import { Pencil, Loader2 } from 'lucide-react';
import { useEditingSession } from '@/hooks/useEditingSession';

/**
 * EditModeToggle - Button to enter editing mode
 * Shown in the header when not currently editing
 */
export function EditModeToggle() {
  const { startEditing, isEditing } = useEditingSession();

  if (isEditing) return null;

  return (
    <button
      onClick={() => startEditing.mutate()}
      disabled={startEditing.isPending}
      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {startEditing.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Creating branch...</span>
        </>
      ) : (
        <>
          <Pencil className="h-4 w-4" />
          <span>Edit Tokens</span>
        </>
      )}
    </button>
  );
}
