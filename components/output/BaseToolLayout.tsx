import React, { JSX } from "react";

export function getWordCount(text: string | undefined): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length;
}

export function getReadingTimeMinutes(wordCount: number): number {
  if (!wordCount) return 0;
  const wordsPerMinute = 180;
  return Math.max(1, Math.round(wordCount / wordsPerMinute));
}

type BaseToolLayoutProps = {
  title: string;
  body?: string;
};

export function BaseToolLayout({ title, body }: BaseToolLayoutProps) {
  const wordCount = getWordCount(body || "");
  const minutes = getReadingTimeMinutes(wordCount);

  const isSummarize = title === "Summarize";

  const summarizeSections = isSummarize
    ? getSummarizeSections(body || "")
    : [];

  const paragraphs = (body || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  function getSummarizeSections(text: string) {
    const labels = [
      "Overview",
      "Core Concepts",
      "Critical Details",
      "Why It Matters",
    ] as const;

    const regex = new RegExp(
      `(?:\\d+\\.\\s*)?(${labels.join("|")})`,
      "g"
    );

    const sections: { title: string; content: string }[] = [];
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      const titleMatch = match[1];

      if (sections.length > 0) {
        sections[sections.length - 1].content = text
          .slice(lastIndex, match.index)
          .trim();
      }

      sections.push({ title: titleMatch, content: "" });
      lastIndex = regex.lastIndex;
    }

    if (sections.length > 0) {
      sections[sections.length - 1].content = text.slice(lastIndex).trim();
    }

    return sections
      .map((section) => {
        const cleaned = section.content
          // remove leading punctuation or bullets
          .replace(/^[-*:\s]+/, "")
          .trim();

        return cleaned
          ? {
              title: section.title,
              content: cleaned,
            }
          : null;
      })
      .filter(Boolean) as { title: string; content: string }[];
  }

  return (
    <div className="rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#3a362b]">{title}</h3>
        <div className="flex items-center gap-3 text-[11px] text-[#6b6658]">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="h-3 w-px bg-[#d3d1cb]" />
          <span>{minutes} min read</span>
        </div>
      </div>
      <div className="h-px bg-[#e7e3d7]" />
      <div
        className={`rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-4 py-3 text-sm text-[#3a362b] leading-relaxed ${
          isSummarize ? "" : "max-h-80 overflow-y-auto"
        }`}
      >
        {isSummarize && summarizeSections.length > 0 ? (
          <div className="space-y-4">
            {summarizeSections.map((section, index) => (
              <div key={index} className="space-y-1">
                <div className="font-semibold text-[#3a362b]">
                  {section.title}
                </div>
                <ul className="list-disc pl-5">
                  <li>{section.content}</li>
                </ul>
              </div>
            ))}
          </div>
        ) : paragraphs.length > 0 ? (
          <div className="space-y-3">
            {paragraphs.map((p, index) => (
              <p key={index}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9b978b]">No content available for this tool.</p>
        )}
      </div>
    </div>
  );
}
