import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default("mongodb://root:example@localhost:27017/credora?authSource=admin"),
  REDIS_URL: z.string().default("redis://localhost:6380"),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(32).default("development-only-secret-change-me-please"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  AI_PROVIDER: z.enum(["mock", "openai", "anthropic", "openrouter", "groq", "together", "ollama", "gemini"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-haiku-latest"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4.1-mini"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  TOGETHER_API_KEY: z.string().optional(),
  TOGETHER_MODEL: z.string().default("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  ENABLE_CROSS_SITE_CREDENTIALS: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export const env = envSchema.parse(process.env);
