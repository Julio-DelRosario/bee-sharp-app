import React from "react";
import { getWordCount, getReadingTimeMinutes } from "./BaseToolLayout";

type OutlineNode = {
  text: string;
  level: number;
  children: OutlineNode[];
};

type OutlineLayoutProps = {
  rawSection?: string;
};

function buildOutlineTree(rawSection: string | undefined): OutlineNode[] {
  if (!rawSection) return [];

  const lines = rawSection
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^structured outline/i.test(l));

  const roots: OutlineNode[] = [];
  const stack: OutlineNode[] = [];

  const getLevel = (line: string): number => {
    if (/^[IVXLCDM]+\./i.test(line)) return 0;
    if (/^[A-Z]\.\s+/.test(line)) return 1;
    if (/^\d+\.\s+/.test(line)) return 2;
    if (/^[a-z]\.\s+/.test(line)) return 3;
    return stack.length > 0 ? stack[stack.length - 1].level : 0;
  };

  const stripMarker = (line: string): string => {
    return line
      .replace(/^[IVXLCDM]+\.\s*/i, "")
      .replace(/^[A-Z]\.\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/^[a-z]\.\s+/, "")
      .trim();
  };

  for (const line of lines) {
    const level = getLevel(line);
    const text = stripMarker(line);
    if (!text) continue;

    const node: OutlineNode = { text, level, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function OutlineList({ nodes }: { nodes: OutlineNode[] }) {
  if (!nodes.length) return null;

  return (
    <ul className="space-y-1">
      {nodes.map((node, index) => (
        <li key={index} className="text-sm text-[#3a362b]">
          <div
            className={
              node.level === 0
                ? "font-semibold"
                : node.level === 1
                ? "ml-4"
                : node.level === 2
                ? "ml-8"
                : "ml-12"
            }
          >
            {node.text}
          </div>
          {node.children.length > 0 && (
            <div className="mt-1 ml-4 border-l border-[#e0ded6] pl-3">
              <OutlineList nodes={node.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function OutlineLayout({ rawSection }: OutlineLayoutProps) {
  const wordCount = getWordCount(rawSection || "");
  const minutes = getReadingTimeMinutes(wordCount);
  const tree = buildOutlineTree(rawSection);

  return (
    <div className="rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#3a362b]">Structured Outline</h3>
        <div className="flex items-center gap-3 text-[11px] text-[#6b6658]">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="h-3 w-px bg-[#d3d1cb]" />
          <span>{minutes} min read</span>
        </div>
      </div>
      <div className="h-px bg-[#e7e3d7]" />
      <div className="max-h-80 overflow-y-auto rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-4 py-3">
        {tree.length > 0 ? (
          <OutlineList nodes={tree} />
        ) : (
          <p className="text-xs text-[#9b978b]">No outline content available.</p>
        )}
      </div>
    </div>
  );
}
