import mongoose from "mongoose";
import { env } from "./config";

let connection: Promise<typeof mongoose> | undefined;

export function connectDatabase() {
  connection ??= mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
  return connection;
}

export async function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}
