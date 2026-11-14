"""Canonical registries for 16 Agents, 540 Production Roles, 7 Layers, 31 Stages, 230 Quality Gates, and 128 Flamenco Workers."""

from __future__ import annotations

from typing import Any, Dict, List

ARCHITECTURE_LAYERS: List[Dict[str, Any]] = [
    {"id": "L01", "name": "Maximum Intelligence Interface", "scope": "Creative reasoning, architectural synthesis, exception diagnosis"},
    {"id": "L02", "name": "Studio Orchestration & Artistic Direction", "scope": "16 core agents, visual identity, emotional continuity"},
    {"id": "L03", "name": "Production Planning & Dependency Graph", "scope": "31-stage DAG compilation, shot scheduling, 540 logical roles"},
    {"id": "L04", "name": "Compiled Native Software Execution", "scope": "Deterministic bpy/BMesh scripts, FFmpeg media synthesis, zero-token execution"},
    {"id": "L05", "name": "Persistent Workers & Flamenco Rendering", "scope": "SQLite durable queue, 128 logical worker slots (8x16), frame reassignment"},
    {"id": "L06", "name": "Independent Validation & Autonomous Recovery", "scope": "230 quality gates, bounded retries, checkpoint rollback"},
    {"id": "L07", "name": "Durable Storage & Archive Delivery", "scope": "ZIP64 bundles, SHA-256 verification, safe extraction, disaster recovery"},
]

PRODUCTION_STAGES: List[str] = [
    "IDEA", "STORY", "SCREENPLAY", "ARTISTIC DNA", "CHARACTER DESIGN", "ENVIRONMENT DESIGN",
    "PROP DESIGN", "STORYBOARD", "ANIMATIC", "PRODUCTION PLANNING", "MODELING", "SCULPTING",
    "RETOPOLOGY", "UV", "TEXTURING", "MATERIALS", "GROOMING", "RIGGING", "SKINNING",
    "LAYOUT", "KEY POSES", "BLOCKING", "BREAKDOWNS", "IN-BETWEENS", "ANIMATION",
    "PERFORMANCE POLISH", "SIMULATION", "EFFECTS", "CINEMATOGRAPHY", "LIGHTING",
    "RENDERING", "COMPOSITING", "EDITORIAL", "AUDIO", "COLOR GRADING", "MASTERING",
    "VALIDATION", "EXPORT", "ARCHIVING",
]

CORE_AGENTS: List[Dict[str, Any]] = [
    {"id": "AG01", "name": "Executive Producer", "layer": "L02", "focus": "Scope governance, budget zero-waste, delivery certification"},
    {"id": "AG02", "name": "Film Director", "layer": "L02", "focus": "Unified creative vision, pacing, emotional arc"},
    {"id": "AG03", "name": "Story and Screenplay Director", "layer": "L02", "focus": "Narrative beat structure, dialogue, character motivation"},
    {"id": "AG04", "name": "Art and Craftsmanship Director", "layer": "L02", "focus": "Visual DNA, intentional imperfection, tactile brushwork"},
    {"id": "AG05", "name": "Production Manager", "layer": "L03", "focus": "Shot dependencies, milestone checkpoints, resource allocation"},
    {"id": "AG06", "name": "Asset Production Supervisor", "layer": "L03", "focus": "Modeling, retopology, UV, PBR materials, environment sets"},
    {"id": "AG07", "name": "Rigging and Deformation Supervisor", "layer": "L04", "focus": "Armatures, FK/IK constraints, corrective shape keys, skinning"},
    {"id": "AG08", "name": "Animation and Performance Director", "layer": "L04", "focus": "Key poses, breakdowns, arcs, overlap, emotional hesitation"},
    {"id": "AG09", "name": "Cinematography and Lighting Director", "layer": "L04", "focus": "Focal lengths, camera choreography, 3-point & motivated lighting"},
    {"id": "AG10", "name": "Physics and Visual Effects Supervisor", "layer": "L04", "focus": "Cloth, hair, particles, atmospheric mist, firefly motes"},
    {"id": "AG11", "name": "Rendering and Compositing Supervisor", "layer": "L05", "focus": "Flamenco 128-slot dispatch, OpenEXR passes, compositor tree"},
    {"id": "AG12", "name": "Editorial and Audio Director", "layer": "L05", "focus": "Cut rhythm, foley synthesis, harmonic score, FFmpeg mastering"},
    {"id": "AG13", "name": "Technical Execution Director", "layer": "L04", "focus": "Compiled graphs, Python/bpy determinism, token reduction"},
    {"id": "AG14", "name": "Independent Quality Director", "layer": "L06", "focus": "230 quality gates, media verification, non-fabricated reporting"},
    {"id": "AG15", "name": "Autonomous Recovery Director", "layer": "L06", "focus": "Fault diagnosis, checkpoint rollback, frame reassignment"},
    {"id": "AG16", "name": "Software Engineering & Archive Director", "layer": "L07", "focus": "Reproducible ZIP64 packaging, SHA-256, safe extraction, release"},
]

