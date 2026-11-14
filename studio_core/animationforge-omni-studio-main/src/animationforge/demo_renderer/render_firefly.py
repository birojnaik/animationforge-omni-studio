"""Pure-Python + FFmpeg 6-second 144-frame 960x540 24fps demo production renderer for THE LAST FIREFLY."""

from __future__ import annotations

import json
import math
import shutil
import struct
import subprocess
import wave
from pathlib import Path
from typing import Any, Dict

from animationforge.archive_engine.integrity import compute_sha256
from animationforge.native_blender.firefly_scene_builder import export_blender_scene_script


def _write_wav_soundtrack(wav_path: Path, duration_s: float = 6.0, sample_rate: int = 24000) -> None:
    """Synthesize a gentle night-forest drone + soft wing-hum + warm harmonic chime (16-bit stereo PCM)."""
    num_samples = int(duration_s * sample_rate)
    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        chimes = [
            (0.6, 523.25),   # C5
            (1.9, 659.25),   # E5
            (3.2, 783.99),   # G5
            (4.4, 1046.50),  # C6
        ]
        for i in range(num_samples):
            t = i / sample_rate
            # Warm night pad
            pad = 0.08 * math.sin(2 * math.pi * 110.0 * t) + 0.05 * math.sin(2 * math.pi * 164.81 * t)
            # Soft wing flutter modulation
            wing_mod = 0.03 * math.sin(2 * math.pi * 46.0 * t) * (0.4 + 0.6 * math.sin(math.pi * t / duration_s))
            chime_val = 0.0
            for onset, freq in chimes:
                dt = t - onset
                if dt >= 0.0:
                    env = math.exp(-dt * 2.6) * min(1.0, dt * 40.0)
                    chime_val += 0.22 * env * math.sin(2 * math.pi * freq * dt)
            # Master fade in/out
            master_env = min(1.0, t / 0.4) * min(1.0, (duration_s - t) / 0.5)
            pan = 0.5 + 0.25 * math.sin(2 * math.pi * 0.25 * t)
            base = (pad + wing_mod + chime_val) * master_env
            left = max(-0.95, min(0.95, base * (1.0 - 0.3 * pan)))
            right = max(-0.95, min(0.95, base * (0.7 + 0.3 * pan)))
            frames += struct.pack("<hh", int(left * 32767), int(right * 32767))
        wf.writeframes(bytes(frames))


