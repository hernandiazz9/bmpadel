"""Catalogo de golpes de padel que el pipeline de analisis conoce."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CameraSetup:
    """Como poner el celular para que MediaPipe tenga la mejor chance de leer el golpe."""

    angle: str  # "Perfil (lateral)" | "Frontal" | "3/4 trasero"
    distance_m: str
    height: str
    fps_min: int  # fps minimo aceptable; 240 (slow-mo) siempre mejora la deteccion del impacto
    framing: str


@dataclass(frozen=True)
class Stroke:
    id: str
    label: str
    camera: CameraSetup
    key_joints: tuple[str, ...]


STROKES: tuple[Stroke, ...] = (
    Stroke(
        "bandeja", "Bandeja",
        CameraSetup("Perfil (lateral)", "3-4 m", "a la altura del hombro",
                    120, "cuerpo completo, desde antes del armado hasta el acompanamiento"),
        ("codo", "hombro", "tronco"),
    ),
    Stroke(
        "vibora", "Vibora",
        CameraSetup("Perfil (lateral)", "3-4 m", "a la altura del hombro",
                    120, "cuerpo completo, igual que bandeja"),
        ("codo", "hombro", "tronco"),
    ),
    Stroke(
        "drive", "Drive",
        CameraSetup("Perfil (lateral)", "3-4 m", "a la altura de la cadera",
                    120, "cuerpo completo incluyendo el pie de apoyo"),
        ("codo", "rodilla", "tronco"),
    ),
    Stroke(
        "reves", "Reves",
        CameraSetup("Perfil (lateral)", "3-4 m", "a la altura de la cadera",
                    120, "cuerpo completo incluyendo el pie de apoyo"),
        ("codo", "rodilla", "tronco"),
    ),
    Stroke(
        "saque", "Saque",
        CameraSetup("Frontal", "4-5 m", "a la altura del pecho",
                    120, "cuerpo completo, incluyendo el lanzamiento de la pelota y el salto"),
        ("hombro", "codo", "rodilla"),
    ),
    Stroke(
        "remate", "Remate (smash)",
        CameraSetup("3/4 trasero", "4-5 m", "a la altura de la cadera",
                    240, "cuerpo completo, dejando espacio arriba para el salto"),
        ("hombro", "codo", "tronco"),
    ),
    Stroke(
        "globo", "Globo",
        CameraSetup("Perfil (lateral)", "3-4 m", "a la altura de la cadera",
                    120, "cuerpo completo, dejando espacio arriba para el acompanamiento"),
        ("codo", "tronco", "rodilla"),
    ),
)


def get_stroke(stroke_id: str) -> Stroke:
    for stroke in STROKES:
        if stroke.id == stroke_id:
            return stroke
    raise ValueError(f"Golpe desconocido: {stroke_id}")
