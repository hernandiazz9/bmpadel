"""Estimacion de pose (MediaPipe) + metricas biomecanicas de un clip de un golpe.

Limitacion conocida: los angulos se calculan sobre la proyeccion 2D de la
camara. Son fiables para flexion/extension en el plano que mira la camara
(ideal: perfil para codo/rodilla/tronco) pero distorsionan rotaciones que
ocurren hacia/desde la camara (p. ej. rotacion de cadera-hombro en un swing).
La velocidad de muneca queda en pixeles/segundo porque no hay calibracion de
escala real todavia.
"""
from __future__ import annotations

from dataclasses import dataclass

import cv2
import mediapipe as mp
import numpy as np
from scipy.signal import savgol_filter

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Indices de landmarks de MediaPipe Pose (33 puntos).
LANDMARKS: dict[str, int] = {
    "left_shoulder": 11, "right_shoulder": 12,
    "left_elbow": 13, "right_elbow": 14,
    "left_wrist": 15, "right_wrist": 16,
    "left_hip": 23, "right_hip": 24,
    "left_knee": 25, "right_knee": 26,
    "left_ankle": 27, "right_ankle": 28,
}

Side = str  # "left" | "right"
Point = np.ndarray
FrameLandmarks = dict[str, Point]


@dataclass
class FrameMetrics:
    frame_index: int
    elbow_angle: float | None
    knee_angle: float | None
    trunk_lean: float | None
    shoulder_rotation: float | None
    wrist_speed: float | None


@dataclass
class AnalysisResult:
    fps: float
    frames: list[FrameMetrics]
    impact_frame: int | None
    annotated_frames: list[np.ndarray]

    def summary(self) -> dict[str, float | int | None]:
        if self.impact_frame is None:
            return {}
        impact = self.frames[self.impact_frame]
        speeds = [f.wrist_speed for f in self.frames if f.wrist_speed is not None]
        return {
            "frame_impacto": impact.frame_index,
            "angulo_codo_impacto": impact.elbow_angle,
            "angulo_rodilla_impacto": impact.knee_angle,
            "inclinacion_tronco_impacto": impact.trunk_lean,
            "velocidad_pico_muneca": max(speeds) if speeds else None,
        }


def analyze_video(
    frames: list[np.ndarray], fps: float, dominant_side: Side = "right"
) -> AnalysisResult:
    height, width = frames[0].shape[:2]
    raw_points: list[FrameLandmarks | None] = []
    annotated_frames: list[np.ndarray] = []

    with mp_pose.Pose(
        static_image_mode=False, model_complexity=1, min_detection_confidence=0.5
    ) as pose:
        for frame in frames:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = pose.process(rgb)
            annotated = frame.copy()
            if result.pose_landmarks is None:
                raw_points.append(None)
            else:
                mp_drawing.draw_landmarks(
                    annotated, result.pose_landmarks, mp_pose.POSE_CONNECTIONS
                )
                landmarks = result.pose_landmarks.landmark
                raw_points.append(
                    {
                        name: _point(landmarks, idx, width, height)
                        for name, idx in LANDMARKS.items()
                    }
                )
            annotated_frames.append(annotated)

    # dominant_key_* apuntan al lado del jugador que ejecuta el golpe.
    dominant_wrist_key = f"{dominant_side}_wrist"
    dominant_elbow_key = f"{dominant_side}_elbow"
    dominant_shoulder_key = f"{dominant_side}_shoulder"
    dominant_hip_key = f"{dominant_side}_hip"
    dominant_knee_key = f"{dominant_side}_knee"
    dominant_ankle_key = f"{dominant_side}_ankle"
    other_shoulder_key = "left_shoulder" if dominant_side == "right" else "right_shoulder"
    other_hip_key = "left_hip" if dominant_side == "right" else "right_hip"

    wrist_xy = _smoothed_series(raw_points, dominant_wrist_key)
    wrist_speed = _speed(wrist_xy, fps)

    frame_metrics: list[FrameMetrics] = []
    for i, points in enumerate(raw_points):
        if points is None:
            frame_metrics.append(FrameMetrics(i, None, None, None, None, wrist_speed[i]))
            continue

        elbow_angle = _angle(
            points[dominant_shoulder_key], points[dominant_elbow_key], points[dominant_wrist_key]
        )
        knee_angle = _angle(
            points[dominant_hip_key], points[dominant_knee_key], points[dominant_ankle_key]
        )

        hip_mid = (points[dominant_hip_key] + points[other_hip_key]) / 2
        shoulder_mid = (points[dominant_shoulder_key] + points[other_shoulder_key]) / 2
        trunk_vector = shoulder_mid - hip_mid
        trunk_lean = float(
            np.degrees(np.arctan2(abs(trunk_vector[0]), abs(trunk_vector[1]) + 1e-9))
        )

        shoulder_vector = points[dominant_shoulder_key] - points[other_shoulder_key]
        shoulder_rotation = float(np.degrees(np.arctan2(shoulder_vector[1], shoulder_vector[0])))

        frame_metrics.append(
            FrameMetrics(
                frame_index=i,
                elbow_angle=elbow_angle,
                knee_angle=knee_angle,
                trunk_lean=trunk_lean,
                shoulder_rotation=shoulder_rotation,
                wrist_speed=wrist_speed[i],
            )
        )

    impact_frame = _detect_impact(wrist_speed)

    return AnalysisResult(
        fps=fps, frames=frame_metrics, impact_frame=impact_frame, annotated_frames=annotated_frames
    )


def _point(landmarks, idx: int, width: int, height: int) -> Point:
    lm = landmarks[idx]
    return np.array([lm.x * width, lm.y * height])


def _angle(a: Point, b: Point, c: Point) -> float:
    """Angulo en grados en el vertice b, formado por los puntos a-b-c."""
    ba = a - b
    bc = c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-9)
    return float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))


def _smoothed_series(raw_points: list[FrameLandmarks | None], key: str) -> np.ndarray:
    n = len(raw_points)
    series = np.full((n, 2), np.nan)
    for i, points in enumerate(raw_points):
        if points is not None:
            series[i] = points[key]

    # Interpola los frames donde MediaPipe no detecto pose, en vez de dejar huecos.
    for axis in range(2):
        values = series[:, axis]
        valid = ~np.isnan(values)
        if valid.sum() >= 2:
            series[:, axis] = np.interp(np.arange(n), np.flatnonzero(valid), values[valid])

    window = min(9, n if n % 2 == 1 else n - 1)
    if window >= 5:
        series[:, 0] = savgol_filter(series[:, 0], window, 2)
        series[:, 1] = savgol_filter(series[:, 1], window, 2)
    return series


def _speed(xy: np.ndarray, fps: float) -> list[float | None]:
    speed: list[float | None] = [None]
    for i in range(1, len(xy)):
        if np.isnan(xy[i]).any() or np.isnan(xy[i - 1]).any():
            speed.append(None)
        else:
            speed.append(float(np.linalg.norm(xy[i] - xy[i - 1]) * fps))
    return speed


def _detect_impact(wrist_speed: list[float | None]) -> int | None:
    valid = [(i, s) for i, s in enumerate(wrist_speed) if s is not None]
    if not valid:
        return None
    return max(valid, key=lambda item: item[1])[0]
