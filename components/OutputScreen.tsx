"use client";

import React, {useState, useEffect, useMemo} from "react";

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

function getWordCount(text: string | undefined): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length;
}

function getReadingTimeMinutes(wordCount: number): number {
  if (!wordCount) return 0;
  const wordsPerMinute = 180;
  return Math.max(1, Math.round(wordCount / wordsPerMinute));
}

type BaseToolLayoutProps = {
  title: string;
  body?: string;
};

function BaseToolLayout({ title, body }: BaseToolLayoutProps) {
  const wordCount = getWordCount(body || "");
  const minutes = getReadingTimeMinutes(wordCount);

  const paragraphs = (body || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

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
      <div className="max-h-80 overflow-y-auto rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-4 py-3 text-sm text-[#3a362b] leading-relaxed">
        {paragraphs.length > 0 ? (
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

function OutlineLayout({ rawSection }: OutlineLayoutProps) {
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

type KeyPointsLayoutProps = {
  rawSection?: string;
};

type ParsedKeyPoints = {
  points: { title: string; explanation: string }[];
  insights?: string;
};

function parseKeyPoints(rawSection: string | undefined): ParsedKeyPoints {
  if (!rawSection) return { points: [] };

  // Try to parse JSON-shaped key points first.
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
      // fall through to plain-text parsing
    }
  }

  // Fallback: parse markdown-style numbered list.
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

function KeyPointsLayout({ rawSection }: KeyPointsLayoutProps) {
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
                <div className="text-xs font-semibold text-[#b45309] mb-1">
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
          <div className="mt-2 rounded-xl bg-[#fff7e5] border border-[#f3e2c0] px-4 py-3 text-xs text-[#3a362b]">
            <p className="font-semibold mb-1 text-[#b45309]">Insights</p>
            <p className="leading-relaxed">{insights}</p>
          </div>
        )}
      </div>
    </div>
  );
}

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type QuizLayoutProps = {
  rawSection?: string;
};

function parseQuizSection(rawSection: string | undefined): QuizQuestion[] {
  if (!rawSection) return [];

  const sectionAIndex = rawSection.toLowerCase().indexOf("section a");
  const sectionBIndex = rawSection.toLowerCase().indexOf("section b");

  const relevant =
    sectionAIndex >= 0
      ? rawSection.slice(
          sectionAIndex,
          sectionBIndex > sectionAIndex ? sectionBIndex : undefined
        )
      : rawSection;

  const lines = relevant.split(/\r?\n/);
  const questions: QuizQuestion[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (!qMatch) {
      i += 1;
      continue;
    }

    const questionText = qMatch[2].trim();
    i += 1;

    const options: string[] = [];
    while (i < lines.length) {
      const optLine = lines[i].trim();
      const optMatch = optLine.match(/^[A-D][\).]\s+(.+)/);
      if (!optMatch) break;
      options.push(optMatch[1].trim());
      i += 1;
    }

    let correctIndex = 0;
    let explanation = "";

    while (i < lines.length) {
      const infoLine = lines[i].trim();
      const answerMatch = infoLine.match(/answer\s*[:\-]\s*([A-D])/i);
      if (answerMatch) {
        const letter = answerMatch[1].toUpperCase();
        const idx = letter.charCodeAt(0) - "A".charCodeAt(0);
        if (idx >= 0 && idx < options.length) {
          correctIndex = idx;
        }
        i += 1;
        continue;
      }

      if (/^explanation/i.test(infoLine)) {
        const parts: string[] = [];
        const first = infoLine.replace(/^explanation\s*[:\-]?\s*/i, "").trim();
        if (first) parts.push(first);
        i += 1;
        while (i < lines.length && lines[i].trim() && !/^\d+\.\s+/.test(lines[i].trim())) {
          parts.push(lines[i].trim());
          i += 1;
        }
        explanation = parts.join(" ");
        break;
      }

      if (/^\d+\.\s+/.test(infoLine)) {
        break;
      }

      i += 1;
    }

    if (questionText && options.length > 0) {
      questions.push({
        question: questionText,
        options,
        correctIndex,
        explanation: explanation || undefined,
      });
    }
  }

  return questions;
}

