import { useState } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { useBranches, useCreateBranch } from '@/hooks/useBranches';
import { useAppStore } from '@/lib/store';

export function BranchSelector() {
  const { selectedBranch, setBranch } = useAppStore();
  const { data, isLoading } = useBranches();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
            <GitBranch className="h-4 w-4" />
            <span>{selectedBranch}</span>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[180px] rounded-md border bg-background p-1 shadow-md"
            sideOffset={5}
          >
            {isLoading ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <>
                {data?.branches.map((branch) => (
                  <DropdownMenu.Item
                    key={branch.name}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    onSelect={() => setBranch(branch.name)}
                  >
                    <GitBranch className="h-4 w-4" />
                    <span className="flex-1">{branch.name}</span>
                    {branch.isDefault && (
                      <span className="text-xs text-muted-foreground">
                        default
                      </span>
                    )}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none hover:bg-accent"
                  onSelect={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>New branch</span>
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <CreateBranchDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateBranchDialog({ open, onOpenChange }: CreateBranchDialogProps) {
  const [branchName, setBranchName] = useState('');
  const { selectedBranch, setBranch } = useAppStore();
  const createBranch = useCreateBranch();

  const handleCreate = async () => {
    if (!branchName.trim()) return;

    await createBranch.mutateAsync({
      baseBranch: selectedBranch,
      newBranch: branchName,
    });

    setBranch(branchName);
    setBranchName('');
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">
            Create New Branch
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Create a new branch from {selectedBranch}
          </Dialog.Description>

          <div className="mt-4">
            <input
              type="text"
              placeholder="feature/my-changes"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded px-4 py-2 text-sm hover:bg-accent">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleCreate}
              disabled={!branchName.trim() || createBranch.isPending}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createBranch.isPending ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
