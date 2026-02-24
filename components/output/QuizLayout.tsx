"use client";

import React, { useState, useEffect } from "react";
import { BaseToolLayout } from "./BaseToolLayout";

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type QuizLayoutProps = {
  rawSection?: string;
};

type GradingEntry = {
  questionId: string;
  status: "Correct" | "Partial" | "Incorrect";
  feedback: string;
};

type GradingResult = {
  results: GradingEntry[];
};

function parseNumberedItems(block: string): string[] {
  if (!block || !block.trim()) return [];

  const lines = block.split(/\r?\n/);
  const items: string[] = [];
  let current: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current.length > 0) {
        items.push(current.join(" "));
        current = [];
      }
      continue;
    }

    if (/^\d+[).\s]/.test(line)) {
      if (current.length > 0) {
        items.push(current.join(" "));
      }
      current = [line.replace(/^\d+[).\s]+/, "").trim()];
    } else {
      if (current.length > 0) {
        current.push(line);
      } else {
        current = [line];
      }
    }
  }

  if (current.length > 0) {
    items.push(current.join(" "));
  }

  return items;
}

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
      const optMatch = optLine.match(/^[A-D][).]\s+(.+)/);
      if (!optMatch) break;
      options.push(optMatch[1].trim());
      i += 1;
    }

    let correctIndex = 0;
    const explanationParts: string[] = [];

    while (i < lines.length) {
      const infoLine = lines[i].trim();

      if (/^\d+\.\s+/.test(infoLine) || /^section\s+[bc]/i.test(infoLine)) {
        break;
      }

      if (/^[A-D][).]\s+/.test(infoLine)) {
        break;
      }

      const answerMatch = infoLine.match(
        /answer\s*[:\-]\s*([A-D])(?:[).])?\s*(.*)/i
      );
      if (answerMatch) {
        const letter = answerMatch[1].toUpperCase();
        const idx = letter.charCodeAt(0) - "A".charCodeAt(0);
        if (idx >= 0 && idx < options.length) {
          correctIndex = idx;
        }
        const rest = (answerMatch[2] || "").trim();
        if (rest) explanationParts.push(rest);
        i += 1;

        while (i < lines.length) {
          const nextTrim = lines[i].trim();
          if (!nextTrim) {
            i += 1;
            break;
          }
          if (
            /^\d+\.\s+/.test(nextTrim) ||
            /^section\s+[bc]/i.test(nextTrim) ||
            /^[A-D][).]\s+/.test(nextTrim)
          ) {
            break;
          }
          explanationParts.push(nextTrim);
          i += 1;
        }
        continue;
      }

      if (/^explanation/i.test(infoLine)) {
        const first = infoLine
          .replace(/^explanation\s*[:\-]?\s*/i, "")
          .trim();
        if (first) explanationParts.push(first);
        i += 1;
        while (i < lines.length) {
          const nextTrim = lines[i].trim();
          if (!nextTrim) {
            i += 1;
            break;
          }
          if (/^\d+\.\s+/.test(nextTrim) || /^section\s+[bc]/i.test(nextTrim)) {
            break;
          }
          explanationParts.push(nextTrim);
          i += 1;
        }
        continue;
      }

      if (infoLine && explanationParts.length > 0) {
        explanationParts.push(infoLine);
        i += 1;
        continue;
      }

      i += 1;
    }

    const explanation = explanationParts.join(" ").trim();

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

