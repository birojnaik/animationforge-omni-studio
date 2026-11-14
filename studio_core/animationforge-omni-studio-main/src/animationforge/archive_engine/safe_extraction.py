"""Safe archive extraction guarding against path traversal, symlinks, duplicates, and ZIP bombs."""

from __future__ import annotations

import stat
import zipfile
from pathlib import Path
from typing import Any, Dict, List


class UnsafeArchiveError(ValueError):
    """Raised when an archive violates extraction security policies."""


def validate_zip_members(
    zf: zipfile.ZipFile,
    max_uncompressed_bytes: int = 512 * 1024 * 1024,
    max_compression_ratio: float = 120.0,
) -> Dict[str, Any]:
    seen_names = set()
    total_uncompressed = 0
    warnings: List[str] = []

    for info in zf.infolist():
        name = info.filename
        if name in seen_names:
            raise UnsafeArchiveError(f"DUPLICATE_ENTRY:{name}")
        seen_names.add(name)

        if name.startswith("/") or name.startswith("\\") or (len(name) > 1 and name[1] == ":"):
            raise UnsafeArchiveError(f"ABSOLUTE_PATH_REJECTED:{name}")

        parts = Path(name).parts
        if ".." in parts:
            raise UnsafeArchiveError(f"PATH_TRAVERSAL_REJECTED:{name}")

        unix_mode = (info.external_attr >> 16) & 0o170000
        if unix_mode == stat.S_IFLNK:
            raise UnsafeArchiveError(f"UNSAFE_SYMLINK_REJECTED:{name}")

        total_uncompressed += info.file_size
        if total_uncompressed > max_uncompressed_bytes:
            raise UnsafeArchiveError("EXCESSIVE_DECOMPRESSED_SIZE_REJECTED")

        if info.compress_size > 0 and (info.file_size / info.compress_size) > max_compression_ratio and info.file_size > 1024 * 1024:
            raise UnsafeArchiveError(f"ZIP_BOMB_RATIO_REJECTED:{name}")

    return {
        "safe": True,
        "entry_count": len(seen_names),
        "total_uncompressed_bytes": total_uncompressed,
        "warnings": warnings,
    }


def safe_extract_zip(
    archive_path: str | Path,
    dest_dir: str | Path,
    max_uncompressed_bytes: int = 512 * 1024 * 1024,
) -> Dict[str, Any]:
    dest = Path(dest_dir).resolve()
    dest.mkdir(parents=True, exist_ok=True)
    extracted_files: List[str] = []

    with zipfile.ZipFile(str(archive_path), "r") as zf:
        validation = validate_zip_members(zf, max_uncompressed_bytes=max_uncompressed_bytes)
        for info in zf.infolist():
            target = (dest / info.filename).resolve()
            if not target.is_relative_to(dest):
                raise UnsafeArchiveError(f"ESCAPED_DESTINATION_REJECTED:{info.filename}")
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(info, "r") as src, open(target, "wb") as dst:
                    while True:
                        chunk = src.read(65536)
                        if not chunk:
                            break
                        dst.write(chunk)
                extracted_files.append(info.filename)

    return {
        "safe": True,
        "destination": str(dest),
        "extracted_count": len(extracted_files),
        "total_uncompressed_bytes": validation["total_uncompressed_bytes"],
    }
