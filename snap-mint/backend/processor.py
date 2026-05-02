"""
processor.py — Core pipeline for SnapMint (local-only)

Pipeline:
  1. download_video()       — yt-dlp CLI → job_dir/video.mp4
  2. detect_scenes()        — PySceneDetect ContentDetector + live % via timer
  3. extract_and_filter()   — OpenCV frame grab + person_filter
  4. stamp_timestamp()      — Pillow text overlay
  5. build_pdf()            — fpdf2 multi-page PDF
"""

import os
import cv2
import time
import json
import shutil
import base64
import logging
import tempfile
import threading
import subprocess
import easyocr
import difflib
from io import BytesIO
from pathlib import Path
from typing import Callable, List, Dict, Any, Optional

from PIL import Image, ImageDraw, ImageFont
from fpdf import FPDF
from scenedetect import open_video, SceneManager
from scenedetect.detectors import ContentDetector

from person_filter import is_person_centered

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
JOBS_DIR = Path(tempfile.gettempdir()) / "snapmint_jobs"
JOBS_DIR.mkdir(parents=True, exist_ok=True)


def get_job_dir(job_id: str) -> Path:
    path = JOBS_DIR / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def cleanup_job(job_id: str):
    job_dir = JOBS_DIR / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir)


# ---------------------------------------------------------------------------
# Step 1: Download  (uses yt-dlp CLI — avoids all Python API logger issues)
# ---------------------------------------------------------------------------
def download_video(
    url: str,
    job_id: str,
    progress_cb: Callable[[int], None],
) -> tuple:
    """
    Download a YouTube video using the yt-dlp command-line tool.
    Returns (video_path, video_title).
    """
    job_dir = get_job_dir(job_id)
    output_template = str(job_dir / "video.%(ext)s")
    title_file = str(job_dir / "title.txt")

    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--extractor-args", "youtube:player_client=android,web",
        "--format", "best[ext=mp4]/best",
        "--output", output_template,
        "--newline",
        "--print-to-file", "%(title)s", title_file,
        url,
    ]

    logger.info(f"[Download] Starting: {url}")
    progress_cb(0)

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

        stderr_lines = []

        def _read_stderr():
            for line in proc.stderr:
                line = line.strip()
                stderr_lines.append(line)
                if "[download]" in line and "%" in line:
                    try:
                        pct_str = line.split("%")[0].split()[-1]
                        pct = int(float(pct_str))
                        progress_cb(min(pct, 99))
                    except Exception:
                        pass

        stderr_thread = threading.Thread(target=_read_stderr, daemon=True)
        stderr_thread.start()

        # Stdout isn't used much anymore since we write title to file, but we read it to avoid blocking
        proc.stdout.read()
        stderr_thread.join(timeout=10)
        proc.wait()

        if proc.returncode != 0:
            # Filter for actual errors (ignore deprecation warnings)
            errors = [l for l in stderr_lines if "ERROR" in l and "Deprecated" not in l]
            detail = errors[-1] if errors else "Unknown error"
            raise RuntimeError(
                f"yt-dlp failed: {detail}. "
                "Check the URL is a valid, public YouTube video."
            )

        title = "Untitled Video"
        try:
            if os.path.exists(title_file):
                with open(title_file, "r", encoding="utf-8") as f:
                    title = f.read().strip()
        except Exception:
            pass

        progress_cb(100)
        logger.info(f"[Download] Done — title: {title}")

    except FileNotFoundError:
        raise RuntimeError(
            "yt-dlp is not installed or not on PATH. Run: pip install yt-dlp"
        )

    # Find the downloaded file
    for f in job_dir.iterdir():
        if f.suffix in (".mp4", ".webm", ".mkv", ".avi"):
            return str(f), title

    raise FileNotFoundError("Download failed — no video file found in job directory.")