export function QuizLayout({ rawSection }: QuizLayoutProps) {
  const questions = parseQuizSection(rawSection);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [mcAnswers, setMcAnswers] = useState<(number | null)[]>([]);
  const [shortAnswers, setShortAnswers] = useState<string[]>([]);
  const [scenarioAnswers, setScenarioAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(
    null
  );
  const [showDetailed, setShowDetailed] = useState(false);

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

  const { sectionBText, sectionCText } = React.useMemo(() => {
    if (!rawSection) return { sectionBText: "", sectionCText: "" };

    const lower = rawSection.toLowerCase();
    const lastAnswerIdx = lower.lastIndexOf("answer:");

    if (lastAnswerIdx < 0) {
      return { sectionBText: "", sectionCText: "" };
    }

    const afterAnswerSegment = rawSection.slice(lastAnswerIdx);
    const newlineIdx = afterAnswerSegment.indexOf("\n");
    const startIndex =
      newlineIdx >= 0 ? lastAnswerIdx + newlineIdx + 1 : rawSection.length;

    const tail = rawSection.slice(startIndex).trim();
    if (!tail) return { sectionBText: "", sectionCText: "" };

    const lines = tail.split(/\r?\n/);
    let dividerIndex = -1;

    for (let idx = 0; idx < lines.length; idx++) {
      if (!lines[idx].trim()) {
        dividerIndex = idx;
        break;
      }
    }

    if (dividerIndex === -1) {
      return { sectionBText: tail.trim(), sectionCText: "" };
    }

    const sectionBLines = lines.slice(0, dividerIndex).join("\n").trim();
    const sectionCLines = lines.slice(dividerIndex + 1).join("\n").trim();

    return {
      sectionBText: sectionBLines,
      sectionCText: sectionCLines,
    };
  }, [rawSection]);

  const sectionBQuestions = React.useMemo(
    () => parseNumberedItems(sectionBText),
    [sectionBText]
  );

  const sectionCQuestions = React.useMemo(
    () => parseNumberedItems(sectionCText),
    [sectionCText]
  );

  const totalCards =
    questions.length + sectionBQuestions.length + sectionCQuestions.length;

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setMcAnswers(Array(questions.length).fill(null));
    setShortAnswers(Array(sectionBQuestions.length).fill(""));
    setScenarioAnswers(Array(sectionCQuestions.length).fill(""));
    setShowResults(false);
    setIsGrading(false);
    setGradingResult(null);
    setShowDetailed(false);
  }, [
    rawSection,
    questions.length,
    sectionBQuestions.length,
    sectionCQuestions.length,
  ]);

  const getCurrentCardInfo = (): {
    kind: "mc" | "short" | "scenario";
    index: number;
  } => {
    if (currentIndex < questions.length) {
      return { kind: "mc", index: currentIndex };
    }
    if (currentIndex < questions.length + sectionBQuestions.length) {
      return {
        kind: "short",
        index: currentIndex - questions.length,
      };
    }
    return {
      kind: "scenario",
      index: currentIndex - questions.length - sectionBQuestions.length,
    };
  };

  const { kind: currentKind, index: localIndex } = getCurrentCardInfo();

  const progressLabel = `Question ${currentIndex + 1} of ${totalCards}`;

  const computeStats = (grading: GradingResult | null) => {
    const totalMc = questions.length;
    const totalB = sectionBQuestions.length;
    const totalC = sectionCQuestions.length;
    const total = totalMc + totalB + totalC;

    let right = 0;
    let wrong = 0;
    let skipped = 0;

    for (let i = 0; i < questions.length; i++) {
      const answer = mcAnswers[i];
      if (answer === null || answer === undefined) {
        skipped++;
      } else if (answer === questions[i].correctIndex) {
        right++;
      } else {
        wrong++;
      }
    }

    const findEntry = (id: string): GradingEntry | undefined =>
      grading?.results.find((r) => r.questionId === id);

    sectionBQuestions.forEach((_, idx) => {
      const answer = shortAnswers[idx]?.trim();
      if (!answer) {
        skipped++;
        return;
      }
      const entry = findEntry(`B${idx + 1}`);
      if (entry?.status === "Correct") {
        right++;
      } else {
        wrong++;
      }
    });

    sectionCQuestions.forEach((_, idx) => {
      const answer = scenarioAnswers[idx]?.trim();
      if (!answer) {
        skipped++;
        return;
      }
      const entry = findEntry(`C${idx + 1}`);
      if (entry?.status === "Correct") {
        right++;
      } else {
        wrong++;
      }
    });

    const percent = total > 0 ? Math.round((right / total) * 100) : 0;

    return { total, right, wrong, skipped, percent };
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1;
      setCurrentIndex(nextIndex);

      if (nextIndex < questions.length) {
        setSelectedOption(mcAnswers[nextIndex] ?? null);
      } else {
        setSelectedOption(null);
      }
    }
  };

  const canGoNext =
    currentKind === "mc" ? mcAnswers[localIndex] !== null : true;

  const handleSelectOption = (index: number) => {
    if (mcAnswers[localIndex] !== null && mcAnswers[localIndex] !== undefined) {
      return;
    }

    setSelectedOption(index);
    setMcAnswers((prev) => {
      const next =
        prev.length === questions.length
          ? [...prev]
          : Array(questions.length)
              .fill(null)
              .map((_, i) => prev[i] ?? null);
      next[localIndex] = index;
      return next;
    });
  };

  const handleResetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setMcAnswers(Array(questions.length).fill(null));
    setShortAnswers(Array(sectionBQuestions.length).fill(""));
    setScenarioAnswers(Array(sectionCQuestions.length).fill(""));
    setShowResults(false);
    setIsGrading(false);
    setGradingResult(null);
    setShowDetailed(false);
  };

  const handleGradeAndShowResults = async () => {
    if (showResults || isGrading) return;

    setIsGrading(true);

    try {
      const shortPayload = sectionBQuestions.map((q, idx) => ({
        questionId: `B${idx + 1}`,
        question: q,
        studentAnswer: shortAnswers[idx] || "",
      }));

      const scenarioPayload = sectionCQuestions.map((q, idx) => ({
        questionId: `C${idx + 1}`,
        question: q,
        studentAnswer: scenarioAnswers[idx] || "",
      }));

      const hasAnyFreeResponse =
        shortPayload.some((p) => p.studentAnswer.trim()) ||
        scenarioPayload.some((p) => p.studentAnswer.trim());

      let grading: GradingResult | null = null;

      if (hasAnyFreeResponse) {
        const response = await fetch("/api/quiz/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shortAnswer: shortPayload,
            scenarios: scenarioPayload,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          grading = data.grading as GradingResult;
        }
      }

      setGradingResult(grading);
      setShowResults(true);
    } catch (error) {
      console.error("Failed to grade quiz answers", error);
      setGradingResult(null);
      setShowResults(true);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#3a362b]">Quiz</h3>
        {!showResults && (
          <span className="text-sm text-[#6b6658]">{progressLabel}</span>
        )}
      </div>
      <div className="h-px bg-[#e7e3d7]" />

      {showResults ? (
        <ResultsView
          stats={computeStats(gradingResult)}
          grading={gradingResult}
          questions={questions}
          mcAnswers={mcAnswers}
          sectionBQuestions={sectionBQuestions}
          sectionCQuestions={sectionCQuestions}
          shortAnswers={shortAnswers}
          scenarioAnswers={scenarioAnswers}
          showDetailed={showDetailed}
          onToggleDetailed={() => setShowDetailed((prev) => !prev)}
          onRetake={handleResetQuiz}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {currentKind === "mc" && (
            <>
              <p className="text-base font-semibold text-[#3a362b]">
                {questions[localIndex].question}
              </p>

              <div className="space-y-2">
                {questions[localIndex].options.map((option, index) => {
                  const storedAnswer = mcAnswers[localIndex];
                  const hasAnswered =
                    storedAnswer !== null && storedAnswer !== undefined;
                  const isSelected =
                    (hasAnswered ? storedAnswer : selectedOption) === index;
                  const isCorrect =
                    index === questions[localIndex].correctIndex;
                  const showCorrect = hasAnswered && isCorrect;
                  const showIncorrect =
                    hasAnswered && isSelected && !isCorrect;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectOption(index)}
                      disabled={hasAnswered}
                      className={[
                        "w-full text-left rounded-xl border px-3 py-2 text-sm transition-colors disabled:cursor-default",
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

              {(() => {
                const storedAnswer = mcAnswers[localIndex];
                const hasAnswered =
                  storedAnswer !== null && storedAnswer !== undefined;

                if (!hasAnswered) return null;

                const chosenIndex = storedAnswer as number;
                const isRight =
                  chosenIndex === questions[localIndex].correctIndex;

                return (
                  <div className="mt-3 rounded-lg border border-[#e0ded6] bg-[#fdfbf6] px-4 py-3 text-xs text-[#3a362b]">
                    <p
                      className={[
                        "font-semibold mb-1 flex items-center gap-1",
                        isRight ? "text-green-700" : "text-red-700",
                      ].join(" ")}
                    >
                      {isRight ? "Correct answer" : "Wrong answer"}
                    </p>
                    <p className="mb-1 text-[#3a362b]">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mr-1">
                        Correct choice
                      </span>
                      <span className="text-gray-900">
                        {String.fromCharCode(
                          "A".charCodeAt(0) +
                            questions[localIndex].correctIndex
                        )}
                      </span>
                    </p>
                    {questions[localIndex].explanation && (
                      <div className="pt-1 border-t border-black/5 mt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                          Explanation
                        </p>
                        <p className="text-gray-900 leading-snug">
                          {questions[localIndex].explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          {currentKind === "short" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#3a362b]">
                Section B – Short Answer
              </p>
              <div className="rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-3 py-2">
                <p className="text-xs font-semibold text-[#7e7a6b] mb-1">
                  Question {localIndex + 1}
                </p>
                <p className="text-sm mb-3">{sectionBQuestions[localIndex]}</p>
                <textarea
                  value={shortAnswers[localIndex] || ""}
                  onChange={(e) => {
                    const next = [...shortAnswers];
                    next[localIndex] = e.target.value;
                    setShortAnswers(next);
                  }}
                  placeholder="Type your answer here..."
                  className="mt-1 w-full rounded-lg border border-[#e0ded6] bg-white px-3 py-2 text-xs text-[#3a362b] focus:outline-none focus:ring-2 focus:ring-[#f4b544] focus:border-transparent min-h-20"
                />
              </div>
            </div>
          )}

          {currentKind === "scenario" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#3a362b]">
                Section C – Application / Critical Thinking
              </p>
              <div className="rounded-xl bg-[#fdfbf6] border border-[#e0ded6] px-3 py-2">
                <p className="text-xs font-semibold text-[#7e7a6b] mb-1">
                  Scenario {localIndex + 1}
                </p>
                <p className="text-sm mb-3">
                  {sectionCQuestions[localIndex]}
                </p>
                <textarea
                  value={scenarioAnswers[localIndex] || ""}
                  onChange={(e) => {
                    const next = [...scenarioAnswers];
                    next[localIndex] = e.target.value;
                    setScenarioAnswers(next);
                  }}
                  placeholder="How would you respond in this situation?"
                  className="mt-1 w-full rounded-lg border border-[#e0ded6] bg-white px-3 py-2 text-xs text-[#3a362b] focus:outline-none focus:ring-2 focus:ring-[#f4b544] focus:border-transparent min-h-25"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end items-center gap-3 mt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full border border-[#cfcdc8] px-4 py-2 text-xs text-[#6b6658] disabled:opacity-0 disabled:cursor-not-allowed hover:bg-[#f4f1e7]"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={async () => {
                const isLast = currentIndex === totalCards - 1;
                if (isLast) {
                  await handleGradeAndShowResults();
                } else {
                  if (currentIndex < totalCards - 1) {
                    const nextIndex = currentIndex + 1;
                    setCurrentIndex(nextIndex);
                    if (nextIndex < questions.length) {
                      setSelectedOption(mcAnswers[nextIndex] ?? null);
                    } else {
                      setSelectedOption(null);
                    }
                  }
                }
              }}
              className="rounded-full bg-[#b45309] px-4 py-2 text-xs text-white cursor-pointer disabled:bg-[#e0ded6] disabled:text-[#9b978b] disabled:cursor-not-allowed"
              disabled={!canGoNext || isGrading}
            >
              {currentIndex === totalCards - 1
                ? isGrading
                  ? "Grading..."
                  : "Done"
                : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type ResultsViewProps = {
  stats: {
    total: number;
    right: number;
    wrong: number;
    skipped: number;
    percent: number;
  };
  grading: GradingResult | null;
  questions: QuizQuestion[];
  mcAnswers: (number | null)[];
  sectionBQuestions: string[];
  sectionCQuestions: string[];
  shortAnswers: string[];
  scenarioAnswers: string[];
  showDetailed: boolean;
  onToggleDetailed: () => void;
  onRetake: () => void;
};

function ResultsView({
  stats,
  grading,
  questions,
  mcAnswers,
  sectionBQuestions,
  sectionCQuestions,
  shortAnswers,
  scenarioAnswers,
  showDetailed,
  onToggleDetailed,
  onRetake,
}: ResultsViewProps) {
  const findEntry = (id: string): GradingEntry | undefined =>
    grading?.results.find((r) => r.questionId === id);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-[#FEFCF6] border border-[#e0ded6] p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6 shadow-sm">
        <div className="flex-1 flex items-center justify-center">
          <div className="relative h-28 w-28 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-[#f4e4b8] fill-none"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-[#b45309] fill-none transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * stats.percent) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3a362b] rotate-0">
              <p className="text-lg font-semibold">
                {stats.right}/{stats.total}
              </p>
              <p className="text-xs text-[#7e7a6b]">{stats.percent}%</p>
            </div>
          </div>
        </div>
        <div className="flex-2 flex flex-col justify-center gap-2 text-sm text-[#3a362b]">
          <p className="text-base font-semibold">You did it! Quiz complete.</p>
          <p className="text-xs text-[#7e7a6b]">
            Review where you’re strong and where to focus next.
          </p>
          <div className="mt-1  flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Right</span>
              <span className="font-semibold text-emerald-700">
                {stats.right}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Wrong</span>
              <span className="font-semibold text-rose-700">
                {stats.wrong}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Skipped</span>
              <span className="font-semibold text-[#7e7a6b]">
                {stats.skipped}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <button
          type="button"
          onClick={onRetake}
          className="rounded-full border border-[#e0ded6] px-4 py-2 text-xs font-semibold text-[#3a362b] bg-white hover:bg-[#fff7e5] transition-colors"
        >
          Retake quiz
        </button>
        <button
          type="button"
          onClick={onToggleDetailed}
          className="rounded-full bg-[#b45309] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#92400e] transition-colors"
        >
          {showDetailed ? "Hide answers" : "Show answers"}
        </button>
      </div>

      {showDetailed && (
        <div className="mt-4 space-y-4 text-sm text-[#3a362b]">
          <div className="rounded-2xl bg-[#FEFCF6] border border-[#e0ded6] p-4 shadow-sm">
            <p className="font-semibold mb-2">Section A – Multiple Choice</p>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const user = mcAnswers[idx];
                const isCorrect = user === q.correctIndex;
                const skipped = user === null || user === undefined;
                const statusLabel = skipped
                  ? "Skipped"
                  : isCorrect
                  ? "Correct"
                  : "Wrong";

                const cardColorClasses = skipped
                  ? "bg-[#fdfbf6] border-[#e0ded6]"
                  : isCorrect
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-rose-50 border-rose-200";
                const badgeColor = skipped
                  ? "bg-[#e0ded6] text-[#3a362b]"
                  : isCorrect
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800";

                return (
                  <div
                    key={idx}
                    className={`relative rounded-xl border px-5 py-5 ${cardColorClasses}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold text-[#2f2b21] leading-snug">
                        Q{idx + 1}. {q.question}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeColor}`}
                      >
                        {skipped ? (
                          <span className="mr-1 text-xs">–</span>
                        ) : isCorrect ? (
                          <span className="mr-1 flex items-center justify-center">
                            <CheckCircleIconSmall />
                          </span>
                        ) : (
                          <span className="mr-1 flex items-center justify-center">
                            <XCircleIconSmall />
                          </span>
                        )}
                        {statusLabel}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                          Your answer
                        </p>
                        <p className="text-gray-900">
                          {skipped
                            ? "(none)"
                            : String.fromCharCode(
                                "A".charCodeAt(0) + (user ?? 0)
                              )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                          Correct answer
                        </p>
                        <p className="text-gray-900">
                          {String.fromCharCode(
                            "A".charCodeAt(0) + q.correctIndex
                          )}
                        </p>
                      </div>
                      {q.explanation && (
                        <div className="pt-1 border-t border-black/5 mt-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                            Explanation
                          </p>
                          <p className="text-gray-900 leading-snug">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-[#FEFCF6] border border-[#e0ded6] p-4 shadow-sm">
            <p className="font-semibold mb-2">Section B – Short Answer</p>
            <div className="space-y-3">
              {sectionBQuestions.map((q, idx) => {
                const entry = findEntry(`B${idx + 1}`);
                const answer = shortAnswers[idx] || "";
                const isCorrect = entry?.status === "Correct";
                const isIncorrect = entry?.status === "Incorrect";
                const cardColorClasses = !entry
                  ? "bg-[#fdfbf6] border-[#e0ded6]"
                  : isCorrect
                  ? "bg-emerald-50 border-emerald-200"
                  : isIncorrect
                  ? "bg-rose-50 border-rose-200"
                  : "bg-amber-50 border-amber-200";
                const badgeColor = !entry
                  ? "bg-[#e0ded6] text-[#3a362b]"
                  : isCorrect
                  ? "bg-emerald-100 text-emerald-800"
                  : isIncorrect
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800";
                return (
                  <div
                    key={idx}
                    className={`relative rounded-xl border px-5 py-5 ${cardColorClasses}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold text-[#2f2b21] leading-snug">
                        Q{idx + 1}. {q}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeColor}`}
                      >
                        {!entry ? (
                          <span className="mr-1 text-xs">–</span>
                        ) : isCorrect ? (
                          <span className="mr-1 flex items-center justify-center">
                            <CheckCircleIconSmall />
                          </span>
                        ) : isIncorrect ? (
                          <span className="mr-1 flex items-center justify-center">
                            <XCircleIconSmall />
                          </span>
                        ) : (
                          <span className="mr-1 text-xs">~</span>
                        )}
                        {entry?.status ?? "Not graded"}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                          Your answer
                        </p>
                        <p className="text-gray-900 whitespace-pre-line">
                          {answer || "(none)"}
                        </p>
                      </div>
                      {entry && (
                        <div className="pt-1 border-t border-black/5 mt-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                            Feedback
                          </p>
                          <p className="text-gray-900 leading-snug whitespace-pre-line">
                            {entry.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-[#FEFCF6] border border-[#e0ded6] p-4 shadow-sm">
            <p className="font-semibold mb-2">
              Section C – Application / Critical Thinking
            </p>
            <div className="space-y-3">
              {sectionCQuestions.map((q, idx) => {
                const entry = findEntry(`C${idx + 1}`);
                const answer = scenarioAnswers[idx] || "";
                const isCorrect = entry?.status === "Correct";
                const isIncorrect = entry?.status === "Incorrect";
                const cardColorClasses = !entry
                  ? "bg-[#fdfbf6] border-[#e0ded6]"
                  : isCorrect
                  ? "bg-emerald-50 border-emerald-200"
                  : isIncorrect
                  ? "bg-rose-50 border-rose-200"
                  : "bg-amber-50 border-amber-200";
                const badgeColor = !entry
                  ? "bg-[#e0ded6] text-[#3a362b]"
                  : isCorrect
                  ? "bg-emerald-100 text-emerald-800"
                  : isIncorrect
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800";
                return (
                  <div
                    key={idx}
                    className={`relative rounded-xl border px-5 py-5 ${cardColorClasses}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold text-[#2f2b21] leading-snug">
                        Scenario {idx + 1}. {q}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeColor}`}
                      >
                        {!entry ? (
                          <span className="mr-1 text-xs">–</span>
                        ) : isCorrect ? (
                          <span className="mr-1 flex items-center justify-center">
                            <CheckCircleIconSmall />
                          </span>
                        ) : isIncorrect ? (
                          <span className="mr-1 flex items-center justify-center">
                            <XCircleIconSmall />
                          </span>
                        ) : (
                          <span className="mr-1 text-xs">~</span>
                        )}
                        {entry?.status ?? "Not graded"}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                          Your answer
                        </p>
                        <p className="text-gray-900 whitespace-pre-line">
                          {answer || "(none)"}
                        </p>
                      </div>
                      {entry && (
                        <div className="pt-1 border-t border-black/5 mt-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                            Feedback
                          </p>
                          <p className="text-gray-900 leading-snug whitespace-pre-line">
                            {entry.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircleIconSmall() {
  return (
    <svg
      className="w-3.5 h-3.5 text-current"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fillRule="evenodd"
        d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XCircleIconSmall() {
  return (
    <svg
      className="w-3.5 h-3.5 text-current"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fillRule="evenodd"
        d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm7.707-3.707a1 1 0 0 0-1.414 1.414L10.586 12l-2.293 2.293a1 1 0 1 0 1.414 1.414L12 13.414l2.293 2.293a1 1 0 0 0 1.414-1.414L13.414 12l2.293-2.293a1 1 0 0 0-1.414-1.414L12 10.586 9.707 8.293Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
