import React from 'react'

export default function SceneGallery({ thumbnails }) {
  if (!thumbnails || thumbnails.length === 0) return null

  const captured = thumbnails.filter(t => !t.filtered)
  const filtered = thumbnails.filter(t => t.filtered)

  return (
    <>
      <div className="gallery-header">
        <h2>🖼️ Scene Gallery</h2>
        <div className="gallery-stats">
          <div className="stat-pill captured">
            ✓ {captured.length} captured
          </div>
          {filtered.length > 0 && (
            <div className="stat-pill filtered-pill">
              ⛔ {filtered.length} filtered
            </div>
          )}
        </div>
      </div>

      <div className="scene-grid">
        {thumbnails.map((scene, i) => (
          <div
            key={scene.scene_num}
            className={`scene-card ${scene.filtered ? 'filtered-card' : ''}`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="scene-img-wrap">
              <img
                src={`data:image/jpeg;base64,${scene.thumbnail_b64}`}
                alt={`Scene ${scene.scene_num} at ${scene.timecode}`}
                loading="lazy"
              />

              {/* Filtered overlay */}
              {scene.filtered && (
                <div className="filtered-overlay">
                  <span>🧑</span>
                  <p>Person in center</p>
                </div>
              )}

              {/* Status badge */}
              <div className={`scene-badge ${scene.filtered ? 'blocked' : 'ok'}`}>
                {scene.filtered ? '⛔ Filtered' : '✓ Captured'}
              </div>
            </div>

            <div className="scene-footer">
              <span className="scene-num">Scene {scene.scene_num}</span>
              <span className="scene-tc">{scene.timecode}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
