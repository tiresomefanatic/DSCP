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
  const { selectedBranch, selectedMode } = useAppStore();

  return useMutation({
    mutationFn: (params: {
      tokenPath: string;
      value: string | number;
      isAlias?: boolean;
    }) =>
      updateToken({
        branch: selectedBranch,
        mode: selectedMode,
        ...params,
      }),
    onSuccess: () => {
      // Invalidate token queries to refetch
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['tokenTree'] });
    },
  });
}
