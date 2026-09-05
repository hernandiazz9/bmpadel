"""Manifiesto de clips organizados: que esta pendiente de analizar y que no."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

LIBRARY_FILE = Path(__file__).parent / "data" / "library.json"


@dataclass
class LibraryEntry:
    alumno: str
    golpe: str
    archivo: str  # ruta relativa a biomech/, ej "data/raw/nico/bandeja/....mp4"
    origen: str  # nombre de archivo original al filmar
    organizado_en: str
    estado: str  # "pendiente" | "analizado"


def load_library(library_file: Path = LIBRARY_FILE) -> list[LibraryEntry]:
    if not library_file.exists():
        return []
    raw = json.loads(library_file.read_text())
    return [LibraryEntry(**item) for item in raw]


def save_library(entries: list[LibraryEntry], library_file: Path = LIBRARY_FILE) -> None:
    library_file.parent.mkdir(parents=True, exist_ok=True)
    library_file.write_text(json.dumps([asdict(e) for e in entries], indent=2, ensure_ascii=False))


def mark_analizado(archivo: str, library_file: Path = LIBRARY_FILE) -> None:
    entries = load_library(library_file)
    for entry in entries:
        if entry.archivo == archivo:
            entry.estado = "analizado"
    save_library(entries, library_file)


def pending_by_alumno(entries: list[LibraryEntry]) -> dict[str, list[LibraryEntry]]:
    grouped: dict[str, list[LibraryEntry]] = {}
    for entry in entries:
        if entry.estado == "pendiente":
            grouped.setdefault(entry.alumno, []).append(entry)
    return grouped
