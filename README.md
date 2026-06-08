# AeroRisk AI

AeroRisk AI is a full-stack Next.js TypeScript prototype for aviation safety management decision support. It helps safety managers enter deidentified safety reports, run deterministic mock AI hazard classification, complete human review, assign SMS-style risk levels, track governance checklist completion, and review evaluation metrics.

This platform is a decision-support prototype only. It does not certify safety, does not make operational safety determinations, and does not replace qualified aviation safety professionals.

## Tech Stack

- Next.js App Router with TypeScript
- Prisma ORM
- PostgreSQL
- Deterministic mock classifier for the default prototype workflow
- Optional OpenAI Responses API for advisory report analysis
- Zod validation for structured AI output
- Vitest for domain logic tests

## Getting Started

1. Install dependencies.

   ```bash
   pnpm install
   ```

2. Create a PostgreSQL database and copy the example environment file.

   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL` in `.env`.

4. Add OpenAI configuration if you want the optional live OpenAI analysis mode.

   ```bash
   OPENAI_API_KEY="your-api-key"
   OPENAI_MODEL="gpt-4.1-mini"
   ```

5. Generate Prisma Client and run the development migration.

   ```bash
   pnpm run prisma:generate
   pnpm run prisma:migrate
   ```

6. Seed deidentified aviation safety narratives.

   ```bash
   pnpm run prisma:seed
   ```

7. Start the development server.

   ```bash
   pnpm run dev
   ```

## Prototype Workflow

- Create a report from the New Report page with a deidentified narrative.
- The app defaults to `classifySafetyReport`, a deterministic mock classifier that supports the mock-first prototype workflow.
- The New Report form can optionally run `classifyReport`, an OpenAI-backed structured-output function that accepts a deidentified narrative and returns advisory JSON.
- OpenAI responses are validated with Zod before records are saved. If validation fails, nothing is saved and the UI shows a safe error.
- Validated AI output creates advisory hazards, an AI analysis record, governance checklist entries, and audit log events.
- AI output cannot close a report or approve a risk assessment. Reports remain human-review required until a qualified reviewer records a decision.
- A human reviewer can accept, modify, reject, escalate, or close the report.
- Human decisions create review records, updated risk assessments, checklist progress, and audit log entries.

## Data Model

Prisma models are defined in `prisma/schema.prisma`:

- `Report`
- `AIAnalysis`
- `Hazard`
- `RiskAssessment`
- `HumanReview`
- `GovernanceChecklist`
- `AuditLog`

Workflow statuses are:

- `AI_DRAFT`
- `HUMAN_REVIEW_REQUIRED`
- `ACCEPTED`
- `MODIFIED`
- `REJECTED`
- `ESCALATED`
- `CLOSED`

## Evaluation Metrics

The Evaluation page summarizes prototype-only metrics from stored records:

- Reviewer agreement rate
- Modified or rejected recommendation rate
- Escalation rate
- Average turnaround from report creation to first review
- Status and hazard category distributions

These metrics are intended for capstone demonstration and workflow evaluation. They are not evidence of operational safety performance or model fitness.

## AI Output Guardrails

The optional OpenAI response must include:

- `summary`
- `possible_hazards`
- `contributing_factors`
- `sms_category`
- `severity_indicators`
- `likelihood_indicators`
- `recommended_safety_questions`
- `confidence_level`
- `explainability_note`
- `human_review_required`

Raw output, validated output, model name, response timestamp, and prompt version are stored in the audit log for valid responses only.

## Tests

Run focused tests for deterministic classification and risk scoring:

```bash
pnpm run test
```
