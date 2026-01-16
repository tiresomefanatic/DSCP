import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { createBranch, deleteBranch, compareBranch, createPullRequest } from '@/lib/api';

/**
 * Hook to manage the editing session lifecycle
 * - Start editing: creates a feature branch from dev
 * - Publish: creates a PR from feature branch to dev
 * - Discard: deletes the feature branch if no changes, or with confirmation
 */
export function useEditingSession() {
  const queryClient = useQueryClient();
  const {
    editingSession,
    startEditingSession,
    endEditingSession,
    incrementChangesCount,
  } = useAppStore();

  // Start a new editing session
  const startEditing = useMutation({
    mutationFn: async () => {
      // Generate a unique branch name
      const timestamp = Date.now();
      const branchName = `feature/edit-${timestamp}`;

      // Create the feature branch from dev
      await createBranch({
        baseBranch: 'dev',
        newBranch: branchName,
      });

      return branchName;
    },
    onSuccess: (branchName) => {
      startEditingSession(branchName);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['tokenTree'] });
    },
  });

  // Check if the current session has changes
  const checkHasChanges = useMutation({
    mutationFn: async () => {
      if (!editingSession.branchName) {
        return { hasChanges: false, ahead: 0, behind: 0 };
      }

      const result = await compareBranch({
        branchName: editingSession.branchName,
        baseBranch: 'dev',
      });

      return result;
    },
  });

  // Discard the editing session (delete branch if no changes or with confirmation)
  const discardEditing = useMutation({
    mutationFn: async (force: boolean = false) => {
      if (!editingSession.branchName) {
        return;
      }

      // Check if there are changes
      if (!force) {
        const comparison = await compareBranch({
          branchName: editingSession.branchName,
          baseBranch: 'dev',
        });

        if (comparison.hasChanges) {
          throw new Error('CHANGES_EXIST');
        }
      }

      // Delete the branch
      await deleteBranch(editingSession.branchName);
    },
    onSuccess: () => {
      endEditingSession();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['tokenTree'] });
    },
  });

  // Publish changes (create a PR to dev)
  const publishChanges = useMutation({
    mutationFn: async (params: { title: string; description?: string }) => {
      if (!editingSession.branchName) {
        throw new Error('No active editing session');
      }

      const result = await createPullRequest({
        sourceBranch: editingSession.branchName,
        targetBranch: 'dev',
        title: params.title,
        description: params.description,
      });

      return result;
    },
    onSuccess: () => {
      endEditingSession();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['tokenTree'] });
    },
  });

  return {
    editingSession,
    startEditing,
    discardEditing,
    publishChanges,
    checkHasChanges,
    incrementChangesCount,
    isEditing: editingSession.isEditing,
  };
}
