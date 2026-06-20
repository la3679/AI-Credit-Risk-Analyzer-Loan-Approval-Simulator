import { ScrollText } from "lucide-react";
import { FeaturePage } from "../../../components/feature-page";
export default function AdminAuditLogsPage() { return <FeaturePage eyebrow="Admin · Audit logs" title="Make product changes traceable." description="Review security, model, flag, and lifecycle actions with request IDs and structured operational logging." icon={ScrollText} points={["Request-ID correlation", "Safe structured Pino logging", "Admin-only audit history"]}/>; }
