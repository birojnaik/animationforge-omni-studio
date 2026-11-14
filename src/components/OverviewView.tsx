import { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Cpu, Layers, ShieldAlert, Search, Play } from 'lucide-react';
import type { StudioState } from '../types/studio';

interface OverviewViewProps {
  state: StudioState;
  onCompileBrief: (payload: { title: string; premise: string; style: string; useAi: boolean }) => Promise<void>;
  onTriggerRepair: (fault: string) => Promise<void>;
  onOpenStage: () => void;
  compiling: boolean;
  repairing: boolean;
}

export function OverviewView({
  state,
  onCompileBrief,
  onTriggerRepair,
  onOpenStage,
  compiling,
  repairing,
}: OverviewViewProps) {
  const [title, setTitle] = useState(state.project.title);
  const [premise, setPremise] = useState(state.project.premise);
  const [style, setStyle] = useState(state.project.style);
  const [useAi, setUseAi] = useState(false);

  const [roleSearch, setRoleSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
  const [faultType, setFaultType] = useState('MISSING_FRAMES');

  const disciplines = useMemo(() => {
    const set = new Set(state.roles.map((r) => r.discipline));
    return ['ALL', ...Array.from(set)];
  }, [state.roles]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    return state.roles.filter((r) => {
      if (selectedDiscipline !== 'ALL' && r.discipline !== selectedDiscipline) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.discipline.toLowerCase().includes(q);
    });
  }, [state.roles, roleSearch, selectedDiscipline]);

  const env = state.environment;

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 px-6 py-8">
      {/* Section 1: Studio Hero & Honest Host Capability Matrix */}
      <section className="grid grid-cols-1 gap-8 border-b border-white/10 pb-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <p className="text-xs font-medium tracking-wide text-amber-400">
            Version {state.version} · 16 Core Agents · 540 Logical Roles · 230 Quality Gates
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#f4f5f7] sm:text-4xl">
            From creative idea to verified animated production and reproducible archives
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#9aa1b0]">
            AnimationForge compiles creative briefs into deterministic multi-stage production graphs, dispatches frame workloads across a 128-slot Flamenco queue, and packages self-verifying ZIP64 distributions with SHA-256 manifests. All host measurements below reflect actual runtime probes.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onOpenStage}
              className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-[#0b0d11] transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              Open 3D Firefly Stage
            </button>
            <span className="text-xs text-[#9aa1b0] tabular-nums">
              Host CPU: {env.cpu_logical_cores} logical cores · Free disk: {env.disk_free_gb} GB
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#12151c] p-5 lg:col-span-5">
          <h2 className="text-sm font-semibold text-[#f4f5f7]">Verified Host Runtime Probe</h2>
          <p className="mt-1 text-xs text-[#9aa1b0]">
            Unavailable external runtimes are reported directly as Blocked rather than simulated as present.
          </p>
          <dl className="mt-4 divide-y divide-white/8 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-[#c2c7d0]">Python Core & Archive Engine</dt>
              <dd className="inline-flex items-center gap-1.5 font-mono text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified ({env.tools.python3.version})
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-[#c2c7d0]">FFmpeg H.264 / AAC Media Encoder</dt>
              <dd className={`inline-flex items-center gap-1.5 font-mono ${env.tools.ffmpeg.available ? 'text-emerald-400' : 'text-red-400'}`}>
                {env.tools.ffmpeg.available ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {env.tools.ffmpeg.available ? 'Verified' : 'Blocked'}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-[#c2c7d0]">Git Snapshot & Provenance</dt>
              <dd className="inline-flex items-center gap-1.5 font-mono text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {env.tools.git.commit_sha === 'UNCOMMITTED_LOCAL_TREE' ? 'Local Source Fallback' : env.tools.git.commit_sha?.slice(0, 10)}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-[#c2c7d0]">Native Blender 4.x Binary</dt>
              <dd className={`inline-flex items-center gap-1.5 font-mono ${env.tools.blender.available ? 'text-emerald-400' : 'text-red-400'}`}>
                {env.tools.blender.available ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {env.tools.blender.available ? 'Verified' : 'Blocked (bpy script exported)'}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-[#c2c7d0]">GitHub Remote Sync</dt>
              <dd className="inline-flex items-center gap-1.5 font-mono text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Local Archive Provenance
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Section 2: Creative Brief -> Compiled 31-Stage Production Graph & Token Economy */}
      <section className="grid grid-cols-1 gap-8 border-b border-white/10 pb-8 lg:grid-cols-12">
        <div className="space-y-4 rounded-lg border border-white/10 bg-[#12151c] p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#f4f5f7]">Production Graph Compiler</h2>
            <span className="font-mono text-xs text-[#9aa1b0] tabular-nums">
              {state.project.specs.total_frames} frames · {state.project.specs.fps} fps
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="brief-title" className="block text-xs font-medium text-[#c2c7d0]">
                Project Title
              </label>
              <input
                id="brief-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/12 bg-[#0b0d11] px-3 py-2 text-sm text-[#f4f5f7] focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="brief-style" className="block text-xs font-medium text-[#c2c7d0]">
                Visual Style & Medium
              </label>
              <input
                id="brief-style"
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/12 bg-[#0b0d11] px-3 py-2 text-sm text-[#f4f5f7] focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="brief-premise" className="block text-xs font-medium text-[#c2c7d0]">
                Narrative Premise
              </label>
              <textarea
                id="brief-premise"
                rows={3}
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
                className="mt-1 w-full rounded-md border border-white/12 bg-[#0b0d11] px-3 py-2 text-sm text-[#f4f5f7] focus:border-amber-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#c2c7d0]">
              <input
                type="checkbox"
                checked={useAi}
                onChange={(e) => setUseAi(e.target.checked)}
                disabled={!state.ai_available}
                className="h-4 w-4 accent-amber-500"
              />
              <span>
                Enrich Artistic DNA via server intelligence ({state.ai_available ? 'Ready' : 'Offline — deterministic 0-token mode'})
              </span>
            </label>
            <button
              type="button"
              disabled={compiling}
              onClick={() => onCompileBrief({ title, premise, style, useAi })}
              className="w-full rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-[#f4f5f7] transition-colors hover:bg-white/16 disabled:opacity-60 cursor-pointer"
            >
              {compiling ? 'Compiling 39-Stage DAG...' : 'Compile Production Graph & Save SQLite Checkpoint'}
            </button>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
              <p className="text-xs text-[#9aa1b0]">Compiled LLM Tokens</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-[#f4f5f7] tabular-nums">
                {state.project.token_economy.compiled_tokens_used.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#9aa1b0]">One-time creative graph compilation</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
              <p className="text-xs text-[#9aa1b0]">Per-Op Naive Baseline</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-[#f4f5f7] tabular-nums">
                {state.project.token_economy.naive_llm_baseline_tokens.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#9aa1b0]">Estimated equivalent per-frame LLM calls</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
              <p className="text-xs text-[#9aa1b0]">Measured Reduction</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-emerald-400 tabular-nums">
                {state.project.token_economy.measured_reduction_percent}%
              </p>
              <p className="mt-1 text-xs text-[#9aa1b0]">Target: {state.project.token_economy.target_reduction_percent}%</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#12151c] p-5">
            <h3 className="text-sm font-semibold text-[#f4f5f7]">Artistic DNA & Protected Imperfections</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-amber-400">Emotional Continuity Beats</p>
                <ul className="mt-2 space-y-2 text-xs text-[#c2c7d0]">
                  {state.project.artistic_dna.emotional_beats.map((b) => (
                    <li key={b.beat} className="border-b border-white/6 pb-1.5">
                      <span className="font-semibold text-[#f4f5f7]">{b.beat}</span> · <span className="font-mono text-[#9aa1b0]">Frames {b.frames}</span>
                      <p className="mt-0.5 text-[#9aa1b0]">{b.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-amber-400">Protected Craftsmanship Decisions</p>
                <ul className="mt-2 space-y-2 text-xs text-[#c2c7d0]">
                  {state.project.artistic_dna.protected_imperfections.map((imp, idx) => (
                    <li key={idx} className="border-b border-white/6 pb-1.5 text-[#c2c7d0]">
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 7 Architecture Layers & 16 Core Orchestration Agents */}
      <section className="grid grid-cols-1 gap-8 border-b border-white/10 pb-8 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-[#f4f5f7]">Seven-Layer Architecture</h2>
          </div>
          <div className="divide-y divide-white/8 rounded-lg border border-white/10 bg-[#12151c]">
            {state.layers.map((layer) => (
              <div key={layer.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#f4f5f7]">{layer.name}</span>
                  <span className="font-mono text-[#9aa1b0]">{layer.id}</span>
                </div>
                <p className="mt-1 text-xs text-[#9aa1b0]">{layer.scope}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-[#f4f5f7]">Sixteen Core Orchestration Agents</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {state.agents.map((ag) => (
              <div key={ag.id} className="rounded-lg border border-white/10 bg-[#12151c] px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#f4f5f7]">{ag.name}</span>
                  <span className="font-mono text-[#9aa1b0]">{ag.id} · {ag.layer}</span>
                </div>
                <p className="mt-1 text-xs text-[#9aa1b0]">{ag.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Autonomous Error-Solving Engine & SQLite Checkpoints */}
      <section className="grid grid-cols-1 gap-8 border-b border-white/10 pb-8 lg:grid-cols-12">
        <div className="space-y-4 rounded-lg border border-white/10 bg-[#12151c] p-5 lg:col-span-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-[#f4f5f7]">Autonomous Error-Solving Engine</h2>
          </div>
          <p className="text-xs text-[#9aa1b0]">
            Protocol: Detect → Diagnose → Checkpoint → Repair → Test → Revalidate → Resume. Test bounded recovery directly against the SQLite production store.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select fault scenario"
              value={faultType}
              onChange={(e) => setFaultType(e.target.value)}
              className="rounded-md border border-white/12 bg-[#0b0d11] px-3 py-2 text-xs text-[#f4f5f7] focus:border-amber-500 focus:outline-none"
            >
              <option value="MISSING_FRAMES">Missing Frame Gap (Render)</option>
              <option value="CHECKSUM_MISMATCH">Archive Checksum Mismatch</option>
              <option value="UNSAFE_ARCHIVE_PATH">Unsafe Path Traversal Entry</option>
              <option value="DEPENDENCY_PATH_DRIFT">Non-Portable Dependency Path</option>
              <option value="BLENDER_BINARY_UNAVAILABLE">Blender Binary Unavailable</option>
            </select>
            <button
              type="button"
              disabled={repairing}
              onClick={() => onTriggerRepair(faultType)}
              className="rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-[#0b0d11] transition-colors hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {repairing ? 'Executing Recovery...' : 'Execute Recovery Test'}
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-white/8 border-t border-white/10 pt-2">
            {state.repair_logs.length === 0 ? (
              <p className="py-4 text-xs text-[#9aa1b0]">No fault recovery events recorded yet. Run a recovery test above.</p>
            ) : (
              state.repair_logs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[#f4f5f7]">{log.fault_type}</span>
                    <span className="font-mono text-emerald-400">{log.outcome}</span>
                  </div>
                  <p className="mt-0.5 text-[#9aa1b0]">{log.diagnosis} → {log.repair_action}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-white/10 bg-[#12151c] p-5 lg:col-span-6">
          <h2 className="text-base font-semibold text-[#f4f5f7]">Transactional SQLite Checkpoints</h2>
          <p className="text-xs text-[#9aa1b0]">
            Persistent snapshots allow resuming interrupted pipelines without repeating completed stages.
          </p>
          <div className="max-h-72 overflow-y-auto divide-y divide-white/8 border-t border-white/10">
            {state.checkpoints.map((cp) => (
              <div key={cp.checkpoint_id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <p className="font-mono font-medium text-[#f4f5f7]">{cp.checkpoint_id}</p>
                  <p className="text-[#9aa1b0]">{cp.milestone}</p>
                </div>
                <div className="text-right font-mono text-[#9aa1b0] tabular-nums">
                  <p>{cp.total_ops} ops tracked</p>
                  <p>{new Date(cp.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: 540 Logical Production Roles Registry */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#f4f5f7]">540 Logical Production Roles Registry</h2>
            <p className="text-xs text-[#9aa1b0]">
              Showing {filteredRoles.length} of {state.roles.length} structured department roles across 12 production disciplines.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[#9aa1b0]" />
              <input
                type="search"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Filter roles..."
                className="rounded-md border border-white/12 bg-[#12151c] py-1.5 pl-8 pr-3 text-xs text-[#f4f5f7] placeholder:text-[#6b7280] focus:border-amber-500 focus:outline-none"
              />
            </div>
            <select
              aria-label="Filter by discipline"
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="rounded-md border border-white/12 bg-[#12151c] px-3 py-1.5 text-xs text-[#f4f5f7] focus:border-amber-500 focus:outline-none"
            >
              {disciplines.map((d) => (
                <option key={d} value={d}>{d === 'ALL' ? 'All 12 Disciplines' : d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-white/10 bg-[#12151c]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-white/10 bg-[#161a23] text-[#9aa1b0]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Role ID</th>
                <th className="px-4 py-2.5 font-medium">Role Title</th>
                <th className="px-4 py-2.5 font-medium">Discipline</th>
                <th className="px-4 py-2.5 font-medium">Tier</th>
                <th className="px-4 py-2.5 text-right font-medium">Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {filteredRoles.slice(0, 120).map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-2 font-mono text-[#9aa1b0] tabular-nums">{r.id}</td>
                  <td className="px-4 py-2 font-medium text-[#f4f5f7]">{r.name}</td>
                  <td className="px-4 py-2 text-[#c2c7d0]">{r.discipline}</td>
                  <td className="px-4 py-2 text-[#9aa1b0]">{r.tier}</td>
                  <td className="px-4 py-2 text-right font-mono text-amber-400">{r.supervisor_agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
