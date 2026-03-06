type Props = {
  role: "user" | "assistant"
  text: string
}

export default function MessageBubble({ role, text }: Props) {
  return (
    <div
      className={`max-w-xl p-3 rounded-xl mb-3 ${role === "user"
          ? "bg-blue-500 text-white ml-auto"
          : "bg-gray-200 text-black"
        }`}
    >
      {text}
    </div>
  )
}