# Contributing to InterviewOS

We're excited you want to help build InterviewOS! This guide covers how to install the project, run it locally, and submit your work.

> [!NOTE]
> The project is still being set up. The database schema has no models yet, so `npx prisma migrate dev` has nothing to apply until the first schema PR is merged.

## Installation

### Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) version 20 or newer (the LTS version is best)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [PostgreSQL](https://www.postgresql.org/download/) running locally, or a free hosted Postgres database (ask the EM for the shared dev database)

Check your versions:

```bash
node -v
npm -v
git --version
```

### Clone the Repo

```bash
git clone https://github.com/CSES-Open-Source/InterviewOS.git
cd InterviewOS
```

## Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up your environment variables

Copy the example file:

```bash
cp .env.example .env
```

Then fill in the values in `.env`. Ask the EM for any keys you do not have.

| Variable                  | What it is for                                                         |
| ------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`            | Your PostgreSQL connection string                                      |
| `AUTH_SECRET`             | A random secret for login sessions (run `npx auth secret` to make one) |
| `LIVEKIT_API_KEY`         | LiveKit API key (video calls)                                          |
| `LIVEKIT_API_SECRET`      | LiveKit API secret (video calls)                                       |
| `NEXT_PUBLIC_LIVEKIT_URL` | Your LiveKit server URL                                                |

> [!WARNING]
> Never commit your `.env` file. It is already in `.gitignore`.

### 3. Set up the database

Run the database migrations:

```bash
npx prisma migrate dev
```

To view your data in the browser:

```bash
npx prisma studio
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run the linter

```bash
npm run lint
```

### Check types

```bash
npm run typecheck
```

### Build the app

Always run a build before you open a PR. This catches errors that `npm run dev` can miss.

```bash
npm run build
```

## Contributing Guidelines

### Workflow

1. Pick an issue that is assigned to you, or ask the EM for one.
2. Pull the latest `main`:
   ```bash
   git checkout main
   git pull
   ```
3. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/streak-counter
   ```
4. Make your changes and commit often.
5. Push your branch and open a pull request.
6. Fill out the PR template and tag your reviewers.
7. Message your reviewers on Slack too.

### Branch Names

Use the type of change, then a short name:

- `feat/mock-interview-room`
- `fix/login-redirect`
- `docs/update-readme`
- `chore/update-deps`

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) to keep history clean:

- `feat: add daily streak counter`
- `fix: stop video call from freezing`
- `docs: add setup steps for Prisma`
- `chore: update dependencies`

### Before You Open a PR

- [ ] Your branch is up to date with `main`
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes

GitHub Actions runs lint, typecheck, build, and a secret scan on every PR. Make sure all checks pass before asking for a merge.
- [ ] You tested your change by hand
- [ ] You added tests where it makes sense
- [ ] You added a screenshot or screen recording for UI changes

### Code Style

- Follow the existing folder structure.
- Use shadcn/ui components when one exists instead of building from scratch.
- Keep components small and reusable.
- Only use Prisma in server code. Never import it in a client component.

### Pull Requests

- Every PR needs at least **1 approval** before merging.
- Link the issue your PR closes (for example, `Closes #12`).
- Keep PRs small. One feature or fix per PR is best.

---

## Issue Labels

When opening issues or reviewing pull requests, please apply the most relevant label(s). This helps the team sort and prioritize work.

| Label              | When to Use                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| `needs:triage`     | New issue that the EM has not reviewed yet (added automatically).        |
| `bug`              | Something is broken or not working as expected.                          |
| `feature`          | A new feature that does not exist yet.                                   |
| `enhancement`      | Improving an existing feature, performance, or the developer experience. |
| `docs`             | Documentation updates, typos, or README/CONTRIBUTING changes.            |
| `refactor`         | Code cleanup that does not change behavior.                              |
| `ci`               | GitHub Actions, testing, or build pipeline issues.                       |
| `good first issue` | Small, clear tasks for new contributors.                                 |

**Tips:**

- Most issues should have **one main label**.
- If an issue touches more than one area (for example, a feature that also needs docs), you can add more than one.
- PRs should match the label of the issue they close.

## Need Help?

- Ask in the team Slack channel.
- Reach out to the EM, Yashmit, at **ybhaverisetti@ucsd.edu**.
- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
