# Credora AI roadmap

## Phase 12 delivery status

Phase 12 is complete. Desktop and mobile Playwright smoke tests cover the public disclosure, demo-session handoff, and seeded-account login against the Dockerized web, API, worker, MongoDB, and Redis stack. Final lint, unit, production-build, and browser checks pass. README, architecture, source references, screenshot-capture guidance, deployment runbooks, and the Render Blueprint document local and production operation.

Next: product-owner visual review of the remaining marked workspace/admin screens, then Render environment provisioning and release promotion.

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

**Phase 8 — Portfolio, reports, and administration:** implementation complete; awaiting visual/responsive acceptance. Portfolio Intelligence now captures owner-scoped BullMQ snapshots and visualizes history; Report Studio queues reports from saved analyses and exposes their lifecycle; the central admin console operates flags, model activation, prompt edits, users, queues, reports, and audit evidence. Report storage is now resolved consistently by API and worker. Docker verification confirmed snapshot persistence, queued PDF completion, authenticated download (HTTP 200), and a structurally valid PDF with its title and simulator disclaimer. Poppler is unavailable in this environment, so raster PDF visual inspection remains for local/browser QA.

**Phase 9 — Verification and delivery:** implementation complete; technical acceptance passed. Added Docker build hygiene, production API/worker start commands, a Next standalone web command, shared report-path resolution for relative environment values, a Render Blueprint, and expanded API/deployment/runbook documentation. Full Docker verification passed: API `/health` and `/ready` returned 200; the browser-facing `/api/feature-flags` rewrite returned 200; an authenticated user completed login → analysis → queued report → worker completion → 200 PDF download through the web origin. Render provisioning and durable shared object storage remain external deployment configuration steps.

Next: final product-owner review and Render environment provisioning.

**Phase 10 — Report Studio and PDF exports:** implementation complete; awaiting visual acceptance. Added the pollable `/reports/[id]` preview, report type/model-version metadata, downloadable branded export sections, and report-history links. A fresh Docker-backed report completed as `executive_summary`; structural PDF verification confirmed its model version, simulation summary, and simulator disclaimer. Raster PDF visual inspection remains unavailable here because Poppler is not installed.

Next: begin Phase 11 — Admin Control Center.

**Phase 11 — Admin Control Center:** implementation complete; awaiting visual acceptance. The admin operations surface now manages model versions, prompt versions, provider status, feature flags, users, demo-data cleanup, and audit evidence. Added dedicated provider, demo-data, and reports admin URLs. API verification confirmed prompt creation, provider status, demo-cleanup job queueing, and the resulting audit log event; model creation is enforced by the shared risk-model schema.

Next: begin Phase 12 — Testing, documentation, polish, and deployment.
