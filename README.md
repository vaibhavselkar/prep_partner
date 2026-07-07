# मराठी नोट्स AI | Marathi Notes AI

A voice-first AI study assistant for students with scanned Marathi handwritten notebook PDFs.

## 🎯 MPSC Group-C Prep (`/technical-sahayak`)

A dedicated, exam-focused module for the **MPSC Group-C Combined Examination 2026**
(Advt. 017/2026 — Industry Inspector & Technical Assistant), built to the official
syllabus (`docs/official-syllabus-2026.md`):

- **Verified question bank** — 593+ questions across all 8 prelims subjects (History,
  Geography, Polity, Current Affairs, Science, Economy, Arithmetic, Reasoning) plus
  Mains Paper-1 language. Each question was AI-drafted then independently fact-checked.
  Bank lives as committed data files (`src/data/bank/`), loaded via a generated bundle.
- **Bank-backed quiz** — practice by subject/sub-topic/difficulty (`/api/bank-quiz`).
- **Full-length timed mock** — 100 questions, 60 min, real subject weightage, auto-scored
  with per-subject breakdown (`/api/mock`), persisted attempts.
- **Study notes** — concise per-sub-topic notes (`src/data/notes/`).
- **Weak-area tracking + report** — accuracy per sub-topic, "practice this", 🚩 report
  wrong questions. Correct exam facts (0.25 negative marking, prelims-for-shortlisting).

Run tests: `npm test` (Vitest). Regenerate the bank/notes bundles: `npm run build:bank`.

## Features

- 📄 **PDF Upload** — Upload scanned Marathi notes, extract text automatically
- 🎤 **Voice Chat** — Speak in Marathi, English, or Hindi; AI replies in the same language
- 🤖 **AI Tutor** — Powered by Groq's `llama-3.3-70b-versatile`; references your notes as context
- 📝 **Smart Notes** — Auto-save notes; say "याची नोंद कर" to save a note by voice
- ❓ **AI Quiz** — Generate MCQ quizzes from your PDF content in Marathi/English
- 📊 **Progress Tracking** — Session counts, coverage %, quiz history dashboard

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd marathi-notes-ai
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```env
GROQ_API_KEY=gsk_...           # Get from https://console.groq.com
BLOB_READ_WRITE_TOKEN=vercel_blob_...  # Get from Vercel Blob dashboard
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel deploy
```

Add the environment variables in Vercel dashboard under Project → Settings → Environment Variables.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS (dark mode, teal accent) |
| AI/LLM | Groq SDK (`llama-3.3-70b-versatile`) |
| Streaming | Vercel AI SDK (`ai` package) |
| File Storage | Vercel Blob (`@vercel/blob`) |
| PDF Parsing | `pdf-parse` (server-side) |
| Voice | Web Speech API (browser-native) |
| Data | Flat files (`data/notes.txt`, `data/pdfs.json`, `data/progress.json`) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — upload PDFs, quick access |
| `/study` | Voice orb + AI chat + PDF sidebar + notes panel |
| `/notes` | Notes manager — view, add, delete, download .txt |
| `/quiz` | AI-generated MCQ quiz from PDF content |
| `/progress` | Study dashboard — coverage, quiz history, sessions |

## Notes on Persistence

The flat-file approach (`data/*.json`) works great locally. On Vercel:
- The `data/` folder is writable **within a deployment** but resets on re-deploy.
- For production persistence, consider upgrading to [Vercel KV](https://vercel.com/docs/storage/vercel-kv) or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres).
- PDFs are stored durably in Vercel Blob and are unaffected by re-deploys.

## Voice Usage Tips

- **Marathi**: Use mic button, speak naturally in Marathi — AI responds in Marathi
- **Save a note**: Say "याची नोंद कर" or "save this as a note"
- **Switch language**: Use the language dropdown in the study page header
- **TTS**: AI responses are spoken aloud automatically; tap orb to stop

## Project Structure

```
src/
├── app/
│   ├── api/         # API routes (chat, upload, notes, quiz, progress)
│   ├── study/       # Voice study page
│   ├── notes/       # Notes manager
│   ├── quiz/        # Quiz page
│   └── progress/    # Progress dashboard
├── components/      # Reusable UI components
├── hooks/           # useSpeechRecognition, useSpeechSynthesis
├── lib/             # dataStore, groq client, pdfUtils
└── types/           # Shared TypeScript types
```
