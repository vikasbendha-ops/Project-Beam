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
      return state.map((t) =>
        t.id === action.threadId
          ? {
              ...t,
              messages: [
                ...((t.messages ?? []).filter(
                  (m) => m.id !== action.message.id,
                )),
                action.message,
              ],
            }
          : t,
      );
    }
    case "REPLACE_MESSAGE": {
      return state.map((t) =>
        t.id === action.threadId
          ? {
              ...t,
              messages: (t.messages ?? []).map((m) =>
                m.id === action.tempId ? action.message : m,
              ),
            }
          : t,
      );
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

interface CreateThreadInput {
  x: number;
  y: number;
  pageNumber?: number | null;
  content: string;
}

interface CanvasMutators {
  threads: CanvasThread[];
  createThread: (input: CreateThreadInput) => Promise<string | null>;
  postReply: (threadId: string, content: string) => Promise<void>;
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
  deleteThread: (threadId: string) => Promise<void>;
  deleteMessage: (threadId: string, messageId: string) => Promise<void>;
}

const CanvasStateContext = createContext<CanvasMutators | null>(null);

interface CanvasStateProviderProps {
  markupId: string;
  versionId: string | null;
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
  initialThreads,
  currentUser,
  currentUserName,
  children,
}: CanvasStateProviderProps) {
  const [threads, dispatch] = useReducer(reducer, initialThreads);

  // Re-seed from server props if the page navigates between markups (the
  // server component re-renders with new initialThreads).
  const seededRef = useRef<string>(markupId);
  useEffect(() => {
    if (seededRef.current !== markupId) {
      seededRef.current = markupId;
      dispatch({ type: "REPLACE", threads: initialThreads });
    }
  }, [markupId, initialThreads]);

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
          filter: `markup_id=eq.${markupId}`,
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
          filter: `markup_id=eq.${markupId}`,
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
          filter: `markup_id=eq.${markupId}`,
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
  }, [markupId]);

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
            attachments: [],
            mentions: [],
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
            x_position: input.x,
            y_position: input.y,
            page_number: input.pageNumber ?? null,
            content: input.content,
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
        dispatch({ type: "REMOVE_THREAD", threadId: tempThreadId });
        toast.error(err instanceof Error ? err.message : "Couldn't drop pin");
        return null;
      }
    },
    [markupId, versionId, threads, currentUser.id],
  );

  const postReply = useCallback(
    async (threadId: string, content: string) => {
      const tempId = `tmp_${Date.now()}_${Math.random()}`;
      const tempMessage: CanvasMessage = {
        id: tempId,
        content,
        attachments: [],
        mentions: [],
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
          body: JSON.stringify({ content }),
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
        dispatch({
          type: "REMOVE_MESSAGE",
          threadId,
          messageId: tempId,
        });
        toast.error(err instanceof Error ? err.message : "Couldn't post");
        throw err;
      }
    },
    [currentUser.id],
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
    created_by: (row.created_by as string | null) ?? null,
    guest_name: (row.guest_name as string | null) ?? null,
    guest_email: (row.guest_email as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    edited_at: (row.edited_at as string | null) ?? null,
    parent_message_id: (row.parent_message_id as string | null) ?? null,
  };
}