def render_the_last_firefly_demo(production_root: str | Path) -> Dict[str, Any]:
    """Generate complete THE_LAST_FIREFLY-production directory tree, 144 frames, audio, and playable MP4."""
    root = Path(production_root).resolve()
    dirs = [
        "01_development", "02_preproduction", "03_assets/characters", "03_assets/environments",
        "03_assets/props", "03_assets/materials", "03_assets/textures", "04_rigging",
        "05_animation", "06_simulations", "07_lighting", "08_rendering/frames",
        "09_compositing", "10_editorial", "11_audio", "12_mastering",
        "13_final_delivery", "14_validation", "15_checkpoints",
    ]
    for d in dirs:
        (root / d).mkdir(parents=True, exist_ok=True)

    # Export genuine bpy scene script
    bpy_path = root / "05_animation" / "the_last_firefly_blender_scene.py"
    export_blender_scene_script(str(bpy_path))

    # Write rig & artistic DNA metadata
    rig_spec = {
        "character": "Luma (The Last Firefly)",
        "bones": ["root_pelvis", "thorax", "head", "abdomen_lantern", "wing_L", "wing_R"],
        "intentional_imperfections": {"wing_phase_asymmetry_deg": 4.0, "hover_drift": True},
    }
    (root / "04_rigging" / "firefly_rig_spec.json").write_text(json.dumps(rig_spec, indent=2), encoding="utf-8")

    # Synthesize 6-second stereo WAV soundtrack
    wav_path = root / "11_audio" / "the_last_firefly_score.wav"
    _write_wav_soundtrack(wav_path, duration_s=6.0)

    # Render playable 960x540 24fps 144-frame MP4 via FFmpeg procedural filtergraph + real audio
    mp4_path = root / "13_final_delivery" / "the_last_firefly_960x540_24fps.mp4"
    ffmpeg_bin = shutil.which("ffmpeg")
    mp4_generated = False
    ffmpeg_note = ""

    if ffmpeg_bin:
        # Render raw 960x540 RGB24 frames procedurally in Python (fast, deterministic 144 frames) and pipe to ffmpeg!
        width, height, fps, total_frames = 960, 540, 24, 144
        # Precompute static forest background buffer (moonlit indigo gradient + distant silhouette hills)
        bg_row = bytearray(width * height * 3)
        for y in range(height):
            ny = y / height
            # Night indigo sky -> deep forest moss floor
            if ny < 0.72:
                r = int(10 + 14 * (ny / 0.72))
                g = int(16 + 24 * (ny / 0.72))
                b = int(34 + 30 * (ny / 0.72))
            else:
                floor_t = (ny - 0.72) / 0.28
                r = int(12 + 10 * floor_t)
                g = int(24 + 14 * floor_t)
                b = int(20 + 8 * floor_t)
            row_bytes = bytes((r, g, b)) * width
            bg_row[y * width * 3 : (y + 1) * width * 3] = row_bytes

        # Save a few keyframe PNGs in 08_rendering/frames via ffmpeg or pipe rawvideo straight to mp4
        cmd = [
            ffmpeg_bin, "-y",
            "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{width}x{height}", "-r", str(fps), "-i", "-",
            "-i", str(wav_path),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart",
            str(mp4_path),
        ]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        assert proc.stdin is not None

        mushrooms = [(220, 415, 22), (710, 430, 18), (380, 445, 14)]
        for f in range(total_frames):
            t = f / (total_frames - 1)
            buf = bytearray(bg_row)

            # Firefly trajectory across the glade
            fx = int(width * (0.22 + 0.56 * t + 0.06 * math.sin(t * math.pi * 2.5)))
            fy = int(height * (0.52 - 0.14 * math.sin(t * math.pi * 1.6) + 0.03 * math.sin(f * 0.45)))
            # Emotional lantern intensity: hesitant flicker -> bright beacon
            pulse = (0.35 + 0.65 * (t ** 1.3)) * (0.88 + 0.12 * math.sin(f * 0.5))
            glow_radius = int(68 + 42 * pulse)

            # Draw glowing teal mushrooms
            for mx, my, mr in mushrooms:
                for dy in range(-mr, mr + 1):
                    py = my + dy
                    if 0 <= py < height:
                        for dx in range(-mr, mr + 1):
                            px = mx + dx
                            if 0 <= px < width:
                                d2 = dx * dx + dy * dy
                                if d2 <= mr * mr:
                                    fall = 1.0 - math.sqrt(d2) / mr
                                    idx = (py * width + px) * 3
                                    buf[idx] = min(255, buf[idx] + int(35 * fall))
                                    buf[idx + 1] = min(255, buf[idx + 1] + int(145 * fall))
                                    buf[idx + 2] = min(255, buf[idx + 2] + int(175 * fall))

            # Draw warm bioluminescent firefly radial halo + core + wing streaks
            y0, y1 = max(0, fy - glow_radius), min(height, fy + glow_radius + 1)
            x0, x1 = max(0, fx - glow_radius), min(width, fx + glow_radius + 1)
            r_sq_max = glow_radius * glow_radius
            wing_flap = math.sin(f * 1.8) * 14
            for py in range(y0, y1):
                dy = py - fy
                row_off = py * width * 3
                for px in range(x0, x1):
                    dx = px - fx
                    d2 = dx * dx + dy * dy
                    if d2 <= r_sq_max:
                        dist = math.sqrt(d2) / glow_radius
                        fall = ((1.0 - dist) ** 2.4) * pulse
                        idx = row_off + px * 3
                        buf[idx] = min(255, buf[idx] + int(255 * fall))
                        buf[idx + 1] = min(255, buf[idx + 1] + int(178 * fall))
                        buf[idx + 2] = min(255, buf[idx + 2] + int(52 * fall))
                        if d2 < 36:
                            buf[idx] = 255
                            buf[idx + 1] = 238
                            buf[idx + 2] = 175
                    # Subtle wing highlight
                    if abs(dy - int(wing_flap * 0.4) + 8) <= 2 and 4 <= abs(dx) <= 18:
                        idx = row_off + px * 3
                        buf[idx] = min(255, buf[idx] + 90)
                        buf[idx + 1] = min(255, buf[idx + 1] + 105)
                        buf[idx + 2] = min(255, buf[idx + 2] + 130)

            proc.stdin.write(buf)

        proc.stdin.close()
        proc.wait(timeout=60)
        stderr_bytes = proc.stderr.read() if proc.stderr else b""
        mp4_generated = proc.returncode == 0 and mp4_path.exists()
        if not mp4_generated:
            ffmpeg_note = stderr_bytes.decode("utf-8", errors="ignore")[:400]

        # Extract 6 representative PNG frames (1, 30, 60, 90, 120, 144) from the MP4 into 08_rendering/frames
        if mp4_generated:
            subprocess.run(
                [ffmpeg_bin, "-y", "-i", str(mp4_path), "-vf", "select='not(mod(n\\,24))'", "-vsync", "0", str(root / "08_rendering" / "frames" / "keyframe_%03d.png")],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=30,
            )
    else:
        ffmpeg_note = "BLOCKED: ffmpeg binary not found on host"

    project_manifest = {
        "project": "THE LAST FIREFLY",
        "duration_seconds": 6.0,
        "fps": 24,
        "frames": 144,
        "preview_resolution": "960x540",
        "blender_scene_script": "05_animation/the_last_firefly_blender_scene.py",
        "audio_track": "11_audio/the_last_firefly_score.wav",
        "playable_mp4": "13_final_delivery/the_last_firefly_960x540_24fps.mp4" if mp4_generated else "BLOCKED",
        "mp4_sha256": compute_sha256(mp4_path) if mp4_generated else None,
        "note": ffmpeg_note or "Rendered 144 frames @ 24fps (960x540) with stereo synthesized audio via FFmpeg.",
    }
    (root / "project_manifest.json").write_text(json.dumps(project_manifest, indent=2), encoding="utf-8")

    return project_manifest
