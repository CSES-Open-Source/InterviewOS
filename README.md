# InterviewOS

An interview prep hub that turns the recruiting cycle into a game. Run live mock interviews with peers, track your practice, get resume reviews, and build your stories, all in one place. InterviewOS links out to LeetCode for coding practice instead of replacing it.

## Why InterviewOS?

Interview prep is spread across too many tools. People use LeetCode for problems, Google Docs for stories, Notion for tracking, and Zoom for mock interviews. InterviewOS connects that preparation through peer sessions, progress tracking, and saved stories. Streaks, badges, and weekly contests are planned to help students stay consistent.

The November 9 team discussion clarified that we are building a hub, not a competing LeetCode or NeetCode problem library. MVP features and the exact gamification rules still need the team's decision.

## Features

- **Live Mock Interviews:** Video and audio calls with a shared code editor and a whiteboard.
- **Progress Tracker:** Track LeetCode practice metrics, mock interview counts, and more, with links to external coding practice.
- **Gamification:** Daily streaks, mastery badges, and weekly competitions.
- **Peer Matching and Scheduling:** Get matched with a partner for mock interviews and resume reviews based on your career interests.
- **Anecdote Vault:** Save your STAR stories and project write-ups in one place.

## Tech Stack

### Frontend

- [Next.js](https://nextjs.org/) (React framework)
- [TailwindCSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) for styling and components

### Backend

- Next.js API routes
- [PostgreSQL](https://www.postgresql.org/) database
- [Prisma](https://www.prisma.io/) ORM

### Real-Time Collaboration

- [LiveKit](https://livekit.io/) (WebRTC) for video and audio
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the in-browser code editor
- [Excalidraw](https://excalidraw.com/) for the whiteboard

### Authentication

- [NextAuth.js / Auth.js](https://authjs.dev/) with UCSD SSO

## Project Status

🚧 InterviewOS is in early development. Features are being built over the 2026-27 school year.

## Getting Started

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to install, set up, and run the project locally.

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on installation, development setup, and how to submit pull requests. Please also read our [Code of Conduct](CODE_OF_CONDUCT.md).

## Contributors

- [Allghelierce](https://github.com/Allghelierce)
- [ypesok28](https://github.com/ypesok28)
- [AayaanSayyad](https://github.com/AayaanSayyad)

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For issues or questions, reach out to Yashmit (Engineering Manager) at **ybhaverisetti@ucsd.edu** or contact the UC San Diego CSES Open Source Society.
