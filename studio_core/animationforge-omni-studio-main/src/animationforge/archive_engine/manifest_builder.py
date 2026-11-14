"""Archive manifest builder complying with Section 29 schema."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List

from animationforge import __schema_version__, __version__


def build_archive_manifest(
    archive_type: str,
    archive_name: str,
    project_id: str,
    source_commit_sha: str,
    source_provenance: str,
    compression_method: str,
    file_count: int,
    compressed_size_bytes: int,
    uncompressed_size_bytes: int,
    required_dependencies: List[str],
    required_runtime_versions: Dict[str, str],
    included_artifacts: List[str],
    excluded_artifacts: List[str],
    file_checksums: Dict[str, str],
    implementation_status: str,
    validation_status: str,
    known_limitations: List[str],
) -> Dict[str, Any]:
    archive_id = hashlib.sha256(f"{archive_name}|{source_commit_sha}|{archive_type}".encode("utf-8")).hexdigest()[:16]
    return {
        "archive_id": archive_id,
        "archive_type": archive_type,
        "archive_name": archive_name,
        "software_version": __version__,
        "schema_version": __schema_version__,
        "project_id": project_id,
        "source_commit_sha": source_commit_sha,
        "source_provenance": source_provenance,
        "creation_timestamp": datetime.now(timezone.utc).isoformat(),
        "compression_method": compression_method,
        "file_count": file_count,
        "compressed_size_bytes": compressed_size_bytes,
        "uncompressed_size_bytes": uncompressed_size_bytes,
        "required_dependencies": required_dependencies,
        "required_runtime_versions": required_runtime_versions,
        "included_artifact_count": len(included_artifacts),
        "included_artifacts": included_artifacts[:200],
        "excluded_artifacts": excluded_artifacts,
        "file_checksums": file_checksums,
        "implementation_status": implementation_status,
        "validation_status": validation_status,
        "known_limitations": known_limitations,
    }
