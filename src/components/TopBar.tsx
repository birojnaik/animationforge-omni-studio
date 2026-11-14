import type { StudioTab } from '../types/studio';

interface TopBarProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onBuildMainZip: () => void;
  buildingZip: boolean;
}

const NAV_ITEMS: { id: StudioTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'stage', label: '3D Stage' },
  { id: 'farm', label: 'Render Farm' },
  { id: 'archives', label: 'Archives' },
  { id: 'verification', label: 'Verification' },
];

export function TopBar({ activeTab, onSelectTab, onBuildMainZip, buildingZip }: TopBarProps) {
  return (
    <header className="w-full border-b border-white/10 bg-[#0b0d11]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="text-base font-semibold tracking-tight text-[#f4f5f7] whitespace-nowrap shrink-0"
        >
          AnimationForge Omni Studio
        </a>

        <nav className="flex items-center gap-6 overflow-x-auto" aria-label="Studio navigation">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  active ? 'text-[#f4f5f7]' : 'text-[#9aa1b0] hover:text-[#f4f5f7]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-[2px] bg-amber-500"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            disabled={buildingZip}
            onClick={onBuildMainZip}
            className="rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-[#0b0d11] transition-colors hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {buildingZip ? 'Packaging ZIP...' : 'Build Main ZIP'}
          </button>
        </div>
      </div>
    </header>
  );
}