_ROLE_DISCIPLINES = [
    ("Story & Narrative", ["Premise Architect", "Beat Sheet Writer", "Dialogue Polisher", "Lore Continuity Editor", "Theme Steward", "Mythology Researcher", "Cultural Advisor", "Script Supervisor", "Pacing Analyst", "Subtext Editor", "Arc Tracker", "Worldbuilding Historian", "Storyboard Lead", "Thumbnails Artist", "Animatic Editor", "Beat Timing Specialist", "Camera Rough Artist", "Action Choreography Planner", "Emotional Continuity Lead", "Voice Direction Writer", "Tone Bible Curator", "Scene Transition Designer", "Dramatic Irony Auditor", "Foreshadowing Indexer", "Title Sequence Conceiver", "Episodic Structure Planner", "Pitch Bible Designer", "Script Breakdown Analyst", "Prop Narrative Indexer", "Character Psychology Profiler"]),
    ("Visual Development & Craft", ["Artistic DNA Architect", "Color Script Painter", "Lighting Key Concept Artist", "Silhouette Stylist", "Intentional Asymmetry Lead", "Brushstroke Texture Designer", "Charcoal Line Specialist", "Watercolor Bleed Shader Artist", "Painterly Normal Sculptor", "Costume Silhouette Designer", "Architecture Heritage Designer", "Foliage Botanical Stylist", "Atmospheric Mood Painter", "Material Imperfection Curator", "Surface Patina Specialist", "Typography & Title Card Artist", "Cel-Shader Ink Line Director", "2.5D Layer Parallax Designer", "Grease Pencil Lookdev Artist", "Scale Reference Modeler", "Value Contrast Checker", "Palette Harmony Auditor", "Film Grain & Halation Stylist", "Lens Flare Restraint Curator", "Optical Vignette Designer", "Creature Anatomy Concept Artist", "Bioluminescence Colorist", "Weathering & Wear Planner", "Set Dressing Lookdev Lead", "Art Review Archivist"]),
    ("Modeling, Sculpting & UVs", ["Hero Character Modeler", "Organic Creature Sculptor", "Hard-Surface Prop Modeler", "Environment Terrain Sculptor", "Architectural Kitbash Modeler", "Foliage & Bark Modeler", "Fungal & Moss Asset Artist", "Retopology Edge-Flow Lead", "Facial Topology Specialist", "Deformation Loop Auditor", "UDIM Tile Planner", "Texel Density Normalizer", "UV Seam Concealment Artist", "Normal Map Baker", "Curvature & AO Baker", "Displacement Sculpt Baker", "Procedural BMesh Generator", "LOD Decimation Engineer", "Proxy Collision Modeler", "Scale & Pivot Enforcer", "Manifold Geometry Validator", "Non-Destructive Modifier Lead", "Geometry Nodes Scatterer", "Procedural Reed & Grass Builder", "Rock & Cliff Boolean Artist", "Water Surface Mesh Builder", "Cloth Rest-Shape Modeler", "Wing Membrane Topology Artist", "Antenna & Micro-Detail Modeler", "Asset Library Publisher"]),
    ("Materials, Texturing & Groom", ["PBR Shader Architect", "Subsurface Scattering Artist", "Iridescent Wing Shader Lead", "Bioluminescent Emission Artist", "Moss & Bark Procedural Texturer", "Wet Stone Roughness Painter", "Brushed Metal Anisotropy Artist", "Glass & Dewdrop IOR Specialist", "Stylized Brushstroke Texturer", "Dirt & Cavity Mask Generator", "Color Management OCIO Lead", "ACEScg Gamut Verifier", "Texture Compression Auditor", "Mipmap Sharpness Checker", "Procedural Noise Calibration Lead", "Hair Curve Groomer", "Feather & Fuzz Scatter Artist", "Dust & Pollen Micro-Groom", "Wind-Driven Groom Rest Lead", "Shader Node Optimizer", "Cycles/EEVEE Parity Tester", "Material Library Packager", "Displacement Height Calibrator", "Translucent Leaf Shader Lead", "Bark Lichen Variation Artist", "Water Ripples Bump Designer", "Volumetric Fog Density Artist", "Firefly Lantern Core Shader", "Shadow Terminator Fixer", "Lookdev Turntable Verifier"]),
    ("Rigging & Deformation", ["Biped Spine Rig Architect", "Insect Thorax & Wing Rig Lead", "Facial Blendshape Modeler", "Corrective Shape Key Sculptor", "FK/IK Seamless Switch Engineer", "Spline IK Tail & Antenna Rig", "Auto-Clavicle & Wing-Fold Rig", "Foot Roll & Ground Contact Rig", "Driver Expression Engineer", "Constraint Dependency Auditor", "Weight Painting Smoothness Lead", "Dual-Quaternion Skinning Tuner", "Lattice & Mesh Deform Specialist", "Muscle & Squash-Stretch Rig", "Eye Aim & Eyelid Track Rig", "Picker UI Bone Controller Lead", "Rig Performance FPS Profiler", "Cyclic Dependency Detector", "Non-Uniform Scale Guard", "Custom Bone Shape Designer", "Mirror Symmetry Rig Checker", "Rest-Pose Delta Validator", "Rig Versioning & Migration Lead", "Motion Capture Retargeter", "Crowd Proxy Rig Simplifier", "Prop Attachment Socket Rig", "Camera Crane Rig Engineer", "Follow-Through Secondary Rig", "Deformation Stress Tester", "Rig Approval Certifier"]),
    ("Animation & Performance", ["Lead Character Animator", "Key Pose Silhouette Artist", "Anticipation & Settling Specialist", "Blocking Timing Director", "Breakdown Arc Sculptor", "In-Between Spacing Cleaner", "Secondary Motion Overlap Lead", "Wing-Beat Flutter Animator", "Micro-Hesitation Performance Lead", "Eye-Dart & Blink Timing Artist", "Breathing & Idle Cycle Animator", "Flight Path Banking Specialist", "Weight & Momentum Calibrator", "Lip-Sync Phoneme Animator", "Crowd Ambient Motion Artist", "Foliage Wind-Sway Animator", "Camera Shake Restraint Animator", "NLA Strip Blending Lead", "Graph Editor Curve Polisher", "Tangent Handle Cleanliness Lead", "Stepped-to-Spline Converter", "Motion Blur Shutter Calibrator", "2s vs 1s Cadence Director", "Silhouette Readability Checker", "Contact Foot-Slip Auditor", "Polish Pass Continuity Lead", "Emotional Subtext Reviewer", "Turntable Cycle Animator", "Action Timing Benchmark Lead", "Animation Approval Certifier"]),
    ("Simulation & Visual Effects", ["Particle Mist & Pollen Lead", "Bioluminescent Trail FX Artist", "Rigid Body Debris Simulator", "Cloth & Cape Dynamics Lead", "Hair & Antenna Physics Tuner", "Fluid & Dewdrop Splash Artist", "Volumetric Light Shaft FX", "Fire & Ember Turbulence Artist", "Smoke & Night Fog Simulator", "Wind Force-Field Choreographer", "Collision Margin Calibrator", "Substep Stability Engineer", "Cache Compression Optimizer", "Alembic/OpenVDB Exporter", "Procedural Spark & Glow FX", "Water Caustics Pattern FX", "Rain & Ripple Impact Simulator", "Feather Flutter Dynamics Lead", "Memory Footprint Profiler", "Simulation Determinism Verifier", "Seed Reproducibility Auditor", "VFX Layer Compositing Prep", "Motion Vector Pass Exporter", "Z-Depth Mist Pass Calibrator", "Cryptomatte ID Pass Lead", "Deep EXR Holdout Engineer", "Cache Checksum Validator", "Interrupted Sim Recovery Lead", "FX Scale Consistency Auditor", "VFX Approval Certifier"]),
    ("Cinematography & Lighting", ["Director of Photography", "Shot Lens & Focal Planner", "Depth of Field Bokeh Director", "3-Point Studio Lighting Lead", "Moonlight Key-to-Fill Designer", "Bioluminescent Motivated Lighter", "Rim Separation Specialist", "Atmospheric Fog Falloff Tuner", "Exposure & EV Calibrator", "Color Temperature Contrast Lead", "Shadow Bias & Softness Tuner", "Light Linking Isolation Lead", "IBL RoomEnvironment Curator", "Camera Crane & Dolly Animator", "Rack Focus Transition Lead", "Rule-of-Thirds Framing Auditor", "180-Degree Continuity Enforcer", "Screen Direction Tracker", "Glare & Bloom Restraint Lead", "Night Scene Legibility Auditor", "Light Bake & Irradiance Lead", "Cycles Sample Noise Tuner", "Adaptive Sampling Threshold Lead", "Denoising Albedo/Normal Verifier", "Render Layer Split Architect", "Shadow Catcher Grounding Lead", "AOV Pass Completeness Auditor", "Shot Lighting Turntable Reviewer", "Histogram Clipping Guard", "Lighting Approval Certifier"]),
    ("Rendering & Flamenco Farm", ["Flamenco Manager Architect", "Worker Slot Provisioner", "Group-A Queue Dispatcher", "Group-B Queue Dispatcher", "Group-C Queue Dispatcher", "Group-D Queue Dispatcher", "Group-E Queue Dispatcher", "Group-F Queue Dispatcher", "Group-G Queue Dispatcher", "Group-H Queue Dispatcher", "4K EXR Pipeline Engineer", "24fps Throughput Monitor", "Failed-Frame Reassigner", "Heartbeat Lease Watchdog", "Task Timeout Calibrator", "VRAM Ceiling Guard", "Shader Compile Pre-Warmer", "Tile Size & Device Optimizer", "CPU/GPU Hybrid Scheduler", "Output Path Collision Guard", "Missing Frame Gap Detector", "Corrupt EXR Header Scanner", "Render Benchmark Collector", "Autoscaling Lock Enforcer", "Worker Crash Recovery Lead", "Asset Dependency Pre-Stager", "Network Storage Bandwidth Tuner", "Checkpoint Frame Saver", "Farm Capacity Reporter", "Render Approval Certifier"]),
    ("Compositing, Editorial & Audio", ["Node Compositor Architect", "EXR Multi-Layer Assembler", "Chromatic Aberration Restraint", "Film Halation & Bloom Lead", "Color Grading ACES Specialist", "LUT & Tone-Mapping Calibrator", "Shot-to-Shot Grade Matcher", "VSE Timeline Assembly Lead", "Frame-Accurate Cut Editor", "24fps Timecode Synchronizer", "Opening & End Credits Designer", "Procedural Foley Synthesizer", "Wing-Hum Harmonic Designer", "Night Forest Ambience Composer", "Bioluminescent Chime Scorer", "Spatial Stereo Panning Engineer", "Loudness LUFS Normalizer", "Audio-Visual Sync Verifier", "FFmpeg H.264 Master Encoder", "ProRes / EXR Sequence Packer", "Audio Clipping Guard", "Subtitle & Metadata Embedder", "Preview 960x540 Proxy Builder", "Master 4K Delivery Packager", "Editorial Continuity Auditor", "Sound Stem Exporter", "Codec Compatibility Tester", "Playback Seekability Checker", "Final Mastering Validator", "Editorial Approval Certifier"]),
    ("Infrastructure, Persistence & Token Economy", ["Compiled DAG Architect", "Execution Plan Cache Lead", "Reusable Skill Indexer", "Typed Schema Enforcer", "SQLite Transaction Engineer", "Durable Task Queue Lead", "Dependency Graph Resolver", "Artifact Checksum Store Lead", "Version Lock Enforcer", "Crash Recovery Orchestrator", "Token Baseline Benchmarker", "Zero-Token Deterministic Runner", "Batch Operation Consolidator", "Selective Context Retriever", "Incremental Delta Detector", "Repair Pattern Cache Lead", "Bounded Retry Governor", "Rollback Snapshot Engineer", "Environment Probe Verifier", "Secret & Env Hygiene Guard", "Git Provenance Auditor", "Commit SHA Recorder", "Local Fallback Packager", "Worker Auth Token Manager", "Resource-Aware Scheduler", "Memory Leak Watchdog", "Disk Quota Monitor", "Deterministic Seed Locker", "API Contract Validator", "Infrastructure Certifier"]),
    ("Archive, Security, QA & Release", ["Main ZIP Snapshot Builder", "Complete Bundle Assembler", "Production Project Archivist", "Dependency Manifest Scanner", "Path-Portability Normalizer", "Reproducible Ordering Engineer", "Normalized Timestamp Enforcer", "Intelligent Compression Router", "ZIP64 Threshold Enforcer", "Streaming Chunk Writer", "Incremental v22-v23 Packager", "Checkpoint Snapshot Packager", "Disaster Recovery Director", "SHA-256 Detached Signer", "Secret Leak Scanner", "Path Traversal Guard", "ZIP Bomb Decompression Guard", "Duplicate Entry Validator", "Clean Extraction Tester", "Isolated Install Tester", "Python Import Smoke Tester", "CLI Smoke Test Runner", "Blender Project Reopen Auditor", "SQLite Restoration Tester", "Quality Gate G001-G115 Auditor", "Quality Gate G116-G210 Auditor", "Archive Gate G211-G230 Auditor", "JUnit XML Report Publisher", "Validation Report Author", "Release Certification Director"]),
]

