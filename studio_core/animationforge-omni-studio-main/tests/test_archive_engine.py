"""Automated test suite for AnimationForge Omni Studio v23.0.0 Archive Engine."""

from __future__ import annotations

import io
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

SRC_ROOT = Path(__file__).resolve().parents[1] / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))

from animationforge.archive_engine import (
    UnsafeArchiveError,
    create_checkpoint_archive,
    generate_incremental_update_archive,
    generate_main_source_archive,
    recover_or_rebuild_archive,
    restore_archive_isolated,
    run_clean_installation_test,
    safe_extract_zip,
    scan_paths_for_secrets,
    select_compression_for_path,
    verify_zip_integrity,
    write_reproducible_zip,
)
from animationforge.execution import ProductionDatabase


class ArchiveEngineTestSuite(unittest.TestCase):
    def test_reproducible_zip_and_determinism(self):
        with tempfile.TemporaryDirectory() as tmp:
            z1 = Path(tmp) / "a.zip"
            z2 = Path(tmp) / "b.zip"
            entries = [("pkg/b.txt", b"hello"), ("pkg/a.py", b"print('ok')\n")]
            r1 = write_reproducible_zip(z1, entries)
            r2 = write_reproducible_zip(z2, list(reversed(entries)))
            self.assertEqual(r1["sha256"], r2["sha256"])
            self.assertEqual(z1.read_bytes(), z2.read_bytes())

    def test_empty_archive_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            z = Path(tmp) / "empty.zip"
            with self.assertRaises(ValueError):
                write_reproducible_zip(z, [])
            with zipfile.ZipFile(z, "w") as zf:
                pass
            res = verify_zip_integrity(z, require_non_empty=True)
            self.assertFalse(res["valid"])
            self.assertEqual(res["error"], "EMPTY_ARCHIVE_REJECTED")

    def test_corrupted_archive_detection(self):
        with tempfile.TemporaryDirectory() as tmp:
            z = Path(tmp) / "bad.zip"
            z.write_bytes(b"NOT_A_ZIP_ARCHIVE_DATA")
            res = verify_zip_integrity(z)
            self.assertFalse(res["valid"])
            self.assertIn("BAD_ZIP_FILE", res["error"])

    def test_checksum_mismatch_detection(self):
        with tempfile.TemporaryDirectory() as tmp:
            z = Path(tmp) / "valid.zip"
            write_reproducible_zip(z, [("data.txt", b"clean")])
            res = verify_zip_integrity(z, expected_sha256="0" * 64)
            self.assertFalse(res["valid"])
            self.assertEqual(res["error"], "CHECKSUM_MISMATCH")

    def test_path_traversal_and_absolute_path_rejection(self):
        with tempfile.TemporaryDirectory() as tmp:
            z = Path(tmp) / "evil.zip"
            with zipfile.ZipFile(z, "w") as zf:
                zf.writestr("../../etc/passwd", b"root:x:0:0")
            with self.assertRaises(UnsafeArchiveError):
                safe_extract_zip(z, Path(tmp) / "out")

            z_abs = Path(tmp) / "abs.zip"
            with zipfile.ZipFile(z_abs, "w") as zf:
                zf.writestr("/tmp/escaped.txt", b"bad")
            with self.assertRaises(UnsafeArchiveError):
                safe_extract_zip(z_abs, Path(tmp) / "out2")

    def test_zip_bomb_excessive_decompression_rejection(self):
        with tempfile.TemporaryDirectory() as tmp:
            z = Path(tmp) / "bomb.zip"
            with zipfile.ZipFile(z, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                zf.writestr("huge.txt", b"A" * (2 * 1024 * 1024))
            with self.assertRaises(UnsafeArchiveError):
                safe_extract_zip(z, Path(tmp) / "out", max_uncompressed_bytes=1024 * 1024)

    def test_duplicate_entry_rejection(self):
        with tempfile.TemporaryDirectory() as tmp:
            z = Path(tmp) / "dup.zip"
            with zipfile.ZipFile(z, "w") as zf:
                zf.writestr("same.txt", b"one")
                zf.writestr("same.txt", b"two")
            with self.assertRaises(UnsafeArchiveError):
                safe_extract_zip(z, Path(tmp) / "out")

    def test_secret_scanner_blocks_env_and_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            env_file = root / ".env"
            env_file.write_text("SECRET=123\n", encoding="utf-8")
            key_file = root / "notes.txt"
            pem_header = "-----BEGIN " + "RSA PRIVATE KEY-----"
            key_file.write_text(f"{pem_header}\nabc\n", encoding="utf-8")
            scan = scan_paths_for_secrets([env_file, key_file], root)
            self.assertFalse(scan["clean"])
            self.assertEqual(len(scan["findings"]), 2)

    def test_intelligent_compression_routing(self):
        self.assertEqual(select_compression_for_path("video.mp4"), zipfile.ZIP_STORED)
        self.assertEqual(select_compression_for_path("scene.py"), zipfile.ZIP_DEFLATED)

    def test_checkpoint_creation_and_sqlite_restoration(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "studio.sqlite"
            db = ProductionDatabase(db_path)
            ckpt_zip = Path(tmp) / "ckpt.zip"
            res = create_checkpoint_archive(db_path, "proj_test", "proj_test-checkpoint-000001", ckpt_zip)
            restored = restore_archive_isolated(ckpt_zip, expected_sha256=res["sha256"])
            self.assertTrue(restored["restored"])
            self.assertTrue(restored["database_restored"])

    def test_incremental_update_and_clean_install(self):
        repo_root = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory() as tmp:
            main_zip = Path(tmp) / "main.zip"
            main_res = generate_main_source_archive(repo_root, main_zip)
            self.assertTrue(verify_zip_integrity(main_zip, expected_sha256=main_res["sha256"])["valid"])

            install_res = run_clean_installation_test(main_zip)
            self.assertTrue(install_res["passed"])

            upd_zip = Path(tmp) / "update.zip"
            upd_res = generate_incremental_update_archive(repo_root, upd_zip)
            self.assertTrue(verify_zip_integrity(upd_zip, expected_sha256=upd_res["sha256"])["valid"])

            # Simulate corruption and disaster recovery rebuild
            main_zip.write_bytes(b"corrupted")
            rec = recover_or_rebuild_archive(main_zip, repo_root)
            self.assertTrue(rec["healthy"])
            self.assertEqual(rec["action"], "REBUILT_FROM_VERIFIED_SOURCE")


if __name__ == "__main__":
    unittest.main()
