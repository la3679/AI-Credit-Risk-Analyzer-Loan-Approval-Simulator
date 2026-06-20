import { ShieldCheck } from "lucide-react";
import { FeaturePage } from "../../components/feature-page";
export default function AdminPage() { return <FeaturePage eyebrow="Control center" title="Operate the simulator without hiding its logic." description="Administrators manage versioned model configurations, prompts, flags, users, reports, jobs, and audit evidence behind independent role checks." icon={ShieldCheck} points={["Role-protected endpoints", "Auditable configuration changes", "No client-side secret management"]}/>; }
