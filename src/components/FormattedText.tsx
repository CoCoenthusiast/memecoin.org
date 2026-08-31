import React from "react";

const TOKEN_REGEX = /(`[^`]+`)|(\*\*[^*]+\*\*)|(https?:\/\/[^\s]+)/g;

function stripTrailingPunct(url: string): string {
  return url.replace(/[.,;:!?]+$/, "");
}

function renderInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, code, bold, url] = match;
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
    }
    lastIndex = TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : text;
}

export function FormattedText({ text }: { text: string }) {
  return <>{renderInline(text)}</>;
}
