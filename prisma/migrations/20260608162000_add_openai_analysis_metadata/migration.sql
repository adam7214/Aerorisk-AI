-- Add structured OpenAI analysis metadata without changing existing required fields.
ALTER TABLE "AIAnalysis"
ADD COLUMN "promptVersion" TEXT,
ADD COLUMN "rawOutput" JSONB,
ADD COLUMN "validatedOutput" JSONB;

ALTER TABLE "AuditLog"
ADD COLUMN "modelName" TEXT,
ADD COLUMN "promptVersion" TEXT,
ADD COLUMN "rawAiOutput" JSONB,
ADD COLUMN "validatedAiOutput" JSONB,
ADD COLUMN "aiResponseTimestamp" TIMESTAMP(3);
