import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./config";

export const QUEUES = { reports: "reports", ai: "ai", portfolio: "portfolio", maintenance: "maintenance" } as const;
let redis: IORedis | undefined;
export function getRedis() {
  redis ??= new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return redis;
}
let queues: Record<keyof typeof QUEUES, Queue> | undefined;
export function getQueues() {
  queues ??= Object.fromEntries(Object.entries(QUEUES).map(([key, name]) => [key, new Queue(name, { connection: { url: env.REDIS_URL }, defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2_000 }, removeOnComplete: 100, removeOnFail: 500 } })])) as Record<keyof typeof QUEUES, Queue>;
  return queues;
}
