import { Link2, Copy, Check, ArrowLeft, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTokens, useUpdateToken } from '@/hooks/useTokens';
import { useAppStore } from '@/lib/store';
import type { ResolvedToken } from '@dscp/types';

interface TokenDetailProps {
  token: ResolvedToken;
}

export function TokenDetail({ token }: TokenDetailProps) {
  const { data: tokensData } = useTokens();
  const { setSelectedToken, viewMode, editingSession } = useAppStore();
  const isEditing = editingSession.isEditing;

  const resolvedLight = tokensData?.resolvedLight || {};
  const resolvedDark = tokensData?.resolvedDark || {};

  return (
    <div className="p-6 max-w-3xl">
      {/* Back Button */}
      <button
        onClick={() => setSelectedToken(null)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to grid
      </button>

      {/* Header */}
      <Header token={token} />

      {/* Non-editing mode hint */}
      {!isEditing && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-sm text-gray-600">
          <Pencil className="h-4 w-4" />
          <span>Click "Edit Tokens" in the header to make changes</span>
        </div>
      )}

      {/* Value Display */}
      <div className="mt-6 space-y-6">
        {token.tier === 'global' ? (
          <GlobalTokenDisplay
            token={token}
            resolvedValue={resolvedLight[token.path]}
            isEditing={isEditing}
          />
        ) : (
          <SemanticTokenDisplay
            token={token}
            viewMode={viewMode}
            resolvedLight={resolvedLight}
            resolvedDark={resolvedDark}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  );
}

function Header({ token }: { token: ResolvedToken }) {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(token.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-b pb-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {token.collection}
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 uppercase">
          {token.tier}
        </span>
        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
          {token.type}
        </span>
      </div>
      <h2 className="text-2xl font-bold">{token.name}</h2>
      <div className="flex items-center gap-2 mt-1">
        <p className="font-mono text-sm text-muted-foreground">{token.path}</p>
        <button
          onClick={handleCopyPath}
          className="p-1 hover:bg-accent rounded transition-colors"
          title="Copy path"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

function GlobalTokenDisplay({
  token,
  resolvedValue,
  isEditing,
}: {
  token: ResolvedToken;
  resolvedValue: string | number | null | undefined;
  isEditing: boolean;
}) {
  const updateToken = useUpdateToken();
  const displayValue = resolvedValue || token.value;
  
  // Local state for editing
  const [localValue, setLocalValue] = useState(String(displayValue));
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Reset local value when resolved value changes
  useEffect(() => {
    console.log('Display value changed:', displayValue);
    setLocalValue(String(displayValue));
  }, [displayValue]);

  const hasChanges = localValue !== String(displayValue);

  const handleSave = () => {
    updateToken.mutate({ tokenPath: token.path, value: localValue });
  };

  const handleReset = () => {
    setLocalValue(String(displayValue));
    setShowColorPicker(false);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      {/* Large Preview */}
      <div className="mb-6 flex justify-center">
        {token.type === 'COLOR' ? (
          <button
            onClick={() => isEditing && setShowColorPicker(!showColorPicker)}
            disabled={!isEditing}
            className={`h-32 w-32 rounded-xl border-4 shadow-lg transition-all ${
              isEditing ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'cursor-default'
            } ${showColorPicker ? 'ring-4 ring-blue-500 ring-offset-2' : ''}`}
            style={{ backgroundColor: localValue }}
            title={isEditing ? 'Click to edit color' : undefined}
          />
        ) : token.type === 'FLOAT' ? (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-muted">
            <span className="text-4xl font-mono font-bold">{String(displayValue)}</span>
          </div>
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-muted text-3xl font-mono">
            Aa
          </div>
        )}
      </div>

      {/* Color Picker (when editing) */}
      {isEditing && token.type === 'COLOR' && showColorPicker && (
        <div className="mb-6 flex justify-center">
          <div className="rounded-lg border bg-white p-4 shadow-lg">
            <HexColorPicker
              color={localValue}
              onChange={setLocalValue}
              style={{ width: 280 }}
            />
          </div>
        </div>
      )}

      {/* Value Input/Display */}
      {isEditing && token.type === 'COLOR' ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">HEX Value</label>
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#000000"
            />
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={updateToken.isPending}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updateToken.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleReset}
                className="rounded border px-4 py-2 text-sm hover:bg-accent"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      ) : isEditing && token.type === 'FLOAT' ? (
        <EditableNumberInput
          value={Number(displayValue) || 0}
          tokenPath={token.path}
        />
      ) : isEditing && token.type === 'STRING' ? (
        <EditableTextInput
          value={String(displayValue)}
          tokenPath={token.path}
        />
      ) : (
        <>
          {/* Read-only Value Display */}
          <ValueDisplay label="Value" value={String(displayValue)} />

          {token.type === 'COLOR' && typeof displayValue === 'string' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">HEX</label>
                <div className="mt-1 font-mono text-sm">{displayValue.toUpperCase()}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">RGB</label>
                <div className="mt-1 font-mono text-sm">{hexToRgb(displayValue)}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EditableNumberInput({ value, tokenPath }: { value: number; tokenPath: string }) {
  const updateToken = useUpdateToken();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const hasChanges = localValue !== value;

  const handleSave = () => {
    updateToken.mutate({ tokenPath, value: localValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Number Value</label>
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(parseFloat(e.target.value) || 0)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {hasChanges && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={updateToken.isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateToken.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setLocalValue(value)}
            className="rounded border px-4 py-2 text-sm hover:bg-accent"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

function EditableTextInput({ value, tokenPath }: { value: string; tokenPath: string }) {
  const updateToken = useUpdateToken();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const hasChanges = localValue !== value;

  const handleSave = () => {
    updateToken.mutate({ tokenPath, value: localValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Text Value</label>
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {hasChanges && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={updateToken.isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateToken.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setLocalValue(value)}
            className="rounded border px-4 py-2 text-sm hover:bg-accent"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

function SemanticTokenDisplay({
  token,
  viewMode,
  resolvedLight,
  resolvedDark,
  isEditing,
}: {
  token: ResolvedToken;
  viewMode: 'light' | 'dark' | 'both';
  resolvedLight: Record<string, string | number | null>;
  resolvedDark: Record<string, string | number | null>;
  isEditing: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Mode Cards */}
      <div className={`grid gap-4 ${viewMode === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {(viewMode === 'light' || viewMode === 'both') && (
          <ModeCard
            mode="light"
            token={token}
            rawValue={token.values?.light}
            resolvedValue={resolvedLight[token.path]}
          />
        )}
        {(viewMode === 'dark' || viewMode === 'both') && (
          <ModeCard
            mode="dark"
            token={token}
            rawValue={token.values?.dark}
            resolvedValue={resolvedDark[token.path]}
          />
        )}
      </div>

      {/* Reference Info */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-3 text-sm font-semibold">Alias References</h4>
        <div className={`grid gap-4 ${viewMode === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {(viewMode === 'light' || viewMode === 'both') && (
            <ReferenceDisplay mode="Light" reference={token.values?.light} />
          )}
          {(viewMode === 'dark' || viewMode === 'both') && (
            <ReferenceDisplay mode="Dark" reference={token.values?.dark} />
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  mode,
  token,
  rawValue,
  resolvedValue,
}: {
  mode: 'light' | 'dark';
  token: ResolvedToken;
  rawValue: string | number | undefined;
  resolvedValue: string | number | null | undefined;
}) {
  const isDark = mode === 'dark';

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <div
        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}
      >
        {mode}
      </div>
      <div className="p-4">
        {token.type === 'COLOR' ? (
          <div className="flex items-center gap-4">
            <div
              className={`h-16 w-16 rounded-lg border-2 shadow-inner ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              style={{
                backgroundColor: typeof resolvedValue === 'string' ? resolvedValue : '#ccc',
              }}
            />
            <div className="flex-1 min-w-0">
              <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Resolved
              </div>
              <div className="font-mono text-sm truncate">
                {typeof resolvedValue === 'string' ? resolvedValue.toUpperCase() : 'Unable to resolve'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-3xl font-mono font-bold">
              {resolvedValue ?? rawValue ?? '—'}
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {token.type === 'FLOAT' ? 'px' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReferenceDisplay({
  mode,
  reference,
}: {
  mode: string;
  reference: string | number | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const refString = String(reference);
  const isAlias = typeof reference === 'string' && reference.includes(':');

  const handleCopy = () => {
    navigator.clipboard.writeText(refString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{mode}</div>
      <div className="flex items-center gap-2">
        {isAlias && <Link2 className="h-3 w-3 text-blue-500 shrink-0" />}
        <code className="bg-background px-2 py-1 rounded border text-xs font-mono flex-1 truncate">
          {refString}
        </code>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-accent rounded transition-colors"
          title="Copy reference"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

function ValueDisplay({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
        <span className="font-mono text-sm flex-1">{value}</span>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-accent rounded transition-colors"
          title="Copy value"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
}
