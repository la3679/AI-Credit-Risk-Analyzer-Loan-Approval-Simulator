import { Settings } from "lucide-react";
import { FeaturePage } from "../../components/feature-page";
export default function SettingsPage() { return <FeaturePage eyebrow="Settings" title="Make the workspace yours." description="Manage theme, default currency, reduced-motion preferences, and account session controls without compromising the simulator boundaries." icon={Settings} points={["Reduced-motion preference", "Secure rotating sessions", "No sensitive financial identifiers"]}/>; }
