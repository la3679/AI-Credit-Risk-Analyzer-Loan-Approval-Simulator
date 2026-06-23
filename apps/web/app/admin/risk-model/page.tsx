import { SlidersHorizontal } from "lucide-react";
import { FeaturePage } from "../../../components/feature-page";
export default function AdminRiskModelPage() { return <FeaturePage eyebrow="Admin · Risk model" title="Version every deterministic model change." description="Create configuration versions, compare their weights, and activate one deliberate version at a time." icon={SlidersHorizontal} points={["Versioned model configs", "Admin-only activation", "Every analysis retains its model version"]}/>; }
