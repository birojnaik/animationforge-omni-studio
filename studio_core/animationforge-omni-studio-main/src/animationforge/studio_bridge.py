"""JSON bridge returning full AnimationForge Studio state for the Express server."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

from animationforge import __version__
from animationforge.archive_engine.integrity import compute_sha256
from animationforge.compiler import compile_production_graph
from animationforge.execution import ProductionDatabase
from animationforge.flamenco_adapter import dispatch_frame_schedule, probe_host_environment
from animationforge.registries import (
    ARCHITECTURE_LAYERS,
    CORE_AGENTS,
    PRODUCTION_STAGES,
    build_128_workers,
    build_230_quality_gates,
    build_540_roles,
)


def get_full_state(source_root: Path, out_dir: Path, db_path: Path, prod_dir: Path) -> Dict[str, Any]:
    db = ProductionDatabase(db_path)
    project = db.get_latest_project()
    if not project:
        project = compile_production_graph(
            title="THE LAST FIREFLY",
            premise="In a hushed indigo forest glade, the last bioluminescent firefly hesitates beneath mossy ferns before igniting a warm amber beacon.",
        )
        db.save_project(project)
        db.record_checkpoint(project["project_id"], "INITIAL_PROJECT_COMPILE", project)

    archives: List[Dict[str, Any]] = []
    if out_dir.exists():
        for zpath in sorted(out_dir.glob("*.zip")):
            archives.append({
                "name": zpath.name,
                "size_bytes": zpath.stat().st_size,
                "sha256": compute_sha256(zpath),
            })

    reports_dir = source_root / "reports"
    reports: List[Dict[str, Any]] = []
    if reports_dir.exists():
        for rpath in sorted(reports_dir.iterdir()):
            if rpath.is_file():
                reports.append({
                    "name": rpath.name,
                    "size_bytes": rpath.stat().st_size,
                })

    mp4_path = prod_dir / "13_final_delivery" / "the_last_firefly_960x540_24fps.mp4"
    bpy_path = prod_dir / "05_animation" / "the_last_firefly_blender_scene.py"
    wav_path = prod_dir / "11_audio" / "the_last_firefly_score.wav"

    return {
        "version": __version__,
        "environment": probe_host_environment(),
        "project": project,
        "layers": ARCHITECTURE_LAYERS,
        "stages": PRODUCTION_STAGES,
        "agents": CORE_AGENTS,
        "roles": build_540_roles(),
        "quality_gates": build_230_quality_gates(),
        "workers": build_128_workers(),
        "checkpoints": db.list_checkpoints(project["project_id"]),
        "repair_logs": db.list_repair_logs(),
        "archives": archives,
        "reports": reports,
        "demo_media": {
            "mp4_ready": mp4_path.exists(),
            "mp4_size_bytes": mp4_path.stat().st_size if mp4_path.exists() else 0,
            "wav_ready": wav_path.exists(),
            "bpy_ready": bpy_path.exists(),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cmd", required=True, choices=["state", "repair", "dispatch", "compile-custom"])
    parser.add_argument("--source", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--db", required=True)
    parser.add_argument("--prod-dir", required=True)
    parser.add_argument("--fault", default="MISSING_FRAMES")
    parser.add_argument("--failed-worker", default="")
    parser.add_argument("--frames", type=int, default=144)
    parser.add_argument("--title", default="THE LAST FIREFLY")
    parser.add_argument("--premise", default="")
    parser.add_argument("--style", default="Stylized 3D CGI with hand-crafted painterly imperfections")
    parser.add_argument("--ai-json", default="")
    args = parser.parse_args()

    src = Path(args.source)
    out_dir = Path(args.out_dir)
    db_path = Path(args.db)
    prod_dir = Path(args.prod_dir)

    if args.cmd == "state":
        print(json.dumps(get_full_state(src, out_dir, db_path, prod_dir)))
    elif args.cmd == "repair":
        db = ProductionDatabase(db_path)
        proj = db.get_latest_project() or {"project_id": "the_last_firefly"}
        res = db.run_autonomous_repair(proj["project_id"], args.fault)
        print(json.dumps({"repair": res, "repair_logs": db.list_repair_logs()}))
    elif args.cmd == "dispatch":
        res = dispatch_frame_schedule(total_frames=args.frames, failed_worker=args.failed_worker or None)
        print(json.dumps(res))
    elif args.cmd == "compile-custom":
        db = ProductionDatabase(db_path)
        ai_data = json.loads(args.ai_json) if args.ai_json else None
        graph = compile_production_graph(
            title=args.title,
            premise=args.premise or "Custom animated short film production.",
            style=args.style,
            ai_enriched=ai_data,
        )
        db.save_project(graph)
        ckpt = db.record_checkpoint(graph["project_id"], "COMPILED_BRIEF", graph)
        print(json.dumps({"project": graph, "checkpoint": ckpt}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
