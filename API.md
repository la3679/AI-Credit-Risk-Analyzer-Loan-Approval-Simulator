# Credora REST API

All JSON errors follow `{ "error": { "code", "message", "requestId", "details?" } }`. Browser calls use same-origin `/api/*` rewrites, HTTP-only cookies, `SameSite=Lax`, and the `X-CSRF-Token` header for credentialed mutations.

## Auth and system

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/me`
- `POST /api/demo/session`
- `GET /health`, `GET /ready`, `GET /metrics`, `GET /api/openapi.json`, `GET /api/docs`
- `GET /api/feature-flags`; admin: `PATCH /api/admin/feature-flags/:key`

## Borrowers, analysis, and loan simulation

- `GET|POST /api/profiles`, `GET|PATCH|DELETE /api/profiles/:id`
- `POST /api/risk/analyze`, `POST /api/risk/autopilot`, `GET /api/risk/analyses`, `GET /api/risk/analyses/:id`
- `POST /api/loans/simulate`, `POST /api/loans/payment-estimate`, `POST /api/loans/apr-estimate`

## Scenario and improvement workspace

- `GET|POST /api/scenarios`, `GET|PATCH|DELETE /api/scenarios/:id`, `POST /api/scenarios/compare`
- `GET|POST /api/improvement-plans`, `GET|PATCH|DELETE /api/improvement-plans/:id`, `PATCH /api/improvement-plans/:id/items/:itemId`, `POST /api/improvement-plans/from-autopilot`
- `POST /api/ai/underwriting-memo`, `POST /api/ai/borrower-explanation`, `POST /api/ai/improvement-plan`, `POST /api/ai/scenario-summary`, `POST /api/ai/portfolio-insights`

## Reports and portfolio

- `GET|POST /api/reports`, `GET|DELETE /api/reports/:id`, `GET /api/reports/:id/download` (creation supports `risk_report` and `executive_summary` types and persists the source model version)
- `GET /api/portfolio/summary`, `GET /api/portfolio/risk-distribution`, `GET /api/portfolio/alerts`, `GET /api/portfolio/snapshots`, `POST /api/portfolio/snapshot`

Reports transition through `queued`, `processing`, `completed`, `failed`, `expired`, and `deleted`. Creation and AI/portfolio work return `202 Accepted` with a BullMQ job ID.

## Admin

- `GET /api/admin/overview`, `GET|PATCH /api/admin/users/:id`
- `GET|POST /api/admin/risk-model-configs`, `PATCH /api/admin/risk-model-configs/:id/activate`
- `GET|POST /api/admin/ai-prompts`, `PATCH /api/admin/ai-prompts/:id`, `GET /api/admin/ai-providers`
- `GET /api/admin/reports`, `GET /api/admin/jobs`, `GET /api/admin/audit-logs`

All non-admin resource reads and writes include `ownerId` in their MongoDB filters. Admin endpoints have independent role checks.
