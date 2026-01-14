import { useState } from 'react';
import { TokenLayout } from './features/token-viewer/TokenLayout';
import { BranchSelector } from './features/git-ui/BranchSelector';
import { PreviewPanel } from './features/preview/PreviewPanel';

function App() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            DSCP
          </h1>
          <BranchSelector />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Token Layout (includes tabs + sidebar + content) */}
        <div className="flex-1 overflow-hidden">
          <TokenLayout />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <aside className="w-80 shrink-0 border-l overflow-auto">
            <PreviewPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
