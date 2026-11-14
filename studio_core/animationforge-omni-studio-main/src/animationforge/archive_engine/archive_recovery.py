"""Archive disaster recovery detecting corruption/mismatches and rebuilding from verified sources."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from animationforge.archive_engine.integrity import verify_zip_integrity
from animationforge.archive_engine.source_snapshot import generate_main_source_archive


def recover_or_rebuild_archive(
    archive_path: str | Path,
    source_root: str | Path,
    expected_sha256: str | None = None,
) -> Dict[str, Any]:
    path = Path(archive_path)
    check = verify_zip_integrity(path, expected_sha256=expected_sha256)
    if check["valid"]:
        return {
            "action": "NONE_NEEDED",
            "healthy": True,
            "integrity": check,
        }

    # Rebuild from verified source directory rather than fabricating content
    rebuilt = generate_main_source_archive(source_root, path)
    return {
        "action": "REBUILT_FROM_VERIFIED_SOURCE",
        "detected_fault": check.get("error"),
        "healthy": bool(rebuilt.get("sha256")),
        "rebuilt": rebuilt,
    }
