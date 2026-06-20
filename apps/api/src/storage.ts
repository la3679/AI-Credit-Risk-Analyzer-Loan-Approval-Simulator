import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const configuredStorage = process.env.REPORT_STORAGE_DIR;
export const reportStorageDir = configuredStorage
  ? path.isAbsolute(configuredStorage) ? configuredStorage : path.resolve(workspaceRoot, configuredStorage)
  : path.join(workspaceRoot, "storage", "reports");
