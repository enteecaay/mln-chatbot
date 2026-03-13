"use client";

import { useEffect, useState } from "react";
import { MessageCircleMore, Plus, Trash2 } from "lucide-react";

import { LoadingSprite } from "@/components/LoadingSprite";
import { createClient } from "@/utils/supabase/client";
import type { ChatSessionRow } from "@/types/database";

type ChatSidebarProps = {
  userId: string;
  selectedSessionId: string | null;
  refreshKey: number;
  onSelectSession: (sessionId: string | null) => void;
};

export function ChatSidebar({
  userId,
  selectedSessionId,
  refreshKey,
  onSelectSession,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      const nextSessions = (data || []) as ChatSessionRow[];
      setSessions(nextSessions);
      if (!selectedSessionId && nextSessions[0]) {
        onSelectSession(nextSessions[0].id);
      }
      if (selectedSessionId && !nextSessions.some((item) => item.id === selectedSessionId)) {
        onSelectSession(nextSessions[0]?.id || null);
      }
      setLoading(false);
    };

    void loadSessions();
  }, [onSelectSession, refreshKey, selectedSessionId, userId]);

  const createSession = async () => {
    setCreating(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_sessions")
      .insert({
        title: "Cuộc trò chuyện mới",
        user_id: userId,
      })
      .select("*")
      .single();

    const createdSession = data as ChatSessionRow | null;
    if (createdSession) {
      setSessions((prev) => [createdSession, ...prev]);
      onSelectSession(createdSession.id);
    }
    setCreating(false);
  };

  const deleteSession = async (sessionId: string) => {
    const supabase = createClient();
    await supabase.from("chat_sessions").delete().eq("id", sessionId).eq("user_id", userId);

    setSessions((prev) => {
      const next = prev.filter((session) => session.id !== sessionId);
      if (sessionId === selectedSessionId) {
        onSelectSession(next[0]?.id || null);
      }
      return next;
    });
  };

  return (
    <aside className="flex w-full max-w-sm flex-col rounded-4xl border border-white/60 bg-white/74 p-5 shadow-[0_24px_80px_rgba(182,92,128,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cuộc trò chuyện</h2>
          <p className="text-sm text-slate-500">Quản lý nhiều phiên chat khác nhau</p>
        </div>

        <button onClick={() => void createSession()} disabled={creating} className="secondary-button px-3">
          {creating ? <LoadingSprite size="sm" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-500">
            <LoadingSprite size="sm" />
            Đang tải...
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#efb0c9] bg-[#fff6fa] p-5 text-sm text-slate-600">
            Chưa có phiên chat nào. Nhấn dấu cộng để tạo cuộc trò chuyện mới.
          </div>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            className={`rounded-3xl border p-4 transition ${selectedSessionId === session.id
                ? "border-[#efb0c9] bg-[#fff3f8]"
                : "border-slate-100 bg-slate-50 hover:border-[#a1c9f1]"
              }`}
          >
            <button onClick={() => onSelectSession(session.id)} className="w-full text-left">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-white p-2 text-[#b65c80] shadow-sm">
                  <MessageCircleMore className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">{session.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{session.message_count} tin nhắn</p>
                </div>
              </div>
            </button>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => void deleteSession(session.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 transition hover:text-rose-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}