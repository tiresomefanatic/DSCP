import { create } from 'zustand';
import type { ResolvedToken, TokenBrand, TokenMode } from '@dscp/types';

export type ActiveTab = 'primitives' | 'tokens' | 'components';
export type ViewMode = 'light' | 'dark' | 'both';

// Editing session state
export interface EditingSession {
  isEditing: boolean;
  branchName: string | null;
  startedAt: Date | null;
  changesCount: number;
}

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

  // Editing session state
  editingSession: EditingSession;

  // Actions
  setBranch: (branch: string) => void;
  setBrand: (brand: TokenBrand) => void;
  setMode: (mode: TokenMode) => void;
  setSelectedToken: (token: ResolvedToken | null) => void;

  // UI actions
  setActiveTab: (tab: ActiveTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCategory: (category: string | null) => void;

  // Editing session actions
  startEditingSession: (branchName: string) => void;
  incrementChangesCount: () => void;
  endEditingSession: () => void;

  // Pending changes (deprecated - now using editing session)
  pendingChanges: Map<string, { mode?: TokenMode; value: string | number }>;
  addPendingChange: (
    path: string,
    change: { mode?: TokenMode; value: string | number }
  ) => void;
  clearPendingChanges: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedBranch: 'dev', // Default to dev branch now
  selectedBrand: 'acpd',
  selectedMode: 'light',
  selectedToken: null,
  activeTab: 'primitives',
  viewMode: 'light',
  selectedCategory: null,
  pendingChanges: new Map(),

  // Initial editing session state
  editingSession: {
    isEditing: false,
    branchName: null,
    startedAt: null,
    changesCount: 0,
  },

  // Actions
  setBranch: (branch) => set({ selectedBranch: branch }),
  setBrand: (brand) => set({ selectedBrand: brand }),
  setMode: (mode) => set({ selectedMode: mode }),
  setSelectedToken: (token) => set({ selectedToken: token }),
  setActiveTab: (tab) => set({ activeTab: tab, selectedCategory: null, selectedToken: null }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedCategory: (category) => set({ selectedCategory: category, selectedToken: null }),

  // Editing session actions
  startEditingSession: (branchName) =>
    set({
      editingSession: {
        isEditing: true,
        branchName,
        startedAt: new Date(),
        changesCount: 0,
      },
      selectedBranch: branchName,
    }),

  incrementChangesCount: () =>
    set((state) => ({
      editingSession: {
        ...state.editingSession,
        changesCount: state.editingSession.changesCount + 1,
      },
    })),

  endEditingSession: () =>
    set({
      editingSession: {
        isEditing: false,
        branchName: null,
        startedAt: null,
        changesCount: 0,
      },
      selectedBranch: 'dev',
    }),

  addPendingChange: (path, change) =>
    set((state) => {
      const newChanges = new Map(state.pendingChanges);
      newChanges.set(path, change);
      return { pendingChanges: newChanges };
    }),

  clearPendingChanges: () => set({ pendingChanges: new Map() }),
}));

