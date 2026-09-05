"""Laboratorio de analisis biomecanico: elegir golpe, subir clip, ver metricas.

Correr con: streamlit run app.py
"""
from __future__ import annotations

import json
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import streamlit as st

from library import LibraryEntry, load_library, mark_analizado, pending_by_alumno
from pose_analysis import AnalysisResult, analyze_video
from strokes import STROKES, Stroke, get_stroke
from text_utils import slugify
from video_utils import read_frames, write_video

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
ANNOTATED_DIR = DATA_DIR / "annotated"
DATA_DIR.mkdir(exist_ok=True)
ANNOTATED_DIR.mkdir(exist_ok=True)
HISTORY_FILE = DATA_DIR / "history.json"

METRIC_LABELS: dict[str, str] = {
    "angulo_codo_impacto": "Angulo de codo",
    "angulo_rodilla_impacto": "Angulo de rodilla",
    "inclinacion_tronco_impacto": "Inclinacion de tronco",
    "velocidad_pico_muneca": "Velocidad pico de muneca",
}


@dataclass
class SelectedClip:
    path: Path | None  # None cuando viene de una subida manual (bytes aun no escritos a disco)
    stroke: Stroke
    alumno_slug: str
    origen: str
    library_entry: LibraryEntry | None


def resolve_library_path(archivo: str) -> Path:
    path = Path(archivo)
    return path if path.is_absolute() else BASE_DIR / path


def render_camera_guide(stroke: Stroke, expanded: bool) -> None:
    with st.expander("Como poner la camara para este golpe", expanded=expanded):
        camera = stroke.camera
        st.markdown(
            f"- **Angulo:** {camera.angle}\n"
            f"- **Distancia:** {camera.distance_m}\n"
            f"- **Altura:** {camera.height}\n"
            f"- **FPS minimo:** {camera.fps_min} (240 slow-mo si el telefono lo permite)\n"
            f"- **Encuadre:** {camera.framing}"
        )


def pick_from_library() -> SelectedClip | None:
    pending = pending_by_alumno(load_library())
    if not pending:
        st.info(
            "No hay clips pendientes en la biblioteca. Filma con el celular, nombra cada "
            "clip \"alumno-golpe\" (ej: nico-bandeja.mov), pasalos a `data/incoming/` y "
            "corre `python organize_clips.py`."
        )
        return None

    alumno_slug = st.selectbox(
        "Alumno",
        options=sorted(pending.keys()),
        format_func=lambda a: f"{a} ({len(pending[a])} pendiente(s))",
    )
    entries = pending[alumno_slug]
    entry = st.selectbox(
        "Clip",
        options=entries,
        format_func=lambda e: f"{get_stroke(e.golpe).label} - {e.organizado_en[:16]}",
    )
    stroke = get_stroke(entry.golpe)
    render_camera_guide(stroke, expanded=False)
    return SelectedClip(
        path=resolve_library_path(entry.archivo),
        stroke=stroke,
        alumno_slug=alumno_slug,
        origen=entry.origen,
        library_entry=entry,
    )


def pick_from_upload() -> tuple[SelectedClip | None, bytes | None]:
    stroke_id = st.selectbox(
        "Golpe",
        options=[s.id for s in STROKES],
        format_func=lambda sid: get_stroke(sid).label,
    )
    stroke = get_stroke(stroke_id)
    render_camera_guide(stroke, expanded=True)

    alumno_input = st.text_input("Alumno")
    uploaded = st.file_uploader("Video (mp4/mov, 10-15s)", type=["mp4", "mov", "m4v"])
    if uploaded is None:
        return None, None

    alumno_slug = slugify(alumno_input) if alumno_input else "sin-alumno"
    selected = SelectedClip(
        path=None,
        stroke=stroke,
        alumno_slug=alumno_slug,
        origen=uploaded.name,
        library_entry=None,
    )
    return selected, uploaded.getvalue()


st.set_page_config(page_title="BMPadel - Analisis biomecanico", layout="wide")
st.title("Laboratorio de analisis biomecanico")

with st.sidebar:
    modo = st.radio("Modo", ["Analizar un golpe", "Ver progreso"])

if modo == "Ver progreso":
    st.header("Progreso por alumno")
    history: list[dict[str, Any]] = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []
    if not history:
        st.info("Todavia no hay analisis guardados.")
    else:
        alumnos = sorted({entry.get("alumno") for entry in history if entry.get("alumno")})
        if not alumnos:
            st.info("Los analisis guardados no tienen alumno asociado.")
        else:
            alumno = st.selectbox("Alumno", options=alumnos)
            golpes_alumno = sorted({e["golpe"] for e in history if e.get("alumno") == alumno})
            golpe = st.selectbox("Golpe", options=golpes_alumno, format_func=lambda g: get_stroke(g).label)

            sesiones = sorted(
                (e for e in history if e.get("alumno") == alumno and e.get("golpe") == golpe),
                key=lambda e: e["timestamp"],
            )
            st.caption(f"{len(sesiones)} sesion(es) analizada(s)")

            fig, ax = plt.subplots()
            x = list(range(1, len(sesiones) + 1))
            for metric_key, label in METRIC_LABELS.items():
                values = [s.get(metric_key) for s in sesiones]
                if any(v is not None for v in values):
                    ax.plot(x, values, marker="o", label=label)
            ax.set_xlabel("Sesion")
            ax.set_ylabel("Valor")
            ax.legend()
            st.pyplot(fig)

else:
    with st.sidebar:
        st.header("1. Elegi el clip")
        origen = st.radio("Origen", ["Biblioteca organizada", "Subir un archivo"])

        upload_bytes: bytes | None = None
        if origen == "Biblioteca organizada":
            selected = pick_from_library()
        else:
            selected, upload_bytes = pick_from_upload()

        dominant_side = st.radio(
            "Mano dominante del jugador",
            options=["right", "left"],
            format_func=lambda s: "Derecha" if s == "right" else "Izquierda",
        )

        run = st.button("Analizar", disabled=selected is None)

    if selected is not None and run:
        with tempfile.TemporaryDirectory() as tmp_dir:
            if selected.path is None:
                input_path = Path(tmp_dir) / selected.origen
                input_path.write_bytes(upload_bytes or b"")
            else:
                input_path = selected.path

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
            "selected": selected,
            "dominant_side": dominant_side,
            "fps": fps,
        }

    if "analysis" in st.session_state:
        data: dict[str, Any] = st.session_state["analysis"]
        result: AnalysisResult = data["result"]
        selected: SelectedClip = data["selected"]
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
            dest_dir = ANNOTATED_DIR / selected.alumno_slug / selected.stroke.id
            dest_dir.mkdir(parents=True, exist_ok=True)
            video_filename = f"{timestamp.strftime('%Y%m%dT%H%M%S')}__{selected.alumno_slug}__{selected.stroke.id}.mp4"
            (dest_dir / video_filename).write_bytes(data["video_bytes"])

            entry = {
                "timestamp": timestamp.isoformat(),
                "alumno": selected.alumno_slug,
                "golpe": selected.stroke.id,
                "mano_dominante": data["dominant_side"],
                "fps": data["fps"],
                "video": str((dest_dir / video_filename).relative_to(BASE_DIR)),
                **summary,
            }
            history = json.loads(HISTORY_FILE.read_text()) if HISTORY_FILE.exists() else []
            history.append(entry)
            HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False))

            if selected.library_entry is not None:
                mark_analizado(selected.library_entry.archivo)

            st.success(f"Guardado ({video_filename}).")
