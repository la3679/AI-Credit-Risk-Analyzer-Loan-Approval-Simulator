# Credora AI roadmap

The implementation follows the nine conventional-commit phases in the reimagined build specification. Each accepted phase is committed with a focused Conventional Commit; changes stay on `codex/credora-rebuild` and are never pushed directly to `main`.

## Verified phase status

- **Phase 0 — Product reset and architecture:** complete. Next.js + Express + MongoDB architecture, documentation, audit, and GitHub feature branch are in place.
- **Phase 1 — Docker + MongoDB foundation:** complete. Docker MongoDB and Redis run locally; the API connects to both; `/health` and `/ready` pass; `npm run seed:demo` creates 8 profiles, 20 analyses, 6 scenarios, 4 plans, 5 reports, 1 admin, 1 user, and 1 guest session.
- **Phases 2–12:** implementation work exists in varying degrees, but none are accepted until their individual runtime and test acceptance criteria have been verified.

Next: verify and complete Phase 2 authentication against the Docker-backed MongoDB database before accepting later phases.
