import React from "react";
import { getWordCount, getReadingTimeMinutes } from "./BaseToolLayout";

type OutlineNode = {
  text: string;
  level: number;
  marker?: string;
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

  const parseLine = (line: string): { level: number; marker: string; text: string } => {
    const romanMatch = line.match(/^((?=[IVXLCDM]*[IVXL])[IVXLCDM]+\.)\s*/i);
    if (romanMatch) {
      return {
        level: 0,
        marker: romanMatch[1],
        text: line.replace(/^([IVXLCDM]+\.)\s*/i, "").trim(),
      };
    }

    const upperMatch = line.match(/^([A-Z]\.)\s+/);
    if (upperMatch) {
      return {
        level: 1,
        marker: upperMatch[1],
        text: line.replace(/^([A-Z]\.)\s+/, "").trim(),
      };
    }

    const numberMatch = line.match(/^(\d+\.)\s+/);
    if (numberMatch) {
      return {
        level: 2,
        marker: numberMatch[1],
        text: line.replace(/^(\d+\.)\s+/, "").trim(),
      };
    }

    const lowerMatch = line.match(/^([a-z]\.)\s+/);
    if (lowerMatch) {
      return {
        level: 3,
        marker: lowerMatch[1],
        text: line.replace(/^([a-z]\.)\s+/, "").trim(),
      };
    }

    const currentLevel = stack.length > 0 ? stack[stack.length - 1].level : 0;
    return {
      level: currentLevel,
      marker: "",
      text: line.trim(),
    };
  };

  for (const line of lines) {
    const isBullet = /^[-•]\s+/.test(line);

    let level: number;
    let marker: string;
    let text: string;

    if (isBullet) {
      const headingParent = [...stack]
        .slice()
        .reverse()
        .find((n) => n.level <= 1);
      const parentLevel = headingParent ? headingParent.level : 0;
      level = parentLevel + 1;
      marker = "";
      text = line.replace(/^[-•]\s+/, "").trim();
    } else {
      const parsed = parseLine(line);
      level = parsed.level;
      marker = parsed.marker;
      text = parsed.text;
    }
    if (!text) continue;

    const node: OutlineNode = { text, level, marker, children: [] };

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

function OutlineList({ nodes, level }: { nodes: OutlineNode[]; level: number }) {
  if (!nodes.length) return null;

  const isBulletLevel = level >= 2;
  const indentClass =
    level === 0 ? "" : level === 1 ? "ml-6" : level === 2 ? "ml-8" : "ml-12";

  return (
    <ul className={`${isBulletLevel ? "list-disc pl-5" : ""} ${indentClass} space-y-1`}>
      {nodes.map((node, index) => (
        <li key={index} className="text-sm text-[#3a362b]">
          <div className={node.level <= 1 ? "font-semibold" : ""}>
            {node.level <= 1 && (
              <span className="mr-2">
                {node.level === 1 ? `${index + 1}.` : node.marker}
              </span>
            )}
            <span>{node.text}</span>
          </div>
          {node.children.length > 0 && (
            <div className="mt-1">
              <OutlineList
                nodes={node.children}
                level={node.children[0]?.level ?? node.level + 1}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function OutlineLayout({ rawSection }: OutlineLayoutProps) {
  console.log("[Structured Outline] rawSection:", rawSection);

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
      <div className="rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-4 py-3">
        {tree.length > 0 ? (
          <OutlineList nodes={tree} level={0} />
        ) : (
          <p className="text-xs text-[#9b978b]">No outline content available.</p>
        )}
      </div>
    </div>
  );
}
