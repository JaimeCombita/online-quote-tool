# Propuestas PDF

Aplicacion serverless para crear propuestas comerciales y generar PDF.

## Estado actual

Fase 1 inicializada con Opcion A:

- Sin base de datos.
- Borradores en almacenamiento local del navegador.
- Arquitectura base orientada a DDD y SOLID.
- Identidad visual alineada con JC Engine usando design tokens centralizados.

## Branding corporativo

La configuracion de marca esta centralizada en `src/modules/shared/branding/brand.config.ts`.

Assets esperados en `public/brand`:

- `logo.png`
- `logo-optimizado.png`
- `favicon-32x32.png`
- `logonew.png`

Si en el futuro cambia la identidad visual, basta actualizar esos archivos y/o el archivo `brand.config.ts`.

## Stack tecnico

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Estructura base

La organizacion principal esta en src/modules/proposals:

- domain: entidades y contratos del dominio.
- application: casos de uso y puertos.
- infrastructure: adaptadores (localStorage, reloj del sistema, generador de id).
- composition: ensamblado de dependencias.
- presentation: componentes de interfaz del modulo.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Siguiente alcance

1. Editor incremental de secciones.
2. Validaciones de contrato funcional.
3. Motor de PDF serverless (on-demand, sin persistencia en navegador).
4. Envio de PDF por email.

## Politica de PDF

- El PDF se genera bajo demanda en `POST /api/proposals/pdf`.
- No se guarda en localStorage ni en base de datos.
- Cada solicitud genera un archivo nuevo en tiempo real y se descarga directamente.

## Envio de PDF por email

- Endpoint: `POST /api/proposals/email`.
- El PDF se genera bajo demanda al momento de enviar y se adjunta al correo.
- No se persiste ninguna copia del PDF en el navegador o almacenamiento local.

Variables de entorno requeridas:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (opcional, por defecto `JC Engine <onboarding@resend.dev>`)
