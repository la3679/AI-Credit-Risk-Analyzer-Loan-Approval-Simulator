# Credora AI roadmap

The implementation follows the nine conventional-commit phases in the reimagined build specification. Each accepted phase is committed with a focused Conventional Commit; changes stay on `codex/credora-rebuild` and are never pushed directly to `main`.

## Verified phase status

- **Phase 0 — Product reset and architecture:** complete. Next.js + Express + MongoDB architecture, documentation, audit, and GitHub feature branch are in place.
- **Phase 1 — Docker + MongoDB foundation:** complete. Docker MongoDB and Redis run locally; the API connects to both; `/health` and `/ready` pass; `npm run seed:demo` creates 8 profiles, 20 analyses, 6 scenarios, 4 plans, 5 reports, 1 admin, 1 user, and 1 guest session.
- **Phase 2 — Firebase removal and Mongo-backed authentication:** complete. Firebase is removed; real Docker-backed signup, authenticated analysis, normal-user admin denial, logout revocation, login, and refresh-token rotation were verified. The Next.js proxy redirects unauthenticated protected routes to login; shared frontend auth state and sign-out controls are in place.
- **Phase 3 — Reimagined reactive UI shell:** complete. The premium dark fintech shell, cinematic landing experience, public marketing pages, responsive navigation, mobile bottom navigation, loading/404 states, and reduced-motion-safe animations are in place. Visual browser review was completed by the product owner.
- **Phase 4 — Explainable risk engine v2:** complete. Inputs and model configurations are strictly validated; deterministic scoring calculates payment, DTI, risk bands, decisions, APR ranges, warnings, and factor explanations; results retain the exact model version. Eight unit tests cover formulas, boundaries, validation, factors, warnings, and Autopilot ranking.
- **Phases 5–12:** implementation work exists in varying degrees, but none are accepted until their individual runtime and test acceptance criteria have been verified.

**Phase 5 — Risk analyzer and results experience:** implementation complete; awaiting visual/responsive acceptance. A three-step, mobile-friendly analyzer validates permitted financial inputs before saving an analysis. The animated results experience includes a risk gauge, approval signal, DTI, payment, APR, affordability, factor waterfall, warnings, Autopilot candidates, and actions for scenarios, memos, and reports. Production build, unit tests, and a live authenticated Docker MongoDB/Redis create/retrieve/invalid-input flow passed; visual QA remains with the product owner because browser automation is unavailable in this environment.

**Phase 6 — Queued, provider-agnostic AI narratives:** implementation complete; awaiting visual/responsive acceptance. The AI worker now persists memo lifecycle states, job IDs, provider/fallback metadata, errors, and generated timestamps. The result view polls queued work and presents safe, bounded narrative states. Approved prompt templates are retrieved by the worker, and mock, OpenAI, Anthropic, OpenRouter, Groq, Together, Ollama, and Gemini adapters remain available behind the provider contract. Live Docker verification confirmed `queued → completed` with the mock provider and simulator disclaimer; `enable_ai_memos` denied queueing with a server-side 403 when disabled.

**Phase 7 — Profiles, scenarios, and improvement plans:** implementation complete; awaiting visual/responsive acceptance. Profiles now expose privacy-safe create/read/update/delete controls, saved results create owner-scoped scenarios, Scenario Lab adds animated comparison and removal, and improvement plans are generated from deterministic Autopilot candidates with durable per-item completion tracking. A live Docker API flow verified profile editing, scenario comparison, plan generation, completion updates, and cross-user 404 isolation.

Next: complete visual/responsive acceptance for Phase 7, then begin Phase 8.