# ---------------------------------------------------------------------------
# Step 2: Scene Detection
# ---------------------------------------------------------------------------
def detect_scenes(
    video_path: str,
    threshold: float = 5.0,
    progress_emit: Optional[Callable[[int], None]] = None,
) -> list:
    """
    Detect scene changes using ContentDetector.
    Emits estimated progress every ~1.5 s via a background timer thread.
    Falls back to a frame every 30 s if no scenes are detected.
    """
    cap_info = cv2.VideoCapture(video_path)
    fps_info = cap_info.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap_info.get(cv2.CAP_PROP_FRAME_COUNT))
    cap_info.release()

    ESTIMATED_SPEED_FPS = 120
    estimated_secs = max(1, total_frames / ESTIMATED_SPEED_FPS)

    stop_event = threading.Event()

    def _emit_progress():
        start = time.time()
        while not stop_event.is_set():
            elapsed = time.time() - start
            pct = min(92, int((elapsed / estimated_secs) * 100))
            if progress_emit:
                progress_emit(pct)
            stop_event.wait(timeout=1.5)

    progress_thread = threading.Thread(target=_emit_progress, daemon=True)
    progress_thread.start()

    video = open_video(video_path)
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector(threshold=threshold))
    scene_manager.detect_scenes(video, show_progress=False)
    scene_list = scene_manager.get_scene_list()

    stop_event.set()
    if progress_emit:
        progress_emit(100)

    if not scene_list:
        interval_frames = int(fps_info * 30)
        fallback_frames = list(range(int(fps_info * 5), total_frames, interval_frames))
        return [
            {"frame": f, "timecode": _frames_to_tc(f, fps_info), "fallback": True}
            for f in fallback_frames
        ]

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    cap.release()

    result = []
    for start_tc, end_tc in scene_list:
        start_f = start_tc.get_frames()
        end_f = end_tc.get_frames()
        mid_f = (start_f + end_f) // 2
        result.append({
            "frame": mid_f,
            "timecode": _frames_to_tc(mid_f, fps),
            "start_frame": start_f,
            "end_frame": end_f,
            "fallback": False,
        })

    return result


