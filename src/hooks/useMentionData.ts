"use client";
import { useState, useEffect } from "react";

export type MentionUserData = { nameStyle?: string | null; isVip?: boolean };
export type MentionDataMap = Record<string, MentionUserData>;

let cache: MentionDataMap | null = null;

export function useMentionData(usernames: string[]): MentionDataMap {
  const [data, setData] = useState<MentionDataMap>(cache ?? {});
  const key = usernames.map((u) => u.toLowerCase()).join(",");

  useEffect(() => {
    const lower = [...new Set(usernames.map((u) => u.toLowerCase()))].filter(Boolean);
    if (lower.length === 0) return;
    const missing = lower.filter((u) => data[u] === undefined);
    if (missing.length === 0) return;

    fetch("/api/mentions/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: missing }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!res) return;
        setData((prev) => {
          const next = { ...prev, ...res.users };
          cache = next;
          return next;
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@([A-Za-z0-9_]+)/g) || [];
  return matches.map((m) => m.slice(1));
}
