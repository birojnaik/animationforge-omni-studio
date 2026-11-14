import { useCallback, useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { OverviewView } from './components/OverviewView';
import { FireflyViewport } from './components/FireflyViewport';
import { RenderFarmView } from './components/RenderFarmView';
import { ArchivesView } from './components/ArchivesView';
import { VerificationView } from './components/VerificationView';
import type { StudioState, StudioTab } from './types/studio';

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');
  const [state, setState] = useState<StudioState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [compiling, setCompiling] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [renderingDemo, setRenderingDemo] = useState(false);
  const [busyArchiveAction, setBusyArchiveAction] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    try {
      const resp = await fetch('/api/studio/state');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load studio state');
      setState(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to reach studio server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleCompileBrief = async (payload: {
    title: string;
    premise: string;
    style: string;
    useAi: boolean;
  }) => {
    setCompiling(true);
    setNotice(null);
    try {
      const resp = await fetch('/api/studio/compile-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Compile failed');
      await loadState();
      setNotice(
        data.aiUsed
          ? `Compiled "${payload.title}" with AI Creative Direction and saved checkpoint ${data.checkpoint.checkpoint_id}.`
          : `Compiled "${payload.title}" deterministically (0 LLM tokens) and saved checkpoint ${data.checkpoint.checkpoint_id}.`,
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Compile failed');
    } finally {
      setCompiling(false);
    }
  };

  const handleTriggerRepair = async (fault: string) => {
    setRepairing(true);
    setNotice(null);
    try {
      const resp = await fetch('/api/studio/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Repair failed');
      await loadState();
      setNotice(`Autonomous recovery completed for ${fault}: ${data.repair.outcome}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Repair failed');
    } finally {
      setRepairing(false);
    }
  };

  const handleRenderDemoMp4 = async () => {
    setRenderingDemo(true);
    setNotice(null);
    try {
      const resp = await fetch('/api/production/render-demo', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Render failed');
      await loadState();
      setNotice(`Rendered 6s 144-frame MP4 (${data.playable_mp4}) and native Blender bpy script.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Render failed');
    } finally {
      setRenderingDemo(false);
    }
  };

  const handleArchiveCommand = async (action: string, targetArchive?: string): Promise<Record<string, unknown> | null> => {
    setBusyArchiveAction(action);
    setNotice(null);
    try {
      const resp = await fetch('/api/archives/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetArchive }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Archive command failed');
      await loadState();
      setNotice(`Archive engine executed ${action} cleanly.`);
      return data;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Archive command failed');
      return null;
    } finally {
      setBusyArchiveAction(null);
    }
  };

  const handleBuildMainZipFromHeader = async () => {
    await handleArchiveCommand('GENERATE_MAIN_ZIP');
    setActiveTab('archives');
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-[#e6e8ed]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onBuildMainZip={handleBuildMainZipFromHeader}
        buildingZip={busyArchiveAction === 'GENERATE_MAIN_ZIP'}
      />

      {error && (
        <div className="mx-auto mt-4 max-w-[1440px] px-6">
          <div className="flex items-center justify-between rounded-md border border-red-500/40 bg-red-950/30 px-4 py-2.5 text-xs text-red-300">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="font-semibold hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div className="mx-auto mt-4 max-w-[1440px] px-6">
          <div className="flex items-center justify-between rounded-md border border-emerald-500/35 bg-emerald-950/25 px-4 py-2.5 text-xs text-emerald-300">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="font-semibold hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main>
        {loading || !state ? (
          <div className="mx-auto max-w-[1440px] space-y-4 px-6 py-12">
            <div className="h-8 w-80 animate-pulse rounded bg-white/10" />
            <div className="h-44 w-full animate-pulse rounded-lg bg-white/5" />
            <div className="h-64 w-full animate-pulse rounded-lg bg-white/5" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewView
                state={state}
                onCompileBrief={handleCompileBrief}
                onTriggerRepair={handleTriggerRepair}
                onOpenStage={() => setActiveTab('stage')}
                compiling={compiling}
                repairing={repairing}
              />
            )}
            {activeTab === 'stage' && (
              <FireflyViewport
                state={state}
                onRenderDemoMp4={handleRenderDemoMp4}
                renderingDemo={renderingDemo}
              />
            )}
            {activeTab === 'farm' && <RenderFarmView state={state} />}
            {activeTab === 'archives' && (
              <ArchivesView
                state={state}
                onExecuteCommand={handleArchiveCommand}
                busyAction={busyArchiveAction}
              />
            )}
            {activeTab === 'verification' && (
              <VerificationView state={state} onRefreshState={loadState} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
