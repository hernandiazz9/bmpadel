# BMPadel — CONTEXT.md

Glosario del dominio y reglas invariantes. Se referencia desde `CLAUDE.md`; el agente de código lo lee antes de tocar cualquier pantalla.

## Vocabulario

- **wall** — el feed cronológico de posts del coach. No "feed", no "muro" en código aunque la UI lo llame Wall.
- **class / class session** — una sesión de clase concreta (`class_session` en el esquema). No "session" a secas (ambiguo con sesión de auth).
- **slot** — un hueco de plaza libre dentro de una clase. `capacity - bookings.length`.
- **strip** (tira de horas) — la columna mono con la lista de clases del día seleccionado, elemento de firma visual.
- **roster** — la lista de inscritos de una clase concreta. No "attendee list", no "participants".
- **coach** — único rol con permiso de publicar posts y abrir clases. Determinado por email fijo en variable de entorno, no por un campo editable.
- **player** — alumno. Rol por defecto para cualquier email que no sea el del coach.
- **level** — decimal 1.0–7.0 estilo Playtomic. En jugador es un valor; en clase es un rango `level_min`–`level_max`.
- **CLUB_TZ** — constante `'Australia/Perth'`. Toda hora mostrada al usuario pasa por ella, sin excepción.

## Reglas invariantes (no se re-preguntan, no se rompen sin nuevo ADR)

1. Todo `starts_at` se guarda en UTC y se formatea siempre con `CLUB_TZ`.
2. `ball` (amarillo-verde) es el color más saturado de la app y aparece como máximo dos veces por pantalla. En Classes, solo la próxima clase con hueco lo lleva; el resto de contadores usan `clay`.
3. Ancho máximo 480px, mobile-first, sin layout de escritorio.
4. Sin `any` en TypeScript. Tipos de dominio centralizados.
5. Textos de interfaz nunca hardcodeados en JSX — siempre desde el módulo de strings (inglés).
6. Sin tests, sin validación de formularios más allá de campos requeridos del navegador, sin manejo de errores más allá de no romper la pantalla.
7. RLS desactivada en Supabase — deliberado, ver ADR-005. No "arreglar" activándola sin discutirlo.
8. `user.id` no lleva FK a `auth.users` — permite alumnos sembrados sin cuenta real.
9. No instalar librerías nuevas fuera de las ya decididas sin preguntar antes.
10. No tocar los tokens de color/tipografía sin pasar por un ADR nuevo.

## Stack cerrado

Next.js App Router (todo client components) · Supabase (Postgres + Storage + Realtime + Auth con Google) · React Query · Tailwind v4 con tokens en `@theme` · shadcn/ui completo, retematizado · Serwist para el service worker · pnpm + Node 22 LTS · Vercel.

## Modelo de datos (resumen — ver `schema.sql` para el detalle)

```
user        id (uuid, sin FK a auth.users), name, avatar_url, role, level, created_at
class_session  id, coach_id, title, type, level_min, level_max, starts_at (UTC),
               duration_min, court, capacity, price, notes, created_at
booking     id, session_id, user_id, created_at
post        id, author_id, body, media_url, media_type, created_at
like        post_id, user_id
comment     id, post_id, user_id, body, created_at
```

Plazas restantes = `capacity − count(bookings)`. Última plaza: insertar → recontar → deshacer si sobra (ADR-008).

## Fuera de alcance en esta POC

Pagos, eventos y rotaciones tipo Roo Jump, torneos, Junior Academy, KPIs, inventario, integración Playtomic, notificaciones push, multiidioma, tests, recuperación de contraseña, roles más allá de coach/player, panel de administración, reset de demo.