function QuizLayout({ rawSection }: QuizLayoutProps) {
  const questions = parseQuizSection(rawSection);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentIndex]);

  if (!rawSection) {
    return (
      <BaseToolLayout title="Quiz" body="No quiz content was generated." />
    );
  }

  if (questions.length === 0) {
    return (
      <BaseToolLayout
        title="Quiz"
        body={
          "An interactive quiz layout will appear here once quiz questions are structured. For now, the raw quiz content is shown below.\n\n" +
          rawSection
        }
      />
    );
  }

  const current = questions[currentIndex];
  const progressLabel = `Question ${currentIndex + 1} of ${questions.length}`;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const canGoNext = selectedOption !== null;
  const hasAnswered = selectedOption !== null;

  return (
    <div className="rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#3a362b]">Quiz</h3>
        <span className="text-[11px] text-[#6b6658]">{progressLabel}</span>
      </div>
      <div className="h-px bg-[#e7e3d7]" />

      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-[#3a362b]">{current.question}</p>

        <div className="space-y-2">
          {current.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === current.correctIndex;
            const showCorrect = hasAnswered && isCorrect;
            const showIncorrect = hasAnswered && isSelected && !isCorrect;

            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedOption(index)}
                className={[
                  "w-full text-left rounded-xl border px-3 py-2 text-sm transition-colors",
                  isSelected
                    ? "border-[#e0b74f] bg-[#fff7e5] text-[#3a362b]"
                    : "border-[#e0ded6] bg-[#fdfbf6] text-[#3a362b] hover:bg-[#fff7e5]",
                  showCorrect ? "border-green-500 bg-green-50" : "",
                  showIncorrect ? "border-red-500 bg-red-50" : "",
                ].join(" ")}
              >
                <span className="mr-2 font-semibold text-xs text-[#7e7a6b]">
                  {String.fromCharCode("A".charCodeAt(0) + index)}.
                </span>
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="rounded-full border border-[#e0ded6] px-3 py-1 text-xs text-[#6b6658] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#f4f1e7]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext || currentIndex === questions.length - 1}
            className="rounded-full border border-[#e0ded6] px-3 py-1 text-xs text-[#6b6658] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#f4f1e7]"
          >
            Next
          </button>
        </div>

        {hasAnswered && (
          <div className="mt-2 rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-3 py-2 text-xs text-[#3a362b]">
            <p className="font-semibold mb-1">
              {selectedOption === current.correctIndex
                ? "Correct! "
                : "Incorrect. "}
              Correct answer: {String.fromCharCode("A".charCodeAt(0) + current.correctIndex)}
            </p>
            {current.explanation && <p>{current.explanation}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

type Flashcard = {
  front: string;
  back: string;
};

type FlashcardLayoutProps = {
  rawSection?: string;
};

function parseFlashcardsSection(rawSection: string | undefined): Flashcard[] {
  if (!rawSection) return [];
  const cards: Flashcard[] = [];

  const normalized = rawSection
    .replace(/\s+/g, " ")
    .replace(/(\d+\.)\s*Q:/g, "\n$1 Q:")
    .trim();

  const inlineRegex = /\d+\.\s*Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=\n\d+\.\s*Q:|$)/g;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(normalized)) !== null) {
    const front = match[1].trim();
    const back = match[2].trim();
    if (front && back) {
      cards.push({ front, back });
    }
  }

  if (cards.length > 0) return cards;

  const multilineRegex = /Q:\s*(.+?)\nA:\s*([\s\S]*?)(?=\nQ:|\nSection|$)/g;
  while ((match = multilineRegex.exec(rawSection)) !== null) {
    const front = match[1].trim();
    const back = match[2].trim();
    if (front && back) {
      cards.push({ front, back });
    }
  }

  return cards;
}

function FlashcardLayout({ rawSection }: FlashcardLayoutProps) {
  const cards = parseFlashcardsSection(rawSection);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  const effectiveCards = useMemo(() => {
    if (!shuffle || cards.length === 0) return cards;
    return [...cards].sort(() => Math.random() - 0.5);
  }, [cards, shuffle]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [shuffle]);

  const total = effectiveCards.length;

  if (!rawSection) {
    return (
      <BaseToolLayout title="Flashcards" body="No flashcard content was generated." />
    );
  }

  if (total === 0) {
    return (
      <BaseToolLayout
        title="Flashcards"
        body={
          "An interactive flashcard deck will appear here once flashcards are structured. For now, the raw flashcard content is shown below.\n\n" +
          rawSection
        }
      />
    );
  }

  const current = effectiveCards[currentIndex];

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const progressLabel = `${total === 0 ? 0 : currentIndex + 1} / ${total}`;

  return (
    <div className="rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col gap-4 items-stretch">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#3a362b]">Flashcards</h3>
        <div className="flex items-center gap-3 text-[11px] text-[#6b6658]">
          <span>{progressLabel}</span>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="h-3 w-3 rounded border-[#d3d1cb] text-[#e0b74f] focus:ring-[#e0b74f]"
            />
            <span>Shuffle</span>
          </label>
        </div>
      </div>
      <div className="h-px bg-[#e7e3d7]" />

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="relative w-full max-w-md h-40 md:h-48 rounded-2xl bg-[#fdfbf6] border border-[#e0ded6] shadow-sm flex items-center justify-center px-4 text-center text-sm text-[#3a362b] transition-transform hover:-translate-y-0.5"
        >
          <div className="absolute top-2 right-3 text-[11px] text-[#9b978b]">
            {isFlipped ? "Back" : "Front"}
          </div>
          <span className="leading-relaxed">
            {isFlipped ? current.back : current.front}
          </span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="rounded-full border border-[#e0ded6] px-3 py-1 text-xs text-[#6b6658] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#f4f1e7]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === total - 1}
            className="rounded-full border border-[#e0ded6] px-3 py-1 text-xs text-[#6b6658] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#f4f1e7]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
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
          <div className="mt-2 flex justify-start">
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
              <BaseToolLayout title="Summarize" body={sections.summarize} />
            )}

            {activeTool === "outline" && sections.outline && (
              <OutlineLayout rawSection={sections.outline} />
            )}

            {activeTool === "keypoints" && sections.keypoints && (
              <KeyPointsLayout rawSection={sections.keypoints} />
            )}

            {activeTool === "quiz" && sections.quiz && (
              <QuizLayout rawSection={sections.quiz} />
            )}

            {activeTool === "flashcards" && sections.flashcards && (
              <FlashcardLayout rawSection={sections.flashcards} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
