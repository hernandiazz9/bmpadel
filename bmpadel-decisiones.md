# BMPadel — Decisiones de arquitectura (ADR)

Salida de la sesión de grilling. Cada ADR es una decisión marcada `⚑` (cara de revertir) durante el cuestionario.

---

## ADR-001 — Qué sobrevive de la POC

**Estado:** aceptada · **Fecha:** 2026-08-16

**Contexto.** El brief pide una POC sin tests ni validaciones (§8) pero también un roadmap de producto (§11). Hay que decidir qué se invierte y qué se tira.

**Decisión.** El código de la POC es desechable. El esquema de datos (`schema.sql`) y el sistema de tokens visuales se conservan.

**Por qué.** Son las dos piezas caras de rehacer. El resto —pantallas, componentes— se puede reescribir en una tarde si el producto avanza; el modelo de datos y la identidad de marca no.

**Consecuencias.** El `schema.sql` se versiona en el repo desde el día 1, no se improvisa en el dashboard de Supabase. Los tokens de color y tipografía se declaran una sola vez y no se hardcodean en componentes.

**Cuándo se revisa.** Si el club aprueba seguir tras la demo, este ADR se reabre para decidir qué del código de POC se conserva también.

---

## ADR-002 — Cómo se enseña la demo

**Estado:** aceptada · **Fecha:** 2026-08-16

**Decisión.** Por link, con dos móviles a la vez en la sala (coach y alumno).

**Por qué.** Fuerza datos compartidos entre dispositivos: sin esto, una demo con datos en memoria local no sirve. Es la decisión que determina que hace falta backend real.

**Consecuencias.** Backend obligatorio (ver ADR-004). La carrera de la última plaza (ver reglas de dominio) pasa de teórica a real. Realtime deja de ser un "nice to have" y se convierte en el momento que vende la app.

**Cuándo se revisa.** No aplica salvo cambio de formato de la reunión.

---

## ADR-003 — Web instalable, no nativa

**Estado:** aceptada · **Fecha:** 2026-08-16

**Decisión.** Web mobile-first, instalable como PWA (manifest + service worker mínimo, sin caché offline).

**Por qué.** Cero fricción de instalación desde un link, y el brief excluye push (§8), que es el único motivo serio para ir nativo.

**Consecuencias.** `app/manifest.ts` nativo de Next.js App Router + Serwist para el service worker. En iOS basta el manifest para "Añadir a inicio"; en Android hace falta el SW para el prompt de instalación. La nav inferior necesita `padding-bottom: env(safe-area-inset-bottom)` en modo standalone.

**Cuándo se revisa.** Si se pide notificaciones push, ahí sí hace falta nativo o Web Push con permiso explícito.

---

## ADR-004 — Framework: Next.js App Router

**Estado:** aceptada · **Fecha:** 2026-08-16

**Contexto.** La app es toda cliente (no hay nada indexable ni SSR-dependiente) y necesita PWA. Vite encajaba mejor en abstracto; Next se eligió por familiaridad con fecha de reunión encima.

**Decisión.** Next.js App Router, todo en client components. Nada de server components ni route handlers salvo que surja una necesidad concreta.

**Por qué.** Velocidad de desarrollo con el stack que ya domina el autor, sin pelearse con hidratación al mezclar server/client sin necesidad real.

**Consecuencias.** El manifest usa la API nativa de Next (`app/manifest.ts`); el service worker se monta con Serwist, no con `next-pwa` (discontinuado).

**Cuándo se revisa.** Si en algún punto se necesita SEO o contenido público indexable (poco probable en esta app).

---

## ADR-005 — Base de datos: Supabase sin RLS

**Estado:** aceptada · **Fecha:** 2026-08-16

**Contexto.** Con datos compartidos entre dispositivos hace falta backend. Entre RLS activada (políticas permisivas) y desactivada, se eligió desactivada por velocidad.

**Decisión.** Supabase (Postgres + Storage + Realtime + Auth), con Row Level Security **desactivada**. Clave anónima en el cliente, acceso abierto.

**Por qué.** Es una POC con datos de demo, detrás de un link no indexado. El coste de escribir y mantener políticas no compra nada hoy.

**Consecuencias.** Cualquiera con el link y algo de curiosidad técnica puede leer o escribir en las tablas. Mitigación: `schema.sql` con script de seed versionado en el repo, para poder re-sembrar en un comando si algo se corrompe antes de una demo.

**Cuándo se revisa.** Obligatorio antes de cualquier uso más allá de la demo con datos reales de alumnos.

---

## ADR-006 — Autenticación: Google vía Supabase Auth

**Estado:** aceptada · **Fecha:** 2026-08-16

**Contexto.** El brief original pedía login por nombre sin contraseña. Con dos móviles compartiendo datos en tiempo real, un nombre en `localStorage` no identifica de forma fiable a la persona (colisiones de nombre, sin persistencia entre dispositivos).

**Decisión.** Login con Google (OAuth) vía Supabase Auth. El rol de coach se determina comparando el email autenticado contra una variable de entorno; todo el resto entra como `player`.

