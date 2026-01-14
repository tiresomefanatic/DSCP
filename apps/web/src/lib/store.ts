import { create } from 'zustand';
import type { ResolvedToken, TokenBrand, TokenMode } from '@dscp/types';

export type ActiveTab = 'primitives' | 'tokens' | 'components';
export type ViewMode = 'light' | 'dark' | 'both';

interface AppState {
  // Selected state
  selectedBranch: string;
  selectedBrand: TokenBrand;
  selectedMode: TokenMode;
  selectedToken: ResolvedToken | null;

  // New Supernova-style UI state
  activeTab: ActiveTab;
  viewMode: ViewMode;
  selectedCategory: string | null;

  // Actions
  setBranch: (branch: string) => void;
  setBrand: (brand: TokenBrand) => void;
  setMode: (mode: TokenMode) => void;
  setSelectedToken: (token: ResolvedToken | null) => void;

  // New actions
  setActiveTab: (tab: ActiveTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCategory: (category: string | null) => void;

  // Pending changes
  pendingChanges: Map<string, { mode?: TokenMode; value: string | number }>;
  addPendingChange: (
    path: string,
    change: { mode?: TokenMode; value: string | number }
  ) => void;
  clearPendingChanges: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedBranch: 'main',
  selectedBrand: 'acpd',
  selectedMode: 'light',
  selectedToken: null,
  activeTab: 'primitives',
  viewMode: 'light',
  selectedCategory: null,
  pendingChanges: new Map(),

  // Actions
  setBranch: (branch) => set({ selectedBranch: branch }),
  setBrand: (brand) => set({ selectedBrand: brand }),
  setMode: (mode) => set({ selectedMode: mode }),
  setSelectedToken: (token) => set({ selectedToken: token }),
  setActiveTab: (tab) => set({ activeTab: tab, selectedCategory: null, selectedToken: null }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedCategory: (category) => set({ selectedCategory: category, selectedToken: null }),

  addPendingChange: (path, change) =>
    set((state) => {
      const newChanges = new Map(state.pendingChanges);
      newChanges.set(path, change);
      return { pendingChanges: newChanges };
    }),

  clearPendingChanges: () => set({ pendingChanges: new Map() }),
}));
