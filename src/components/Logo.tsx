export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      stroke="#4ade80"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Diamond (rotated square) */}
      <polygon points="20,4 36,20 20,36 4,20" />

      {/* Eye — almond shape */}
      <path d="M11,20 Q20,13 29,20 Q20,27 11,20" />

      {/* Pupil */}
      <circle cx="20" cy="20" r="2" fill="#4ade80" stroke="none" />
    </svg>
  )
}
