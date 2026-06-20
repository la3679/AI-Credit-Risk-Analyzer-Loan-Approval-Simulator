import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const reportStorageDir = path.resolve(process.env.REPORT_STORAGE_DIR ?? path.join(workspaceRoot, "storage", "reports"));
