# InterviewOS

Interview prep platform that turns the recruiting cycle into a game: coding challenges, peer mock interviews, and resume reviews in one app. Built by a CSES Open Source team at UC San Diego over the 2026-27 school year. See [README.md](README.md) for the overview and [CONTRIBUTING.md](CONTRIBUTING.md) for setup and team process.

## Status

Early development. The stack below is partly set up. No features exist yet.

Open decisions. Do not assume an answer or build around one:

- **MVP scope:** not picked yet.
- **Auth library:** Auth.js is planned, but it now gets security patches only, so Better Auth is under consideration. `AUTH_SECRET` and `npx auth secret` are Auth.js-specific and change if we switch.

## Planned Features

1. **Live Mock Interviews:** video and audio with a shared code editor and whiteboard.
2. **Progress Tracker:** solved problems, mock interview counts, and more.
3. **Gamification:** daily streaks, mastery badges, and weekly contests.
4. **Peer Matching and Scheduling:** match partners by career interests.
5. **Anecdote Vault:** STAR stories and project write-ups.

## Tech Stack

- **App:** Next.js (App Router, TypeScript, `src/` directory), with API routes as the backend
- **UI:** TailwindCSS and shadcn/ui
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** LiveKit (video and audio), Monaco Editor (code), Excalidraw (whiteboard)
- **Login:** UCSD SSO (library undecided, see above)

## Commands

```bash
npm install            # also runs prisma generate
npm run dev            # http://localhost:3000
npm run lint
npm run typecheck      # next typegen, then tsc --noEmit
npm run build
npx prisma migrate dev
npx prisma studio
```

Run lint, typecheck, and build before calling work done. CI runs the same three on every PR, plus a TruffleHog secret scan.

## Conventions

- **Branches:** `feat/`, `fix/`, `docs/`, `chore/`, then a short name.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add daily streak counter`.
- **PRs:** `main` is protected. Every change goes through a PR with 1 approval from someone other than the author, and this also applies to admins. Fill out the PR template, link the issue with `Closes #12`, and keep each PR to one feature or fix.
- **Components:** use shadcn/ui when a component exists. Keep components small and reusable.
- **Prisma:** server code only. Never import it in a client component.
- **AI tools:** follow "Using AI Tools" in CONTRIBUTING.

## Watch Out For

- **Secrets:** this repo is public. Never commit `.env`, keys, or personal information. Add new env variables to `.env.example` and the table in CONTRIBUTING.
- **Generated client:** the Prisma client is generated into `src/generated/prisma`. Do not edit or commit it.
- **`npx prisma init`:** it can add AI-assistant folders (`.agents/`, `.claude/`, `.windsurf/`) and `skills-lock.json`. Do not commit those.
- **Local notes:** `CLAUDE.local.md` is private and gitignored. Do not copy its contents into tracked files, PRs, or issues.
