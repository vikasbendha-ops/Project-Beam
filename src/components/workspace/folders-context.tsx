"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FolderNode } from "@/components/workspace/folder-tree";

export interface FlatFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  /** Display name with parents joined ("/") for the move dialog. */
  path: string;
  depth: number;
}

interface FoldersContextValue {
  folders: FolderNode[];
  flat: FlatFolder[];
}

const Ctx = createContext<FoldersContextValue | null>(null);

export function FoldersProvider({
  folders,
  children,
}: {
  folders: FolderNode[];
  children: ReactNode;
}) {
  const value = useMemo<FoldersContextValue>(
    () => ({ folders, flat: flatten(folders) }),
    [folders],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFolders() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      folders: [] as FolderNode[],
      flat: [] as FlatFolder[],
    };
  }
  return ctx;
}

function flatten(
  nodes: FolderNode[],
  prefix = "",
  depth = 0,
): FlatFolder[] {
  const out: FlatFolder[] = [];
  for (const n of nodes) {
    const path = prefix ? `${prefix} / ${n.name}` : n.name;
    out.push({
      id: n.id,
      name: n.name,
      parent_folder_id: n.parent_folder_id,
      path,
      depth,
    });
    out.push(...flatten(n.children, path, depth + 1));
  }
  return out;
}
