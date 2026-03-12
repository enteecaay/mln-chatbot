# MLN Chatbot Frontend

A modern Next.js web interface for the MLN RAG Chatbot system. This frontend connects to the [mln_chatbot_ollama](https://github.com/enteecaay/mln_chatbot_ollama) API backend to provide an interactive chat experience for questions about Marxism-Leninism.

## Features

- 🎨 **Modern UI**: Clean and responsive chat interface built with Next.js 15
- 💬 **Real-time Chat**: Streaming responses from the RAG API
- 🔄 **Session Management**: Maintains conversation context across messages
- 📱 **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: Optimized with Next.js App Router and Server Components

## Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- **Running API Backend**: The [MLN RAG API](https://github.com/enteecaay/mln_chatbot_ollama) must be running

## Backend API Setup

Before running this frontend, you need to set up and run the backend API:

1. **Clone and set up the API**:

   ```bash
   git clone https://github.com/enteecaay/mln_chatbot_ollama.git
   cd mln_chatbot_ollama
   ```

2. **Follow the API setup instructions** in the [backend repository](https://github.com/enteecaay/mln_chatbot_ollama)

3. **Start the API server**:

   ```bash
   uvicorn api:app --host 0.0.0.0 --port 8000
   ```

4. **Verify API is running**:
   ```bash
   curl http://localhost:8000/chat -X POST \
   -H "Content-Type: application/json" \
   -d '{"question":"Test","session_id":"test"}'
   ```

## Frontend Installation

1. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

2. **Configure environment variables**:

   ```bash
   # Copy the example environment file
   cp .env.example .env.local

   # Edit .env.local to match your API configuration
   # Default: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   # For production: NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open your browser**:
   Visit [http://localhost:3000](http://localhost:3000) to use the chatbot interface

## Project Structure

```
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # Main chat interface
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── chat/             # Chat-related components
│   └── ui/               # UI components
├── lib/                  # Utility functions
│   └── chat.ts           # API connection utilities
├── .env.local            # Environment variables (not committed)
├── .env.example          # Environment variables template
└── public/              # Static assets
```

## API Integration

This frontend communicates with the MLN RAG API through:

- **Endpoint**: `POST /chat`
- **Request Format**:
  ```json
  {
    "question": "Your question in Vietnamese",
    "session_id": "unique_session_identifier"
  }
  ```
- **Response**: Server-Sent Events (SSE) stream with real-time AI responses
- **Rate Limiting**: 20 requests per minute (handled by backend)

## Environment Configuration

The frontend uses environment variables to configure the API connection:

- **`.env.local`**: Your local environment configuration (not committed to git)
- **`.env.example`**: Template showing required environment variables

### Environment Variables

| Variable                   | Description                  | Default Value           |
| -------------------------- | ---------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the MLN RAG API | `http://localhost:8000` |

### Configuration Examples

**Development** (`.env.local`):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Production** (`.env.local`):

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

**Docker/Container**:

```bash
NEXT_PUBLIC_API_BASE_URL=http://mln-api:8000
```

## OTP Email (Nodemailer + Gmail)

OTP signup/resend currently uses Nodemailer with Gmail SMTP, compatible with Vercel serverless runtime.

Required environment variables:

- `GMAIL_USER`: Gmail address used to send OTP (example: `your-bot@gmail.com`)
- `GMAIL_APP_PASSWORD`: 16-character Google App Password (do not use normal account password)
- `MAIL_FROM` (optional): custom sender name/email. If omitted, default is `MLN Chatbot <GMAIL_USER>`

How to get Gmail App Password:

1. Enable 2-Step Verification in Google Account.
2. Open App Passwords in Google Account security settings.
3. Create a new app password and copy the generated 16-character value.

Vercel deployment notes:

1. In Vercel project, go to Settings -> Environment Variables.
2. Add `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and optionally `MAIL_FROM`.
3. Redeploy project after updating variables.

Quick local example (`.env.local`):

```bash
GMAIL_USER=your-bot@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
MAIL_FROM=MLN Chatbot <your-bot@gmail.com>
```

## Usage

1. **Start the backend API** (see Backend API Setup above)
2. **Run this frontend** with `npm run dev`
3. **Open browser** to http://localhost:3000
4. **Start chatting** about Marxism-Leninism in Vietnamese!

Example questions:

- "Chủ nghĩa Mác là gì?"
- "Giải thích về đấu tranh giai cấp"
- "Vai trò của đảng cộng sản là gì?"

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS / CSS Modules
- **API Communication**: Fetch API with Server-Sent Events
- **Backend**: [MLN RAG API](https://github.com/enteecaay/mln_chatbot_ollama) (FastAPI + Ollama + ChromaDB)

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Related Repositories

- **Backend API**: [mln_chatbot_ollama](https://github.com/enteecaay/mln_chatbot_ollama) - The RAG API that powers this frontend

## License

This project is open source and available under the [MIT License](LICENSE).
