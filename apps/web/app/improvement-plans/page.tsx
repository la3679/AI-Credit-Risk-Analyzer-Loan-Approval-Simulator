import { ListChecks } from "lucide-react";
import { FeaturePage } from "../../components/feature-page";
export default function ImprovementPlansPage() { return <FeaturePage eyebrow="Improvement plans" title="Turn simulated insights into trackable steps." description="Prioritize scenario changes, record completion, and ask the configured narrative provider to explain the modelled impact." icon={ListChecks} action={{ label: "Analyze a baseline", href: "/analyzer" }} points={["Prioritized, estimated impacts", "Completion tracking", "Optional asynchronous explanation"]}/>; }
