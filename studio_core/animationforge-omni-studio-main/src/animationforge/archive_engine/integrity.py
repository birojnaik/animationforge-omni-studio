"""Archive integrity verification: SHA-256 digests, CRC testzip, empty archive rejection."""

from __future__ import annotations

import hashlib
import zipfile
from pathlib import Path
from typing import Any, Dict


def compute_sha256(file_path: str | Path) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_zip_integrity(
    archive_path: str | Path,
    expected_sha256: str | None = None,
    require_non_empty: bool = True,
) -> Dict[str, Any]:
    path = Path(archive_path)
    if not path.exists() or not path.is_file():
        return {"valid": False, "error": "ARCHIVE_NOT_FOUND"}

    actual_sha256 = compute_sha256(path)
    if expected_sha256 and actual_sha256 != expected_sha256:
        return {
            "valid": False,
            "error": "CHECKSUM_MISMATCH",
            "expected_sha256": expected_sha256,
            "actual_sha256": actual_sha256,
        }

    try:
        with zipfile.ZipFile(str(path), "r") as zf:
            infos = zf.infolist()
            if require_non_empty and len(infos) == 0:
                return {"valid": False, "error": "EMPTY_ARCHIVE_REJECTED", "sha256": actual_sha256}
            bad_member = zf.testzip()
            if bad_member is not None:
                return {"valid": False, "error": f"CRC_CORRUPTION:{bad_member}", "sha256": actual_sha256}
            uncompressed_bytes = sum(i.file_size for i in infos)
            return {
                "valid": True,
                "sha256": actual_sha256,
                "compressed_size_bytes": path.stat().st_size,
                "uncompressed_size_bytes": uncompressed_bytes,
                "entry_count": len(infos),
            }
    except zipfile.BadZipFile as exc:
        return {"valid": False, "error": f"BAD_ZIP_FILE:{exc}", "sha256": actual_sha256}
