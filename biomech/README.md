# Laboratorio de analisis biomecanico (prototipo)

Esto es un experimento aislado del resto de `bmpadel` (que es Next.js/TypeScript).
Vive en Python porque las librerias de pose estimation (MediaPipe) son las mas
maduras ahi. Objetivo: subir un clip corto de un golpe y ver que metricas se
pueden sacar automaticamente, antes de pensar en escalar a club.

No se pudo instalar ni probar en el sandbox remoto (bloqueo de red a PyPI),
asi que este codigo esta escrito pero sin correr. Puede necesitar ajustes al
primer intento local.

## Instalar

```bash
cd biomech
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Correr

```bash
streamlit run app.py
```

Abre una pagina local. Flujo: elegis el golpe (bandeja, drive, etc.) y la app
te muestra como poner la camara para ese golpe en particular (angulo,
distancia, altura, fps minimo, encuadre); subis un clip siguiendo esa guia y
apretas "Analizar".

## Que calcula hoy

- Angulo de codo (hombro-codo-muneca) frame a frame.
- Angulo de rodilla (cadera-rodilla-tobillo).
- Inclinacion de tronco respecto a la vertical.
- Rotacion de linea de hombros (referencia, ver limitacion abajo).
- Velocidad de la muneca (para detectar el frame de impacto).
- Resumen de esas metricas en el frame de impacto.
- Video anotado con el esqueleto de MediaPipe superpuesto.

## Limitaciones conocidas

- **Todo es 2D.** Los angulos son fiables en el plano que mira la camara. Un
  golpe de padel gira hacia la camara, asi que la rotacion cadera-hombro en
  particular va a ser poco fiable con una sola camara lateral.
- **Sin calibracion de escala.** La velocidad de muneca queda en pixeles por
  segundo, no metros por segundo.
- **La pala no se detecta.** Solo se seguye el cuerpo; la pala puede tapar la
  muneca en el impacto.
- **Deteccion de impacto es un proxy simple**: el frame de velocidad maxima de
  muneca. Puede fallar si el jugador hace un gesto brusco antes del golpe real.
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

## Historial

"Guardar en el historial" escribe una fila en `data/history.json` con las
metricas del impacto y copia el video anotado a `data/videos/`. Toda la
carpeta `data/` esta ignorada por git: es data local del coach, no del repo.
