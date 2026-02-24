"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BaseToolLayout } from "./BaseToolLayout";

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

export function FlashcardLayout({ rawSection }: FlashcardLayoutProps) {
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