def _frames_to_tc(frame_num: int, fps: float) -> str:
    total_seconds = int(frame_num / fps)
    h = total_seconds // 3600
    m = (total_seconds % 3600) // 60
    s = total_seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def compute_hist(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
    cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
    return hist

def compute_quality(frame, is_blocked):
    score = 0
    if is_blocked:
        score -= 10000
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    score += sharpness
    return score

# ---------------------------------------------------------------------------
# Step 3: Extract + Filter
# ---------------------------------------------------------------------------
def extract_and_filter(
    video_path: str,
    scenes: list,
    job_id: str,
    enable_person_filter: bool,
    center_fraction: float,
    progress_cb: Callable[[int, int, str], None],
) -> List[Dict[str, Any]]:
    """
    For each scene grab the midpoint frame, optionally run the person filter,
    stamp a timestamp, and return metadata + base64 thumbnail.
    """
    job_dir = get_job_dir(job_id)
    frames_dir = job_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    quality_str = f"{height}p" if height > 0 else ""
    
    total = len(scenes)
    results = []
    
    # Initialize OCR Reader (will use CPU or GPU depending on availability)
    reader = easyocr.Reader(['en'])
    
    # List of dicts: {"hist": hist, "text": str, "best_idx": int, "score": float}
    saved_clusters = []
    
    prev_hist = None
    prev_text = ""

    for i, scene in enumerate(scenes):

        try:
            progress_cb(i, total, scene["timecode"])

            cap.set(cv2.CAP_PROP_POS_FRAMES, scene["frame"])
            ret, frame = cap.read()

            if not ret or frame is None:
                continue

            blocked = False
            if enable_person_filter:
                blocked = is_person_centered(frame, center_fraction=center_fraction)

            quality_score = compute_quality(frame, blocked)
            hist = compute_hist(frame)
            
            # --- FAST PATH OPTIMIZATION ---
            skip_ocr = False
            extracted_text = ""
            
            if prev_hist is not None:
                hist_sim_prev = cv2.compareHist(hist, prev_hist, cv2.HISTCMP_CORREL)
                if hist_sim_prev > 0.98:
                    extracted_text = prev_text
                    skip_ocr = True
                    
            if not skip_ocr:
                # --- AI DOWNSCALING OPTIMIZATION ---
                h, w = frame.shape[:2]
                if w > 800:
                    scale = 800 / w
                    ocr_frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
                else:
                    ocr_frame = frame.copy()
                    
                ocr_frame = cv2.cvtColor(ocr_frame, cv2.COLOR_BGR2GRAY)
                ocr_results = reader.readtext(ocr_frame, detail=0, paragraph=True)
                extracted_text = " ".join(ocr_results).strip()
                
            prev_hist = hist
            prev_text = extracted_text

            filtered = False
            reason = None
            
            # Check against all known clusters using text similarity
            matched_cluster = None
            for cluster in saved_clusters:
                text_sim = difflib.SequenceMatcher(None, extracted_text, cluster["text"]).ratio()
                
                if text_sim > 0.85:
                    matched_cluster = cluster
                    break
                    
                # Fallback: if there's almost no text (e.g. diagrams), rely on color histogram > 90%
                if len(extracted_text) < 20:
                    hist_sim = cv2.compareHist(hist, cluster["hist"], cv2.HISTCMP_CORREL)
                    if hist_sim > 0.90:
                        matched_cluster = cluster
                        break

            if matched_cluster is not None:
                if quality_score > matched_cluster["score"]:
                    # This frame is better. Mark the previous best as a duplicate.
                    old_idx = matched_cluster["best_idx"]
                    if old_idx != -1:
                        results[old_idx]["filtered"] = True
                        results[old_idx]["reason"] = "Duplicate"

                    # Keep this one as the representative for the cluster
                    filtered = False
                    reason = None

                    matched_cluster["best_idx"] = len(results)
                    matched_cluster["score"] = quality_score
                    matched_cluster["hist"] = hist
                    matched_cluster["text"] = extracted_text
                else:
                    # This frame is worse, so it is the duplicate
                    filtered = True
                    reason = "Duplicate"
            else:
                # New cluster: always guarantee at least 1 image is kept for new content!
                filtered = False
                reason = None

                saved_clusters.append({
                    "hist": hist,
                    "text": extracted_text,
                    "best_idx": len(results),
                    "score": quality_score
                })

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(frame_rgb)
            stamped = _stamp_timestamp(pil_img, scene["timecode"], scene_num=i + 1, quality=quality_str)

            frame_path = str(frames_dir / f"scene_{i+1:03d}.png")
            stamped.save(frame_path, "PNG", optimize=False)

            thumb = stamped.copy()
            thumb.thumbnail((480, 270))
            buf = BytesIO()
            thumb.save(buf, format="JPEG", quality=85)
            thumb_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

            results.append({
                "scene_num": i + 1,
                "timecode": scene["timecode"],
                "frame_path": frame_path,
                "thumbnail_b64": thumb_b64,
                "filtered": filtered,
                "reason": reason,
            })
        except Exception as e:
            logger.error(f"Error processing scene {i+1}: {e}", exc_info=True)
            raise

    cap.release()
    return results


def _stamp_timestamp(img: Image.Image, timecode: str, scene_num: int, quality: str = "") -> Image.Image:
    """Burn timecode + scene number + quality onto the bottom-left corner."""
    draw = ImageDraw.Draw(img)
    w, h = img.size

    text = f"  Scene {scene_num}  |  {timecode}  "
    if quality:
        text += f"|  {quality}  "
        
    font_size = max(16, h // 28)

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    pad = 8
    rect_x0 = 10
    rect_y0 = h - text_h - pad * 2 - 10
    rect_x1 = rect_x0 + text_w + pad
    rect_y1 = h - 10

    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    ov_draw.rectangle([rect_x0, rect_y0, rect_x1, rect_y1], fill=(0, 0, 0, 180))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")

    draw2 = ImageDraw.Draw(img)
    draw2.text((rect_x0 + pad, rect_y0 + pad), text, fill=(255, 255, 255), font=font)

    return img


# ---------------------------------------------------------------------------
# Step 4: Build PDF
# ---------------------------------------------------------------------------
def _ascii_safe(text: str) -> str:
    return "".join(c if 0x20 <= ord(c) <= 0x7E else " " for c in text)


def build_pdf(
    frame_results: List[Dict[str, Any]],
    title: str,
    job_id: str,
) -> str:
    job_dir = get_job_dir(job_id)
    pdf_path = str(job_dir / "snapmint_output.pdf")

    captured = [r for r in frame_results if not r["filtered"]]
    if not captured:
        captured = frame_results

    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(False)

    page_w = 297
    page_h = 210

    for item in captured:
        pdf.add_page()

        pdf.set_fill_color(10, 14, 26)
        pdf.rect(0, 0, page_w, 12, "F")
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(99, 102, 241)
        pdf.set_xy(5, 2)
        safe_title = _ascii_safe(title)[:80] + ("..." if len(_ascii_safe(title)) > 80 else "")
        pdf.cell(
            0, 8,
            f"SnapMint  |  {safe_title}  |  Scene {item['scene_num']}  |  {item['timecode']}",
            ln=0,
        )

        img_y = 14
        img_h = page_h - img_y - 10
        try:
            pdf.image(item["frame_path"], x=5, y=img_y, w=page_w - 10, h=img_h, keep_aspect_ratio=True)
        except Exception:
            pass

        pdf.set_font("Helvetica", "", 7)
        pdf.set_text_color(150, 150, 150)
        pdf.set_xy(5, page_h - 8)
        pdf.cell(0, 5, f"Generated by SnapMint  |  {item['timecode']}", ln=0)

    pdf.output(pdf_path)
    return pdf_path


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------
def run_pipeline(
    url: str,
    job_id: str,
    threshold: float = 27.0,
    enable_person_filter: bool = True,
    center_fraction: float = 0.40,
    emit: Callable[[str, Any], None] = None,
) -> Dict[str, Any]:
    """Full pipeline. `emit(event, data)` streams progress to the SSE client."""

    def send(event: str, data: Any):
        if emit:
            emit(event, data)

    try:
        # ── Step 1: Download ──────────────────────────────────────────────────
        send("step", {"step": "downloading", "message": "Downloading video...", "pct": 0})

        def dl_progress(pct):
            send("progress", {"step": "downloading", "pct": pct})

        video_path, title = download_video(url, job_id, dl_progress)
        send("step", {"step": "downloading", "message": "Download complete!", "pct": 100})

        # ── Step 2: Detect Scenes ─────────────────────────────────────────────
        send("step", {"step": "detecting", "message": "Detecting scene changes...", "pct": 0})

        def detect_progress(pct):
            send("progress", {"step": "detecting", "pct": pct,
                              "message": f"Scanning frames… {pct}%"})

        scenes = detect_scenes(video_path, threshold=threshold, progress_emit=detect_progress)
        send("step", {"step": "detecting", "message": f"Found {len(scenes)} scenes", "pct": 100})

        # ── Step 3: Extract + Filter ──────────────────────────────────────────
        send("step", {"step": "filtering", "message": "Extracting & filtering frames...", "pct": 0})

        filtered_count = 0
        captured_count = 0

        def extract_progress(i, total, tc):
            send("progress", {
                "step": "filtering",
                "pct": int((i / max(total, 1)) * 100),
                "current": i,
                "total": total,
                "timecode": tc,
            })

        frame_results = extract_and_filter(
            video_path, scenes, job_id,
            enable_person_filter=enable_person_filter,
            center_fraction=center_fraction,
            progress_cb=extract_progress,
        )

        filtered_count = sum(1 for r in frame_results if r["filtered"])
        captured_count = len(frame_results) - filtered_count

        send("step", {
            "step": "filtering",
            "message": f"{captured_count} captured, {filtered_count} filtered",
            "pct": 100,
        })

        # ── Step 4: Build PDF ─────────────────────────────────────────────────
        send("step", {"step": "building_pdf", "message": "Building PDF...", "pct": 0})
        pdf_path = build_pdf(frame_results, title, job_id)
        send("step", {"step": "building_pdf", "message": "PDF ready!", "pct": 100})

        thumbnails = [
            {
                "scene_num": r["scene_num"],
                "timecode": r["timecode"],
                "thumbnail_b64": r["thumbnail_b64"],
                "filtered": r["filtered"],
                "reason": r.get("reason"),
            }
            for r in frame_results
        ]

        send("done", {
            "title": title,
            "total_scenes": len(scenes),
            "captured": captured_count,
            "filtered": filtered_count,
            "pdf_ready": True,
            "thumbnails": thumbnails,
        })

        return {
            "status": "done",
            "title": title,
            "captured": captured_count,
            "filtered": filtered_count,
            "pdf_path": pdf_path,
            "thumbnails": thumbnails,
        }

    except Exception as e:
        send("error", {"message": str(e)})
        raise
