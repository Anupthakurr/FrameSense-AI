"""
processor.py — Core pipeline for SnapMint

Pipeline:
  1. download_video()       — yt-dlp → /tmp/<job_id>/video.mp4
  2. detect_scenes()        — PySceneDetect ContentDetector + live % via timer thread
  3. extract_and_filter()   — OpenCV frame grab + person_filter
  4. stamp_timestamp()      — Pillow text overlay
  5. build_pdf()            — fpdf2 multi-page PDF
"""

import os
import cv2
import uuid
import time
import json as json_mod
import threading
import tempfile
import shutil
import base64
import logging
import subprocess
from io import BytesIO
from pathlib import Path
from typing import Callable, List, Dict, Any, Optional

import yt_dlp
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
# PO Token resolution — Dynamic direct CLI call
# ---------------------------------------------------------------------------
def _generate_po_token() -> dict:
    """
    Generate a fresh PO Token dynamically by shelling out to the local
    youtube-po-token-generator tool. Falls back to static env vars.
    Returns dict with 'po_token' and 'visitor_data'.
    """
    try:
        logger.info("[PO Token] Generating fresh token...")
        # Since Northflank handles HTTPS proxies, we might need to pass the proxy to the CLI
        cmd = "youtube-po-token-generator"
        proxy = os.getenv("PROXY_URL")
        if proxy:
            # For Windows or Linux, setting HTTPS_PROXY before the command works
            cmd = f"HTTPS_PROXY={proxy} youtube-po-token-generator"
            
        out = subprocess.check_output(cmd, shell=True, text=True, timeout=15)
        # Parse the JSON {"visitorData":"...","poToken":"..."}
        import json
        data = json.loads(out)
        po = data.get("poToken")
        vd = data.get("visitorData")
        if po and vd:
            logger.info("[PO Token] Fresh token successfully generated ✓")
            return {"po_token": po, "visitor_data": vd}
    except Exception as e:
        logger.warning(f"[PO Token] Failed to generate dynamically: {e}")

    # Fallback
    po = os.getenv("PO_TOKEN", "")
    vd = os.getenv("VISITOR_DATA", "")
    if po and vd:
        logger.info("[PO Token] Using static fallback env vars")
        return {"po_token": po, "visitor_data": vd}

    return {}


# ---------------------------------------------------------------------------
# Step 1: Download
# ---------------------------------------------------------------------------
def download_video(url: str, job_id: str, progress_cb: Callable[[int], None]) -> tuple[str, str]:
    """
    Download YouTube video to job directory.
    Returns (video_path, video_title).
    """
    job_dir = get_job_dir(job_id)
    output_path = str(job_dir / "video.%(ext)s")
    title_holder = {"title": "Untitled Video"}

    def yt_hook(d):
        if d["status"] == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 1
            downloaded = d.get("downloaded_bytes", 0)
            pct = int((downloaded / total) * 100)
            progress_cb(pct)
        elif d["status"] == "finished":
            progress_cb(100)

    # ── Cookie handling ───────────────────────────────────────────────────────
    # Optional: pass YouTube cookies via YT_COOKIES_CONTENT env var.
    # With a residential proxy, cookies are typically not required for
    # public videos, but they help with age-gated or region-locked content.
    cookies_content = os.getenv("YT_COOKIES_CONTENT")
    cookie_file_path = None
    if cookies_content:
        cookie_file_path = os.path.join(tempfile.gettempdir(), "youtube_cookies.txt")
        if not cookies_content.startswith("# Netscape"):
            cookies_content = "# Netscape HTTP Cookie File\n" + cookies_content
        with open(cookie_file_path, "w", encoding="utf-8") as f:
            f.write(cookies_content)

    # ── Build extractor_args ─────────────────────────────────────────────────
    # Use the standard "web" client — best quality DASH streams.
    # _generate_po_token() creates a unique per-video token on the fly.
    yt_extractor_args = {
        "player_client": ["web"],
    }
    
    token_info = _generate_po_token()
    if token_info:
        yt_extractor_args["po_token"] = [f"web+{token_info['po_token']}"]
        yt_extractor_args["visitor_data"] = [token_info["visitor_data"]]

    ydl_opts = {
        "outtmpl": output_path,
        "quiet": False,
        "verbose": True,
        "no_warnings": False,
        "progress_hooks": [yt_hook],
        "source_address": "0.0.0.0",
        "nocheckcertificate": True,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
        "extractor_args": {
            "youtube": yt_extractor_args,
        },
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "retries": 5,
        "fragment_retries": 5,
        "ignoreerrors": False,
        "check_formats": False,
        "merge_output_format": "mp4",
    }

    # ── Residential proxy (required for Northflank / data-center IPs) ────────
    proxy_url = os.getenv("PROXY_URL")
    if proxy_url:
        ydl_opts["proxy"] = proxy_url

    if cookie_file_path:
        ydl_opts["cookiefile"] = cookie_file_path

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title_holder["title"] = info.get("title", "Untitled Video")

    # Find the downloaded file
    for f in job_dir.iterdir():
        if f.suffix in (".mp4", ".webm", ".mkv", ".avi"):
            return str(f), title_holder["title"]

    raise FileNotFoundError("Download failed — no video file found in job dir.")


