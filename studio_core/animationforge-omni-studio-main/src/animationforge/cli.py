"""Unified CLI for AnimationForge Omni Studio v23.0.0."""

from __future__ import annotations

import argparse
import json
import sys
import unittest
from pathlib import Path

from animationforge import __version__
from animationforge.archive_engine import (
    build_all_release_archives,
    create_checkpoint_archive,
    generate_incremental_update_archive,
    generate_main_source_archive,
    recover_or_rebuild_archive,
    restore_archive_isolated,
    run_clean_installation_test,
    verify_archive_20_points,
)
from animationforge.compiler import compile_production_graph
from animationforge.demo_renderer import render_the_last_firefly_demo
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


def main() -> int:
    parser = argparse.ArgumentParser(prog="animationforge", description="AnimationForge Omni Studio v23.0.0 CLI")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("probe", help="Probe host hardware and external tool availability")

    p_comp = sub.add_parser("compile", help="Compile a creative brief into a production graph")
    p_comp.add_argument("--title", default="THE LAST FIREFLY")
    p_comp.add_argument("--premise", default="A solitary firefly hesitates in an indigo forest glade before igniting a beacon of hope.")
    p_comp.add_argument("--db", required=True)

    p_demo = sub.add_parser("render-demo", help="Render 6s 144-frame THE LAST FIREFLY MP4 + WAV + bpy bundle")
    p_demo.add_argument("--out", required=True)

    p_arch = sub.add_parser("archive-cmd", help="Execute an autonomous archive command")
    p_arch.add_argument("--action", required=True)
    p_arch.add_argument("--source", required=True)
    p_arch.add_argument("--out-dir", required=True)
    p_arch.add_argument("--db", required=True)
    p_arch.add_argument("--production-dir", default="")
    p_arch.add_argument("--target-zip", default="")

    p_test = sub.add_parser("run-tests", help="Run automated Python archive unit tests and emit JUnit XML")
    p_test.add_argument("--source", required=True)
    p_test.add_argument("--xml-out", required=True)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return 0

    if args.command == "probe":
        print(json.dumps(probe_host_environment(), indent=2))
        return 0

    if args.command == "compile":
        db = ProductionDatabase(args.db)
        graph = compile_production_graph(title=args.title, premise=args.premise)
        db.save_project(graph)
        ckpt = db.record_checkpoint(graph["project_id"], "COMPILED_PRODUCTION_GRAPH", graph)
        print(json.dumps({"graph": graph, "checkpoint": ckpt}, indent=2))
        return 0

    if args.command == "render-demo":
        res = render_the_last_firefly_demo(args.out)
        print(json.dumps(res, indent=2))
        return 0

    if args.command == "archive-cmd":
        src = Path(args.source)
        out_dir = Path(args.out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        action = args.action
        prod_dir = Path(args.production_dir) if args.production_dir else (src / "examples" / "THE_LAST_FIREFLY-production")

        if action in ("GENERATE_MAIN_ZIP", "GENERATE_SOURCE_ARCHIVE"):
            zpath = out_dir / "animationforge-omni-studio-main.zip"
            res = generate_main_source_archive(src, zpath)
            ver = verify_archive_20_points(zpath, expected_sha256=res["sha256"], run_install_test=True)
            print(json.dumps({"action": action, "archive": zpath.name, "result": res, "verification": ver}, indent=2))
        elif action in ("GENERATE_COMPLETE_ARCHIVE", "PUBLISH_RELEASE", "GENERATE_ALL_RELEASES"):
            res = build_all_release_archives(src, out_dir, args.db, prod_dir)
            print(json.dumps({"action": action, **res}, indent=2))
        elif action == "GENERATE_INCREMENTAL_UPDATE":
            zpath = out_dir / "animationforge-omni-studio-v22-to-v23-update.zip"
            res = generate_incremental_update_archive(src, zpath)
            ver = verify_archive_20_points(zpath, expected_sha256=res["sha256"])
            print(json.dumps({"action": action, "archive": zpath.name, "result": res, "verification": ver}, indent=2))
        elif action == "GENERATE_CHECKPOINT_ARCHIVE":
            db = ProductionDatabase(args.db)
            proj = db.get_latest_project() or {"project_id": "the_last_firefly"}
            ckpt = db.record_checkpoint(proj["project_id"], "MANUAL_CHECKPOINT_ARCHIVE", proj)
            zpath = out_dir / f"{ckpt['checkpoint_id']}.zip"
            res = create_checkpoint_archive(args.db, proj["project_id"], ckpt["checkpoint_id"], zpath)
            ver = verify_archive_20_points(zpath, expected_sha256=res["sha256"])
            print(json.dumps({"action": action, "archive": zpath.name, "checkpoint": ckpt, "result": res, "verification": ver}, indent=2))
        elif action in ("VERIFY_ARCHIVE", "SCAN_ARCHIVE_SECURITY", "TEST_ARCHIVE_EXTRACTION"):
            zpath = Path(args.target_zip) if args.target_zip else (out_dir / "animationforge-omni-studio-main.zip")
            ver = verify_archive_20_points(zpath, run_install_test=(zpath.name.endswith(("main.zip", "v23.0.0.zip"))))
            print(json.dumps({"action": action, "verification": ver}, indent=2))
        elif action == "TEST_ARCHIVE_INSTALLATION":
            zpath = Path(args.target_zip) if args.target_zip else (out_dir / "animationforge-omni-studio-main.zip")
            inst = run_clean_installation_test(zpath)
            print(json.dumps({"action": action, "installation": inst}, indent=2))
        elif action == "RESTORE_ARCHIVE":
            zpath = Path(args.target_zip) if args.target_zip else (out_dir / "animationforge-omni-studio-main.zip")
            rest = restore_archive_isolated(zpath)
            print(json.dumps({"action": action, "restoration": rest}, indent=2))
        elif action == "REPAIR_ARCHIVE":
            zpath = Path(args.target_zip) if args.target_zip else (out_dir / "animationforge-omni-studio-main.zip")
            rep = recover_or_rebuild_archive(zpath, src)
            print(json.dumps({"action": action, "recovery": rep}, indent=2))
        else:
            print(json.dumps({"error": f"Unsupported action: {action}"}))
            return 1
        return 0

    if args.command == "run-tests":
        tests_dir = Path(args.source) / "tests"
        loader = unittest.TestLoader()
        suite = loader.discover(str(tests_dir))
        runner = unittest.TextTestRunner(verbosity=1, stream=sys.stderr)
        result = runner.run(suite)

        xml_out = Path(args.xml_out)
        xml_out.parent.mkdir(parents=True, exist_ok=True)
        failures = len(result.failures)
        errors = len(result.errors)
        xml_content = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<testsuite name="AnimationForgeArchiveSuite" tests="{result.testsRun}" failures="{failures}" errors="{errors}">\n'
            f'</testsuite>\n'
        )
        xml_out.write_text(xml_content, encoding="utf-8")
        print(json.dumps({
            "tests_run": result.testsRun,
            "failures": failures,
            "errors": errors,
            "passed": result.wasSuccessful(),
            "xml_path": str(xml_out),
            "failure_details": [str(f[1]) for f in result.failures + result.errors],
        }, indent=2))
        return 0 if result.wasSuccessful() else 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
