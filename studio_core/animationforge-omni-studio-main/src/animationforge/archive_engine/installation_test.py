"""Clean-environment extraction, Python compile, import, and CLI smoke tests."""

from __future__ import annotations

import compileall
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict

from animationforge.archive_engine.safe_extraction import safe_extract_zip


def run_clean_installation_test(archive_path: str | Path) -> Dict[str, Any]:
    """Extract an archive to an isolated temp directory, compile Python, import package, and run CLI help."""
    with tempfile.TemporaryDirectory(prefix="af_install_test_") as tmp_dir:
        extract_result = safe_extract_zip(archive_path, tmp_dir)
        tmp_path = Path(tmp_dir)
        # Locate src directory inside extracted root
        src_dirs = list(tmp_path.glob("*/src"))
        if not src_dirs:
            src_dirs = list(tmp_path.glob("src"))

        if not src_dirs:
            return {
                "passed": False,
                "stage": "LOCATE_SOURCE",
                "error": "No src/ directory found inside extracted archive",
                "extraction": extract_result,
            }

        src_dir = src_dirs[0]
        compiled_ok = compileall.compile_dir(str(src_dir), quiet=1)
        if not compiled_ok:
            return {
                "passed": False,
                "stage": "BYTECODE_COMPILE",
                "error": "compileall reported syntax errors",
                "extraction": extract_result,
            }

        # Isolated import and CLI version check
        env = {"PYTHONPATH": str(src_dir), "PATH": ""}
        proc = subprocess.run(
            [sys.executable, "-c", "import animationforge; print(animationforge.__version__)"],
            env=env,
            capture_output=True,
            text=True,
            timeout=15,
        )
        import_ok = proc.returncode == 0 and "23.0.0" in proc.stdout

        cli_proc = subprocess.run(
            [sys.executable, "-m", "animationforge.cli", "--help"],
            env=env,
            capture_output=True,
            text=True,
            timeout=15,
        )
        cli_ok = cli_proc.returncode == 0

        return {
            "passed": bool(compiled_ok and import_ok and cli_ok),
            "compiled_ok": compiled_ok,
            "import_ok": import_ok,
            "cli_smoke_ok": cli_ok,
            "version_reported": proc.stdout.strip(),
            "extracted_count": extract_result["extracted_count"],
        }
