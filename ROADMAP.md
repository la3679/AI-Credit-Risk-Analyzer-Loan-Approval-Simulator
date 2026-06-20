# Credora AI roadmap

The implementation follows the nine conventional-commit phases in the reimagined build specification. Each accepted phase is committed with a focused Conventional Commit; changes stay on `codex/credora-rebuild` and are never pushed directly to `main`.

## Verified phase status

- **Phase 0 — Product reset and architecture:** complete. Next.js + Express + MongoDB architecture, documentation, audit, and GitHub feature branch are in place.
- **Phase 1 — Docker + MongoDB foundation:** complete. Docker MongoDB and Redis run locally; the API connects to both; `/health` and `/ready` pass; `npm run seed:demo` creates 8 profiles, 20 analyses, 6 scenarios, 4 plans, 5 reports, 1 admin, 1 user, and 1 guest session.
- **Phase 2 — Firebase removal and Mongo-backed authentication:** complete. Firebase is removed; real Docker-backed signup, authenticated analysis, normal-user admin denial, logout revocation, login, and refresh-token rotation were verified. The Next.js proxy redirects unauthenticated protected routes to login; shared frontend auth state and sign-out controls are in place.
- **Phase 3 — Reimagined reactive UI shell:** complete. The premium dark fintech shell, cinematic landing experience, public marketing pages, responsive navigation, mobile bottom navigation, loading/404 states, and reduced-motion-safe animations are in place. Visual browser review was completed by the product owner.
- **Phase 4 — Explainable risk engine v2:** complete. Inputs and model configurations are strictly validated; deterministic scoring calculates payment, DTI, risk bands, decisions, APR ranges, warnings, and factor explanations; results retain the exact model version. Eight unit tests cover formulas, boundaries, validation, factors, warnings, and Autopilot ranking.
- **Phases 5–12:** implementation work exists in varying degrees, but none are accepted until their individual runtime and test acceptance criteria have been verified.

Next: verify and complete the Risk Analyzer and Results Experience for Phase 5.
