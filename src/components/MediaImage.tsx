"use client"
import type { CSSProperties } from "react"

export function clampPct(v: number | null | undefined, fallback = 50): number {
  if (v == null || Number.isNaN(v)) return fallback
  return Math.min(100, Math.max(0, v))
}

export function clampZoom(v: number | null | undefined, fallback = 1): number {
  if (v == null || Number.isNaN(v)) return fallback
  return Math.min(3, Math.max(1, v))
}

export function imageCropStyle(
  x: number | null | undefined,
  y: number | null | undefined,
  zoom: number | null | undefined
): CSSProperties {
  const px = clampPct(x)
  const py = clampPct(y)
  const pz = clampZoom(zoom)
  return {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${px}% ${py}%`,
    transformOrigin: `${px}% ${py}%`,
    transform: `scale(${pz})`,
  }
}

type MediaImageProps = {
  src?: string | null
  alt?: string
  x?: number | null
  y?: number | null
  zoom?: number | null
  className?: string
  imgClassName?: string
}

export function MediaImage({ src, alt = "", x, y, zoom, className = "", imgClassName = "" }: MediaImageProps) {
  if (!src) {
    return <div className={className} />
  }
  return (
    <div className={`overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`h-full w-full ${imgClassName}`}
        style={imageCropStyle(x, y, zoom)}
      />
    </div>
  )
}