import { UserRoundCog } from "lucide-react";
import { FeaturePage } from "../../../components/feature-page";
export default function AdminUsersPage() { return <FeaturePage eyebrow="Admin · Users" title="Manage access with a narrow surface." description="Review account roles, guest status, and disable access while keeping all user-owned data queries independently scoped." icon={UserRoundCog} points={["Role controls", "Guest cleanup", "Ownership enforcement"]}/>; }
