"use client";
import React from "react";
import Link from "next/link";
import { StyledUsername } from "@/components/StyledUsername";

const TOKEN_REGEX =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(https?:\/\/[^\s]+)|(@[A-Za-z0-9_]+)/g;

export type MentionData = { nameStyle?: string | null; isVip?: boolean };
export type MentionDataMap = Record<string, MentionData>;

function stripTrailingPunct(url: string): string {
  return url.replace(/[.,;:!?]+$/, "");
}

function renderInline(text: string, mentionData: MentionDataMap): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, code, bold, url, mention] = match;
    const k = `seg-${key++}`;
    if (code) {
      nodes.push(
        <code
          key={k}
          className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 font-mono text-[0.85em]"
        >
          {code.slice(1, -1)}
        </code>
      );
    } else if (bold) {
      nodes.push(
        <strong key={k} className="font-bold text-white">
          {bold.slice(2, -2)}
        </strong>
      );
    } else if (url) {
      const href = stripTrailingPunct(url) || url;
      nodes.push(
        <a
          key={k}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
        >
          {href}
        </a>
      );
    } else if (mention) {
      const username = mention.slice(1);
      const md = mentionData[username.toLowerCase()];
      const hasStyle = !!(md && md.nameStyle);
      nodes.push(
        <Link
          key={k}
          href={`/profile/${username}`}
          onClick={(e) => e.stopPropagation()}
          className={
            hasStyle
              ? ""
              : "text-neon font-semibold hover:text-neon-light underline decoration-neon/30 underline-offset-2 transition-colors"
          }
        >
          <StyledUsername
            username={mention}
            nameStyle={md?.nameStyle}
            isVip={md?.isVip}
            className={
              hasStyle
                ? "font-semibold text-neon underline decoration-neon/30 underline-offset-2"
                : ""
            }
          />
        </Link>
      );
    }
    lastIndex = TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : text;
}

export function FormattedText({
  text,
  mentionData = {},
}: {
  text: string;
  mentionData?: MentionDataMap;
}) {
  return <>{renderInline(text, mentionData)}</>;
}
