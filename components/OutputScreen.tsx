"use client";

import React, {useState, useEffect, useMemo} from "react";
import { BaseToolLayout } from "./output/BaseToolLayout";
import { OutlineLayout } from "./output/OutlineLayout";
import { KeyPointsLayout } from "./output/KeyPointsLayout";
import { QuizLayout } from "./output/QuizLayout";
import { FlashcardLayout } from "./output/FlashcardLayout";
import { ExportButtons, ExportDropdown } from "@/components/UI/ExportButtons";


type OutputData = {
  status: string;
  content?: { type: string; value: string }[];
  message?: string;
  groqResponse?: string;
};

type ParsedSections = {
  summarize?: string;
  quiz?: string;
  outline?: string;
  flashcards?: string;
  keypoints?: string;
};

function parseSections(markdown: string | undefined | null): ParsedSections {
  if (!markdown) return {};

  const lines = markdown.split(/\r?\n/);
  const buffers: Record<keyof ParsedSections, string[]> = {
    summarize: [],
    quiz: [],
    outline: [],
    flashcards: [],
    keypoints: [],
  };

  let current: keyof ParsedSections | null = null;

  const headingToKey = (heading: string): keyof ParsedSections | null => {
    const normalized = heading.trim().toLowerCase();
    if (normalized.startsWith("summarize")) return "summarize";
    if (normalized.startsWith("quiz")) return "quiz";
    if (normalized.startsWith("structured outline")) return "outline";
    if (normalized.startsWith("flashcards")) return "flashcards";
    if (normalized.startsWith("key points") || normalized.startsWith("keypoints")) return "keypoints";
    return null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^#+\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#+\s+/, "");
      const key = headingToKey(headingText);
      if (key) {
        current = key;
      }
      continue;
    }

    if (current) {
      buffers[current].push(line);
    }
  }

  const result: ParsedSections = {};
  (Object.keys(buffers) as (keyof ParsedSections)[]).forEach((key) => {
    const text = buffers[key].join("\n").trim();
    if (text) {
      result[key] = text;
    }
  });

  return result;
}

type SourceBlock = {
  sourceId: string;
  sourceLabel: string;
  body: string;
};

function parseBySource(rawSection: string | undefined | null): SourceBlock[] {
  if (!rawSection) return [];

  const lines = rawSection.split(/\r?\n/);
  const blocks: SourceBlock[] = [];

  const headingRegex = /^#{3,6}\s+\[SOURCE\s+(\d+):\s*(.+?)\]\s*$/i;

  let currentId = "source-1";
  let currentLabel = "All sources";
  let buffer: string[] = [];
  let seenAnyHeading = false;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      // Flush previous block
      if (buffer.length > 0) {
        blocks.push({
          sourceId: currentId,
          sourceLabel: currentLabel,
          body: buffer.join("\n").trim(),
        });
        buffer = [];
      }

      const index = match[1].trim();
      const label = match[2].trim();
      currentId = `source-${index}`;
      currentLabel = label || `Source ${index}`;
      seenAnyHeading = true;
    } else {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    blocks.push({
      sourceId: currentId,
      sourceLabel: currentLabel,
      body: buffer.join("\n").trim(),
    });
  }

  if (!seenAnyHeading && blocks.length === 1) {
    // Single unsegmented block
    blocks[0].sourceLabel = "All sources";
  }

  return blocks.filter((b) => b.body.length > 0);
}

type ToolKey = "summarize" | "outline" | "keypoints" | "quiz" | "flashcards";

const TOOL_CONFIGS: { key: ToolKey; label: string }[] = [
  { key: "summarize", label: "Summarize" },
  { key: "outline", label: "Structured Outline" },
  { key: "keypoints", label: "Key Points" },
  { key: "quiz", label: "Quiz" },
  { key: "flashcards", label: "Flashcards" },
];

export default function OutputScreen({
  onReset,
  data,
}: {
  onReset: () => void;
  data: OutputData | null;
}) {
  const sections = parseSections(data?.groqResponse ?? "");
  const availableTools = useMemo(
    () =>
      TOOL_CONFIGS.filter(({ key }) => {
        const value = sections[key];
        return typeof value === "string" && value.trim().length > 0;
      }),
    [sections]
  );

  const [activeTool, setActiveTool] = useState<ToolKey | null>(
    availableTools[0]?.key ?? null
  );

  useEffect(() => {
    setActiveTool((current) => {
      if (current && availableTools.some((t) => t.key === current)) {
        return current;
      }
      return availableTools[0]?.key ?? null;
    });
  }, [availableTools]);

  const hasAnySection = availableTools.length > 0;

  return (
    <section className="flex flex-1 items-start justify-center pt-10 px-4">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#3a362b]">Your study pack</h2>
            <p className="mt-1 text-sm text-[#6b6658]">
              Generated from your notes and files. Explore each tool below.
            </p>
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center rounded-full border border-[#e0ded6] px-4 py-2 text-xs font-semibold text-[#3a362b] bg-white hover:bg-[#fff7e5] transition-colors"
          >
            Start Over
          </button>
        </div>

        {hasAnySection && (
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="flex justify-start">
              <div className="inline-flex rounded-full bg-[#f4f1e7] p-1 gap-2">
                {availableTools.map(({ key, label }) => {
                  const isActive = key === activeTool;
                  const baseClasses =
                    "px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors";
                  const activeClasses =
                    "border border-[#b45309] bg-[#b45309] text-white shadow-sm";
                  const inactiveClasses =
                    "border border-[#e0ded6] bg-[#fdfbf6] text-[#6b6658] hover:bg-[#f4f1e7]";

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTool(key)}
                      className={`${baseClasses} ${
                        isActive ? activeClasses : inactiveClasses
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="shrink-0">
              <ExportDropdown
                markdownContent={data?.groqResponse ?? ""}
                title="Study Materials"
              />
            </div>
          </div>
        )}

        

        {!hasAnySection && (
          <div className="rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm text-sm text-[#3a362b]">
            <p className="font-semibold mb-2">Raw model output</p>
            <div className="rounded-xl bg-slate-950 text-slate-50 p-3 text-xs max-h-80 overflow-auto">
              <pre>{data ? data.groqResponse || JSON.stringify(data, null, 2) : "{}"}</pre>
            </div>
          </div>
        )}

        {hasAnySection && (
          <div className="flex flex-col gap-6">
            {activeTool === "summarize" && sections.summarize && (
              parseBySource(sections.summarize).map((block) => (
                <BaseToolLayout
                  key={`summarize-${block.sourceId}`}
                  title={
                    block.sourceLabel === "All sources"
                      ? "Summarize"
                      : `Summarize 9 ${block.sourceLabel}`
                  }
                  body={block.body}
                />
              ))
            )}

            {activeTool === "outline" && sections.outline && (
              parseBySource(sections.outline).map((block) => (
                <OutlineLayout
                  key={`outline-${block.sourceId}`}
                  rawSection={block.body}
                />
              ))
            )}

            {activeTool === "keypoints" && sections.keypoints && (
              // Key Points remain aggregated across all sources for now.
              <KeyPointsLayout rawSection={sections.keypoints} />
            )}

            {activeTool === "quiz" && sections.quiz && (
              parseBySource(sections.quiz).map((block) => (
                <QuizLayout
                  key={`quiz-${block.sourceId}`}
                  rawSection={block.body}
                />
              ))
            )}

            {activeTool === "flashcards" && sections.flashcards && (
              parseBySource(sections.flashcards).map((block) => (
                <FlashcardLayout
                  key={`flashcards-${block.sourceId}`}
                  rawSection={block.body}
                />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
