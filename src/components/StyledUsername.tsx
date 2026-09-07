"use client";
import { StyledName, nameStyleFromJson } from "@/components/StyledName";

export function OwnerBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/30 align-middle"
      title="Forum owner"
      aria-label="Forum owner"
    >
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 16L3 5l5.5 4L12 5l3.5 4L21 5l-2 11H5zm0 2h14v2H5v-2z" />
      </svg>
      Owner
    </span>
  );
}

export function StyledUsername({
  username,
  nameStyle,
  isVip,
  isOwner,
  className = "",
}: {
  username: string;
  nameStyle?: string | null;
  isVip?: boolean;
  isOwner?: boolean;
  className?: string;
}) {
  const style = nameStyleFromJson(nameStyle);
  const Name = style ? (
    <StyledName text={username} style={style} />
  ) : (
    <span>{username}</span>
  );

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {Name}
      {isOwner && <OwnerBadge />}
    </span>
  );
}
