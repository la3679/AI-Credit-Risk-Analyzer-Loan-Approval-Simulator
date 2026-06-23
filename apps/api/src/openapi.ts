import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { apiErrorSchema, financialInputSchema, loginSchema, riskAnalysisResultSchema, signupSchema } from "@credora/shared";
import { z } from "zod";
extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();
const error = apiErrorSchema.openapi("ApiError");
registry.registerPath({ method: "post", path: "/api/auth/signup", summary: "Create an account", request: { body: { content: { "application/json": { schema: signupSchema } } } }, responses: { 201: { description: "Authenticated user" }, 400: { description: "Validation error", content: { "application/json": { schema: error } } } } });
registry.registerPath({ method: "post", path: "/api/auth/login", summary: "Sign in", request: { body: { content: { "application/json": { schema: loginSchema } } } }, responses: { 200: { description: "Authenticated user" }, 401: { description: "Invalid credentials", content: { "application/json": { schema: error } } } } });
registry.registerPath({ method: "post", path: "/api/risk/analyze", summary: "Run a deterministic simulator analysis", security: [{ cookieAuth: [] }], request: { body: { content: { "application/json": { schema: financialInputSchema } } } }, responses: { 201: { description: "Created analysis", content: { "application/json": { schema: riskAnalysisResultSchema } } }, 400: { description: "Validation error", content: { "application/json": { schema: error } } } } });
registry.registerPath({ method: "post", path: "/api/ai/underwriting-memo", summary: "Queue an educational AI narrative for a saved simulation", security: [{ cookieAuth: [] }], request: { body: { content: { "application/json": { schema: z.object({ analysisId: z.string(), regenerate: z.boolean().optional() }) } } } }, responses: { 202: { description: "Memo job queued" }, 403: { description: "AI narratives disabled", content: { "application/json": { schema: error } } }, 404: { description: "Analysis not found", content: { "application/json": { schema: error } } } } });
registry.registerPath({ method: "get", path: "/api/ai/underwriting-memo/{analysisId}", summary: "Read the owned memo lifecycle state", security: [{ cookieAuth: [] }], request: { params: z.object({ analysisId: z.string() }) }, responses: { 200: { description: "Memo lifecycle state" }, 404: { description: "Analysis not found", content: { "application/json": { schema: error } } } } });

export const openApiDocument = new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: "3.0.3", info: { title: "Credora AI API", version: "1.0.0", description: "Educational credit-risk simulator API. Not a lending or underwriting system." }, servers: [{ url: "/" }] });
openApiDocument.components ??= {};
openApiDocument.components.securitySchemes = { cookieAuth: { type: "apiKey", in: "cookie", name: "credora_access" } };
