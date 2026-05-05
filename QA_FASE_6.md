# Fase 6 - QA

Fecha de inicio: 2026-05-05

## Objetivo
Validar estabilidad funcional y no regresiones despues de Fase 5 (seguridad), incluyendo editor, preview, PDF, email e import/export.

## Estado general
En progreso.

## Evidencia automatizada
- [x] Lint ejecutado sin errores.
- [x] Build de produccion ejecutado sin errores.

Comando usado:
- `npm run lint ; npm run build`

Resultado:
- Compilacion correcta.
- Rutas API construidas: `/api/proposals/email`, `/api/proposals/pdf`.
- Nota de ejecucion en Windows: se detecto un bloqueo temporal EPERM en `.next` durante una corrida; el reintento de `npm run build` finalizo correctamente.

## Matriz QA - Funcional
### Dashboard
- [ ] Crear propuesta nueva.
- [ ] Editar propuesta existente.
- [ ] Eliminar propuesta.
- [ ] Exportar JSON individual.
- [ ] Exportar JSON masivo.
- [ ] Importar JSON valido.
- [ ] Importar JSON invalido (debe mostrar error controlado).
- [ ] Guardar configuracion global de empresa.

### Editor
- [ ] Guardado automatico/estado de cambios.
- [ ] Validaciones obligatorias en espanol.
- [ ] Secciones: mover, ocultar, eliminar, menu de acciones.
- [ ] Tabla de inversion editable.
- [ ] Bullets editables.
- [ ] Loader bloqueante en acciones de espera.

### Preview y PDF
- [ ] Preview consistente visualmente.
- [ ] Generacion de PDF por screenshot sin recortes.
- [ ] Rechazo por vigencia expirada (regla de negocio).

### Email
- [ ] Envio con PDF adjunto valido.
- [ ] Error controlado con email invalido.
- [ ] Error controlado si faltan variables de entorno.

## Matriz QA - Seguridad (Fase 5)
### Rate limit
- [x] `/api/proposals/email` responde 429 al superar limite.
- [x] `/api/proposals/pdf` responde 429 al superar limite.
- [x] Header `Retry-After` presente en 429.

### Payload guard
- [x] `/api/proposals/email` responde 413 cuando `content-length` excede limite.
- [x] `/api/proposals/pdf` responde 413 cuando `content-length` excede limite.

### Evidencia de ejecucion (2026-05-05)
- Email rate limit: intentos 1-6 devolvieron 400 (payload invalido esperado), intento 7 devolvio 429.
- Email 429 headers: `retry-after` presente, junto con `x-ratelimit-remaining: 0`.
- PDF rate limit: intentos 1-20 devolvieron 400 (payload invalido esperado), intento 21 devolvio 429.
- PDF 429 headers: `retry-after` presente, junto con `x-ratelimit-remaining: 0`.
- Payload grande email: estado 413.
- Payload grande PDF: estado 413.

## Riesgos y notas
- El rate limit actual es en memoria de instancia; en despliegues serverless multi-instancia no es un limite global distribuido.
- Para hardening posterior, evaluar storage centralizado (Redis/KV) y observabilidad de eventos de bloqueo.

## Siguiente iteracion QA
1. Ejecutar pruebas manuales guiadas en local.
2. Ejecutar smoke test en Vercel con variables de entorno productivas.
3. Consolidar resultados y defectos encontrados.
