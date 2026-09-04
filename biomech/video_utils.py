"""Helpers de lectura/escritura de video para el prototipo."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np


def read_frames(video_path: str | Path) -> tuple[list[np.ndarray], float]:
    """Lee todos los frames de un video. Devuelve (frames, fps)."""
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frames: list[np.ndarray] = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    cap.release()
    return frames, fps


def write_video(frames: list[np.ndarray], fps: float, output_path: str | Path) -> None:
    """Escribe frames (BGR, mismo tamano) a un mp4."""
    if not frames:
        return
    height, width = frames[0].shape[:2]
    # mp4v es el codec mas compatible con builds default de OpenCV;
    # si el navegador no reproduce el resultado, probar "avc1" si esta disponible.
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
    for frame in frames:
        writer.write(frame)
    writer.release()