# ---------------------------------------------------------------------------
# Step 2: Scene Detection
# ---------------------------------------------------------------------------
def detect_scenes(
    video_path: str,
    threshold: float = 27.0,
    progress_emit: Optional[Callable[[int], None]] = None,
) -> list:
    """
    Detect scene changes using ContentDetector.
    `progress_emit(pct)` is called every ~1.5s with estimated % completion.
    Falls back to every-30s if no scenes detected.
    """
    # Get total frames upfront for progress estimation
    cap_info = cv2.VideoCapture(video_path)
    fps_info = cap_info.get(cv2.CAP_PROP_FPS) or 25
    total_frames = int(cap_info.get(cv2.CAP_PROP_FRAME_COUNT))
    cap_info.release()

    # Estimate detection duration: PySceneDetect runs ~120 fps on average CPU
    ESTIMATED_SPEED_FPS = 120
    estimated_secs = max(1, total_frames / ESTIMATED_SPEED_FPS)

    # Background timer thread — emits progress every 1.5s based on elapsed time
    stop_event = threading.Event()

    def _emit_progress():
        start = time.time()
        while not stop_event.is_set():
            elapsed = time.time() - start
            # Cap at 92% — final 8% reserved for when detection actually finishes
            pct = min(92, int((elapsed / estimated_secs) * 100))
            if progress_emit:
                progress_emit(pct)
            stop_event.wait(timeout=1.5)

    progress_thread = threading.Thread(target=_emit_progress, daemon=True)
    progress_thread.start()

    # Run scene detection
    video = open_video(video_path)
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector(threshold=threshold))
    scene_manager.detect_scenes(video, show_progress=False)
    scene_list = scene_manager.get_scene_list()

    # Stop progress thread
    stop_event.set()
    if progress_emit:
        progress_emit(100)  # Signal 100% complete

    if not scene_list:
        # Fallback: interval every 30 seconds
        interval_frames = int(fps_info * 30)
        fallback_frames = list(range(int(fps_info * 5), total_frames, interval_frames))
        return [{"frame": f, "timecode": _frames_to_tc(f, fps_info), "fallback": True} for f in fallback_frames]

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
    For each scene, grab the midpoint frame, run person filter, stamp timestamp.
    Returns list of dicts: {frame_path, timecode, thumbnail_b64, filtered, reason}
    """
    job_dir = get_job_dir(job_id)
    frames_dir = job_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    total = len(scenes)
    results = []

    for i, scene in enumerate(scenes):
        progress_cb(i, total, scene["timecode"])

        frame_num = scene["frame"]
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()

        if not ret or frame is None:
            continue

        filtered = False
        reason = None

        if enable_person_filter:
            if is_person_centered(frame, center_fraction=center_fraction):
                filtered = True
                reason = "Person blocking center"

        # Convert BGR→RGB for Pillow
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(frame_rgb)

        # Stamp timestamp
        stamped = _stamp_timestamp(pil_img, scene["timecode"], scene_num=i + 1)

        # Save full-res frame as LOSSLESS PNG — no compression artifacts in PDF
        frame_path = str(frames_dir / f"scene_{i+1:03d}.png")
        stamped.save(frame_path, "PNG", optimize=False)

        # Generate thumbnail (base64 for frontend preview) — JPEG is fine here
        thumb = stamped.copy()
        thumb.thumbnail((480, 270))        # slightly bigger thumbnail
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

    cap.release()
    return results


def _stamp_timestamp(img: Image.Image, timecode: str, scene_num: int) -> Image.Image:
    """Burn timecode + scene number onto the bottom-left corner."""
    draw = ImageDraw.Draw(img)
    w, h = img.size

    text = f"  Scene {scene_num}  |  {timecode}  "
    font_size = max(16, h // 28)

    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    # Measure text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    pad = 8
    rect_x0 = 10
    rect_y0 = h - text_h - pad * 2 - 10
    rect_x1 = rect_x0 + text_w + pad
    rect_y1 = h - 10

    # Semi-transparent black background
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    ov_draw.rectangle([rect_x0, rect_y0, rect_x1, rect_y1], fill=(0, 0, 0, 180))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")

    # White text
    draw2 = ImageDraw.Draw(img)
    draw2.text((rect_x0 + pad, rect_y0 + pad), text, fill=(255, 255, 255), font=font)

    return img


# ---------------------------------------------------------------------------
# Step 4: Build PDF
# ---------------------------------------------------------------------------
def _ascii_safe(text: str) -> str:
    """
    Strip any character outside printable ASCII (space through ~).
    fpdf2's built-in Helvetica only supports Latin-1; emojis and Unicode
    symbols cause a crash. This makes titles safe regardless of content.
    """
    return "".join(c if 0x20 <= ord(c) <= 0x7E else " " for c in text)


def build_pdf(
    frame_results: List[Dict[str, Any]],
    title: str,
    job_id: str,
) -> str:
    """
    Assemble captured (non-filtered) frames into a PDF.
    Returns path to the PDF file.
    """
    job_dir = get_job_dir(job_id)
    pdf_path = str(job_dir / "snapmint_output.pdf")

    captured = [r for r in frame_results if not r["filtered"]]
    if not captured:
        captured = frame_results  # If all filtered, include everything

    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_auto_page_break(False)

    page_w = 297  # A4 landscape mm
    page_h = 210

    for item in captured:
        pdf.add_page()

        # Header bar
        pdf.set_fill_color(10, 14, 26)  # deep navy
        pdf.rect(0, 0, page_w, 12, "F")
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(99, 102, 241)  # indigo
        pdf.set_xy(5, 2)
        safe_title = _ascii_safe(title)[:80] + ("..." if len(_ascii_safe(title)) > 80 else "")
        pdf.cell(0, 8, f"SnapMint  |  {safe_title}  |  Scene {item['scene_num']}  |  {item['timecode']}", ln=0)

        # Image
        img_y = 14
        img_h = page_h - img_y - 10
        try:
            pdf.image(item["frame_path"], x=5, y=img_y, w=page_w - 10, h=img_h, keep_aspect_ratio=True)
        except Exception:
            pass

        # Footer
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
    """
    Full pipeline. `emit(event, data)` is called to stream progress to SSE.
    """

    def send(event: str, data: Any):
        if emit:
            emit(event, data)

    try:
        # --- Step 1: Download ---
        send("step", {"step": "downloading", "message": "Downloading video...", "pct": 0})

        def dl_progress(pct):
            send("progress", {"step": "downloading", "pct": pct})

        video_path, title = download_video(url, job_id, dl_progress)
        send("step", {"step": "downloading", "message": "Download complete!", "pct": 100})

        # --- Step 2: Detect Scenes ---
        send("step", {"step": "detecting", "message": "Detecting scene changes...", "pct": 0})

        def detect_progress(pct):
            send("progress", {"step": "detecting", "pct": pct,
                              "message": f"Scanning frames… {pct}%"})

        scenes = detect_scenes(video_path, threshold=threshold, progress_emit=detect_progress)
        send("step", {"step": "detecting", "message": f"Found {len(scenes)} scenes", "pct": 100})

        # --- Step 3: Extract + Filter ---
        send("step", {"step": "filtering", "message": "Extracting & filtering frames...", "pct": 0})

        filtered_count = 0
        captured_count = 0

        def extract_progress(i, total, tc):
            nonlocal filtered_count, captured_count
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

        # --- Step 4: Build PDF ---
        send("step", {"step": "building_pdf", "message": "Building PDF...", "pct": 0})
        pdf_path = build_pdf(frame_results, title, job_id)
        send("step", {"step": "building_pdf", "message": "PDF ready!", "pct": 100})

        # --- Thumbnails for gallery ---
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
