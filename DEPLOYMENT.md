# Deployment

Deploy `web`, `api`, and `worker` as separate Docker services on Render. Set `API_ORIGIN` on the web service to the API service's internal Render URL so Next.js rewrites browser `/api/*` requests cleanly. Configure `WEB_ORIGIN` on the API with the public web URL, and set `COOKIE_SECURE=true`.

Use MongoDB Atlas, a managed Redis-compatible service, and S3-compatible storage for reports. Set every secret through the hosting provider; never commit `.env` files. Run `npm run build`, health/readiness checks, and the test suite before promotion.