**Por qué.** Un `sub` de Google estable resuelve identidad sin fricción de contraseña, y de paso trae nombre y avatar reales — el roster se ve con caras de verdad en vez de iniciales sembradas.

**Consecuencias.** `user.id` es un uuid propio, **sin** foreign key a `auth.users`, para poder sembrar alumnos de demo sin cuenta real. Se añade una pantalla de onboarding (nivel) al primer login, que no estaba en el brief original — el flujo pasa de 9 a 10 pantallas.

**Cuándo se revisa.** Si el club quiere alumnos que no tengan o no quieran cuenta de Google.

---

## ADR-007 — Zona horaria fija a Australia/Perth

**Estado:** aceptada · **Fecha:** 2026-08-16

**Contexto.** El club opera en Perth (UTC+8, sin horario de verano); el desarrollo ocurre desde Alicante (UTC+1/+2). Formatear con la zona del navegador desplaza la tira de horas varias horas según quién mire el link.

**Decisión.** Toda hora se guarda en UTC (`timestamptz`) y se formatea siempre fijando `Australia/Perth`, nunca la zona del dispositivo.

**Por qué.** Es la única forma de que "hoy" y "19:00" signifiquen lo mismo en el móvil del coach en Perth y en el link abierto desde España.

**Consecuencias.** Una constante `CLUB_TZ = 'Australia/Perth'` centralizada; ningún `toLocaleString` ni `Date` nativo sin pasar por ella. El selector de día en Classes calcula "hoy" en esa zona, no en la del navegador.

**Cuándo se revisa.** Si el club abre una segunda sede fuera de Perth.

---

## ADR-008 — Última plaza: insertar y deshacer

**Estado:** aceptada · **Fecha:** 2026-08-16

**Contexto.** Con realtime y dos móviles en la sala, dos personas pueden pulsar `Book` sobre la misma última plaza casi simultáneamente.

**Decisión.** Se inserta la reserva, se recuenta contra `capacity`, y si el recuento se pasa, se borra la reserva que llegó después y se muestra `Class is full` a esa persona.

**Por qué.** Evita el único escenario que podría avergonzar en una demo en vivo, sin necesitar un constraint de base de datos ni lógica de bloqueo.

**Consecuencias.** Existe una ventana breve donde la capacidad puede leerse temporalmente en 5/4 antes de corregirse; aceptable para el volumen de esta demo.

**Cuándo se revisa.** Si el volumen de reservas simultáneas crece, mover la comprobación a un constraint o función de base de datos.

---

## ADR-009 — Componentes: shadcn/ui completo, retematizado

**Estado:** aceptada · **Fecha:** 2026-08-16

**Contexto.** El brief pide identidad visual propia y shadcn/ui tiene un aspecto reconocible por defecto. Se sopesó construir a mano, pero el ahorro de tiempo (slider de nivel, Sheet, Dialog, toast) pesó más.

**Decisión.** shadcn/ui completo, pero retematizado antes de construir la primera pantalla: variables CSS mapeadas a los tokens del brief (`court`, `deep`, `glass`, `line`, `ball`, `clay`), radio a 20px, sombras a cero, tipografías del brief cargadas en el stack.

**Por qué.** Sin este paso previo, la app corre el riesgo de verse como cualquier otra hecha con IA — justo lo que el criterio de "listo" del §9 quiere evitar.

**Consecuencias.** Media hora de configuración de tema obligatoria en la Rebanada 1, no opcional ni pospuesta.

**Cuándo se revisa.** No aplica.

---

## ADR-010 — Nivel del jugador: escala decimal continua

**Estado:** aceptada · **Fecha:** 2026-08-16

**Decisión.** Nivel de jugador como decimal 1.0–7.0 (estilo Playtomic), elegido con un slider de paso 0.5 y etiqueta descriptiva en el onboarding. Nivel de clase como rango mín–máx sobre la misma escala. Reservar fuera del rango de nivel de una clase está permitido, con aviso suave.

**Por qué.** Se lee como un marcador junto a la hora en IBM Plex Mono, coherente con la identidad visual. El rango en vez de valor único permite clases mixtas sin fingir precisión que no existe sin el histórico de partidos de Playtomic.

**Consecuencias.** Sin integración con Playtomic, el nivel inicial lo autoevalúa el propio alumno — puede no ser preciso. Trece etiquetas descriptivas que traducir/redactar en inglés para el slider.

**Cuándo se revisa.** Si se conecta con Playtomic (ADR fuera de alcance de esta POC), el nivel inicial podría importarse en vez de autoevaluarse.

---

## Índice de reversibles aceptadas sin ADR propio

Decisiones `○` cerradas con la recomendación, sin discusión — documentadas en `CONTEXT.md` y la spec, no aquí: React Query con staleTime 30s, IDs uuid, pnpm + Node 22, proyecto único (no monorepo), commits por rebanada, RLS con seed versionado como mitigación, Lucide para iconos, sin modo oscuro, sin reset de demo, capacidad/precio prerrellenados por tipo de clase, `court` como lista fija, borrar sí/editar no en clases y posts, like como toggle, sin histórico en Me.
