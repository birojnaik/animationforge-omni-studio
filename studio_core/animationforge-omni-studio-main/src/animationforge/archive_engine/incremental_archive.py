"""Incremental update packager comparing v22 baseline manifest against v23 source state."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

from animationforge.archive_engine.reproducibility import write_reproducible_zip
from animationforge.archive_engine.source_snapshot import collect_source_entries


def generate_incremental_update_archive(
    source_root: str | Path,
    output_zip: str | Path,
    baseline_checksums: Dict[str, str] | None = None,
) -> Dict[str, Any]:
    root = Path(source_root).resolve()
    entries, _ = collect_source_entries(root, prefix="update-v22-to-v23")
    baseline = baseline_checksums or {}

    changed_entries: List[Tuple[str, bytes]] = []
    deleted_paths: List[str] = []
    current_map: Dict[str, str] = {}

    for arcname, payload in entries:
        rel = arcname.split("/", 1)[1]
        digest = hashlib.sha256(payload).hexdigest()
        current_map[rel] = digest
        if baseline.get(rel) != digest:
            changed_entries.append((arcname, payload))

    for old_rel in sorted(baseline.keys()):
        if old_rel not in current_map:
            deleted_paths.append(old_rel)

    update_manifest = {
        "from_version": "22.0.0",
        "to_version": "23.0.0",
        "requires_base_verification": True,
        "rollback_supported": True,
        "changed_or_added_count": len(changed_entries),
        "deleted_files": deleted_paths,
        "preserve_user_projects": True,
    }
    changed_entries.append(
        ("update-v22-to-v23/UPDATE_INSTRUCTIONS.json", json.dumps(update_manifest, indent=2).encode("utf-8"))
    )

    result = write_reproducible_zip(output_zip, changed_entries)
    result["update_manifest"] = update_manifest
    return result
