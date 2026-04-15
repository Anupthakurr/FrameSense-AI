"""
person_filter.py — Smart center-person detection for SnapMint

Determines if a person is blocking the CENTER zone of a video frame.
If centered → skip (content is blocked).
If on left/right side only → keep (content is clear).
"""

import cv2
import numpy as np

# ---------------------------------------------------------------------------
# HOG People Detector (built-in OpenCV, no model download needed)
# ---------------------------------------------------------------------------
_hog = cv2.HOGDescriptor()
_hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

# Haar cascade for face detection (secondary check)
_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def _get_center_zone(frame_w: int, center_fraction: float = 0.40):
    """Return (left_x, right_x) boundaries of the center zone."""
    margin = (1.0 - center_fraction) / 2.0
    left_x = int(frame_w * margin)
    right_x = int(frame_w * (1.0 - margin))
    return left_x, right_x


def _detection_center_x(x, w):
    """Return horizontal center of a bounding box."""
    return x + w // 2


def _is_detection_in_center(cx: int, frame_w: int, center_fraction: float) -> bool:
    """True if the detection's center x falls inside the center zone."""
    left_x, right_x = _get_center_zone(frame_w, center_fraction)
    return left_x <= cx <= right_x


def is_person_centered(
    frame: np.ndarray,
    center_fraction: float = 0.40,
    confidence_threshold: float = 0.5,
    downscale_factor: float = 0.5,
) -> bool:
    """
    Returns True if a person is detected in the CENTER zone of the frame.

    Parameters
    ----------
    frame              : BGR numpy array (OpenCV frame)
    center_fraction    : fraction of width considered "center" (default 40%)
    confidence_threshold: minimum HOG detection weight (default 0.5)
    downscale_factor   : resize factor for speed (default 0.5 = half size)
    """
    if frame is None or frame.size == 0:
        return False

    orig_h, orig_w = frame.shape[:2]

    # --- Downscale for speed ---
    small = cv2.resize(frame, (0, 0), fx=downscale_factor, fy=downscale_factor)
    small_h, small_w = small.shape[:2]

    # --- 1. HOG person detector ---
    rects, weights = _hog.detectMultiScale(
        small,
        winStride=(8, 8),
        padding=(4, 4),
        scale=1.05,
    )

    if len(rects) > 0:
        for (x, y, w, h), weight in zip(rects, weights):
            # Skip low-confidence detections
            if float(weight) < confidence_threshold:
                continue

            # Scale bounding box back to original dimensions
            cx = int(_detection_center_x(x, w) / downscale_factor)

            if _is_detection_in_center(cx, orig_w, center_fraction):
                return True  # Person is blocking the center

    # --- 2. Face cascade (secondary — catches faces HOG misses) ---
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    if len(faces) > 0:
        for (x, y, w, h) in faces:
            cx = int(_detection_center_x(x, w) / downscale_factor)
            if _is_detection_in_center(cx, orig_w, center_fraction):
                return True  # Face in center → person blocking content

    return False  # Safe to screenshot


def analyze_frame(frame: np.ndarray, center_fraction: float = 0.40) -> dict:
    """
    Returns a detailed analysis dict for debugging / UI display.
    """
    result = {
        "person_centered": False,
        "hog_detections": 0,
        "face_detections": 0,
        "verdict": "clear",
    }

    if frame is None or frame.size == 0:
        return result

    orig_h, orig_w = frame.shape[:2]
    downscale_factor = 0.5
    small = cv2.resize(frame, (0, 0), fx=downscale_factor, fy=downscale_factor)

    rects, weights = _hog.detectMultiScale(small, winStride=(8, 8), padding=(4, 4), scale=1.05)
    result["hog_detections"] = len(rects)

    for (x, y, w, h), weight in zip(rects, weights):
        if float(weight) < 0.5:
            continue
        cx = int(_detection_center_x(x, w) / downscale_factor)
        if _is_detection_in_center(cx, orig_w, center_fraction):
            result["person_centered"] = True
            result["verdict"] = "blocked"
            return result

    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    result["face_detections"] = len(faces)

    for (x, y, w, h) in faces:
        cx = int(_detection_center_x(x, w) / downscale_factor)
        if _is_detection_in_center(cx, orig_w, center_fraction):
            result["person_centered"] = True
            result["verdict"] = "blocked"
            return result

    return result
