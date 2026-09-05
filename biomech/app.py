"""Laboratorio de analisis biomecanico: elegir golpe, subir clip, ver metricas.

Correr con: streamlit run app.py
"""
from __future__ import annotations

import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import streamlit as st

from pose_analysis import AnalysisResult, analyze_video
from strokes import STROKES, get_stroke
from video_utils import read_frames, write_video

DATA_DIR = Path(__file__).parent / "data"
VIDEOS_DIR = DATA_DIR / "videos"
DATA_DIR.mkdir(exist_ok=True)
VIDEOS_DIR.mkdir(exist_ok=True)
HISTORY_FILE = DATA_DIR / "history.json"

st.set_page_config(page_title="BMPadel - Analisis biomecanico", layout="wide")
st.title("Laboratorio de analisis biomecanico")

with st.sidebar:
    st.header("1. Elegi el golpe")
    stroke_id = st.selectbox(
        "Golpe",
        options=[s.id for s in STROKES],
        format_func=lambda sid: get_stroke(sid).label,
    )
    stroke = get_stroke(stroke_id)
    with st.expander("Como poner la camara para este golpe", expanded=True):
        camera = stroke.camera
        st.markdown(
            f"- **Angulo:** {camera.angle}\n"
            f"- **Distancia:** {camera.distance_m}\n"
            f"- **Altura:** {camera.height}\n"
            f"- **FPS minimo:** {camera.fps_min} (240 slow-mo si el telefono lo permite)\n"
            f"- **Encuadre:** {camera.framing}"
        )

    dominant_side = st.radio(
        "Mano dominante del jugador",
        options=["right", "left"],
        format_func=lambda s: "Derecha" if s == "right" else "Izquierda",
    )
    alumno = st.text_input("Alumno (opcional)")

    st.header("2. Subi el clip")
    uploaded = st.file_uploader("Video (mp4/mov, 10-15s, de perfil)", type=["mp4", "mov", "m4v"])
    run = st.button("Analizar", disabled=uploaded is None)

if uploaded is not None and run:
    with tempfile.TemporaryDirectory() as tmp_dir:
        input_path = Path(tmp_dir) / uploaded.name
        input_path.write_bytes(uploaded.getvalue())

        with st.spinner("Detectando pose y calculando metricas..."):
            frames, fps = read_frames(input_path)
            if not frames:
                st.error("No se pudo leer el video.")
                st.stop()

            result = analyze_video(frames, fps, dominant_side=dominant_side)

            output_path = Path(tmp_dir) / "anotado.mp4"
            write_video(result.annotated_frames, fps, output_path)
            video_bytes = output_path.read_bytes()

    # Se guarda en session_state para que sobreviva al rerender que dispara
    # el boton "Guardar en el historial" mas abajo.
    st.session_state["analysis"] = {
        "video_bytes": video_bytes,
        "result": result,
        "stroke": stroke,
        "dominant_side": dominant_side,
        "alumno": alumno,
        "fps": fps,
    }

if "analysis" in st.session_state:
    data: dict[str, Any] = st.session_state["analysis"]
    result: AnalysisResult = data["result"]
    summary = result.summary()

    st.subheader("Video anotado")
    st.video(data["video_bytes"])

    st.subheader("Resumen en el momento del impacto")
    cols = st.columns(4)
    cols[0].metric("Frame de impacto", summary.get("frame_impacto", "-"))
    elbow = summary.get("angulo_codo_impacto")
    cols[1].metric("Angulo de codo", f"{elbow:.1f}°" if elbow is not None else "-")
    trunk = summary.get("inclinacion_tronco_impacto")
    cols[2].metric("Inclinacion de tronco", f"{trunk:.1f}°" if trunk is not None else "-")
    speed = summary.get("velocidad_pico_muneca")
    cols[3].metric("Velocidad pico de muneca", f"{speed:.0f} px/s" if speed is not None else "-")

    st.subheader("Evolucion de angulos durante el golpe")
    fig, ax = plt.subplots()
    frame_indices = [f.frame_index for f in result.frames]
    ax.plot(frame_indices, [f.elbow_angle for f in result.frames], label="Codo")
    ax.plot(frame_indices, [f.knee_angle for f in result.frames], label="Rodilla")
    ax.plot(frame_indices, [f.trunk_lean for f in result.frames], label="Inclinacion tronco")
    if result.impact_frame is not None:
        ax.axvline(result.impact_frame, color="red", linestyle="--", label="Impacto")
    ax.set_xlabel("Frame")
    ax.set_ylabel("Grados")
    ax.legend()
    st.pyplot(fig)

    if st.button("Guardar en el historial"):
        timestamp = datetime.now(timezone.utc)
        video_filename = f"{timestamp.strftime('%Y%m%dT%H%M%S')}_{data['stroke'].id}.mp4"
        video_path = VIDEOS_DIR / video_filename
        video_path.write_bytes(data["video_bytes"])

        entry = {
            "timestamp": timestamp.isoformat(),
            "alumno": data["alumno"] or None,
            "golpe": data["stroke"].id,
            "mano_dominante": data["dominant_side"],
            "fps": data["fps"],
            "video": f"videos/{video_filename}",
            **summary,
        }
        history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []
        history.append(entry)
        HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False))
        st.success(f"Guardado ({video_filename}).")
