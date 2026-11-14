"""Intelligent compression engine with per-type compression routing and ZIP64 support."""

from __future__ import annotations

import zipfile
from pathlib import Path

ALREADY_COMPRESSED_EXTS = {
    ".mp4", ".mov", ".mkv", ".webm", ".jpg", ".jpeg", ".png", ".webp",
    ".exr", ".zip", ".gz", ".xz", ".bz2", ".zst", ".aac", ".mp3", ".ogg",
}

TEXT_AND_GEOMETRY_EXTS = {
    ".py", ".ts", ".tsx", ".js", ".json", ".xml", ".csv", ".svg", ".md",
    ".txt", ".yml", ".yaml", ".toml", ".ini", ".cfg", ".obj", ".usda", ".mtl",
    ".html", ".css", ".sh",
}


def select_compression_for_path(path: str | Path) -> int:
    ext = Path(path).suffix.lower()
    if ext in ALREADY_COMPRESSED_EXTS:
        return zipfile.ZIP_STORED
    if ext in TEXT_AND_GEOMETRY_EXTS:
        return zipfile.ZIP_DEFLATED
    return zipfile.ZIP_DEFLATED


def open_zip64_writer(target_zip: str | Path) -> zipfile.ZipFile:
    Path(target_zip).parent.mkdir(parents=True, exist_ok=True)
    return zipfile.ZipFile(str(target_zip), mode="w", allowZip64=True)
