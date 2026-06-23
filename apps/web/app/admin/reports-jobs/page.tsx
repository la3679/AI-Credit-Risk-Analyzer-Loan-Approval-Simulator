import { ListRestart } from "lucide-react";
import { FeaturePage } from "../../../components/feature-page";
export default function AdminReportsJobsPage() { return <FeaturePage eyebrow="Admin · Reports and jobs" title="See every asynchronous state." description="Inspect queued, processing, completed, failed, expired, and deleted reports alongside retryable worker jobs." icon={ListRestart} points={["BullMQ retry policy", "Report lifecycle visibility", "No silent job failures"]}/>; }
