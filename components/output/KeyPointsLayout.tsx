import React from "react";
import { getWordCount, getReadingTimeMinutes } from "./BaseToolLayout";

type KeyPointsLayoutProps = {
  rawSection?: string;
};

type ParsedKeyPoints = {
  points: { title: string; explanation: string }[];
  insights?: string;
};

function parseKeyPoints(rawSection: string | undefined): ParsedKeyPoints {
  if (!rawSection) return { points: [] };

  const jsonStart = rawSection.indexOf("{");
  if (jsonStart !== -1) {
    const jsonText = rawSection.slice(jsonStart).trim();
    try {
      const parsed = JSON.parse(jsonText) as {
        type?: string;
        title?: string;
        data?: { rank?: number; title?: string; explanation?: string }[];
        insights?: string[];
      };

      if (parsed && Array.isArray(parsed.data)) {
        const points = parsed.data
          .map((item) => ({
            title: (item.title || "").trim(),
            explanation: (item.explanation || "").trim(),
          }))
          .filter((p) => p.title || p.explanation);

        const insightsText = Array.isArray(parsed.insights)
          ? parsed.insights.join(" ")
          : undefined;

        if (points.length > 0) {
          return { points, insights: insightsText };
        }
      }
    } catch {
    }
  }

  let working = rawSection.trim();
  let insights: string | undefined;

  const insightsMatch = working.match(/(^|\n)\s*Insights[:\-]?\s*([\s\S]*)$/i);
  if (insightsMatch && typeof insightsMatch.index === "number") {
    const rawInsights = insightsMatch[2].trim();
    if (rawInsights) {
      insights = rawInsights;
    }
    working = working.slice(0, insightsMatch.index).trim();
  }

  const points: { title: string; explanation: string }[] = [];

  const cleaned = working
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

  const regex = /^(\d+)\.\s*([\s\S]*?)(?=^\d+\.\s*|$)/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    const block = match[2].trim();
    if (!block) continue;

    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let title = lines[0];
    let explanation = lines.slice(1).join(" ");

    if (!explanation) {
      const singleLine = lines[0];

      const separatorMatch = singleLine.match(/^(.+?)[:\-\u2013\u2014]\s+(.+)$/);
      if (separatorMatch) {
        title = separatorMatch[1].trim();
        explanation = separatorMatch[2].trim();
      } else {
        const periodIndex = singleLine.indexOf(". ");
        if (periodIndex > 0) {
          title = singleLine.slice(0, periodIndex + 1).trim();
          explanation = singleLine.slice(periodIndex + 2).trim();
        } else {
          explanation = singleLine.trim();
        }
      }
    }

    points.push({
      title,
      explanation,
    });
  }

  return {
    points,
    insights,
  };
}

export function KeyPointsLayout({ rawSection }: KeyPointsLayoutProps) {
  const wordCount = getWordCount(rawSection || "");
  const minutes = getReadingTimeMinutes(wordCount);
  const { points, insights } = parseKeyPoints(rawSection);

  return (
    <div className="rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#3a362b]">Key Points</h3>
        <div className="flex items-center gap-3 text-[11px] text-[#6b6658]">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="h-3 w-px bg-[#d3d1cb]" />
          <span>{minutes} min read</span>
        </div>
      </div>
      <div className="h-px bg-[#e7e3d7]" />
      <div className="rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-4 py-3 flex flex-col gap-3">
        {points.length > 0 ? (
          <div className="space-y-3">
            {points.map((point, index) => (
              <div
                key={index}
                className="rounded-xl bg-white border border-[#f3e2c0] px-4 py-3 text-sm text-[#3a362b] shadow-sm"
              >
                <div className="font-semibold text-[#b45309] mb-1">
                  {point.title}
                </div>
                <div className="leading-relaxed">{point.explanation}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9b978b]">No key points available.</p>
        )}

        {insights && (
          <div className="mt-2 rounded-xl bg-[#fff7e5] border border-[#f3e2c0] px-4 py-3 text-[#3a362b]">
            <p className="font-semibold mb-1 text-[#b45309]">Insights</p>
            <p className="leading-relaxed text-sm">{insights}</p>
          </div>
        )}
      </div>
    </div>
  );
}
