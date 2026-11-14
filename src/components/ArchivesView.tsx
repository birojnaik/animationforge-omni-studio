import { useState } from 'react';
import { Download, ShieldCheck, Package, RotateCcw, Wrench, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { StudioState } from '../types/studio';

interface ArchivesViewProps {
  state: StudioState;
  onExecuteCommand: (action: string, targetArchive?: string) => Promise<Record<string, unknown> | null>;
  busyAction: string | null;
}

export function ArchivesView({ state, onExecuteCommand, busyAction }: ArchivesViewProps) {
  const [selectedArchive, setSelectedArchive] = useState<string>('animationforge-omni-studio-main.zip');
  const [commandOutput, setCommandOutput] = useState<Record<string, unknown> | null>(null);

  const runCmd = async (action: string, target?: string) => {
    const res = await onExecuteCommand(action, target);
    if (res) setCommandOutput(res);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#f4f5f7]">
            Universal Autonomous Archive Engine
          </h1>
          <p className="max-w-3xl text-xs text-[#9aa1b0]">
            Reproducible ZIP64 packaging with normalized timestamps, per-type compression routing, secret scanning, SHA-256 detached checksums, safe path-traversal extraction, and isolated SQLite restoration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => runCmd('GENERATE_MAIN_ZIP')}
            className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#f4f5f7] hover:bg-white/16 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Package className="h-3.5 w-3.5" />
            {busyAction === 'GENERATE_MAIN_ZIP' ? 'Generating...' : 'Generate Main ZIP'}
          </button>
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => runCmd('GENERATE_ALL_RELEASES')}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3.5 py-2 text-xs font-semibold text-[#0b0d11] hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Package className="h-3.5 w-3.5" />
            {busyAction === 'GENERATE_ALL_RELEASES' ? 'Building All 12 Bundles...' : 'Generate All Release ZIPs & SHA256SUMS'}
          </button>
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => runCmd('GENERATE_INCREMENTAL_UPDATE')}
            className="rounded-md border border-white/12 bg-[#12151c] px-3 py-2 text-xs font-medium text-[#c2c7d0] hover:bg-white/10 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {busyAction === 'GENERATE_INCREMENTAL_UPDATE' ? 'Diffing...' : 'Build v22→v23 Update'}
          </button>
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => runCmd('GENERATE_CHECKPOINT_ARCHIVE')}
            className="rounded-md border border-white/12 bg-[#12151c] px-3 py-2 text-xs font-medium text-[#c2c7d0] hover:bg-white/10 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {busyAction === 'GENERATE_CHECKPOINT_ARCHIVE' ? 'Snapshotting...' : 'Create SQLite Checkpoint ZIP'}
          </button>
        </div>
      </div>

      {/* Verification & Restoration Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#12151c] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="archive-target-select" className="text-xs font-medium text-[#c2c7d0]">
            Target Archive:
          </label>
          <select
            id="archive-target-select"
            value={selectedArchive}
            onChange={(e) => setSelectedArchive(e.target.value)}
            className="rounded-md border border-white/12 bg-[#0b0d11] px-3 py-1.5 font-mono text-xs text-[#f4f5f7]"
          >
            {state.archives.length === 0 ? (
              <option value="animationforge-omni-studio-main.zip">animationforge-omni-studio-main.zip</option>
            ) : (
              state.archives.map((a) => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={Boolean(busyAction) || state.archives.length === 0}
            onClick={() => runCmd('VERIFY_ARCHIVE', selectedArchive)}
            className="inline-flex items-center gap-1.5 rounded border border-white/12 px-3 py-1.5 text-xs font-medium text-[#f4f5f7] hover:bg-white/10 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Run 20-Point Verification
          </button>
          <button
            type="button"
            disabled={Boolean(busyAction) || state.archives.length === 0}
            onClick={() => runCmd('TEST_ARCHIVE_INSTALLATION', selectedArchive)}
            className="rounded border border-white/12 px-3 py-1.5 text-xs font-medium text-[#f4f5f7] hover:bg-white/10 disabled:opacity-50 cursor-pointer"
          >
            Test Clean Installation
          </button>
          <button
            type="button"
            disabled={Boolean(busyAction) || state.archives.length === 0}
            onClick={() => runCmd('RESTORE_ARCHIVE', selectedArchive)}
            className="inline-flex items-center gap-1.5 rounded border border-white/12 px-3 py-1.5 text-xs font-medium text-[#f4f5f7] hover:bg-white/10 disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
            Test Isolated Restoration
          </button>
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => runCmd('REPAIR_ARCHIVE', selectedArchive)}
            className="inline-flex items-center gap-1.5 rounded border border-white/12 px-3 py-1.5 text-xs font-medium text-[#f4f5f7] hover:bg-white/10 disabled:opacity-50 cursor-pointer"
          >
            <Wrench className="h-3.5 w-3.5 text-amber-400" />
            Disaster Recovery Check
          </button>
        </div>
      </div>

      {/* Deliverables Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#12151c]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#f4f5f7]">
            Generated Distribution Archives ({state.archives.length})
          </h2>
          {state.archives.length > 0 && (
            <a
              href="/api/archives/download/SHA256SUMS.txt"
              download="SHA256SUMS.txt"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download SHA256SUMS.txt
            </a>
          )}
        </div>

        {state.archives.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-[#9aa1b0]">
            No archives generated yet. Click <span className="font-semibold text-[#f4f5f7]">Generate All Release ZIPs & SHA256SUMS</span> above to package and verify all deliverables.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-[#161a23] text-[#9aa1b0]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Archive Filename</th>
                <th className="px-4 py-2.5 font-medium">SHA-256 Digest</th>
                <th className="px-4 py-2.5 text-right font-medium">Size</th>
                <th className="px-4 py-2.5 text-right font-medium">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {state.archives.map((arc) => (
                <tr key={arc.name} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5 font-mono font-medium text-[#f4f5f7]">{arc.name}</td>
                  <td className="px-4 py-2.5 font-mono text-[#9aa1b0]">{arc.sha256}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#c2c7d0] tabular-nums">{formatBytes(arc.size_bytes)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={`/api/archives/download/${encodeURIComponent(arc.name)}`}
                      download={arc.name}
                      className="inline-flex items-center gap-1 font-medium text-amber-400 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      ZIP
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Live Verification / Command Output Inspector */}
      {commandOutput && (
        <div className="rounded-lg border border-white/10 bg-[#12151c] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#f4f5f7]">
              Command Output · {String(commandOutput.action || 'RESULT')}
            </h3>
            {typeof (commandOutput.verification as Record<string, unknown> | undefined)?.overall === 'string' && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {String((commandOutput.verification as Record<string, unknown>).overall)}
              </span>
            )}
          </div>

          {Array.isArray((commandOutput.verification as Record<string, unknown> | undefined)?.checks) ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {((commandOutput.verification as Record<string, unknown>).checks as { id: string; name: string; status: string }[]).map((chk) => {
                const blocked = chk.status.includes('BLOCKED') || chk.status.includes('NOT_APPLICABLE');
                const failed = chk.status === 'FAILED';
                return (
                  <div key={chk.id} className="flex items-center justify-between rounded border border-white/8 bg-[#0b0d11] px-3 py-2 text-xs">
                    <span className="text-[#c2c7d0]">{chk.id} · {chk.name}</span>
                    <span className={`inline-flex items-center gap-1 font-mono ${failed ? 'text-red-400' : blocked ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {failed ? <XCircle className="h-3.5 w-3.5" /> : blocked ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      {chk.status}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <pre className="max-h-72 overflow-auto rounded bg-[#0b0d11] p-4 font-mono text-xs text-[#c2c7d0]">
              {JSON.stringify(commandOutput, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
