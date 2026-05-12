# AI Project Technical Specification

This file defines the technical constraints and implementation standards that AI-assisted changes must follow in this repository.

## 1. Technology Baseline

- Framework: Next.js 16 (App Router).
- Language: TypeScript.
- Styling: Tailwind CSS.
- Email provider: Resend.
- PDF generation path in active use: preview-based PDF (jsPDF + html-to-image) for user-visible parity.

## 2. Architecture (DDD + Modular)

Use and preserve this module structure:

- `src/modules/proposals/domain`
- `src/modules/proposals/application`
- `src/modules/proposals/infrastructure`
- `src/modules/proposals/composition`
- `src/modules/proposals/presentation`

Rules:

- Domain contains business rules and entities, not framework/runtime details.
- Application orchestrates use-cases and ports.
- Infrastructure provides concrete adapters for ports.
- Presentation handles React/UI concerns only.
- Composition wires dependencies.

## 3. SOLID Expectations

- Single Responsibility: avoid multi-purpose classes/hooks.
- Open/Closed: extend behavior via new adapters/services, avoid invasive changes.
- Liskov: keep interface contracts stable.
- Interface Segregation: small focused ports/interfaces.
- Dependency Inversion: depend on ports, not concrete infrastructure from use-cases.

## 4. Proposal Versioning Contract

Versioning must follow these rules:

- Persist publication state in JSON:
  - `metadata.version`
  - `metadata.lastPublishedContentHash`
  - `metadata.lastPublishedAt`
  - `publicationState.hasUnpublishedChanges`
- Any content edit sets `hasUnpublishedChanges = true`.
- Version is evaluated only on publication actions:
  - Generate PDF
  - Send Email
- Multiple edits before publish must produce only one version increment.
- Publish without changes must not increment version.

## 5. Validity and Renewal Contract

- `issueDate` is not manually editable from the form.
- Renewal action is shown only when offer is expired.
- Renewal updates `issueDate` to current date and marks unpublished changes.
- Renewal alone does not increment version until publication occurs.

## 6. Observability Minimum Standard

Use structured telemetry via:

- `src/modules/shared/infrastructure/observability/telemetry.ts`

Required event fields:

- `scope`
- `action`
- `outcome` (`success` | `rejected` | `error`)
- `proposalId` (when available)
- `version` (when available)
- `durationMs`
- `statusCode` (for API events)
- `detail` (for failure context)

At minimum, instrument:

- `POST /api/proposals/pdf`
- `POST /api/proposals/email`

## 7. Testing and Validation

Before completing changes:

- Run `npm run build`.
- Keep/adjust tests for changed behavior.
- Prefer focused updates over broad refactors.

When changing domain contracts:

- Update DTO schemas and mappers consistently.
- Ensure import/export compatibility with older JSON snapshots when feasible.

## 8. UI/UX Consistency

- Keep the preview and downloaded/sent PDF behavior aligned.
- Avoid introducing fields in editor forms that are not represented in output flows.
- Do not overload proposal header with non-essential metadata.

## 9. Security and Reliability

- Preserve rate limiting and payload guards in API routes.
- Keep email asset URLs public and non-localhost for email clients.
- Avoid storing generated PDFs persistently unless explicitly requested.

## 10. Change Management Guidelines

When implementing features:

- Favor root-cause fixes over cosmetic patches.
- Keep changes minimal and local.
- Avoid breaking public behavior without explicit migration notes.
- Update `README.md` when behavior or operational setup changes.
