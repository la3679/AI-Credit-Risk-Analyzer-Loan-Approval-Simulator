import { Users } from "lucide-react";
import { FeaturePage } from "../../components/feature-page";
export default function ProfilesPage() { return <FeaturePage eyebrow="Borrower profiles" title="Keep structured, privacy-safe simulation baselines." description="Save and revisit permitted financial inputs without collecting real credit reports or sensitive identity data." icon={Users} action={{ label: "Create analysis", href: "/analyzer" }} points={["Owner-scoped profiles", "Tags and anonymized baselines", "Timeline-ready analysis history"]}/>; }
