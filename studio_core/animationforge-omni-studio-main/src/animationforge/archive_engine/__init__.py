"""Archive Engine subpackage — 15 modular packaging, verification, and recovery modules."""

from .archive_recovery import recover_or_rebuild_archive
from .checkpoint_archive import create_checkpoint_archive
from .compression import open_zip64_writer, select_compression_for_path
from .dependency_scanner import scan_project_dependencies
from .generator import verify_archive_20_points
from .incremental_archive import generate_incremental_update_archive
from .installation_test import run_clean_installation_test
from .integrity import compute_sha256, verify_zip_integrity
from .manifest_builder import build_archive_manifest
from .release_packager import build_all_release_archives, generate_evidence_reports
from .reproducibility import write_reproducible_zip
from .restoration import restore_archive_isolated
from .safe_extraction import UnsafeArchiveError, safe_extract_zip, validate_zip_members
from .secret_scanner import is_forbidden_secret_file, scan_paths_for_secrets
from .source_snapshot import generate_main_source_archive

__all__ = [
    "UnsafeArchiveError",
    "build_all_release_archives",
    "build_archive_manifest",
    "compute_sha256",
    "create_checkpoint_archive",
    "generate_evidence_reports",
    "generate_incremental_update_archive",
    "generate_main_source_archive",
    "is_forbidden_secret_file",
    "open_zip64_writer",
    "recover_or_rebuild_archive",
    "restore_archive_isolated",
    "run_clean_installation_test",
    "safe_extract_zip",
    "scan_paths_for_secrets",
    "scan_project_dependencies",
    "select_compression_for_path",
    "validate_zip_members",
    "verify_archive_20_points",
    "verify_zip_integrity",
    "write_reproducible_zip",
]
