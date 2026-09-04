"use client";
import { StyledName, nameStyleFromJson } from "@/components/StyledName";

export function StyledUsername({
  username,
  nameStyle,
  isVip,
  className = "",
}: {
  username: string;
  nameStyle?: string | null;
  isVip?: boolean;
  className?: string;
}) {
  const style = nameStyleFromJson(nameStyle);
  const Name = style ? (
    <StyledName text={username} style={style} />
  ) : (
    <span>{username}</span>
  );

  return <span className={className}>{Name}</span>;
}
