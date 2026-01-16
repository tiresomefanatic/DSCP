import { useState } from 'react';
import { GitBranch, Send, Trash2, X, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useEditingSession } from '@/hooks/useEditingSession';

/**
 * EditModeBar - Shows editing session status and actions
 * Displayed at the top of the page when in editing mode
 */
export function EditModeBar() {
  const {
    editingSession,
    discardEditing,
    publishChanges,
    isEditing,
  } = useEditingSession();

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  if (!isEditing) return null;

  const handleDiscard = async () => {
    try {
      await discardEditing.mutateAsync(false);
    } catch (error) {
      if ((error as Error).message === 'CHANGES_EXIST') {
        setShowDiscardConfirm(true);
      }
    }
  };

  const handleForceDiscard = async () => {
    await discardEditing.mutateAsync(true);
    setShowDiscardConfirm(false);
  };

  return (
    <>
      <div className="flex items-center gap-4 bg-amber-50 border-b border-amber-200 px-4 py-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-medium text-amber-800">Editing Mode</span>
        </div>

        {/* Branch name */}
        <div className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1">
          <GitBranch className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-mono text-amber-700">
            {editingSession.branchName}
          </span>
        </div>

        {/* Changes count */}
        {editingSession.changesCount > 0 && (
          <span className="text-xs text-amber-600">
            {editingSession.changesCount} change{editingSession.changesCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Discard button */}
        <button
          onClick={handleDiscard}
          disabled={discardEditing.isPending}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          {discardEditing.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Discard
        </button>

        {/* Publish button */}
        <button
          onClick={() => setShowPublishDialog(true)}
          disabled={editingSession.changesCount === 0}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Publish Changes
        </button>
      </div>

      {/* Publish Dialog */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        onPublish={publishChanges}
        changesCount={editingSession.changesCount}
      />

      {/* Discard Confirmation Dialog */}
      <DiscardConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        onConfirm={handleForceDiscard}
        isPending={discardEditing.isPending}
      />
    </>
  );
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: ReturnType<typeof useEditingSession>['publishChanges'];
  changesCount: number;
}

function PublishDialog({ open, onOpenChange, onPublish, changesCount }: PublishDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handlePublish = async () => {
    await onPublish.mutateAsync({
      title: title || `Update design tokens (${changesCount} changes)`,
      description,
    });
    onOpenChange(false);
    setTitle('');
    setDescription('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">
            Publish Changes
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Create a pull request to merge your changes into the dev branch.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder={`Update design tokens (${changesCount} changes)`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                placeholder="Describe your changes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded border bg-background px-3 py-2 resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded px-4 py-2 text-sm hover:bg-accent">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handlePublish}
              disabled={onPublish.isPending}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {onPublish.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Create Pull Request
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface DiscardConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DiscardConfirmDialog({ open, onOpenChange, onConfirm, isPending }: DiscardConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-red-600">
            Discard Changes?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            You have unpublished changes. Are you sure you want to discard them? This action cannot be undone.
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded px-4 py-2 text-sm hover:bg-accent">
                Keep Editing
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Discard Changes
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
