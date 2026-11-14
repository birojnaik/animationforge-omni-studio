# AnimationForge Omni Studio v23.0.0

Universal autonomous AI-driven animation production studio and reproducible archive engine.

## Core Capabilities
- **16 Core Orchestration Agents** & **540 Logical Production Roles** across **7 Architecture Layers**.
- **Compiled 31+ Stage Production Graph** reducing per-operation LLM token consumption.
- **SQLite Persistent Production Database** with transactional checkpointing and bounded error recovery.
- **Flamenco 128-Slot Fixed Worker Scheduler** (`WORKER_001`–`WORKER_128`, 8 groups of 16, autoscaling disabled).
- **Universal Autonomous Archive Engine** supporting reproducible ZIP64 packaging, SHA-256 verification, secret scanning, safe extraction, incremental updates, and isolated restoration.
- **End-to-End Demo Production**: *THE LAST FIREFLY* (6s, 24fps, 144 frames, 960×540 preview MP4 + native Blender `bpy` script).

## Honest Runtime Notes
- Native Blender `.blend` reopening requires an external `blender` 4.x executable (`BLOCKED` if absent on host).
- GitHub remote push/snapshot requires authorized Git remote credentials; local snapshots fall back cleanly to `LOCAL_MAIN_SNAPSHOT` or `LOCAL_SOURCE_FALLBACK`.
