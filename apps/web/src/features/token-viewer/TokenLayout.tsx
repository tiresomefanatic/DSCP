import * as Tabs from '@radix-ui/react-tabs';
import { Layers, Palette, Box } from 'lucide-react';
import { useAppStore, type ActiveTab, type ViewMode } from '@/lib/store';
import { CategorySidebar } from './CategorySidebar';
import { TokenGrid } from './TokenGrid';
import { TokenTable } from './TokenTable';
import { TokenDetail } from './TokenDetail';

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'primitives', label: 'Primitives', icon: <Palette className="h-4 w-4" /> },
  { id: 'tokens', label: 'Tokens', icon: <Layers className="h-4 w-4" /> },
  { id: 'components', label: 'Components', icon: <Box className="h-4 w-4" /> },
];

export function TokenLayout() {
  const { activeTab, setActiveTab, viewMode, setViewMode, selectedToken, selectedCategory } = useAppStore();

  return (
    <div className="flex h-full flex-col">
      {/* Tab Bar + Mode Toggle */}
      <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <Tabs.List className="flex">
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground"
              >
                {tab.icon}
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 px-4">
          <span className="text-xs font-medium text-muted-foreground mr-2">Mode:</span>
          <ModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Category Sidebar */}
        <aside className="w-56 shrink-0 border-r overflow-auto bg-muted/30">
          <CategorySidebar />
        </aside>

        {/* Token Display */}
        <main className="flex-1 overflow-auto">
          {selectedToken ? (
            <TokenDetail token={selectedToken} />
          ) : selectedCategory ? (
            <TokenContent />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const modes: { id: ViewMode; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'both', label: 'Both' },
  ];

  return (
    <div className="flex rounded-lg border bg-background p-0.5">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            mode === m.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function TokenContent() {
  const { selectedCategory } = useAppStore();

  // Determine if this category should show grid or table
  const isColorCategory = selectedCategory?.toLowerCase().includes('color') || 
    ['blue', 'gray', 'red', 'green', 'orange', 'white', 'black', 'mauve', 'slate', 'sage', 'olive', 'sand', 'tomato', 'ruby', 'plum', 'pink', 'purple', 'violet', 'indigo', 'cyan', 'teal', 'mint', 'lime', 'yellow', 'amber', 'brown', 'bronze', 'gold', 'sky', 'jade', 'grass', 'crimson', 'iris'].some(
      c => selectedCategory?.toLowerCase() === c
    );

  if (isColorCategory) {
    return <TokenGrid />;
  }

  return <TokenTable />;
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
      <Palette className="h-12 w-12 mb-4 opacity-20" />
      <p className="text-lg font-medium">Select a category</p>
      <p className="text-sm">Choose a category from the sidebar to view tokens</p>
    </div>
  );
}
