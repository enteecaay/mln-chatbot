"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { LoadingSprite } from "@/components/LoadingSprite";
import { streamChat } from "@/lib/chat";
import { createClient } from "@/utils/supabase/client";
import type { MessageRow } from "@/types/database";

type ChatBoxProps = {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  selectedSessionId: string | null;
  onSessionActivity: () => void;
};

type Message = Pick<MessageRow, "content" | "role" | "id">;

export default function ChatBox({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  selectedSessionId,
  onSessionActivity,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [botAvatarBroken, setBotAvatarBroken] = useState(false);
  const [userAvatarBroken, setUserAvatarBroken] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedSessionId) {
        setMessages([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("session_id", selectedSessionId)
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: true });

      setMessages((data || []) as Message[]);
    };

    void loadMessages();
  }, [currentUserId, selectedSessionId]);

  const sendMessage = async () => {
    if (!selectedSessionId) {
      setError("Hãy tạo hoặc chọn một cuộc trò chuyện trước khi gửi câu hỏi.");
      return;
    }

    if (!input.trim() || isLoading) return;

    const question = input.trim();
    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: question,
    };
    const botMessage: Message = {
      id: `temp-bot-${Date.now()}`,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      let accumulated = "";

      await streamChat(question, selectedSessionId, (token) => {
        accumulated += token;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            ...botMessage,
            content: accumulated,
          };
          return next;
        });
      });

      onSessionActivity();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setError(message);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...botMessage,
          content: message,
        };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedSessionId) {
    return (
      <div className="flex min-h-[70vh] flex-1 items-center justify-center rounded-4xl border border-white/60 bg-white/72 p-10 text-center shadow-[0_24px_80px_rgba(93,126,216,0.12)] backdrop-blur-xl">
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold text-slate-900">Chưa có cuộc trò chuyện nào được chọn</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Tạo một phiên chat mới ở cột bên trái để bắt đầu đặt câu hỏi về Chủ nghĩa Mác - Lênin.</p>
        </div>
      </div>
    );
  }

  const renderAvatar = (role: "user" | "assistant") => {
    if (role === "assistant") {
      return (
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-linear-to-br from-slate-200 to-slate-300 text-[10px] font-semibold text-slate-700 shadow-sm">
          {!botAvatarBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/bot.png"
              alt="bot avatar"
              className="h-full w-full object-cover scale-120"
              onError={() => setBotAvatarBroken(true)}
            />
          ) : (
            <span>AI</span>
          )}
        </div>
      );
    }

    if (currentUserAvatar && !userAvatarBroken) {
      return (
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUserAvatar}
            alt="user avatar"
            className="h-full w-full object-cover"
            onError={() => setUserAvatarBroken(true)}
          />
        </div>
      );
    }

    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
        {currentUserName.slice(0, 1).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-4xl border border-white/60 bg-white/72 shadow-[0_24px_80px_rgba(93,126,216,0.12)] backdrop-blur-xl">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Marx-Lenin AI</h2>
        <p className="text-sm text-slate-500">Lịch sử chat được lưu tự động theo từng phiên.</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-8">
        {messages.length === 0 && (
          <div className="mt-12 rounded-[28px] border border-dashed border-[#efb0c9] bg-[#fff6fa] p-8 text-center">
            <h3 className="text-2xl font-semibold text-slate-900">Bắt đầu cuộc trò chuyện</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Đặt câu hỏi đầu tiên. Tiêu đề đoạn chat sẽ tự động lấy từ 5-6 từ đầu tiên của câu hỏi này.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-4xl items-end gap-1 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {renderAvatar(message.role)}

              <div>
                <p className={`mb-1 text-xs font-medium text-slate-500 ${message.role === "user" ? "text-right" : "text-left"}`}>
                  {message.role === "user" ? currentUserName : "MLN Chatbot"}
                </p>
                <div
                  className={`max-w-3xl rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm ${message.role === "user"
                    ? "bg-linear-to-r from-[#b65c80] to-[#5d7ed8] text-white"
                    : "border border-slate-100 bg-slate-50 text-slate-700"
                    }`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-500">
            <LoadingSprite size="sm" />
            AI đang trả lời...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 px-6 py-5">
        {error && <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void sendMessage())}
            placeholder="Hỏi về chủ nghĩa Mác - Lênin..."
            className="input flex-1"
          />
          <button onClick={() => void sendMessage()} disabled={isLoading || !input.trim()} className="primary-button px-5">
            <SendHorizonal className="h-4 w-4" />
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}