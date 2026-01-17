import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTokens, fetchTokenTree, updateToken } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export function useTokens() {
  const { selectedBranch, selectedBrand, selectedMode } = useAppStore();

  return useQuery({
    queryKey: ['tokens', selectedBranch, selectedBrand, selectedMode],
    queryFn: () =>
      fetchTokens({
        branch: selectedBranch,
        brand: selectedBrand,
        mode: selectedMode,
      }),
  });
}

export function useTokenTree() {
  const { selectedBranch, selectedBrand } = useAppStore();

  return useQuery({
    queryKey: ['tokenTree', selectedBranch, selectedBrand],
    queryFn: () =>
      fetchTokenTree({
        branch: selectedBranch,
        brand: selectedBrand,
      }),
  });
}

export function useUpdateToken() {
  const queryClient = useQueryClient();
  const { selectedBranch, selectedBrand, selectedMode, incrementChangesCount, editingSession } = useAppStore();

  return useMutation({
    mutationFn: (params: {
      tokenPath: string;
      value: string | number;
      isAlias?: boolean;
    }) => {
      // Only allow updates when in editing mode
      if (!editingSession.isEditing) {
        throw new Error('Cannot update tokens outside of editing mode');
      }

      return updateToken({
        branch: selectedBranch,
        mode: selectedMode,
        ...params,
      });
    },
    onSuccess: (data) => {
      // Increment the changes count
      incrementChangesCount();

      // Manually update the cache since GitHub API has a ~5min latency
      // and immediate refetch would return stale data
      queryClient.setQueryData(
        ['tokens', selectedBranch, selectedBrand, selectedMode],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          const newTokens = oldData.tokens.map((t: any) => 
            t.path === data.token.path ? data.token : t
          );
          
          const newResolved = { ...oldData.resolved, [data.token.path]: data.token.value };
          const newResolvedLight = { ...oldData.resolvedLight };
          const newResolvedDark = { ...oldData.resolvedDark };
          
          // Update specific mode maps
          // We use selectedMode from the store since it controls the validation/save mode
          if (selectedMode === 'light') {
             newResolvedLight[data.token.path] = data.token.value;
          } else if (selectedMode === 'dark') {
             newResolvedDark[data.token.path] = data.token.value;
          } else {
             newResolvedLight[data.token.path] = data.token.value;
             newResolvedDark[data.token.path] = data.token.value;
          }

          return {
            ...oldData,
            tokens: newTokens,
            resolved: newResolved,
            resolvedLight: newResolvedLight,
            resolvedDark: newResolvedDark,
          };
        }
      );
    },
  });
}

