import React from "react";
import { getWordCount, getReadingTimeMinutes } from "./BaseToolLayout";

type KeyPointsLayoutProps = {
  rawSection?: string;
};

type ParsedKeyPoints = {
  points: { title: string; explanation: string }[];
};

/**
 * Helper to strip surrounding brackets from text: "[text]" -> "text"
 */
function stripBrackets(text: string): string {
  return text.replace(/^\[/, "").replace(/\]$/, "").trim();
}

function parseKeyPoints(rawSection: string | undefined): ParsedKeyPoints {
  if (!rawSection) return { points: [] };

  // Try JSON format first (legacy)
  const jsonStart = rawSection.indexOf("{");
  if (jsonStart !== -1) {
    const jsonText = rawSection.slice(jsonStart).trim();
    try {
      const parsed = JSON.parse(jsonText) as {
        type?: string;
        title?: string;
        data?: { rank?: number; title?: string; explanation?: string }[];
      };

      if (parsed && Array.isArray(parsed.data)) {
        const points = parsed.data
          .map((item) => ({
            title: stripBrackets(item.title || ""),
            explanation: stripBrackets(item.explanation || ""),
          }))
          .filter((p) => p.title || p.explanation);
        if (points.length > 0) {
          return { points };
        }
      }
    } catch {
      // JSON parse failed, continue to markdown parsing
    }
  }

  // No insights support: treat entire section as key points block
  const working = rawSection.trim();

  // ========================================
  // STEP 2: Parse Key Points
  // ========================================
  const points: { title: string; explanation: string }[] = [];
  const lines = working.split(/\r?\n/);
  
  let currentTitle = "";
  let currentExplanation = "";
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Skip section headers
    if (/^#{1,6}\s*(Key\s*Points|Summary)/i.test(trimmed)) continue;
    
    // Match bold numbered title: **1. Title** or **1. [Title]**
    const boldNumMatch = trimmed.match(/^\*\*\s*\d+\.\s*(.+?)\s*\*\*$/);
    if (boldNumMatch) {
      // Save previous point
      if (currentTitle && currentExplanation) {
        points.push({ 
          title: stripBrackets(currentTitle), 
          explanation: stripBrackets(currentExplanation) 
        });
      }
      currentTitle = boldNumMatch[1].trim();
      currentExplanation = "";
      continue;
    }
    
    // Match plain numbered title without bold: 1. Title
    const plainNumMatch = trimmed.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?$/);
    if (plainNumMatch && !trimmed.startsWith("-") && !trimmed.startsWith("*")) {
      if (currentTitle && currentExplanation) {
        points.push({ 
          title: stripBrackets(currentTitle), 
          explanation: stripBrackets(currentExplanation) 
        });
      }
      currentTitle = plainNumMatch[1].replace(/\*\*/g, "").trim();
      currentExplanation = "";
      continue;
    }
    
    // Bullet point under a title = explanation
    const bulletMatch = trimmed.match(/^[\-\*•]\s*(.+)$/);
    if (bulletMatch && currentTitle) {
      const bulletText = stripBrackets(bulletMatch[1]);
      currentExplanation = currentExplanation 
        ? currentExplanation + " " + bulletText 
        : bulletText;
      continue;
    }
    
    // Plain text continuation (not a header, not a bullet)
    if (currentTitle && !trimmed.startsWith("#")) {
      currentExplanation = currentExplanation 
        ? currentExplanation + " " + trimmed 
        : trimmed;
    }
  }
  
  // Push the last point
  if (currentTitle && currentExplanation) {
    points.push({ 
      title: stripBrackets(currentTitle), 
      explanation: stripBrackets(currentExplanation) 
    });
  }

  return { points };
}

export function KeyPointsLayout({ rawSection }: KeyPointsLayoutProps) {
  const wordCount = getWordCount(rawSection || "");
  const minutes = getReadingTimeMinutes(wordCount);
  const { points } = parseKeyPoints(rawSection);

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

      </div>
    </div>
  );
}
