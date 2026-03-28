# AI Tool Picker 🚀

Find the right AI tool in seconds.  
Describe your need, and AI Tool Picker recommends the best-fit tool with a clear reason you can trust.

## ✨ Features

- **One-input recommendation flow**: type your goal → get a precise AI tool suggestion.
- **Hybrid recommendation engine**:
  - keyword matching for fast, stable results
  - **LLM fallback** (Zhipu GLM-4-Flash) for broader intent understanding
- **Personalized recommendation reason**: each result explains *why this tool fits your request*.
- **History & favorites**: revisit past searches and save go-to tools.
- **Google login**: sign in with Google for a real product-like account experience.
- **Session-based favorites sync**:
  - guest mode → favorites saved in localStorage
  - logged-in mode → favorites saved to `/api/favorites` per user
- **Category shortcuts**: jump quickly by scenarios like writing, coding, design, and productivity.
- **Tool comparison**: compare candidates side by side before deciding.
- **Official website redirect**: open each tool's official page directly.
- **Audience tags**: see who each tool is best for (e.g., `Student`, `Developer`, `Creator`, `Team`).

## 🧱 Tech Stack

### Frontend
- [Next.js 16](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

### Backend
- Next.js API Route (`/api/recommend`)
- NextAuth API Route (`/api/auth/[...nextauth]`)
- Favorites API Route (`/api/favorites`)

### AI
- [智谱 GLM-4-Flash](https://open.bigmodel.cn/)
- Structured **JSON response** for predictable rendering and easy extensibility

### Persistence
- `localStorage` for search history and guest favorites
- in-memory per-user favorites via `/api/favorites` when logged in

## 🚀 Getting Started

### 1) Clone the repository

```bash
git clone https://github.com/chake111/ai-tool-picker.git
cd ai-tool-picker/ui
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment variables

Create a `.env.local` file in `/ui`:

```bash
ZHIPU_API_KEY=your_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_URL=http://localhost:3000
```

You can generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 4) Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🧪 Usage

Enter your goal in natural language, then review the recommendation card:

- Query: **“make PPT slides”**
  - Suggested tools: [Gamma](https://gamma.app/), [Tome](https://tome.app/), [Beautiful.ai](https://www.beautiful.ai/)
  - Why choose it: great slide speed, strong templates, and visual polish
  - Best for: `Consultants` `Students` `Content Teams`

- Query: **“write code”**
  - Suggested tools: [ChatGPT](https://chatgpt.com/), [GitHub Copilot](https://github.com/features/copilot), [Tabnine](https://www.tabnine.com/)
  - Why choose it: fast code generation, debugging support, and IDE integration
  - Best for: `Developers` `Indie Hackers` `Engineering Teams`

## 🔐 NextAuth (Google) in App Router API

In App Router API (`app/api/**/route.ts`), get the current login session with:

```ts
const session = await getServerSession(authOptions)
```

Then read `userId` from:

```ts
const userId = session?.user?.id
```

This project sets `session.user.id` in `/home/runner/work/ai-tool-picker/ai-tool-picker/ui/lib/auth.ts` via the NextAuth callbacks.

Complete TypeScript example:

```ts
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    userId: session.user.id,
    user: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
  })
}
```

## 🌐 Deployment

You can deploy quickly on [Vercel](https://vercel.com/):

1. Import this repository into Vercel.
2. Set environment variables (e.g., `ZHIPU_API_KEY`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`).
3. Deploy with default Next.js settings.

For self-hosting:

```bash
cd ui
npm run build
npm run start
```

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "feat: add amazing feature"`)
4. Push the branch and open a Pull Request

Please keep PRs focused, readable, and easy to review.

## 📄 License

This project is open-sourced under the **MIT License**.  
If the repository license differs, please follow the root `LICENSE` file as source of truth.
