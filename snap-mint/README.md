# SnapMint 📸

> Turn any YouTube video into a smart, timestamped PDF using scene-based screenshots and AI person filtering.

![SnapMint](./docs/hero.png)

## ✨ Features

- 🎬 **Scene Detection** — PySceneDetect `ContentDetector` finds natural cut points
- 🧠 **Person Center Filter** — Skips frames where a presenter is blocking the slide/content (center zone configurable)
- ⏱️ **Timestamp Overlay** — Each screenshot has the video timecode burned in
- 📡 **Real-time Progress** — Server-Sent Events stream live pipeline status
- 🖼️ **Scene Gallery** — Visual preview of captured vs. filtered frames
- 📄 **PDF Export** — One scene per page, landscape A4

---

## 🏗️ Project Structure

```
snap-mint/
├── backend/           ← Python Flask API
│   ├── app.py         ← routes + SSE
│   ├── processor.py   ← full pipeline
│   ├── person_filter.py ← HOG + Haar person detection
│   ├── requirements.txt
│   ├── nixpacks.toml  ← Railway: install FFmpeg
│   └── Procfile       ← Railway: gunicorn start
└── frontend/          ← Vite + React
    ├── src/
    │   ├── App.jsx
    │   └── components/
    │       ├── Hero.jsx
    │       ├── UrlInput.jsx
    │       ├── ProgressStream.jsx
    │       ├── SceneGallery.jsx
    │       └── PdfDownload.jsx
    └── vercel.json    ← Vercel SPA routing
```

---

## 🚀 Local Development

### Prerequisites
- Python 3.9+
- Node.js 18+
- **FFmpeg** in system PATH → [download here](https://ffmpeg.org/download.html)

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## ☁️ Deployment

### Backend → Railway

1. Push `backend/` to GitHub
2. Create new Railway project → connect repo
3. Railway auto-detects Python + installs FFmpeg via `nixpacks.toml`
4. Add env var: `CORS_ORIGINS=https://your-app.vercel.app`

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import to Vercel Dashboard
3. Add env var: `VITE_API_URL=https://your-backend.railway.app`
4. Deploy → `vercel.json` handles SPA routing

---

## ⚙️ API

| Route | Method | Description |
|---|---|---|
| `/api/process` | POST | Start job → returns `job_id` |
| `/api/progress/<job_id>` | GET (SSE) | Stream pipeline progress |
| `/api/scenes/<job_id>` | GET | Scene thumbnails JSON |
| `/api/download/<job_id>` | GET | Download PDF |
| `/api/cleanup/<job_id>` | DELETE | Remove temp files |
| `/api/health` | GET | Health check |

### POST /api/process body
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "threshold": 27,
  "enable_person_filter": true,
  "center_fraction": 0.40
}
```

---

## 🧠 How Person Filtering Works

```
Frame divided into 3 zones:
┌──────────┬────────────┬──────────┐
│  LEFT    │   CENTER   │  RIGHT   │
│  (0–30%) │  (30–70%) │ (70–100%)│
└──────────┴────────────┴──────────┘

Person in CENTER → ❌ Skip (content blocked)
Person on LEFT/RIGHT → ✅ Capture (content visible)
No person → ✅ Capture
```

Detection uses OpenCV's built-in HOG+SVM people detector + Haar face cascade as fallback. No external model download needed.

---

## 🤖 Tech Stack

| Layer | Technology |
|---|---|
| Video Download | yt-dlp |
| Scene Detection | PySceneDetect + ContentDetector |
| Person Detection | OpenCV HOG + Haar Cascade |
| Frame Processing | OpenCV + Pillow |
| PDF Assembly | fpdf2 |
| API | Flask + Flask-CORS |
| Streaming | Server-Sent Events (SSE) |
| Frontend | Vite + React |
| Backend Deploy | Railway + Nixpacks |
| Frontend Deploy | Vercel |
