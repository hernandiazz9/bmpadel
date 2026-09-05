# Laboratorio de analisis biomecanico (prototipo)

Esto es un experimento aislado del resto de `bmpadel` (que es Next.js/TypeScript).
Vive en Python porque las librerias de pose estimation (MediaPipe) son las mas
maduras ahi. Objetivo: subir un clip corto de un golpe y ver que metricas se
pueden sacar automaticamente, antes de pensar en escalar a club.

`organize_clips.py` no depende de mediapipe/opencv/streamlit (solo libreria
estandar de Python), asi que ese si esta probado con archivos de prueba. El
resto (pose estimation, la app de Streamlit) esta escrito pero sin correr:
el sandbox donde se escribio tiene bloqueado el acceso a PyPI. Puede necesitar
ajustes al primer intento local.

## El orden completo (celular -> compu -> analisis)

1. **Filmar.** Elegis el golpe en la app (o mirás `strokes.py`) para saber
   como poner la camara, y grabas el clip con el celular.
2. **Nombrar el clip en el celular** como `alumno-golpe` antes de pasarlo a la
   compu (ej: `nico-bandeja.mov`, `flor-drive-2.mp4`). El alumno va sin
   guiones ni espacios (`anamaria`, no `ana-maria`); el golpe tiene que ser
   reconocible (bandeja, vibora, drive, reves, saque/servicio, remate/smash,
   globo/lob — ver alias en `strokes.resolve_stroke_id`).
3. **Pasar los clips a la compu** (cable, AirDrop, Drive) dentro de
   `biomech/data/incoming/`.
4. **Ordenar:** `python organize_clips.py`. Mueve cada clip a
   `data/raw/<alumno>/<golpe>/` con un nombre canonico con fecha, y anota todo
   en `data/library.json` como "pendiente". Lo que no matchea el patron de
   nombre queda en `data/incoming/sin_clasificar/` para renombrar a mano.
5. **Analizar:** `streamlit run app.py`, modo "Analizar un golpe", origen
   "Biblioteca organizada". Elegis alumno y clip (ya vienen con golpe y
   camara asociados), apretas "Analizar" y despues "Guardar en el historial".
   Eso marca el clip como "analizado" en la biblioteca, guarda el video
   anotado en `data/annotated/<alumno>/<golpe>/` y agrega una fila a
   `data/history.json`.
6. **Ver progreso:** mismo `app.py`, modo "Ver progreso". Elegis alumno y
   golpe y ves como evolucionaron las metricas guardadas sesion a sesion.

Para un video suelto que no pasó por el paso 2-4 (una prueba rapida), el modo
"Analizar un golpe" tambien tiene origen "Subir un archivo": pedís golpe y
alumno a mano y segui igual.

## Instalar

```bash
cd biomech
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Que calcula hoy

- Angulo de codo (hombro-codo-muneca) frame a frame.
- Angulo de rodilla (cadera-rodilla-tobillo).
- Inclinacion de tronco respecto a la vertical.
- Rotacion de linea de hombros (referencia, ver limitacion abajo).
- Velocidad de la muneca (para detectar el frame de impacto).
- Resumen de esas metricas en el frame de impacto.
- Video anotado con el esqueleto de MediaPipe superpuesto.
- Evolucion de esas metricas a lo largo de las sesiones guardadas por alumno.

## Limitaciones conocidas

- **Todo es 2D.** Los angulos son fiables en el plano que mira la camara. Un
  golpe de padel gira hacia la camara, asi que la rotacion cadera-hombro en
  particular va a ser poco fiable con una sola camara lateral.
- **Sin calibracion de escala.** La velocidad de muneca queda en pixeles por
  segundo, no metros por segundo.
- **La pala no se detecta.** Solo se sigue el cuerpo; la pala puede tapar la
  muneca en el impacto.
- **Deteccion de impacto es un proxy simple**: el frame de velocidad maxima de
  muneca. Puede fallar si el jugador hace un gesto brusco antes del golpe real.
- **El nombre del archivo es la unica fuente de verdad** para alumno/golpe en
  `organize_clips.py`. Si el coach se equivoca al nombrar, el clip queda mal
  clasificado (no hay forma de corregirlo dentro de la app todavia, hay que
  mover el archivo a mano y editar `data/library.json`).
- Usa `mediapipe.solutions.pose` (API clasica). Si mediapipe la deprecó del
  todo en la version que se instale, migrar a la Tasks API
  (`mediapipe.tasks.python.vision.PoseLandmarker`).

## Proximos pasos sugeridos

1. Probar con un video real (celular, de perfil, luz decente) y ver si
   MediaPipe detecta bien los puntos durante todo el swing.
2. Mirar los graficos de angulos con el coach: preguntar cuales le sirven y
   cuales no.
3. Probar el mismo clip a distinto fps (30 vs slow-mo 240) y comparar
   estabilidad de los angulos.
4. Si falla por oclusion de la pala o perfiles muy cerrados, evaluar
   ViTPose/MMPose en vez de MediaPipe.
5. Si esto valida bien, decidir si "alumnos" y "progreso" siguen viviendo
   como pantallas de este laboratorio en Python, o si pasan a ser parte de
   la app real (`bmpadel`, Next.js) que ya tiene su propio modelo de alumnos.

## Datos locales

Toda la carpeta `data/` esta ignorada por git excepto `data/incoming/.gitkeep`
(para que la carpeta exista al clonar). Es informacion del coach, no del repo:

- `data/incoming/` — clips recien pasados del celular, esperando `organize_clips.py`.
- `data/raw/<alumno>/<golpe>/` — clips ya organizados, listos para analizar.
- `data/library.json` — que clip esta pendiente y cual ya se analizo.
- `data/annotated/<alumno>/<golpe>/` — videos con el esqueleto superpuesto, ya analizados.
- `data/history.json` — metricas de cada analisis guardado, para la pantalla de progreso.
