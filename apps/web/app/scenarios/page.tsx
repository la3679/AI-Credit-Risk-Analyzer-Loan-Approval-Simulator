import { GitCompareArrows } from "lucide-react";
import { FeaturePage } from "../../components/feature-page";
export default function ScenariosPage() { return <FeaturePage eyebrow="Scenario Lab" title="Make the “what if” visible." description="Compare loan amounts, terms, debt levels, and credit-health improvements with a deliberate animated comparison experience." icon={GitCompareArrows} action={{ label: "Build a scenario", href: "/analyzer" }} points={["Owner-scoped scenario CRUD", "Approval, DTI, payment, and APR deltas", "Queue AI scenario summaries when enabled"]}/>; }
