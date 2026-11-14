import { useState } from 'react';
import { Server, AlertTriangle, RefreshCw } from 'lucide-react';
import type { StudioState } from '../types/studio';

interface DispatchResult {
  total_frames: number;
  worker_slots_used: number;
  reassignments: { frame: number; failed_worker: string; reassigned_to: string; reason: string }[];
  assignments: { frame: number; worker_id: string; group: string; status: string }[];
}

interface RenderFarmViewProps {
  state: StudioState;
}

export function RenderFarmView({ state }: RenderFarmViewProps) {
  const [failedWorker, setFailedWorker] = useState('WORKER_014');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cfg = state.environment.flamenco_config;
  const groups = ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D', 'GROUP_E', 'GROUP_F', 'GROUP_G', 'GROUP_H'];

  const handleDispatch = async (simulateFailure: boolean) => {
    setDispatching(true);
    setError(null);
    try {
      const resp = await fetch('/api/flamenco/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: 144,
          failedWorker: simulateFailure ? failedWorker : '',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Dispatch failed');
      setDispatchResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to dispatch frames');
    } finally {
      setDispatching(false);
    }
  };

  const reassignedTargets = new Set(dispatchResult?.reassignments.map((r) => r.reassigned_to) || []);
  const activeWorkers = new Set(dispatchResult?.assignments.map((a) => a.worker_id) || []);

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#f4f5f7]">
            Flamenco 128-Slot Fixed Render Scheduler
          </h1>
          <p className="max-w-3xl text-xs text-[#9aa1b0]">
            {cfg.physical_host_note} Target throughput objectives (24 fps sustained, 5.0s mean 4K OpenEXR frame) remain unverified until Blender Cycles executes on physical render nodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Select worker to simulate heartbeat timeout"
            value={failedWorker}
            onChange={(e) => setFailedWorker(e.target.value)}
            className="rounded-md border border-white/12 bg-[#12151c] px-3 py-2 font-mono text-xs text-[#f4f5f7]"
          >
            {state.workers.slice(0, 32).map((w) => (
              <option key={w.id} value={w.id}>{w.id}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={dispatching}
            onClick={() => handleDispatch(false)}
            className="rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-[#f4f5f7] hover:bg-white/16 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Schedule 144 Frames
          </button>
          <button
            type="button"
            disabled={dispatching}
            onClick={() => handleDispatch(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-[#0b0d11] hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Test Worker Failure & Reassignment
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Locked Flamenco Configuration Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
          <p className="text-xs text-[#9aa1b0]">Logical Slots</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[#f4f5f7] tabular-nums">{cfg.logical_worker_slots}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
          <p className="text-xs text-[#9aa1b0]">Worker Groups</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[#f4f5f7] tabular-nums">{cfg.groups} × {cfg.workers_per_group}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
          <p className="text-xs text-[#9aa1b0]">Autoscaling</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[#f4f5f7]">{cfg.autoscaling}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
          <p className="text-xs text-[#9aa1b0]">Master Spec</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[#f4f5f7] tabular-nums">{cfg.default_resolution}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
          <p className="text-xs text-[#9aa1b0]">Master Format</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[#f4f5f7]">{cfg.master_format}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#12151c] p-4">
          <p className="text-xs text-[#9aa1b0]">Physical CPU Cores</p>
          <p className="mt-1 font-mono text-lg font-semibold text-amber-400 tabular-nums">{state.environment.cpu_logical_cores}</p>
        </div>
      </div>

      {dispatchResult && dispatchResult.reassignments.length > 0 && (
        <div className="rounded-lg border border-amber-500/35 bg-[#12151c] p-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Automatic Failed-Frame Reassignment Executed
          </div>
          <div className="mt-2 space-y-1 font-mono text-[#c2c7d0]">
            {dispatchResult.reassignments.map((r) => (
              <p key={r.frame}>
                Frame {String(r.frame).padStart(3, '0')}: {r.failed_worker} timed out → reassigned to {r.reassigned_to}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 8 Groups × 16 Worker Slots */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {groups.map((grp) => {
          const groupWorkers = state.workers.filter((w) => w.group === grp);
          return (
            <div key={grp} className="rounded-lg border border-white/10 bg-[#12151c] p-4">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#f4f5f7]">
                  <Server className="h-3.5 w-3.5 text-amber-400" />
                  {grp}
                </span>
                <span className="font-mono text-[#9aa1b0]">16 slots</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {groupWorkers.map((w) => {
                  const isReassigned = reassignedTargets.has(w.id);
                  const isScheduled = activeWorkers.has(w.id);
                  const isFailed = Boolean(dispatchResult?.reassignments.some((r) => r.failed_worker === w.id));
                  let cellClass = 'border-white/8 bg-[#0b0d11] text-[#9aa1b0]';
                  if (isFailed) cellClass = 'border-red-500/50 bg-red-950/40 text-red-300';
                  else if (isReassigned) cellClass = 'border-amber-500/60 bg-amber-500/15 text-amber-300';
                  else if (isScheduled) cellClass = 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300';
                  return (
                    <div
                      key={w.id}
                      title={`${w.id} · ${w.status}`}
                      className={`rounded border px-1.5 py-1 text-center font-mono text-[10px] tabular-nums ${cellClass}`}
                    >
                      {w.id.replace('WORKER_', 'W')}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
