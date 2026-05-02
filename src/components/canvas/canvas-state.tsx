"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type {
  CanvasMessage,
  CanvasThread,
  CanvasCurrentUser,
} from "@/components/canvas/types";

type Action =
  | { type: "REPLACE"; threads: CanvasThread[] }
  | { type: "ADD_THREAD"; thread: CanvasThread }
  | { type: "UPDATE_THREAD"; threadId: string; patch: Partial<CanvasThread> }
  | { type: "REMOVE_THREAD"; threadId: string }
  | {
      type: "ADD_MESSAGE";
      threadId: string;
      message: CanvasMessage;
    }
  | {
      type: "REPLACE_MESSAGE";
      threadId: string;
      tempId: string;
      message: CanvasMessage;
    }
  | { type: "REMOVE_MESSAGE"; threadId: string; messageId: string };

function reducer(state: CanvasThread[], action: Action): CanvasThread[] {
  switch (action.type) {
    case "REPLACE":
      return action.threads;
    case "ADD_THREAD": {
      // Idempotent: don't add if id (or temp id) already present.
      if (state.some((t) => t.id === action.thread.id)) return state;
      return [...state, action.thread].sort(
        (a, b) => a.thread_number - b.thread_number,
      );
    }
    case "UPDATE_THREAD":
      return state.map((t) =>
        t.id === action.threadId ? { ...t, ...action.patch } : t,
      );
    case "REMOVE_THREAD":
      return state.filter((t) => t.id !== action.threadId);
    case "ADD_MESSAGE": {
      return state.map((t) => {
        if (t.id !== action.threadId) return t;
        const existing = t.messages ?? [];
        // Already in state by exact id — no-op.
        if (existing.some((m) => m.id === action.message.id)) {
          return t;
        }
        // Realtime INSERT arrived for a message we already added optimistically.
        // Resolve the temp (id starts with 'tmp_') by matching content + author
        // instead of duplicating. Pure-replace-by-id leaves orphaned temps.
        const incomingIsReal = !action.message.id.startsWith("tmp_");
        if (incomingIsReal) {
          const tempIdx = existing.findIndex(
            (m) =>
              m.id.startsWith("tmp_") &&
              m.content === action.message.content &&
              m.created_by === action.message.created_by &&
              m.guest_name === action.message.guest_name,
          );
          if (tempIdx >= 0) {
            const next = [...existing];
            next[tempIdx] = action.message;
            return { ...t, messages: next };
          }
        }
        return { ...t, messages: [...existing, action.message] };
      });
    }
    case "REPLACE_MESSAGE": {
      return state.map((t) => {
        if (t.id !== action.threadId) return t;
        const existing = t.messages ?? [];
        const idx = existing.findIndex((m) => m.id === action.tempId);
        if (idx >= 0) {
          const next = [...existing];
          next[idx] = action.message;
          return { ...t, messages: next };
        }
        // Realtime UPDATE arriving for a message we don't have in state.
        // Self-heal by trying to resolve a matching temp; otherwise add.
        if (existing.some((m) => m.id === action.message.id)) {
          // Already present (race) — overwrite in place.
          return {
            ...t,
            messages: existing.map((m) =>
              m.id === action.message.id ? action.message : m,
            ),
          };
        }
        const tempIdx = existing.findIndex(
          (m) =>
            m.id.startsWith("tmp_") &&
            m.content === action.message.content &&
            m.created_by === action.message.created_by &&
            m.guest_name === action.message.guest_name,
        );
        if (tempIdx >= 0) {
          const next = [...existing];
          next[tempIdx] = action.message;
          return { ...t, messages: next };
        }
        return { ...t, messages: [...existing, action.message] };
      });
    }
    case "REMOVE_MESSAGE":
      return state.map((t) =>
        t.id === action.threadId
          ? {
              ...t,
              messages: (t.messages ?? []).filter(
                (m) => m.id !== action.messageId,
              ),
            }
          : t,
      );
    default:
      return state;
  }
}

