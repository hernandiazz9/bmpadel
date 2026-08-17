# BMPadel — Spec por rebanadas

Cinco rebanadas verticales, cada una demostrable por sí sola. Orden fijado: shell → Classes → reservar → muro → media.

Antes de la Rebanada 1: `schema.sql` versionado, script de seed (1 coach, 8 alumnos, 12 clases, 5 posts, estados deliberados), retema de shadcn a los tokens del brief.

---

## Rebanada 1 — Shell

**Incluye:** login con Google, onboarding de nivel al primer login, nav inferior de 3 pestañas (Wall · Classes · Me), retema completo de shadcn, manifest + service worker PWA.

**Criterio de aceptación:** entrar con Google, elegir nivel en el slider si es la primera vez, ver la nav de 3 pestañas con los tokens de color y las tres fuentes cargadas, e instalar la app desde el navegador.

---

## Rebanada 2 — Classes (lectura)

**Incluye:** selector de día horizontal (hoy + 13 días), tira de horas del día seleccionado leyendo clases sembradas, prototipo estático de la tira ya validado y llevado a componente real.

**Criterio de aceptación:** ver el día entero de un vistazo, con clases llenas apagadas a gris y la próxima clase con hueco marcada en `ball`.

---

## Rebanada 3 — Reservar

**Incluye:** detalle de clase, roster con avatares, `Book` / `Cancel booking`, lógica de última plaza (insertar → recontar → deshacer si sobra), realtime en roster.

**Criterio de aceptación:** desde dos móviles a la vez, reservar en uno y ver aparecer la reserva en el roster del otro sin recargar; si se llena, `Full` con botón desactivado.

---

## Rebanada 4 — Muro

**Incluye:** feed cronológico, detalle de post con comentarios, like como toggle, comentar y borrar comentario propio, realtime en el muro.

**Criterio de aceptación:** publicar (como coach) y ver el post aparecer en el otro móvil sin recargar; dar like y comentar desde el móvil de alumno.

---

## Rebanada 5 — Publicar y crear

**Incluye:** New post (texto + imagen/vídeo con subida real y campo de URL de escape), New class (con capacidad/precio prerrellenados por tipo), Me (próximas reservas del alumno; clases abiertas si es coach).

**Criterio de aceptación (= criterio de "listo" del brief, §9):** en un móvil, entrar como coach, abrir tres clases de la semana, publicar un vídeo, cambiar a un alumno, reservar una de esas clases, comentar el vídeo, y el coach ve al alumno en el roster.

---

## Después de las 5 rebanadas

- Prototipo del ratio de media en el feed (foto vs. vídeo vertical), si no se resolvió antes de la Rebanada 4.
- Verificar el rebote de 140ms al publicar en un móvil real.
- Cuestionario aparte al club: precios reales en AUD, nombre/foto/nivel del coach real, nombres y franjas horarias de las pistas.
