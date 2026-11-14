"""Transactional checkpoint archive generator capturing SQLite snapshot and production state."""

from __future__ import annotations

import json
import sqlite3
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Tuple

from animationforge.archive_engine.reproducibility import write_reproducible_zip


def create_checkpoint_archive(
    db_path: str | Path,
    project_id: str,
    checkpoint_id: str,
    output_zip: str | Path,
    extra_artifacts: Dict[str, bytes] | None = None,
) -> Dict[str, Any]:
    db_file = Path(db_path)
    entries: List[Tuple[str, bytes]] = []

    if db_file.exists():
        # Create a transactionally consistent SQLite backup snapshot
        with tempfile.TemporaryDirectory(prefix="af_ckpt_db_") as tmp_dir:
            snap_path = Path(tmp_dir) / "production_snapshot.sqlite"
            src_conn = sqlite3.connect(str(db_file))
            dst_conn = sqlite3.connect(str(snap_path))
            src_conn.backup(dst_conn)
            dst_conn.close()
            src_conn.close()
            entries.append((f"{checkpoint_id}/database/production_snapshot.sqlite", snap_path.read_bytes()))

    recovery_doc = {
        "checkpoint_id": checkpoint_id,
        "project_id": project_id,
        "recovery_protocol": ["INSPECT", "VERIFY", "EXTRACT", "RESOLVE_DEPENDENCIES", "RESTORE", "REVALIDATE", "RESUME"],
        "skip_completed_operations": True,
    }
    entries.append((f"{checkpoint_id}/RECOVERY_INSTRUCTIONS.json", json.dumps(recovery_doc, indent=2).encode("utf-8")))

    if extra_artifacts:
        for rel, data in extra_artifacts.items():
            entries.append((f"{checkpoint_id}/{rel.lstrip('/')}", data))

    result = write_reproducible_zip(output_zip, entries)
    result["checkpoint_id"] = checkpoint_id
    return result
