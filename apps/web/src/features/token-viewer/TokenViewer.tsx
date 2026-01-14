import { Link2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useTokens } from '@/hooks/useTokens';
import type { ResolvedToken } from '@dscp/types';

interface TokenViewerProps {
  token: ResolvedToken;
}

export function TokenViewer({ token }: TokenViewerProps) {
  const { data: tokensData } = useTokens();

  // Determine view type based on tier
  if (token.tier === 'global') {
    return (
      <GlobalTokenView
        token={token}
        resolvedLight={tokensData?.resolvedLight || {}}
        resolvedDark={tokensData?.resolvedDark || {}}
      />
    );
  }

  return (
    <SemanticTokenView
      token={token}
      resolvedLight={tokensData?.resolvedLight || {}}
      resolvedDark={tokensData?.resolvedDark || {}}
    />
  );
}

interface ResolvedMaps {
  resolvedLight: Record<string, string | number | null>;
  resolvedDark: Record<string, string | number | null>;
}

function GlobalTokenView({
  token,
  resolvedLight,
  resolvedDark: _resolvedDark,
}: {
  token: ResolvedToken;
} & ResolvedMaps) {
  // For global tokens, we use the same value for both modes
  void _resolvedDark; // Mark as intentionally unused for global tokens
  const value = token.value;
  const displayValue = resolvedLight[token.path] || value;

  return (
    <div className="space-y-6 max-w-2xl">
      <Header token={token} />

      <div className="rounded-lg border bg-card p-6">
        {/* Preview */}
        <div className="mb-6 flex justify-center">
          {token.type === 'COLOR' ? (
            <div
              className="h-32 w-32 rounded-xl border-4 shadow-lg"
              style={{ backgroundColor: String(displayValue) }}
            />
          ) : token.type === 'FLOAT' ? (
            <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-muted">
              <span className="text-4xl font-mono font-bold text-foreground">
                {String(displayValue)}
              </span>
            </div>
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-muted text-3xl font-mono text-muted-foreground">
              Aa
            </div>
          )}
        </div>

        {/* Value Display */}
        <div className="space-y-4">
          <ValueDisplay label="Value" value={String(value)} />

          {token.type === 'COLOR' && typeof displayValue === 'string' && (
            <div className="grid grid-cols-2 gap-4">
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

          {token.type === 'FLOAT' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Size Preview</label>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="h-4 bg-blue-500 rounded"
                  style={{ width: `${Math.min(Number(displayValue), 200)}px` }}
                />
                <span className="text-xs text-muted-foreground">{String(displayValue)}px</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SemanticTokenView({
  token,
  resolvedLight,
  resolvedDark,
}: {
  token: ResolvedToken;
} & ResolvedMaps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <Header token={token} />

      {/* Mode Comparison */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Mode Values
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ModeCard
            mode="light"
            token={token}
            rawValue={token.values?.light}
            resolvedValue={resolvedLight[token.path]}
          />
          <ModeCard
            mode="dark"
            token={token}
            rawValue={token.values?.dark}
            resolvedValue={resolvedDark[token.path]}
          />
        </div>
      </div>

      {/* Reference Chain */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-3 text-sm font-semibold">Alias References</h4>
        <div className="grid grid-cols-2 gap-4">
          <ReferenceDisplay
            mode="Light"
            reference={token.values?.light}
          />
          <ReferenceDisplay
            mode="Dark"
            reference={token.values?.dark}
          />
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
                backgroundColor:
                  typeof resolvedValue === 'string' ? resolvedValue : '#ccc',
              }}
            />
            <div className="flex-1 min-w-0">
              <div
                className={`text-xs mb-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Resolved
              </div>
              <div className="font-mono text-sm truncate">
                {typeof resolvedValue === 'string'
                  ? resolvedValue.toUpperCase()
                  : 'Unable to resolve'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-3xl font-mono font-bold">
              {resolvedValue ?? rawValue ?? '—'}
            </div>
            <div
              className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
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
          className="p-1 hover:bg-accent rounded"
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
        {token.brand && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            {token.brand}
          </span>
        )}
      </div>
      <h2 className="text-2xl font-bold">{token.name}</h2>
      <div className="flex items-center gap-2 mt-1">
        <p className="font-mono text-sm text-muted-foreground">{token.path}</p>
        <button
          onClick={handleCopyPath}
          className="p-1 hover:bg-accent rounded"
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
          className="p-1 hover:bg-accent rounded"
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
