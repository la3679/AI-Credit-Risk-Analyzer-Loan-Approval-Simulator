import mongoose, { InferSchemaType } from "mongoose";
import { featureFlagKeys, reportStatusSchema, userRoleSchema } from "@credora/shared";

const timestamps = { timestamps: true } as const;
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: userRoleSchema.options, default: "user", index: true },
  isGuest: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, index: { expires: 0 } },
  disabledAt: Date,
}, timestamps);
export const User = mongoose.models.User || mongoose.model("User", userSchema);

const sessionSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true },
  csrfToken: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  userAgent: String,
  ipHash: String,
}, timestamps);
export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

const featureFlagSchema = new mongoose.Schema({
  key: { type: String, enum: featureFlagKeys, unique: true },
  enabled: { type: Boolean, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, timestamps);
export const FeatureFlag = mongoose.models.FeatureFlag || mongoose.model("FeatureFlag", featureFlagSchema);

const riskModelSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true, index: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, timestamps);
export const RiskModel = mongoose.models.RiskModel || mongoose.model("RiskModel", riskModelSchema);

const profileSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  displayName: { type: String, required: true },
  anonymized: { type: Boolean, default: true },
  baselineFinancials: { type: mongoose.Schema.Types.Mixed, required: true },
  tags: { type: [String], default: [] },
  notes: String,
}, timestamps);
profileSchema.index({ ownerId: 1, updatedAt: -1 });
export const BorrowerProfile = mongoose.models.BorrowerProfile || mongoose.model("BorrowerProfile", profileSchema);

const analysisSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: "BorrowerProfile" },
  input: { type: mongoose.Schema.Types.Mixed, required: true },
  derived: { type: mongoose.Schema.Types.Mixed, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  explanation: { type: mongoose.Schema.Types.Mixed, required: true },
  aiMemo: String,
}, { timestamps: { createdAt: true, updatedAt: false } });
analysisSchema.index({ ownerId: 1, createdAt: -1 });
export const RiskAnalysis = mongoose.models.RiskAnalysis || mongoose.model("RiskAnalysis", analysisSchema);

const scenarioSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  baseAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAnalysis" },
  inputs: mongoose.Schema.Types.Mixed,
  resultSnapshot: mongoose.Schema.Types.Mixed,
  comparisonGroup: String,
}, timestamps);
scenarioSchema.index({ ownerId: 1, updatedAt: -1 });
export const LoanScenario = mongoose.models.LoanScenario || mongoose.model("LoanScenario", scenarioSchema);

const improvementPlanSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAnalysis", required: true },
  title: String,
  items: [{ title: String, description: String, priority: String, estimatedImpact: Number, completed: Boolean }],
}, timestamps);
export const ImprovementPlan = mongoose.models.ImprovementPlan || mongoose.model("ImprovementPlan", improvementPlanSchema);

const portfolioSnapshotSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  summary: mongoose.Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });
export const PortfolioSnapshot = mongoose.models.PortfolioSnapshot || mongoose.model("PortfolioSnapshot", portfolioSnapshotSchema);

const aiPromptTemplateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  version: { type: Number, required: true, default: 1 },
  content: { type: String, required: true },
  active: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, timestamps);
export const AIPromptTemplate = mongoose.models.AIPromptTemplate || mongoose.model("AIPromptTemplate", aiPromptTemplateSchema);

const reportSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAnalysis" },
  type: { type: String, default: "risk_report" },
  title: { type: String, required: true },
  status: { type: String, enum: reportStatusSchema.options, default: "queued", index: true },
  jobId: String,
  pdfUrl: String,
  contentMarkdown: String,
  error: { code: String, message: String },
  expiresAt: Date,
  deletedAt: Date,
}, timestamps);
reportSchema.index({ ownerId: 1, createdAt: -1 });
export const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

const auditLogSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  action: { type: String, required: true },
  entityType: String,
  entityId: String,
  metadata: mongoose.Schema.Types.Mixed,
  requestId: String,
}, { timestamps: { createdAt: true, updatedAt: false } });
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export type UserDocument = InferSchemaType<typeof userSchema>;
