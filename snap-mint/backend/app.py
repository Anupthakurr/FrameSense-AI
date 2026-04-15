"""
app.py — Flask API for SnapMint

Routes:
  POST   /api/process              → start job
  GET    /api/progress/<job_id>    → SSE stream
  GET    /api/scenes/<job_id>      → thumbnails JSON
  GET    /api/download/<job_id>    → PDF download
  DELETE /api/cleanup/<job_id>     → remove temp files
"""

import os
import json
import queue
import threading
import time
from pathlib import Path
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS

from processor import run_pipeline, cleanup_job, JOBS_DIR

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)

CORS(app, origins=os.getenv("CORS_ORIGINS", "*").split(","))

# In-memory job store: job_id → { status, queue, result, created_at }
_jobs: dict = {}
_jobs_lock = threading.Lock()


def _make_job(job_id: str):
    return {
        "status": "pending",
        "queue": queue.Queue(),
        "result": None,
        "created_at": time.time(),
    }


# ---------------------------------------------------------------------------
# POST /api/process
# ---------------------------------------------------------------------------
@app.route("/api/process", methods=["POST"])
def start_process():
    data = request.get_json(force=True)
    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "Missing YouTube URL"}), 400

    threshold = float(data.get("threshold", 27.0))
    enable_filter = bool(data.get("enable_person_filter", True))
    center_fraction = float(data.get("center_fraction", 0.40))

    import uuid
    job_id = uuid.uuid4().hex

    with _jobs_lock:
        _jobs[job_id] = _make_job(job_id)

    def worker():
        job = _jobs[job_id]
        job["status"] = "running"

        def emit(event, data):
            job["queue"].put({"event": event, "data": data})

        try:
            result = run_pipeline(
                url=url,
                job_id=job_id,
                threshold=threshold,
                enable_person_filter=enable_filter,
                center_fraction=center_fraction,
                emit=emit,
            )
            job["result"] = result
            job["status"] = "done"
        except Exception as e:
            job["status"] = "error"
            job["queue"].put({"event": "error", "data": {"message": str(e)}})
        finally:
            job["queue"].put(None)  # sentinel

    t = threading.Thread(target=worker, daemon=True)
    t.start()

    return jsonify({"job_id": job_id}), 202


# ---------------------------------------------------------------------------
# GET /api/progress/<job_id>  — Server-Sent Events
# ---------------------------------------------------------------------------
@app.route("/api/progress/<job_id>")
def stream_progress(job_id):
    job = _jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    def generate():
        q = job["queue"]
        while True:
            msg = q.get()
            if msg is None:
                yield f"data: {json.dumps({'event': 'end'})}\n\n"
                break
            payload = json.dumps({"event": msg["event"], "data": msg["data"]})
            yield f"data: {payload}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# GET /api/scenes/<job_id>
# ---------------------------------------------------------------------------
@app.route("/api/scenes/<job_id>")
def get_scenes(job_id):
    job = _jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    if job["status"] != "done":
        return jsonify({"error": "Job not complete"}), 202
    return jsonify(job["result"]["thumbnails"])


# ---------------------------------------------------------------------------
# GET /api/download/<job_id>
# ---------------------------------------------------------------------------
@app.route("/api/download/<job_id>")
def download_pdf(job_id):
    job = _jobs.get(job_id)
    if not job or job["status"] != "done":
        return jsonify({"error": "PDF not ready"}), 404

    pdf_path = job["result"].get("pdf_path")
    if not pdf_path or not Path(pdf_path).exists():
        return jsonify({"error": "PDF file not found"}), 404

    title = job["result"].get("title", "snapmint")
    safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:40]

    return send_file(
        pdf_path,
        as_attachment=True,
        download_name=f"snapmint_{safe_name}.pdf",
        mimetype="application/pdf",
    )


# ---------------------------------------------------------------------------
# DELETE /api/cleanup/<job_id>
# ---------------------------------------------------------------------------
@app.route("/api/cleanup/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    with _jobs_lock:
        _jobs.pop(job_id, None)
    cleanup_job(job_id)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "jobs": len(_jobs)})


# ---------------------------------------------------------------------------
# Background cleanup — remove jobs older than 15 minutes
# ---------------------------------------------------------------------------
def _auto_cleanup():
    while True:
        time.sleep(300)
        now = time.time()
        to_remove = []
        with _jobs_lock:
            for jid, job in _jobs.items():
                if now - job["created_at"] > 900:  # 15 min
                    to_remove.append(jid)
        for jid in to_remove:
            with _jobs_lock:
                _jobs.pop(jid, None)
            try:
                cleanup_job(jid)
            except Exception:
                pass


threading.Thread(target=_auto_cleanup, daemon=True).start()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
