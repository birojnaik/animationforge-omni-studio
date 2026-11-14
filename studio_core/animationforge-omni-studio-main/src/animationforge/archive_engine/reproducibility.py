"""Reproducible archive ordering, normalized timestamps, and byte-for-byte verification."""

from __future__ import annotations

import zipfile
from pathlib import Path
from typing import Dict, Iterable, Tuple

from animationforge.archive_engine.compression import select_compression_for_path
from animationforge.archive_engine.integrity import compute_sha256

NORMALIZED_ZIP_DATETIME = (2026, 1, 1, 0, 0, 0)


def write_reproducible_zip(
    target_zip: str | Path,
    entries: Iterable[Tuple[str, bytes]],
) -> Dict[str, object]:
    """Write entries in sorted order with normalized timestamps for deterministic ZIP bytes."""
    sorted_entries = sorted(entries, key=lambda item: item[0])
    if not sorted_entries:
        raise ValueError("Refusing to create empty archive without content entries")

    Path(target_zip).parent.mkdir(parents=True, exist_ok=True)
    total_uncompressed = 0
    with zipfile.ZipFile(str(target_zip), mode="w", allowZip64=True) as zf:
        for arcname, payload in sorted_entries:
            info = zipfile.ZipInfo(filename=arcname, date_time=NORMALIZED_ZIP_DATETIME)
            info.compress_type = select_compression_for_path(arcname)
            info.external_attr = 0o644 << 16
            zf.writestr(info, payload)
            total_uncompressed += len(payload)

    sha256 = compute_sha256(target_zip)
    return {
        "archive_path": str(target_zip),
        "sha256": sha256,
        "file_count": len(sorted_entries),
        "compressed_size_bytes": Path(target_zip).stat().st_size,
        "uncompressed_size_bytes": total_uncompressed,
    }
