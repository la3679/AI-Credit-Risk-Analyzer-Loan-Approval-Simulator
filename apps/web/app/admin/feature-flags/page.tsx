import { ToggleLeft } from "lucide-react";
import { FeaturePage } from "../../../components/feature-page";
export default function AdminFlagsPage() { return <FeaturePage eyebrow="Admin · Feature flags" title="Release capability deliberately." description="Control AI memos, PDF reports, demo mode, model editing, portfolio analytics, and OpenAI use through server-enforced flags." icon={ToggleLeft} points={["Mongo-backed flags", "Audit events on edits", "Server-side enforcement"]}/>; }
