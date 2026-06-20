import { Route } from "lucide-react";
import { FeaturePage } from "../../components/feature-page";
export default function AutopilotPage() { return <FeaturePage eyebrow="What-If Autopilot" title="Find the next best simulated move." description="Generate and rank transparent improvement candidates such as lower debt, smaller requests, and better utilization—not opaque advice." icon={Route} action={{ label: "Run a simulation", href: "/analyzer" }} points={["Deterministic impact ranking", "No real financial advice", "Save outcomes into improvement plans"]}/>; }
