"""Source snapshot generator with honest provenance classification (GitHub/Local Git/Fallback)."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Tuple

from animationforge.archive_engine.reproducibility import write_reproducible_zip
from animationforge.archive_engine.secret_scanner import is_forbidden_secret_file, scan_paths_for_secrets

EXCLUDED_DIRS = {".git", "__pycache__", ".pytest_cache", "node_modules", "dist", "generated_archives"}


def collect_source_entries(source_root: Path, prefix: str = "animationforge-omni-studio-main") -> Tuple[List[Tuple[str, bytes]], List[str]]:
    files: List[Path] = []
    excluded: List[str] = []
    for p in sorted(source_root.rglob("*")):
        if not p.is_file():
            continue
        rel_parts = p.relative_to(source_root).parts
        if any(part in EXCLUDED_DIRS or part.endswith(".pyc") for part in rel_parts):
            continue
        if is_forbidden_secret_file(p):
            excluded.append(str(p.relative_to(source_root)))
            continue
        files.append(p)

    scan = scan_paths_for_secrets(files, source_root)
    if not scan["clean"]:
        raise RuntimeError(f"Secret scanner blocked snapshot generation: {scan['findings']}")

    entries: List[Tuple[str, bytes]] = []
    for p in files:
        rel = p.relative_to(source_root).as_posix()
        entries.append((f"{prefix}/{rel}", p.read_bytes()))
    return entries, excluded


def generate_main_source_archive(source_root: str | Path, output_zip: str | Path) -> Dict[str, Any]:
    root = Path(source_root).resolve()
    out = Path(output_zip).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    git_bin = shutil.which("git")
    provenance = "LOCAL_SOURCE_FALLBACK"
    commit_sha = "UNCOMMITTED_LOCAL_TREE"

    if git_bin and (root / ".git").exists():
        try:
            commit_sha = subprocess.check_output(
                [git_bin, "-C", str(root), "rev-parse", "HEAD"],
                stderr=subprocess.DEVNULL,
                text=True,
            ).strip()
            dirty = subprocess.check_output(
                [git_bin, "-C", str(root), "status", "--porcelain"],
                stderr=subprocess.DEVNULL,
                text=True,
            ).strip()
            if not dirty:
                subprocess.check_call(
                    [git_bin, "-C", str(root), "archive", "--format=zip", "--prefix=animationforge-omni-studio-main/", f"--output={out}", "HEAD"],
                    stderr=subprocess.DEVNULL,
                )
                provenance = "LOCAL_MAIN_SNAPSHOT"
                from animationforge.archive_engine.integrity import verify_zip_integrity
                info = verify_zip_integrity(out)
                return {
                    "archive_path": str(out),
                    "source_provenance": provenance,
                    "source_commit_sha": commit_sha,
                    "excluded_artifacts": [],
                    **info,
                }
        except subprocess.CalledProcessError:
            provenance = "LOCAL_SOURCE_FALLBACK"

    entries, excluded = collect_source_entries(root)
    result = write_reproducible_zip(out, entries)
    result.update({
        "source_provenance": provenance,
        "source_commit_sha": commit_sha,
        "excluded_artifacts": excluded,
    })
    return result
