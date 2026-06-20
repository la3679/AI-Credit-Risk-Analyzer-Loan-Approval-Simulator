# Credora AI

Credora AI is an educational credit-risk simulator and portfolio project. It does not provide financial advice, lending decisions, credit reports, regulatory-compliant underwriting, or real-lending-data predictions. Do not enter sensitive personal information.

## Product

Credora is a premium reactive fintech SaaS demonstration for explainable risk simulations, borrower scenarios, improvement planning, portfolio analytics, AI-generated educational narratives, and queued PDF reports.

## Architecture

- `apps/web` — Next.js App Router UI with a dark, responsive fintech visual system. Same-origin `/api/*` calls are rewritten to the Express API.
- `apps/api` — Express REST API with Zod validation, OpenAPI docs, MongoDB persistence, secure cookie sessions, feature flags, and observability.
- `apps/worker` — BullMQ jobs for reports, AI narratives, portfolio snapshots, retries, and demo cleanup.
- `packages/shared` — deterministic scoring engine, Zod DTOs, domain constants, and shared API contracts.

MongoDB and Redis run through Docker Compose locally. Production targets separate Render web/API/worker services, MongoDB Atlas, Redis, and S3-compatible report storage.

## Local development

```bash
cp .env.example .env
docker compose up -d mongodb redis
npm install
npm run seed:demo
npm run dev
```

- Web: `http://localhost:3000`
- API health: `http://localhost:4010/health`
- API readiness: `http://localhost:4010/ready`
- OpenAPI: `http://localhost:4010/api/openapi.json`
- Swagger UI: `http://localhost:4010/api/docs`

Demo credentials: `analyst@credora.local` / `CredoraDemo!2026`.

Redis is published on host port `6380` to avoid collisions with other local projects; containers use `redis://redis:6379` internally.

## AI providers

The provider interface supports OpenAI, Anthropic, OpenRouter, Groq, Together AI, Ollama, optional Gemini, and an offline mock implementation. Provider choice and credentials live only in server/worker environment variables; the deterministic risk score never relies on AI.

## Safety and privacy

The scoring model accepts financial and loan fields only. It does not collect or score race, religion, ethnicity, gender, disability, marital status, national origin, or similar protected attributes. Credora makes no ECOA/FCRA-compliance claim and does not claim training on real lending data.

See [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md), [SOURCES.md](SOURCES.md), and [DEPLOYMENT.md](DEPLOYMENT.md) for implementation and operations guidance.

For a Render deployment, import `render.yaml`, configure the required environment values, and follow the [deployment promotion checklist](DEPLOYMENT.md#promotion-checklist). Render services require shared object storage before production report downloads are enabled.

The Docker production verification path is `docker compose up --build -d`, followed by `/health`, `/ready`, and a same-origin request through `http://localhost:3000/api/feature-flags`.
