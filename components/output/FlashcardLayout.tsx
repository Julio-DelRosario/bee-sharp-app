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

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
  const cards = useMemo(
    () => parseFlashcardsSection(rawSection),
    [rawSection]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [cardOrder, setCardOrder] = useState<number[]>([]);
  const [instantReset, setInstantReset] = useState(false);

  useEffect(() => {
    if (cards.length === 0) {
      setCardOrder([]);
      setCurrentIndex(0);
      setIsFlipped(false);
      return;
    }

    const baseOrder = Array.from({ length: cards.length }, (_, index) => index);
    const ordered = shuffle ? shuffleArray(baseOrder) : baseOrder;

    setCardOrder(ordered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards, shuffle]);

  useEffect(() => {
    if (!instantReset) return;

    const id = window.requestAnimationFrame(() => {
      setInstantReset(false);
    });

    return () => window.cancelAnimationFrame(id);
  }, [instantReset]);

  const total = cardOrder.length;

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

  const current =
    total > 0 ? cards[cardOrder[currentIndex] ?? 0] : { front: "", back: "" };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setInstantReset(true);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setInstantReset(true);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
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
          className="group flashcard-3d-button relative w-full max-w-md h-40 md:h-48 flex items-center justify-center text-center text-sm text-[#3a362b] cursor-pointer transition-transform hover:-translate-y-1"
        >
          <div
            className={`flashcard-3d-inner ${
              isFlipped ? "is-flipped" : ""
            } ${
              instantReset ? "no-transition" : ""
            }`}
          >
            <div className="flashcard-face flashcard-front leading-relaxed">
              <div className="w-full text-center">
                <div className="font-semibold tracking-wide text-[#a07a23]">
                  Question:
                </div>
                <div className="whitespace-pre-line">
                  {current.front}
                </div>
              </div>
            </div>
            <div className="flashcard-face flashcard-back leading-relaxed">
              <div className="w-full text-center">
                <div className="font-semibold tracking-wide text-[#7a5c17]">
                  Answer:
                </div>
                <div className="whitespace-pre-line">
                  {current.back || "No answer was parsed for this card."}
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-[#9b978b] opacity-0 group-hover:opacity-100 transition-opacity">
            Click to flip
          </div>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="rounded-full bg-gray-600 border border-[#e0ded6] px-4 py-2 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === total - 1}
            className="rounded-full bg-[#b45309] border border-[#e0ded6] px-4 py-2 text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#b45309]/90"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
