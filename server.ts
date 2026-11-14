import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GoogleGenAI, Type } from '@google/genai';

const execFileAsync = promisify(execFile);

const ROOT_DIR = process.cwd();
const STUDIO_SRC_ROOT = path.join(ROOT_DIR, 'studio_core', 'animationforge-omni-studio-main');
const PYTHON_PATH = path.join(STUDIO_SRC_ROOT, 'src');
const ARCHIVE_OUT_DIR = path.join(ROOT_DIR, 'generated_archives');
const STUDIO_DB_PATH = path.join(ROOT_DIR, 'studio_runtime', 'animationforge_studio.sqlite');
const PROD_DEMO_DIR = path.join(STUDIO_SRC_ROOT, 'examples', 'THE_LAST_FIREFLY-production');

fs.mkdirSync(ARCHIVE_OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(STUDIO_DB_PATH), { recursive: true });
fs.mkdirSync(PROD_DEMO_DIR, { recursive: true });

async function runPythonModule(moduleName: string, args: string[], timeoutMs = 90000): Promise<string> {
  const { stdout } = await execFileAsync('python3', ['-m', moduleName, ...args], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PYTHONPATH: PYTHON_PATH,
    },
    maxBuffer: 10 * 1024 * 1024,
    timeout: timeoutMs,
  });
  return stdout;
}

