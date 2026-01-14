import { useTokens } from '@/hooks/useTokens';
import { useAppStore } from '@/lib/store';

/**
 * PreviewPanel displays token values with live preview
 */
export function PreviewPanel() {
  const { selectedMode, selectedBrand } = useAppStore();
  const { data, isLoading } = useTokens();

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading preview...</div>;
  }

  if (!data) {
    return <div className="p-4 text-muted-foreground">No data</div>;
  }

  // Get color tokens for the selected brand
  const colorTokens = data.tokens.filter(
    (t) => t.type === 'COLOR' && (t.brand === selectedBrand || t.tier === 'global')
  );

  // Group by category
  const brandColors = colorTokens.filter((t) => t.brand === selectedBrand);
  const globalColors = colorTokens.filter((t) => t.tier === 'global');

  // Get some key semantic colors for the preview
  const getResolvedColor = (path: string): string => {
    const resolved = data.resolved[path];
    return typeof resolved === 'string' ? resolved : '#cccccc';
  };

  // Find semantic colors from the brand tokens
  const findColor = (keyword: string): string => {
    const token = brandColors.find((t) => t.path.toLowerCase().includes(keyword));
    if (token) {
      return getResolvedColor(token.path);
    }
    return '#cccccc';
  };

  const primaryColor = findColor('content/primary');
  const secondaryColor = findColor('content/secondary');
  const accentColor = findColor('content/accent');
  const dangerColor = findColor('content/danger');
  const successColor = findColor('content/success');
  const warningColor = findColor('content/warning');
  const bgPrimary = findColor('background/primary');
  const bgSecondary = findColor('background/secondary');
  const borderColor = findColor('border/primary');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-3">
        <h3 className="font-semibold">Preview</h3>
        <p className="text-xs text-muted-foreground">
          {selectedBrand.toUpperCase()} · {selectedMode}
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-4">
        {/* Semantic Colors */}
        <PreviewSection title="Semantic Colors">
          <div className="grid grid-cols-3 gap-3">
            <ColorSwatch label="Primary" color={primaryColor} />
            <ColorSwatch label="Secondary" color={secondaryColor} />
            <ColorSwatch label="Accent" color={accentColor} />
            <ColorSwatch label="Success" color={successColor} />
            <ColorSwatch label="Warning" color={warningColor} />
            <ColorSwatch label="Danger" color={dangerColor} />
          </div>
        </PreviewSection>

        {/* Background Colors */}
        <PreviewSection title="Backgrounds">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: bgPrimary, borderColor }}
            >
              <span style={{ color: primaryColor }} className="text-sm font-medium">
                Primary BG
              </span>
            </div>
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: bgSecondary, borderColor }}
            >
              <span style={{ color: secondaryColor }} className="text-sm font-medium">
                Secondary BG
              </span>
            </div>
          </div>
        </PreviewSection>

        {/* Typography Preview */}
        <PreviewSection title="Typography">
          <div className="space-y-2 rounded-lg border p-4" style={{ borderColor }}>
            <h1 style={{ color: primaryColor }} className="text-xl font-bold">
              Heading Text
            </h1>
            <p style={{ color: secondaryColor }} className="text-sm">
              Body text with secondary color styling. This shows how text would appear in your design system.
            </p>
            <a href="#" style={{ color: accentColor }} className="text-sm underline">
              Link text with accent color
            </a>
          </div>
        </PreviewSection>

        {/* Button Preview */}
        <PreviewSection title="Buttons">
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              Primary
            </button>
            <button
              className="rounded-md border px-4 py-2 text-sm font-medium"
              style={{ borderColor, color: primaryColor }}
            >
              Secondary
            </button>
            <button
              className="rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: dangerColor }}
            >
              Danger
            </button>
            <button
              className="rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: successColor }}
            >
              Success
            </button>
          </div>
        </PreviewSection>

        {/* Color Palette Grid */}
        <PreviewSection title={`Brand Colors (${brandColors.length})`}>
          <div className="grid grid-cols-4 gap-2">
            {brandColors.slice(0, 20).map((token) => {
              const resolved = getResolvedColor(token.path);
              return (
                <div key={token.path} className="text-center">
                  <div
                    className="mx-auto h-10 w-10 rounded-md border shadow-sm"
                    style={{ backgroundColor: resolved }}
                    title={`${token.path}\n${resolved}`}
                  />
                  <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                    {token.name}
                  </span>
                </div>
              );
            })}
          </div>
          {brandColors.length > 20 && (
            <p className="mt-2 text-xs text-muted-foreground">
              +{brandColors.length - 20} more colors
            </p>
          )}
        </PreviewSection>

        {/* Global Primitives */}
        <PreviewSection title={`Global Primitives (${globalColors.length})`}>
          <div className="grid grid-cols-5 gap-1">
            {globalColors.slice(0, 50).map((token) => {
              const resolved = getResolvedColor(token.path);
              return (
                <div
                  key={token.path}
                  className="h-6 w-full rounded border"
                  style={{ backgroundColor: resolved }}
                  title={`${token.path}\n${resolved}`}
                />
              );
            })}
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto h-12 w-12 rounded-lg border shadow-sm"
        style={{ backgroundColor: color }}
        title={color}
      />
      <span className="mt-1 block text-xs font-medium">{label}</span>
      <span className="block text-[10px] font-mono text-muted-foreground">{color}</span>
    </div>
  );
}
