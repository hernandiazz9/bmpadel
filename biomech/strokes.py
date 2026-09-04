"""Catalogo de golpes de padel que el pipeline de analisis conoce."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Stroke:
    id: str
    label: str
    recommended_angle: str
    key_joints: tuple[str, ...]


STROKES: tuple[Stroke, ...] = (
    Stroke("bandeja", "Bandeja", "Perfil (lateral)", ("codo", "hombro", "tronco")),
    Stroke("vibora", "Vibora", "Perfil (lateral)", ("codo", "hombro", "tronco")),
    Stroke("drive", "Drive", "Perfil (lateral)", ("codo", "rodilla", "tronco")),
    Stroke("reves", "Reves", "Perfil (lateral)", ("codo", "rodilla", "tronco")),
    Stroke("saque", "Saque", "Frontal", ("hombro", "codo", "rodilla")),
    Stroke("remate", "Remate (smash)", "Perfil (lateral)", ("hombro", "codo", "tronco")),
    Stroke("globo", "Globo", "Perfil (lateral)", ("codo", "tronco", "rodilla")),
)


def get_stroke(stroke_id: str) -> Stroke:
    for stroke in STROKES:
        if stroke.id == stroke_id:
            return stroke
    raise ValueError(f"Golpe desconocido: {stroke_id}")
