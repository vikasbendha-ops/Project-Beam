import type { FolderNode } from "@/components/workspace/folder-tree";

interface FlatFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  project_id?: string | null;
}

/**
 * Convert a flat list of folders into a tree (sorted by name at every level).
 */
export function buildFolderTree(flat: FlatFolder[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();
  for (const f of flat) {
    byId.set(f.id, {
      id: f.id,
      name: f.name,
      parent_folder_id: f.parent_folder_id,
      project_id: f.project_id ?? null,
      children: [],
    });
  }

  const roots: FolderNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_folder_id && byId.has(node.parent_folder_id)) {
      byId.get(node.parent_folder_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRec = (xs: FolderNode[]) => {
    xs.sort((a, b) => a.name.localeCompare(b.name));
    xs.forEach((x) => sortRec(x.children));
  };
  sortRec(roots);
  return roots;
}