interface MessageAttachment {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

interface CreateThreadInput {
  x: number;
  y: number;
  pageNumber?: number | null;
  content: string;
  mentions?: string[];
  attachments?: MessageAttachment[];
}

interface PostReplyInput {
  content: string;
  mentions?: string[];
  attachments?: MessageAttachment[];
}

interface CanvasMutators {
  threads: CanvasThread[];
  createThread: (input: CreateThreadInput) => Promise<string | null>;
  postReply: (threadId: string, input: PostReplyInput) => Promise<void>;
  setThreadStatus: (
    threadId: string,
    status: "open" | "resolved",
  ) => Promise<void>;
  setThreadPriority: (
    threadId: string,
    priority: "none" | "low" | "medium" | "high",
  ) => Promise<void>;
  /** Reposition pin to new % coords (and optionally a different page). */
  moveThread: (
    threadId: string,
    x: number,
    y: number,
    pageNumber?: number | null,
  ) => Promise<void>;
  /** Edit the content of an existing message. Optimistic; reverts on error. */
  editMessage: (
    threadId: string,
    messageId: string,
    content: string,
  ) => Promise<void>;
  /** Toggle the current user's reaction on a message. Optimistic. */
  toggleReaction: (
    threadId: string,
    messageId: string,
    emoji: string,
  ) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  deleteMessage: (threadId: string, messageId: string) => Promise<void>;
}

const CanvasStateContext = createContext<CanvasMutators | null>(null);

interface CanvasStateProviderProps {
  markupId: string;
  versionId: string | null;
  /** Active asset for multi-asset markups. Threads in state are scoped to
   *  this asset; realtime inserts from other assets are filtered out. */
  assetId?: string | null;
  initialThreads: CanvasThread[];
  currentUser: CanvasCurrentUser;
  currentUserName: string;
  children: ReactNode;
}

/**
 * Holds threads in local state and exposes optimistic mutators. Realtime
 * payloads merge into the same store. Eliminates the perceived lag from
 * router.refresh() round-trips.
 */
export function CanvasStateProvider({
  markupId,
  versionId,
  assetId,
  initialThreads,
  currentUser,
  currentUserName,
  children,
}: CanvasStateProviderProps) {
  const router = useRouter();
  const [threads, dispatch] = useReducer(reducer, initialThreads);

  // Re-seed from server props if the page navigates between markups OR
  // between assets within the same markup (the server component
  // re-renders with new initialThreads each time).
  const seedKey = `${markupId}::${assetId ?? ""}`;
  const seededRef = useRef<string>(seedKey);
  useEffect(() => {
    if (seededRef.current !== seedKey) {
      seededRef.current = seedKey;
      dispatch({ type: "REPLACE", threads: initialThreads });
    }
  }, [seedKey, initialThreads]);

  // Realtime: subscribe to threads + messages for this markup. Merge new
  // rows into local state instead of refreshing the page.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`canvas-state:${markupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "threads",
          filter: assetId
            ? `asset_id=eq.${assetId}`
            : `markup_id=eq.${markupId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          // Skip if we already have it (we just optimistically added).
          dispatch({
            type: "ADD_THREAD",
            thread: rowToThread(row),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "threads",
          filter: assetId
            ? `asset_id=eq.${assetId}`
            : `markup_id=eq.${markupId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          dispatch({
            type: "UPDATE_THREAD",
            threadId: String(row.id),
            patch: {
              status: row.status as CanvasThread["status"],
              priority: row.priority as CanvasThread["priority"],
              resolved_at: (row.resolved_at as string | null) ?? null,
              updated_at: (row.updated_at as string | null) ?? null,
            },
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "threads",
          filter: assetId
            ? `asset_id=eq.${assetId}`
            : `markup_id=eq.${markupId}`,
        },
        (payload) => {
          const row = payload.old as Record<string, unknown>;
          dispatch({ type: "REMOVE_THREAD", threadId: String(row.id) });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          dispatch({
            type: "ADD_MESSAGE",
            threadId: String(row.thread_id),
            message: rowToMessage(row),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          // Reuse REPLACE_MESSAGE — the matching message swaps to the new
          // server row. Covers edits AND reaction toggles, both of which
          // arrive as UPDATEs.
          dispatch({
            type: "REPLACE_MESSAGE",
            threadId: String(row.thread_id),
            tempId: String(row.id),
            message: rowToMessage(row),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.old as Record<string, unknown>;
          dispatch({
            type: "REMOVE_MESSAGE",
            threadId: String(row.thread_id),
            messageId: String(row.id),
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [markupId, assetId]);

  const createThread = useCallback(
    async (input: CreateThreadInput): Promise<string | null> => {
      const tempThreadId = `tmp_${Date.now()}_${Math.random()}`;
      const tempMessageId = `tmp_${Date.now()}_${Math.random()}`;
      const nowIso = new Date().toISOString();
      const nextNumber =
        Math.max(0, ...threads.map((t) => t.thread_number)) + 1;

      const tempThread: CanvasThread = {
        id: tempThreadId,
        thread_number: nextNumber,
        x_position: input.x,
        y_position: input.y,
        page_number: input.pageNumber ?? null,
        status: "open",
        priority: "none",
        created_by: currentUser.id,
        guest_name: null,
        guest_email: null,
        created_at: nowIso,
        updated_at: nowIso,
        resolved_at: null,
        messages: [
          {
            id: tempMessageId,
            content: input.content,
            attachments: input.attachments ?? [],
            mentions: input.mentions ?? [],
            reactions: {},
            created_by: currentUser.id,
            guest_name: null,
            guest_email: null,
            created_at: nowIso,
            edited_at: null,
            parent_message_id: null,
          },
        ],
      };

      dispatch({ type: "ADD_THREAD", thread: tempThread });

      try {
        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            markup_id: markupId,
            markup_version_id: versionId,
            asset_id: assetId ?? undefined,
            x_position: input.x,
            y_position: input.y,
            page_number: input.pageNumber ?? null,
            content: input.content,
            mentions: input.mentions ?? [],
            attachments: input.attachments ?? [],
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't drop pin");
        }
        const body = (await res.json()) as {
          thread_id: string;
          thread_number: number;
          message_id: string;
        };
        // Replace temp thread with confirmed id + thread_number. Easiest:
        // remove the temp + add the real (using the same x/y/content).
        dispatch({ type: "REMOVE_THREAD", threadId: tempThreadId });
        dispatch({
          type: "ADD_THREAD",
          thread: {
            ...tempThread,
            id: body.thread_id,
            thread_number: body.thread_number,
            messages: [
              {
                ...tempThread.messages![0]!,
                id: body.message_id,
              },
            ],
          },
        });
        return body.thread_id;
      } catch (err) {
        // Same logic as postReply: insert may or may not have landed. Strip
        // optimistic, refresh from server.
        dispatch({ type: "REMOVE_THREAD", threadId: tempThreadId });
        router.refresh();
        toast.error(err instanceof Error ? err.message : "Couldn't drop pin");
        return null;
      }
    },
    [markupId, versionId, assetId, threads, currentUser.id, router],
  );

  const postReply = useCallback(
    async (threadId: string, input: PostReplyInput) => {
      const tempId = `tmp_${Date.now()}_${Math.random()}`;
      const tempMessage: CanvasMessage = {
        id: tempId,
        content: input.content,
        attachments: input.attachments ?? [],
        mentions: input.mentions ?? [],
        reactions: {},
        created_by: currentUser.id,
        guest_name: null,
        guest_email: null,
        created_at: new Date().toISOString(),
        edited_at: null,
        parent_message_id: null,
      };
      dispatch({ type: "ADD_MESSAGE", threadId, message: tempMessage });

      try {
        const res = await fetch(`/api/threads/${threadId}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            content: input.content,
            mentions: input.mentions ?? [],
            attachments: input.attachments ?? [],
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't post");
        }
        const { id } = (await res.json()) as { id: string };
        dispatch({
          type: "REPLACE_MESSAGE",
          threadId,
          tempId,
          message: { ...tempMessage, id },
        });
      } catch (err) {
        // We don't know if the insert actually landed (network blip mid-INSERT
        // is possible). Strip the optimistic + ask the server for the truth —
        // if the row IS in DB, it'll come back through initialThreads and
        // REPLACE re-seeds it.
        dispatch({
          type: "REMOVE_MESSAGE",
          threadId,
          messageId: tempId,
        });
        router.refresh();
        toast.error(err instanceof Error ? err.message : "Couldn't post");
        throw err;
      }
    },
    [currentUser.id, router],
  );

  const setThreadStatus = useCallback(
    async (threadId: string, status: "open" | "resolved") => {
      const target = threads.find((t) => t.id === threadId);
      if (!target) return;
      dispatch({
        type: "UPDATE_THREAD",
        threadId,
        patch: {
          status,
          resolved_at: status === "resolved" ? new Date().toISOString() : null,
        },
      });
      try {
        const res = await fetch(`/api/threads/${threadId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't update");
        }
      } catch (err) {
        // Revert.
        dispatch({
          type: "UPDATE_THREAD",
          threadId,
          patch: {
            status: target.status,
            resolved_at: target.resolved_at,
          },
        });
        toast.error(err instanceof Error ? err.message : "Couldn't update");
      }
    },
    [threads],
  );

  const setThreadPriority = useCallback(
    async (
      threadId: string,
      priority: "none" | "low" | "medium" | "high",
    ) => {
      const target = threads.find((t) => t.id === threadId);
      if (!target) return;
      dispatch({
        type: "UPDATE_THREAD",
        threadId,
        patch: { priority },
      });
      try {
        const res = await fetch(`/api/threads/${threadId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ priority }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't update priority");
        }
      } catch (err) {
        dispatch({
          type: "UPDATE_THREAD",
          threadId,
          patch: { priority: target.priority },
        });
        toast.error(err instanceof Error ? err.message : "Couldn't update");
      }
    },
    [threads],
  );

  const moveThread = useCallback(
    async (
      threadId: string,
      x: number,
      y: number,
      pageNumber?: number | null,
    ) => {
      const target = threads.find((t) => t.id === threadId);
      if (!target) return;
      // Optimistic.
      dispatch({
        type: "UPDATE_THREAD",
        threadId,
        patch: {
          x_position: x,
          y_position: y,
          ...(pageNumber !== undefined ? { page_number: pageNumber } : {}),
        },
      });
      try {
        const res = await fetch(`/api/threads/${threadId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            x_position: x,
            y_position: y,
            ...(pageNumber !== undefined ? { page_number: pageNumber } : {}),
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't move pin");
        }
      } catch (err) {
        // Revert.
        dispatch({
          type: "UPDATE_THREAD",
          threadId,
          patch: {
            x_position: target.x_position,
            y_position: target.y_position,
            page_number: target.page_number,
          },
        });
        toast.error(err instanceof Error ? err.message : "Couldn't move pin");
      }
    },
    [threads],
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      const target = threads.find((t) => t.id === threadId);
      if (!target) return;
      dispatch({ type: "REMOVE_THREAD", threadId });
      try {
        const res = await fetch(`/api/threads/${threadId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't delete");
        }
      } catch (err) {
        // Roll back.
        dispatch({ type: "ADD_THREAD", thread: target });
        toast.error(err instanceof Error ? err.message : "Couldn't delete");
      }
    },
    [threads],
  );

  const editMessage = useCallback(
    async (threadId: string, messageId: string, content: string) => {
      const thread = threads.find((t) => t.id === threadId);
      const target = thread?.messages?.find((m) => m.id === messageId);
      if (!thread || !target) return;
      const trimmed = content.trim();
      if (!trimmed || trimmed === target.content) return;
      // Optimistic: swap content + stamp edited_at locally.
      dispatch({
        type: "REPLACE_MESSAGE",
        threadId,
        tempId: messageId,
        message: {
          ...target,
          content: trimmed,
          edited_at: new Date().toISOString(),
        },
      });
      try {
        const res = await fetch(`/api/messages/${messageId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't save edit");
        }
      } catch (err) {
        // Revert.
        dispatch({
          type: "REPLACE_MESSAGE",
          threadId,
          tempId: messageId,
          message: target,
        });
        toast.error(err instanceof Error ? err.message : "Couldn't save edit");
      }
    },
    [threads],
  );

  const toggleReaction = useCallback(
    async (threadId: string, messageId: string, emoji: string) => {
      const thread = threads.find((t) => t.id === threadId);
      const target = thread?.messages?.find((m) => m.id === messageId);
      if (!thread || !target) return;
      const userId = currentUser.id;
      const current = (target.reactions as Record<string, string[]> | null) ?? {};
      const list = current[emoji] ?? [];
      const has = list.includes(userId);
      const nextList = has
        ? list.filter((u) => u !== userId)
        : [...list, userId];
      const nextReactions: Record<string, string[]> = { ...current };
      if (nextList.length === 0) delete nextReactions[emoji];
      else nextReactions[emoji] = nextList;

      // Optimistic.
      dispatch({
        type: "REPLACE_MESSAGE",
        threadId,
        tempId: messageId,
        message: { ...target, reactions: nextReactions },
      });
      try {
        const res = await fetch(`/api/messages/${messageId}/reactions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't react");
        }
      } catch (err) {
        // Revert.
        dispatch({
          type: "REPLACE_MESSAGE",
          threadId,
          tempId: messageId,
          message: target,
        });
        toast.error(err instanceof Error ? err.message : "Couldn't react");
      }
    },
    [threads, currentUser.id],
  );

  const deleteMessage = useCallback(
    async (threadId: string, messageId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      const target = thread?.messages?.find((m) => m.id === messageId);
      if (!thread || !target) return;
      dispatch({ type: "REMOVE_MESSAGE", threadId, messageId });
      try {
        const res = await fetch(`/api/messages/${messageId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't delete");
        }
      } catch (err) {
        dispatch({ type: "ADD_MESSAGE", threadId, message: target });
        toast.error(err instanceof Error ? err.message : "Couldn't delete");
      }
    },
    [threads],
  );

  const value = useMemo<CanvasMutators>(
    () => ({
      threads,
      createThread,
      postReply,
      setThreadStatus,
      setThreadPriority,
      moveThread,
      editMessage,
      toggleReaction,
      deleteThread,
      deleteMessage,
    }),
    [
      threads,
      createThread,
      postReply,
      setThreadStatus,
      setThreadPriority,
      moveThread,
      editMessage,
      toggleReaction,
      deleteThread,
      deleteMessage,
    ],
  );

  return (
    <CanvasStateContext.Provider value={value}>
      {children}
    </CanvasStateContext.Provider>
  );
}

export function useCanvasMutators() {
  const ctx = useContext(CanvasStateContext);
  if (!ctx)
    throw new Error("useCanvasMutators must be used inside CanvasStateProvider");
  return ctx;
}

function rowToThread(row: Record<string, unknown>): CanvasThread {
  return {
    id: String(row.id),
    thread_number: Number(row.thread_number ?? 0),
    x_position: row.x_position == null ? null : Number(row.x_position),
    y_position: row.y_position == null ? null : Number(row.y_position),
    page_number: row.page_number == null ? null : Number(row.page_number),
    status: (row.status as CanvasThread["status"]) ?? "open",
    priority: (row.priority as CanvasThread["priority"]) ?? "none",
    created_by: (row.created_by as string | null) ?? null,
    guest_name: (row.guest_name as string | null) ?? null,
    guest_email: (row.guest_email as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
    resolved_at: (row.resolved_at as string | null) ?? null,
    messages: [],
  };
}

function rowToMessage(row: Record<string, unknown>): CanvasMessage {
  return {
    id: String(row.id),
    content: String(row.content ?? ""),
    attachments: (row.attachments as unknown) ?? [],
    mentions: (row.mentions as string[] | null) ?? [],
    reactions:
      (row.reactions as Record<string, string[]> | null) ?? {},
    created_by: (row.created_by as string | null) ?? null,
    guest_name: (row.guest_name as string | null) ?? null,
    guest_email: (row.guest_email as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    edited_at: (row.edited_at as string | null) ?? null,
    parent_message_id: (row.parent_message_id as string | null) ?? null,
  };
}
