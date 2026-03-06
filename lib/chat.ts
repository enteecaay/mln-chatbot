export async function streamChat(
  question: string,
  sessionId: string,
  onToken: (token: string) => void
) {
  const response = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question,
      session_id: sessionId
    })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) return

  while (true) {
    const { value, done } = await reader.read()

    if (done) break

    const chunk = decoder.decode(value)

    const lines = chunk.split("\n")

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const json = line.replace("data: ", "")

        try {
          const parsed = JSON.parse(json)

          if (parsed.token) onToken(parsed.token)
        } catch { }
      }
    }
  }
}