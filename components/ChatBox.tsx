"use client"

import { useState } from "react"
import { streamChat } from "@/lib/chat"
import MessageBubble from "./MessageBubble"

type Message = {
  role: "user" | "assistant"
  text: string
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const sessionId = "demo-session"

  const sendMessage = async () => {
    if (!input) return

    const userMessage: Message = {
      role: "user",
      text: input
    }

    setMessages(prev => [...prev, userMessage])

    setInput("")

    let assistantText = ""

    setMessages(prev => [...prev, { role: "assistant", text: "" }])

    await streamChat(input, sessionId, token => {
      assistantText += token

      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          text: assistantText
        }
        return newMessages
      })
    })
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">

      <div className="flex-1 overflow-y-auto p-4">

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}

      </div>

      <div className="p-4 border-t flex gap-2">

        <input
          className="flex-1 border rounded-lg p-2 text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        <button
          onClick={sendMessage}
          className="bg-black text-white px-4 rounded-lg"
        >
          Send
        </button>

      </div>
    </div>
  )
}