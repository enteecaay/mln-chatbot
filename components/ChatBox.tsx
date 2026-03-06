"use client"

import { useState, useRef } from "react"
import ReactMarkdown from "react-markdown"

// Define proper Message type
interface Message {
  role: "user" | "assistant"
  content: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function ChatBox() {

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    const botMessage: Message = { role: "assistant", content: "" }

    // Fix: Properly type the messages
    setMessages(prev => [...prev, userMessage, botMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          session_id: "default-session"
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let accumulatedResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.token) {
                accumulatedResponse += data.token
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: accumulatedResponse
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại."
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0b0b0f] text-white">

      {/* HEADER */}

      <div className="border-b border-zinc-800 p-4 text-center text-lg font-semibold">
        Marx-Lenin AI
      </div>

      {/* CHAT AREA */}

      <div className="flex-1 overflow-y-auto px-6 py-10 max-w-3xl w-full mx-auto space-y-8">

        {messages.length === 0 && (

          <div className="text-center mt-20 space-y-4 opacity-80">

            <h1 className="text-3xl font-semibold">
              Marx-Lenin AI
            </h1>

            <p className="text-zinc-400">
              Hỏi bất kỳ câu hỏi nào về Chủ nghĩa Mác-Lênin
            </p>

          </div>

        )}

        {messages.map((msg, i) => (

          <div
            key={i}
            className={`flex ${msg.role === "user"
              ? "justify-end"
              : "justify-start"
              }`}
          >

            <div
              className={`px-5 py-4 rounded-xl max-w-2xl leading-relaxed ${msg.role === "user"
                ? "bg-blue-600"
                : "bg-zinc-900"
                }`}
            >

              <ReactMarkdown>
                {msg.content}
              </ReactMarkdown>

            </div>

          </div>

        ))}

        {isLoading && (

          <div className="text-zinc-500 text-sm">
            AI đang trả lời...
          </div>

        )}

        <div ref={bottomRef} />

      </div>

      {/* INPUT */}

      <div className="border-t border-zinc-800 p-4">

        <div className="max-w-3xl mx-auto flex gap-3">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Hỏi về chủ nghĩa Mác-Lênin..."
            className="flex-1 bg-zinc-900 px-4 py-3 rounded-xl outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 px-6 rounded-xl hover:bg-blue-700 transition"
          >
            Ask
          </button>

        </div>

      </div>

    </div>
  )
}