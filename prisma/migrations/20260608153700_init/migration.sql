-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('AI_DRAFT', 'HUMAN_REVIEW_REQUIRED', 'ACCEPTED', 'MODIFIED', 'REJECTED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'HAZARDOUS', 'CATASTROPHIC');

-- CreateEnum
CREATE TYPE "Likelihood" AS ENUM ('RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'FREQUENT');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXTREME');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('ACCEPTED', 'MODIFIED', 'REJECTED', 'ESCALATED', 'CLOSED');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "phaseOfFlight" TEXT NOT NULL,
    "reporterRole" TEXT NOT NULL,
    "tags" TEXT[],
    "status" "WorkflowStatus" NOT NULL DEFAULT 'AI_DRAFT',
    "assignedReviewer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "recommendedStatus" "WorkflowStatus" NOT NULL,
    "recommendedSeverity" "Severity" NOT NULL,
    "recommendedLikelihood" "Likelihood" NOT NULL,
    "recommendedRiskLevel" "RiskLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hazard" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "likelihood" "Likelihood" NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "likelihood" "Likelihood" NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "score" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanReview" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comments" TEXT NOT NULL,
    "adjustedSeverity" "Severity",
    "adjustedLikelihood" "Likelihood",
    "adjustedRiskLevel" "RiskLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HumanReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceChecklist" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "deidentified" BOOLEAN NOT NULL DEFAULT false,
    "rationaleReviewed" BOOLEAN NOT NULL DEFAULT false,
    "humanDecisionRecorded" BOOLEAN NOT NULL DEFAULT false,
    "riskOwnerAssigned" BOOLEAN NOT NULL DEFAULT false,
    "escalationChecked" BOOLEAN NOT NULL DEFAULT false,
    "limitationsAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GovernanceChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "fromStatus" "WorkflowStatus",
    "toStatus" "WorkflowStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIAnalysis_reportId_key" ON "AIAnalysis"("reportId");
CREATE UNIQUE INDEX "GovernanceChecklist_reportId_key" ON "GovernanceChecklist"("reportId");

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Hazard" ADD CONSTRAINT "Hazard_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GovernanceChecklist" ADD CONSTRAINT "GovernanceChecklist_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
