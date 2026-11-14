"""Blender Flamenco 128-slot fixed render farm adapter and honest hardware probe."""

from __future__ import annotations

import os
import shutil
import subprocess
from typing import Any, Dict, List

from animationforge.registries.catalog import build_128_workers


def probe_host_environment() -> Dict[str, Any]:
    """Measure real local hardware and installed executables without fabricating capacity."""
    cpu_count = os.cpu_count() or 1
    blender_bin = shutil.which("blender")
    ffmpeg_bin = shutil.which("ffmpeg")
    git_bin = shutil.which("git")
    gh_bin = shutil.which("gh")

    mem_total_mb = None
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as fh:
            for line in fh:
                if line.startswith("MemTotal:"):
                    mem_total_mb = round(int(line.split()[1]) / 1024.0, 1)
                    break
    except OSError:
        mem_total_mb = None

    disk_stat = shutil.disk_usage(os.getcwd())
    git_commit = None
    git_branch = None
    if git_bin:
        try:
            git_commit = subprocess.check_output([git_bin, "rev-parse", "HEAD"], stderr=subprocess.DEVNULL, text=True).strip()
            git_branch = subprocess.check_output([git_bin, "rev-parse", "--abbrev-ref", "HEAD"], stderr=subprocess.DEVNULL, text=True).strip()
        except subprocess.CalledProcessError:
            git_commit = None

    return {
        "cpu_logical_cores": cpu_count,
        "memory_total_mb": mem_total_mb,
        "disk_free_gb": round(disk_stat.free / (1024 ** 3), 2),
        "tools": {
            "python3": {"available": True, "version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"},
            "ffmpeg": {"available": bool(ffmpeg_bin), "path": ffmpeg_bin or "NOT_FOUND"},
            "git": {"available": bool(git_bin), "path": git_bin or "NOT_FOUND", "commit_sha": git_commit or "UNINITIALIZED", "branch": git_branch or "NONE"},
            "blender": {"available": bool(blender_bin), "path": blender_bin or "BLOCKED: binary not installed on host"},
            "gh": {"available": bool(gh_bin), "path": gh_bin or "BLOCKED: GitHub CLI not installed"},
        },
        "flamenco_config": {
            "logical_worker_slots": 128,
            "groups": 8,
            "workers_per_group": 16,
            "autoscaling": "DISABLED",
            "failed_frame_reassignment": "ENABLED",
            "default_resolution": "4096x2160",
            "default_fps": 24,
            "master_format": "OpenEXR",
            "target_mean_frame_seconds": 5.0,
            "target_sustained_fps": 24.0,
            "physical_host_note": f"Logical 128-slot Flamenco queue is configured; physical host provides {cpu_count} logical CPU cores and no Blender binary.",
        },
    }


def dispatch_frame_schedule(total_frames: int = 144, failed_worker: str | None = None) -> Dict[str, Any]:
    """Deterministically assign frames 1..N across the 128 Flamenco slots with automatic reassignment."""
    workers = build_128_workers()
    assignments: List[Dict[str, Any]] = []
    reassignments: List[Dict[str, Any]] = []

    for frame in range(1, total_frames + 1):
        slot_idx = (frame - 1) % 128
        worker = workers[slot_idx]
        if failed_worker and worker["id"] == failed_worker:
            backup_idx = (slot_idx + 16) % 128
            backup_worker = workers[backup_idx]
            reassignments.append({
                "frame": frame,
                "failed_worker": failed_worker,
                "reassigned_to": backup_worker["id"],
                "reason": "Simulated worker heartbeat timeout -> automatic failed-frame reassignment",
            })
            worker = backup_worker
        assignments.append({
            "frame": frame,
            "worker_id": worker["id"],
            "group": worker["group"],
            "status": "SCHEDULED",
        })

    return {
        "total_frames": total_frames,
        "worker_slots_used": len({a["worker_id"] for a in assignments}),
        "reassignments": reassignments,
        "assignments": assignments,
    }
