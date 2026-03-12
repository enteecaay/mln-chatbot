import { NextResponse } from "next/server";

import { createChatTitle, formatBanMessage, isBanActive } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUserServer } from "@/lib/server-auth";
import { createAdminClient, createClient } from "@/utils/supabase/server";

const CHAT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    if (isBanActive(currentUser)) {
      return NextResponse.json({ error: formatBanMessage(currentUser) }, { status: 403 });
    }

    const throttle = rateLimit(`chat:${currentUser.id}`, 5, 10_000);
    if (!throttle.allowed) {
      return NextResponse.json(
        { error: `Bạn đang gửi quá nhanh. Vui lòng thử lại sau ${throttle.retryAfter}s.` },
        { status: 429 },
      );
    }

    const { question, sessionId } = (await request.json()) as {
      question?: string;
      sessionId?: string;
    };

    if (!question?.trim() || !sessionId) {
      return NextResponse.json({ error: "Thiếu câu hỏi hoặc sessionId" }, { status: 400 });
    }

    if (!CHAT_API_BASE_URL) {
      return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL chưa được cấu hình" }, { status: 500 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: session } = await supabase
      .from("chat_sessions")
      .select("id, title, message_count")
      .eq("id", sessionId)
      .eq("user_id", currentUser.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Không tìm thấy phiên chat" }, { status: 404 });
    }

    const trimmedQuestion = question.trim();
    await supabase.from("messages").insert({
      session_id: sessionId,
      user_id: currentUser.id,
      role: "user",
      content: trimmedQuestion,
    });

    const upstream = await fetch(`${CHAT_API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: trimmedQuestion,
        session_id: sessionId,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Chat API hiện không phản hồi" }, { status: 502 });
    }

    let answer = "";
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunkText = decoder.decode(value, { stream: true });
            for (const line of chunkText.split("\n")) {
              if (line.startsWith("data:")) {
                const raw = line.replace(/^data:\s*/, "");
                try {
                  const parsed = JSON.parse(raw) as { token?: string };
                  if (parsed.token) answer += parsed.token;
                } catch { }
              }
            }

            controller.enqueue(encoder.encode(chunkText));
          }

          await supabase.from("messages").insert({
            session_id: sessionId,
            user_id: currentUser.id,
            role: "assistant",
            content: answer || "Xin lỗi, tôi chưa thể trả lời lúc này.",
          });

          await supabase
            .from("chat_sessions")
            .update({
              title: session.message_count === 0 ? createChatTitle(trimmedQuestion) : session.title,
              message_count: session.message_count + 2,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("user_id", currentUser.id);

          await admin
            .from("profiles")
            .update({ message_count: currentUser.messageCount + 1 })
            .eq("id", currentUser.id);

          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" },
      { status: 500 },
    );
  }
}