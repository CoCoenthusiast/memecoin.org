"use client";

export type NameStyle = {
  colors: [string, string];
  animation: "static" | "shift" | "pulse";
  speed?: string;
  glow: boolean;
};

export function nameStyleFromJson(raw: string | null | undefined): NameStyle | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.colors) &&
      parsed.colors.length === 2 &&
      typeof parsed.animation === "string" &&
      ["static", "shift", "pulse"].includes(parsed.animation) &&
      typeof parsed.glow === "boolean"
    ) {
      return parsed as NameStyle;
    }
    return null;
  } catch {
    return null;
  }
}

export function StyledName({
  text,
  style,
  className = "",
}: {
  text: string;
  style: NameStyle;
  className?: string;
}) {
  const animClass =
    style.animation === "shift"
      ? "name-style--shift"
      : style.animation === "pulse"
        ? "name-style--pulse"
        : "";
  const glowClass = style.glow ? "name-style--glow" : "";
  return (
    <span
      className={`name-style ${animClass} ${glowClass} ${className}`}
      style={
        {
          "--name-c1": style.colors[0],
          "--name-c2": style.colors[1],
        } as React.CSSProperties
      }
    >
      {text}
    </span>
  );
}
