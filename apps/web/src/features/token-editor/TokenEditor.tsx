import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Link2, Pencil } from 'lucide-react';
import { useTokens, useUpdateToken } from '@/hooks/useTokens';
import { useAppStore } from '@/lib/store';
import { isEditingDisabledBranch } from '@/lib/branch-utils';
import type { ResolvedToken, TokenMode } from '@dscp/types';

interface TokenEditorProps {
  token: ResolvedToken;
  mode: TokenMode;
}

export function TokenEditor({ token, mode }: TokenEditorProps) {
  const { data: tokensData } = useTokens();
  const updateToken = useUpdateToken();
  const { editingSession, selectedBranch } = useAppStore();
  const isEditing = editingSession.isEditing;
  const isEditingDisabled = isEditingDisabledBranch(selectedBranch);

  // Get the raw value (may be an alias like "Global:color/blue/500")
  const rawValue = token.tier === 'global' ? token.value : token.values?.[mode];

  // Get the resolved value (actual color hex)
  const resolvedValue = tokensData?.resolved[token.path];

  // Check if it's an alias
  const isAlias = typeof rawValue === 'string' && rawValue.includes(':');

  return (
    <div className="space-y-6">
      {/* Non-editing mode banner */}
      {!isEditing && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-sm text-gray-600">
          <Pencil className="h-4 w-4" />
          <span>
            {isEditingDisabled
              ? 'Main, Stage, and Dev are read-only. Click "Edit Tokens" to create a feature branch from dev.'
              : 'Click "Edit Tokens" in the header to make changes'}
          </span>
        </div>
      )}
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{token.name}</h2>
            <p className="font-mono text-sm text-muted-foreground">{token.path}</p>
          </div>
          {token.type === 'COLOR' && resolvedValue && (
            <div
              className="h-12 w-12 rounded-lg border-2 shadow-md"
              style={{ backgroundColor: String(resolvedValue) }}
              title={String(resolvedValue)}
            />
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-4 gap-4">
        <MetadataItem label="Type" value={token.type} />
        <MetadataItem label="Tier" value={token.tier} />
        <MetadataItem label="Category" value={token.category} />
        <MetadataItem label="Collection" value={token.collection} />
      </div>

      {/* Current Value */}
      <div className="rounded-lg border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">
            Value {token.tier !== 'global' && <span className="text-muted-foreground">({mode} mode)</span>}
          </h3>
          {isAlias && (
            <span className="flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              <Link2 className="h-3 w-3" />
              Alias
            </span>
          )}
        </div>

        {/* Show raw value */}
        <div className="mb-4 rounded bg-muted p-3">
          <p className="text-xs text-muted-foreground">Raw value:</p>
          <p className="font-mono text-sm">{String(rawValue)}</p>
        </div>

        {/* Show resolved value if different */}
        {isAlias && (
          <div className="mb-4 rounded bg-green-50 p-3">
            <p className="text-xs text-green-600">Resolved value:</p>
            <p className="font-mono text-sm text-green-700">{String(resolvedValue)}</p>
          </div>
        )}

        {/* Editor based on type */}
        {token.type === 'COLOR' && (
          <ColorEditor
            rawValue={String(rawValue)}
            resolvedValue={String(resolvedValue || rawValue)}
            isAlias={isAlias}
            onSave={(value) => {
              updateToken.mutate({ tokenPath: token.path, value });
            }}
            isLoading={updateToken.isPending}
          />
        )}

        {token.type === 'FLOAT' && (
          <NumberEditor
            value={Number(rawValue) || 0}
            onSave={(value) => {
              updateToken.mutate({ tokenPath: token.path, value });
            }}
            isLoading={updateToken.isPending}
          />
        )}

        {token.type === 'STRING' && (
          <StringEditor
            value={String(rawValue)}
            onSave={(value) => {
              updateToken.mutate({ tokenPath: token.path, value });
            }}
            isLoading={updateToken.isPending}
          />
        )}
      </div>

      {/* Both modes comparison for brand/component tokens */}
      {token.tier !== 'global' && token.values && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-medium">Mode Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <ModePreview
              label="Light"
              value={token.values.light}
              resolvedValue={tokensData?.resolved[token.path]}
              isActive={mode === 'light'}
              type={token.type}
            />
            <ModePreview
              label="Dark"
              value={token.values.dark}
              resolvedValue={tokensData?.resolved[token.path]}
              isActive={mode === 'dark'}
              type={token.type}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}

function ModePreview({
  label,
  value,
  resolvedValue,
  isActive,
  type,
}: {
  label: string;
  value?: string | number;
  resolvedValue?: string | number | null;
  isActive: boolean;
  type: string;
}) {
  const isAlias = typeof value === 'string' && value.includes(':');

  return (
    <div className={`rounded-lg border p-3 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {isActive && (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">Active</span>
        )}
      </div>
      {type === 'COLOR' && (
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded border"
            style={{ backgroundColor: String(isActive ? resolvedValue : value) }}
          />
          <div className="text-xs">
            <p className="font-mono">{String(value)}</p>
            {isAlias && (
              <p className="text-muted-foreground">→ {String(resolvedValue)}</p>
            )}
          </div>
        </div>
      )}
      {type !== 'COLOR' && (
        <p className="font-mono text-sm">{String(value)}</p>
      )}
    </div>
  );
}

interface EditorProps<T> {
  value?: T;
  rawValue?: string;
  resolvedValue?: string;
  isAlias?: boolean;
  onSave: (value: T) => void;
  isLoading?: boolean;
}

function ColorEditor({
  rawValue: _rawValue,
  resolvedValue,
  isAlias: _isAlias,
  onSave,
  isLoading,
}: EditorProps<string> & { rawValue: string; resolvedValue: string; isAlias: boolean }) {
  const [localValue, setLocalValue] = useState(resolvedValue);
  const [showPicker, setShowPicker] = useState(false);

  // Reset local value when resolved value changes
  useEffect(() => {
    setLocalValue(resolvedValue);
  }, [resolvedValue]);

  const hasChanges = localValue !== resolvedValue;

  return (
    <div className="space-y-4">
      {/* Color Preview & Input */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="relative h-16 w-16 rounded-lg border-2 shadow-sm transition-shadow hover:shadow-md"
          style={{ backgroundColor: localValue }}
        >
          {showPicker && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500" />
          )}
        </button>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Hex color</label>
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-full rounded border bg-background px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Color Picker */}
      {showPicker && (
        <div className="rounded-lg border p-4">
          <HexColorPicker
            color={localValue}
            onChange={setLocalValue}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(localValue)}
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setLocalValue(resolvedValue)}
            className="rounded border px-4 py-2 text-sm hover:bg-accent"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

function NumberEditor({ value, onSave, isLoading }: EditorProps<number>) {
  const [localValue, setLocalValue] = useState(value || 0);

  useEffect(() => {
    setLocalValue(value || 0);
  }, [value]);

  const hasChanges = localValue !== value;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Number value</label>
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(parseFloat(e.target.value) || 0)}
          className="w-full rounded border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(localValue)}
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setLocalValue(value || 0)}
            className="rounded border px-4 py-2 text-sm hover:bg-accent"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

function StringEditor({ value, onSave, isLoading }: EditorProps<string>) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const hasChanges = localValue !== value;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">String value</label>
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="w-full rounded border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(localValue)}
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => setLocalValue(value || '')}
            className="rounded border px-4 py-2 text-sm hover:bg-accent"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
