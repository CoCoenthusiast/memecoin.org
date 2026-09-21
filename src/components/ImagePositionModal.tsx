"use client"
import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MediaImage, clampPct, clampZoom } from "@/components/MediaImage"

type ImagePositionModalProps = {
  objectUrl: string
  title: string
  shape: "square" | "banner"
  onCancel: () => void
  onConfirm: (x: number, y: number, zoom: number) => void
}

export function ImagePositionModal({ objectUrl, title, shape, onCancel, onConfirm }: ImagePositionModalProps) {
  const [x, setX] = useState(50)
  const [y, setY] = useState(50)
  const [zoom, setZoom] = useState(1)
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null)

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, x, y }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    const frame = frameRef.current
    if (!d || !frame) return
    const rect = frame.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    setX(clampPct(d.x + ((e.clientX - d.startX) / rect.width) * 100))
    setY(clampPct(d.y + ((e.clientY - d.startY) / rect.height) * 100))
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    try {
      ;(e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
    } catch {
      // already released
    }
    dragRef.current = null
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/80 p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">{title}</h2>
        <p className="text-xs text-gray-500 mb-3">Drag to reposition. Use the slider to zoom. GIFs keep animating after saving.</p>

        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`w-full overflow-hidden rounded-xl border border-gray-700 touch-none select-none cursor-grab active:cursor-grabbing ${
            shape === "square" ? "aspect-square" : "aspect-[21/6]"
          }`}
        >
          <MediaImage
            src={objectUrl}
            alt=""
            x={x}
            y={y}
            zoom={zoom}
            imgClassName="pointer-events-none"
            className="h-full w-full"
          />
        </div>

        <div className="mt-5 flex items-center gap-4">
          <span className="text-sm text-gray-400 flex-shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(clampZoom(parseFloat(e.target.value)))}
            className="flex-1 accent-neon"
            aria-label="Zoom"
          />
          <span className="text-sm text-gray-300 w-12 text-right tabular-nums">{zoom.toFixed(2)}x</span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span>
            Position: X {x.toFixed(0)}% · Y {y.toFixed(0)}%
          </span>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(x, y, zoom)}
            className="px-4 py-2 rounded-lg bg-neon-glow text-gray-950 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(modal, document.body)
}