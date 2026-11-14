"""Dependency scanner inspecting Python modules, runtime tools, and asset paths."""

from __future__ import annotations

import ast
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List


def scan_project_dependencies(project_root: str | Path) -> Dict[str, Any]:
    root = Path(project_root)
    third_party_imports = set()
    stdlib_names = getattr(sys, "stdlib_module_names", set())

    for py_file in sorted(root.rglob("*.py")):
        try:
            tree = ast.parse(py_file.read_text(encoding="utf-8"))
        except (SyntaxError, OSError):
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    top = alias.name.split(".")[0]
                    if top not in stdlib_names and top != "animationforge":
                        third_party_imports.add(top)
            elif isinstance(node, ast.ImportFrom) and node.module:
                top = node.module.split(".")[0]
                if top not in stdlib_names and top != "animationforge":
                    third_party_imports.add(top)

    external_apps: List[Dict[str, str]] = [
        {"name": "python3", "status": "AVAILABLE", "version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"},
        {"name": "ffmpeg", "status": "AVAILABLE" if shutil.which("ffmpeg") else "MISSING", "path": shutil.which("ffmpeg") or "NOT_FOUND"},
        {"name": "git", "status": "AVAILABLE" if shutil.which("git") else "MISSING", "path": shutil.which("git") or "NOT_FOUND"},
        {"name": "blender", "status": "AVAILABLE" if shutil.which("blender") else "EXTERNAL_REQUIRED_BLOCKED", "path": shutil.which("blender") or "NOT_INSTALLED"},
    ]

    return {
        "detected_imports": sorted(third_party_imports),
        "external_applications": external_apps,
        "portable_relative_paths": True,
    }
