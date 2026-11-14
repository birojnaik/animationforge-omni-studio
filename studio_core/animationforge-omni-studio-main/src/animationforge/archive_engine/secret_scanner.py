"""Secret scanner preventing accidental bundling of keys, tokens, passwords, or .env files."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List

FORBIDDEN_FILENAMES = {
    ".env", ".env.local", ".env.production", "id_rsa", "id_ed25519",
    "credentials.json", "service-account.json", ".npmrc", ".pypirc",
}

SECRET_PATTERNS = [
    ("PEM_PRIVATE_KEY", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("OPENAI_KEY", re.compile(r"\bsk-[A-Za-z0-9]{20,}\b")),
    ("GOOGLE_API_KEY", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
    ("GITHUB_TOKEN", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b")),
    ("AWS_ACCESS_KEY", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
]


def is_forbidden_secret_file(path: Path) -> bool:
    name = path.name.lower()
    if name in FORBIDDEN_FILENAMES:
        return True
    if name.endswith((".pem", ".key", ".p12", ".pfx")):
        return True
    return False


def scan_paths_for_secrets(paths: List[Path], root: Path) -> Dict[str, object]:
    findings: List[Dict[str, str]] = []
    for p in paths:
        rel = str(p.relative_to(root)) if p.is_relative_to(root) else str(p)
        if is_forbidden_secret_file(p):
            findings.append({"path": rel, "type": "FORBIDDEN_SECRET_FILE"})
            continue
        if p.is_file() and p.stat().st_size <= 512 * 1024:
            try:
                text = p.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for label, pattern in SECRET_PATTERNS:
                if pattern.search(text):
                    findings.append({"path": rel, "type": label})
    return {
        "clean": len(findings) == 0,
        "scanned_files": len(paths),
        "findings": findings,
    }