# 12 disciplines * 45? Wait: let's expand deterministically to EXACTLY 540 logical roles (12 * 45 = 540)!
def build_540_roles() -> List[Dict[str, str]]:
    roles: List[Dict[str, str]] = []
    tiers = ["Principal", "Senior", "Specialist"]
    # Wait: 12 disciplines * 30 base roles = 360; add 15 specialized sub-roles per discipline -> 12 * 45 = 540!
    extra_suffixes = [
        "Continuity Auditor", "Automation Scripting Lead", "Pipeline Verification Specialist",
        "Asset Integrity Checker", "Performance Profiler", "Cross-Shot Harmonizer",
        "Tooling Maintainer", "Standards Reviewer", "Regression Tester",
        "Documentation Steward", "Error-Recovery Operator", "Archive Compliance Lead",
        "Scene Portability Checker", "Resource Budget Analyst", "Gate Acceptance Signer",
    ]
    idx = 1
    for disc_idx, (discipline, base_names) in enumerate(PRODUCTION_DISCIPLINES_LIST()):
        combined = list(base_names) + [f"{discipline.split('&')[0].strip()} {suf}" for suf in extra_suffixes]
        for role_name in combined[:45]:
            agent = CORE_AGENTS[(disc_idx * 16 // 12) % 16]
            roles.append({
                "id": f"R{idx:03d}",
                "name": role_name,
                "discipline": discipline,
                "supervisor_agent": agent["id"],
                "tier": tiers[(idx - 1) % 3],
            })
            idx += 1
    return roles


def PRODUCTION_DISCIPLINES_LIST():
    return _ROLE_DISCIPLINES


def build_230_quality_gates() -> List[Dict[str, str]]:
    gates: List[Dict[str, str]] = []
    domains = [
        ("Creative & Narrative", 1, 25),
        ("Artistic DNA & Craftsmanship", 26, 55),
        ("Modeling, Topology & UVs", 56, 85),
        ("Materials, Groom & Lookdev", 86, 110),
        ("Rigging & Deformation", 111, 135),
        ("Animation & Emotional Continuity", 136, 165),
        ("Simulation, Lighting & Render", 166, 190),
        ("Editorial, Audio & Infrastructure", 191, 210),
    ]
    for domain, start, end in domains:
        for num in range(start, end + 1):
            gates.append({
                "id": f"G{num:03d}",
                "category": domain,
                "title": f"{domain} Verification Gate {num:03d}",
                "criteria": f"Deterministic validation rule for {domain.lower()} stage check #{num:03d}.",
            })

    archive_gates = [
        ("G211", "Archive generation integrity"),
        ("G212", "Source provenance verification"),
        ("G213", "GitHub main synchronization"),
        ("G214", "Commit SHA verification"),
        ("G215", "Archive content completeness"),
        ("G216", "Dependency packaging"),
        ("G217", "Compression integrity"),
        ("G218", "ZIP64 compatibility"),
        ("G219", "Large archive validation"),
        ("G220", "Manifest accuracy"),
        ("G221", "SHA-256 verification"),
        ("G222", "Secret scanning"),
        ("G223", "Safe extraction"),
        ("G224", "Clean installation"),
        ("G225", "Archive reproducibility"),
        ("G226", "Incremental update integrity"),
        ("G227", "Checkpoint restoration"),
        ("G228", "Disaster recovery"),
        ("G229", "Native project portability"),
        ("G230", "Independent archive release certification"),
    ]
    for gid, title in archive_gates:
        gates.append({
            "id": gid,
            "category": "Archive & Release",
            "title": title,
            "criteria": f"Automated verifiable check for {title.lower()}.",
        })
    return gates


def build_128_workers() -> List[Dict[str, Any]]:
    workers: List[Dict[str, Any]] = []
    groups = ["A", "B", "C", "D", "E", "F", "G", "H"]
    for i in range(1, 129):
        group_idx = (i - 1) // 16
        workers.append({
            "id": f"WORKER_{i:03d}",
            "slot": i,
            "group": f"GROUP_{groups[group_idx]}",
            "status": "CONFIGURED_LOGICAL_SLOT",
            "max_concurrent_jobs": 1,
            "autoscaling": "DISABLED",
            "target_resolution": "4096x2160",
            "target_fps": 24,
            "master_format": "OpenEXR",
        })
    return workers
