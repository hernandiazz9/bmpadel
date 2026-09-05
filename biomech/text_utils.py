"""Normalizacion de texto compartida: nombres de alumnos y golpes en archivos."""
from __future__ import annotations

import re

_ACCENTS = {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n"}


def strip_accents(text: str) -> str:
    for accented, plain in _ACCENTS.items():
        text = text.replace(accented, plain)
    return text


def slugify(text: str) -> str:
    """Convierte texto libre (nombre de alumno) a un slug estable para carpetas/archivos."""
    normalized = strip_accents(text.strip().lower())
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return slug or "sin-nombre"
