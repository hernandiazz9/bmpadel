"""Ordena clips filmados en el celular a partir del nombre de archivo.

Convencion al filmar: renombrar cada clip como "<alumno>-<golpe>" antes de
pasarlo a la compu (ej: "nico-bandeja.mov", "flor-drive-2.mp4"). El alumno va
sin guiones ni espacios (usar "anamaria", no "ana-maria"); el golpe tiene que
ser reconocible por strokes.resolve_stroke_id (bandeja, vibora, drive, reves,
saque/servicio, remate/smash, globo/lob).

Los que no matchean ese patron se mueven a "sin_clasificar/" dentro de la
carpeta de origen, para renombrarlos a mano y volver a correr el script.

Uso:
    python organize_clips.py                    # data/incoming -> data/raw
    python organize_clips.py --source ~/Downloads
"""
from __future__ import annotations

import argparse
import re
import shutil
from datetime import datetime
from pathlib import Path

from library import LIBRARY_FILE, LibraryEntry, load_library, save_library
from strokes import resolve_stroke_id
from text_utils import slugify

VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v"}
NAME_PATTERN = re.compile(r"^(?P<alumno>[^\W_]+)[-_](?P<golpe>[^\W\d_]+)")

BASE_DIR = Path(__file__).parent
DEFAULT_SOURCE = BASE_DIR / "data" / "incoming"
DEFAULT_RAW_DIR = BASE_DIR / "data" / "raw"


def _library_path(dest_path: Path) -> str:
    """Ruta a guardar en library.json: relativa a biomech/ cuando se puede, absoluta si no."""
    try:
        return str(dest_path.relative_to(BASE_DIR))
    except ValueError:
        return str(dest_path.resolve())


def parse_filename(stem: str) -> tuple[str, str] | None:
    match = NAME_PATTERN.match(stem)
    if match is None:
        return None
    golpe_id = resolve_stroke_id(match.group("golpe"))
    if golpe_id is None:
        return None
    return slugify(match.group("alumno")), golpe_id


def organize(source: Path, raw_dir: Path, library_file: Path) -> tuple[int, int]:
    raw_dir.mkdir(parents=True, exist_ok=True)
    unclassified_dir = source / "sin_clasificar"

    library = load_library(library_file)
    organized = 0
    skipped = 0

    for clip in sorted(source.iterdir()):
        if not clip.is_file() or clip.suffix.lower() not in VIDEO_EXTENSIONS:
            continue

        parsed = parse_filename(clip.stem)
        if parsed is None:
            unclassified_dir.mkdir(exist_ok=True)
            shutil.move(str(clip), str(unclassified_dir / clip.name))
            print(f"[sin clasificar] {clip.name} -> revisar nombre, se movio a sin_clasificar/")
            skipped += 1
            continue

        alumno, golpe = parsed
        captured_at = datetime.fromtimestamp(clip.stat().st_mtime)
        dest_dir = raw_dir / alumno / golpe
        dest_dir.mkdir(parents=True, exist_ok=True)

        base_name = f"{captured_at.strftime('%Y%m%dT%H%M%S')}__{alumno}__{golpe}"
        dest_path = dest_dir / f"{base_name}{clip.suffix.lower()}"
        counter = 1
        while dest_path.exists():
            dest_path = dest_dir / f"{base_name}_{counter}{clip.suffix.lower()}"
            counter += 1

        shutil.move(str(clip), str(dest_path))
        library_path = _library_path(dest_path)
        library.append(
            LibraryEntry(
                alumno=alumno,
                golpe=golpe,
                archivo=library_path,
                origen=clip.name,
                organizado_en=datetime.now().isoformat(),
                estado="pendiente",
            )
        )
        print(f"[ok] {clip.name} -> {library_path}")
        organized += 1

    save_library(library, library_file)
    return organized, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--raw-dir", type=Path, default=DEFAULT_RAW_DIR)
    parser.add_argument("--library-file", type=Path, default=LIBRARY_FILE)
    args = parser.parse_args()

    args.source.mkdir(parents=True, exist_ok=True)
    organized, skipped = organize(args.source, args.raw_dir, args.library_file)
    print(f"\n{organized} clip(s) organizados, {skipped} sin clasificar.")


if __name__ == "__main__":
    main()
