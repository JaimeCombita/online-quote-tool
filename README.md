# Propuestas PDF

Aplicación para crear propuestas comerciales, versionarlas por publicación y enviarlas por email con PDF adjunto.

## Objetivo funcional

- Editar propuestas en un flujo por tabs.
- Generar PDF visualmente consistente con el preview.
- Enviar propuesta por email con ese mismo PDF adjunto.
- Versionar solo cuando se publica (PDF o email), no por cada edición intermedia.

## Arquitectura

El proyecto sigue una organización modular con enfoque DDD:

- `domain`: entidades, reglas de negocio, contratos.
- `application`: casos de uso, DTOs, puertos.
- `infrastructure`: adaptadores concretos (browser storage, seguridad, PDF, email, observabilidad).
- `composition`: wiring de dependencias.
- `presentation`: UI y hooks de interacción.

Principios aplicados:

- SRP: cada capa se enfoca en una responsabilidad concreta.
- OCP/DIP: casos de uso dependen de puertos, no de implementaciones concretas.
- Separación clara entre reglas de dominio y detalles de framework.

## Stack técnico

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Resend (email)
- jsPDF + html-to-image (PDF desde preview para descarga/email)

## Reglas de versión y vigencia

- La fecha de emisión no se edita manualmente.
- Si la propuesta está vencida, aparece botón `Renovar propuesta`.
- Renovar actualiza `issueDate` a la fecha actual y deja cambios pendientes de publicación.
- El estado `publicationState.hasUnpublishedChanges` se persiste en el JSON.
- La versión solo se evalúa al publicar (`Generar PDF` o `Enviar email`).
- Si hay cambios pendientes y el contenido publicado cambió, la versión incrementa una sola vez.
- Si no hay cambios, publicar no incrementa versión.

## Observabilidad mínima

Se implementó telemetría estructurada en stdout/stderr:

- Utilidad: `src/modules/shared/infrastructure/observability/telemetry.ts`
- Formato: JSON con `scope`, `action`, `outcome`, `proposalId`, `version`, `statusCode`, `durationMs`, `detail`.
- Flujos instrumentados:
	- `POST /api/proposals/pdf` (`generate-pdf`)
	- `POST /api/proposals/email` (`send-email`)
- Outcomes registrados: `success`, `rejected`, `error`.

## Endpoints

- `POST /api/proposals/pdf`: genera PDF bajo demanda.
- `POST /api/proposals/email`: envía correo con PDF adjunto.
- `POST /api/proposals/wp`: prepara enlace de WhatsApp.

## Variables de entorno

Requeridas:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Opcionales relevantes:

- `NEXT_PUBLIC_BASE_URL`
- `PUBLIC_APP_BASE_URL`
- `EMAIL_PAYLOAD_MAX_BYTES`
- `RATE_LIMIT_EMAIL_MAX_REQUESTS`
- `RATE_LIMIT_EMAIL_WINDOW_MS`
- `RATE_LIMIT_PDF_MAX_REQUESTS`
- `RATE_LIMIT_PDF_WINDOW_MS`
- `PDF_PAYLOAD_MAX_BYTES`

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Branding

Config central: `src/modules/shared/branding/brand.config.ts`.

Assets esperados en `public/brand`:

- `logo.png`
- `logo-optimizado.png`
- `favicon-32x32.png`
- `logonew.png`
