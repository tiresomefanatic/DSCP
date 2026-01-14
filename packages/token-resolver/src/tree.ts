import type { ResolvedToken, TokenTreeNode } from '@dscp/types';

/**
 * Build a tree structure from flat tokens for UI navigation
 */
export function buildTokenTree(tokens: ResolvedToken[]): TokenTreeNode {
  const root: TokenTreeNode = {
    name: 'root',
    path: '',
    children: [],
    isLeaf: false,
  };

  for (const token of tokens) {
    const parts = token.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join('/');
      const isLast = i === parts.length - 1;

      let child = current.children.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          path: currentPath,
          children: [],
          isLeaf: isLast,
          token: isLast ? token : undefined,
        };
        current.children.push(child);
      } else if (isLast) {
        child.isLeaf = true;
        child.token = token;
      }

      current = child;
    }
  }

  // Sort children alphabetically at each level
  sortTreeRecursive(root);

  return root;
}

/**
 * Recursively sort tree children
 */
function sortTreeRecursive(node: TokenTreeNode): void {
  node.children.sort((a, b) => {
    // Folders before leaves
    if (a.isLeaf !== b.isLeaf) {
      return a.isLeaf ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const child of node.children) {
    sortTreeRecursive(child);
  }
}

/**
 * Filter tree to only include nodes matching a brand
 */
export function filterTreeByBrand(
  tree: TokenTreeNode,
  brand: string
): TokenTreeNode {
  const filtered: TokenTreeNode = {
    ...tree,
    children: [],
  };

  for (const child of tree.children) {
    // Include global tokens and matching brand
    const firstPart = child.name.toLowerCase();
    if (firstPart === 'global' || firstPart === brand.toLowerCase()) {
      filtered.children.push(filterTreeByBrand(child, brand));
    }
  }

  return filtered;
}

/**
 * Flatten tree back to token array
 */
export function flattenTree(tree: TokenTreeNode): ResolvedToken[] {
  const tokens: ResolvedToken[] = [];

  function traverse(node: TokenTreeNode) {
    if (node.token) {
      tokens.push(node.token);
    }
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree);
  return tokens;
}

/**
 * Get all categories from tokens
 */
export function getCategories(tokens: ResolvedToken[]): string[] {
  const categories = new Set<string>();
  for (const token of tokens) {
    categories.add(token.category);
  }
  return Array.from(categories).sort();
}
