# Deployment

`render.yaml` defines separate Docker services for `web`, `api`, and `worker`. Import the repository as a Render Blueprint, then supply every `sync: false` environment value in the Render dashboard. Do not place secrets in the Blueprint or repository.

## Required configuration

| Service | Required values |
| --- | --- |
| Web | `API_ORIGIN` set to the API service's internal Render URL. Browser traffic stays same-origin through Next.js `/api/*` rewrites. |
| API | `MONGODB_URI`, `REDIS_URL`, `WEB_ORIGIN`, generated `JWT_ACCESS_SECRET`, `COOKIE_SECURE=true`, and any enabled provider credentials. |
| Worker | The same `MONGODB_URI` and `REDIS_URL`, selected `AI_PROVIDER`, matching provider credentials, and report-storage configuration. |

Use MongoDB Atlas and a managed Redis-compatible service. After deployment, verify `GET /health`, `GET /ready`, `GET /api/openapi.json`, and authenticated report/memo queues.

## Report storage

Docker Compose uses a shared named volume at `/app/storage/reports`, so API downloads and worker generation share one local path. Render services do not share a filesystem; for a durable production rollout, connect the report artifact layer to shared S3-compatible storage before enabling production report downloads. Do not rely on ephemeral local disks for report retention.

## Promotion checklist

1. Run `npm run lint`, `npm run test`, and `npm run build`.
2. Start Docker services and pass `/health` plus `/ready`.
3. Seed only non-production environments with `npm run seed:demo`.
4. Confirm `COOKIE_SECURE=true`, production origins, secret rotation, and feature-flag defaults.
5. Verify a normal user cannot read another user's resource and cannot access `/api/admin/*`.
6. Queue a mock-provider memo, portfolio snapshot, and report; confirm their terminal states and report download.

## Docker verification evidence

The local production image check builds all three services, starts the API and worker with their production commands, and starts the web service with Next.js standalone output. The web proxy is verified with `GET http://localhost:3000/api/feature-flags`; a full authenticated flow then creates an analysis, queues a report, waits for `completed`, and downloads the PDF through the web origin.