function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // 1. Full Studio State
  app.get('/api/studio/state', async (_req, res) => {
    try {
      const out = await runPythonModule('animationforge.studio_bridge', [
        '--cmd', 'state',
        '--source', STUDIO_SRC_ROOT,
        '--out-dir', ARCHIVE_OUT_DIR,
        '--db', STUDIO_DB_PATH,
        '--prod-dir', PROD_DEMO_DIR,
      ]);
      const data = JSON.parse(out);
      data.ai_available = Boolean(getAiClient());
      res.json(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load studio state';
      res.status(500).json({ error: msg });
    }
  });

  // 2. Compile Creative Brief into 31+ Stage Production Graph
  app.post('/api/studio/compile-brief', async (req, res) => {
    try {
      const title = String(req.body?.title || 'THE LAST FIREFLY').slice(0, 120);
      const premise = String(req.body?.premise || '').slice(0, 1000);
      const style = String(req.body?.style || 'Stylized 3D CGI with hand-crafted painterly imperfections').slice(0, 200);
      const useAi = Boolean(req.body?.useAi);

      let aiEnriched: Record<string, unknown> | null = null;
      let aiUsed = false;
      let aiError: string | null = null;

      if (useAi) {
        const ai = getAiClient();
        if (ai) {
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-4-hydrogen',
              contents: `As Film Director and Art & Craftsmanship Director, break down this animated short film brief into visual motifs, 3 emotional beats across 144 frames (24fps, 6s), and protected intentional imperfections.\nTitle: ${title}\nStyle: ${style}\nPremise: ${premise}`,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    visual_motifs: { type: Type.ARRAY, items: { type: Type.STRING } },
                    emotional_beats: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          beat: { type: Type.STRING },
                          frames: { type: Type.STRING },
                          note: { type: Type.STRING },
                        },
                      },
                    },
                    protected_imperfections: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
            });
            const parsed = JSON.parse((response.text ?? '{}').trim());
            if (parsed && typeof parsed === 'object') {
              aiEnriched = parsed;
              aiUsed = true;
            }
          } catch (e: unknown) {
            aiError = e instanceof Error ? e.message : 'AI enrichment failed; fell back to deterministic compiler';
          }
        } else {
          aiError = 'No GEMINI_API_KEY configured; used deterministic compiled graph (0 tokens).';
        }
      }

      const args = [
        '--cmd', 'compile-custom',
        '--source', STUDIO_SRC_ROOT,
        '--out-dir', ARCHIVE_OUT_DIR,
        '--db', STUDIO_DB_PATH,
        '--prod-dir', PROD_DEMO_DIR,
        '--title', title,
        '--premise', premise,
        '--style', style,
      ];
      if (aiEnriched) {
        args.push('--ai-json', JSON.stringify(aiEnriched));
      }
      const out = await runPythonModule('animationforge.studio_bridge', args);
      const result = JSON.parse(out);
      res.json({ ...result, aiUsed, aiError });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compile production graph';
      res.status(500).json({ error: msg });
    }
  });

  // 3. Autonomous Error-Solving Simulation
  app.post('/api/studio/repair', async (req, res) => {
    try {
      const fault = String(req.body?.fault || 'MISSING_FRAMES');
      const out = await runPythonModule('animationforge.studio_bridge', [
        '--cmd', 'repair',
        '--source', STUDIO_SRC_ROOT,
        '--out-dir', ARCHIVE_OUT_DIR,
        '--db', STUDIO_DB_PATH,
        '--prod-dir', PROD_DEMO_DIR,
        '--fault', fault,
      ]);
      res.json(JSON.parse(out));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Repair command failed';
      res.status(500).json({ error: msg });
    }
  });

  // 4. Flamenco 128-Slot Dispatch
  app.post('/api/flamenco/dispatch', async (req, res) => {
    try {
      const frames = Math.min(500, Math.max(1, Number(req.body?.frames || 144)));
      const failedWorker = String(req.body?.failedWorker || '');
      const out = await runPythonModule('animationforge.studio_bridge', [
        '--cmd', 'dispatch',
        '--source', STUDIO_SRC_ROOT,
        '--out-dir', ARCHIVE_OUT_DIR,
        '--db', STUDIO_DB_PATH,
        '--prod-dir', PROD_DEMO_DIR,
        '--frames', String(frames),
        '--failed-worker', failedWorker,
      ]);
      res.json(JSON.parse(out));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Flamenco dispatch failed';
      res.status(500).json({ error: msg });
    }
  });

  // 5. Render 6s 144-Frame Playable MP4 + WAV + Native bpy Script
  app.post('/api/production/render-demo', async (_req, res) => {
    try {
      const out = await runPythonModule('animationforge.cli', [
        'render-demo',
        '--out', PROD_DEMO_DIR,
      ], 120000);
      res.json(JSON.parse(out));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo render failed';
      res.status(500).json({ error: msg });
    }
  });

  // 6. Stream Playable MP4 with Byte-Range Support
  app.get('/api/production/video', (req, res) => {
    const mp4Path = path.join(PROD_DEMO_DIR, '13_final_delivery', 'the_last_firefly_960x540_24fps.mp4');
    if (!fs.existsSync(mp4Path)) {
      res.status(404).json({ error: 'MP4 not yet rendered. Click Render 6s MP4 first.' });
      return;
    }
    const stat = fs.statSync(mp4Path);
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(mp4Path, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(mp4Path).pipe(res);
    }
  });

  // 7. Download Native Blender Python Script
  app.get('/api/production/blender-script', (_req, res) => {
    const bpyPath = path.join(PROD_DEMO_DIR, '05_animation', 'the_last_firefly_blender_scene.py');
    if (!fs.existsSync(bpyPath)) {
      res.status(404).json({ error: 'Blender script not generated yet.' });
      return;
    }
    res.download(bpyPath, 'the_last_firefly_blender_scene.py');
  });

  // 8. Execute Archive Engine Command
  app.post('/api/archives/command', async (req, res) => {
    try {
      const action = String(req.body?.action || 'GENERATE_MAIN_ZIP');
      const targetArchive = req.body?.targetArchive ? path.basename(String(req.body.targetArchive)) : '';
      const args = [
        'archive-cmd',
        '--action', action,
        '--source', STUDIO_SRC_ROOT,
        '--out-dir', ARCHIVE_OUT_DIR,
        '--db', STUDIO_DB_PATH,
        '--production-dir', PROD_DEMO_DIR,
      ];
      if (targetArchive) {
        args.push('--target-zip', path.join(ARCHIVE_OUT_DIR, targetArchive));
      }
      const out = await runPythonModule('animationforge.cli', args, 120000);
      res.json(JSON.parse(out));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Archive command failed';
      res.status(500).json({ error: msg });
    }
  });

  // 9. Download Generated Archive or SHA256SUMS.txt
  app.get('/api/archives/download/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const fullPath = path.join(ARCHIVE_OUT_DIR, safeName);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Archive file not found' });
      return;
    }
    res.download(fullPath, safeName);
  });

  // 10. Run Automated Python Archive Test Suite
  app.post('/api/tests/run', async (_req, res) => {
    try {
      const xmlOut = path.join(STUDIO_SRC_ROOT, 'reports', 'test_results.xml');
      const out = await runPythonModule('animationforge.cli', [
        'run-tests',
        '--source', STUDIO_SRC_ROOT,
        '--xml-out', xmlOut,
      ], 60000);
      res.json(JSON.parse(out));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Test run failed';
      res.status(500).json({ error: msg });
    }
  });

  // 11. Inspect Generated Evidence Report
  app.get('/api/reports/:name', (req, res) => {
    const safeName = path.basename(req.params.name);
    const reportPath = path.join(STUDIO_SRC_ROOT, 'reports', safeName);
    if (!fs.existsSync(reportPath)) {
      res.status(404).json({ error: 'Report not found. Generate releases or run tests first.' });
      return;
    }
    const content = fs.readFileSync(reportPath, 'utf-8');
    res.json({ name: safeName, content });
  });

  // Frontend Serving (Vite dev middleware vs static dist)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`AnimationForge Omni Studio server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
