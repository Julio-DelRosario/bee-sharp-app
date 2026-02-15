"use client"

import React, { useState } from "react";
import LoadingScreen from "./LoadingScreen";
import OutputScreen from "./OutputScreen";
import HexButton from "./UI/HexButton";

export default function InputScreen() {
  const [step, setStep] = useState<"input" | "loading" | "output">("input");
  const [prompt, setPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [inputTab, setInputTab] = useState<"upload" | "notes">("upload");

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleGenerate = () => {
    setStep("loading");
    setTimeout(() => setStep("output"), 1000);
  };

  const handleReset = () => setStep("input");

  if (step === "loading") return <LoadingScreen />;
  if (step === "output") return <OutputScreen onReset={handleReset} />;

  return (
    <section className="flex flex-1 items-start justify-center pt-6 px-4">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <div className="mx-auto max-w-xl pb-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sharpen your mind.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Upload slides, textbook pages, or paste your notes. The bees filter the noise and keep the honey.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          {/* Left Panel */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="h-full rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col">
              <div className="mb-4 text-center">
                <h2 className="text-lg font-semibold text-[#3a362b]">
                  Add your notes
                </h2>
              </div>
              <div className="inline-flex mx-auto rounded-full bg-[#f4f1e7] p-1 text-xs font-medium text-[#6b6658] mb-4">
                <button
                  type="button"
                  onClick={() => setInputTab("upload")}
                  className={`${
                    inputTab === "upload"
                      ? "bg-white text-[#3a362b] shadow-sm"
                      : "text-[#7e7a6b]"
                  } px-4 py-1 rounded-full transition-colors`}
                >
                  Upload files
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab("notes")}
                  className={`${
                    inputTab === "notes"
                      ? "bg-white text-[#3a362b] shadow-sm"
                      : "text-[#7e7a6b]"
                  } px-4 py-1 rounded-full transition-colors`}
                >
                  Paste notes (optional)
                </button>
              </div>

              {inputTab === "upload" ? (
                <div className="w-full h-full rounded-xl bg-[#f6f4ef] border-2 border-dashed border-[#d3d1cb] flex flex-col items-center justify-center gap-2 text-[#6b6658] text-sm">
                  <span className="font-semibold">Upload Files</span>
                  <span className="text-xs text-[#9b978b]">PDF, slides, or documents</span>
                  <button
                    type="button"
                    className="mt-2 rounded-full border border-[#e0b74f] px-4 py-1 text-xs font-semibold text-[#3a362b] bg-white hover:bg-[#fff7e5] transition-colors"
                  >
                    Browse files
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-semibold text-[#3a362b] mb-2">
                    Paste Notes (Optional)
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Paste your notes here..."
                    className="mt-1 w-full flex-1 rounded-xl border border-[#e0ded6] bg-[#fdfbf6] px-3 py-2 text-sm text-[#3a362b] focus:outline-none focus:ring-2 focus:ring-[#f4b544] focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-1/2 rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-[#3a362b] text-center">
                Study Tool Selection
              </h2>

              {/* Honeycomb layout */}
              <div className="flex justify-center">
                {/* Desktop / tablet honeycomb */}
                <div className="hidden md:flex flex-col items-center gap-2">
                  {/* Top Row */}
                  <div className="flex justify-center">
                    <HexButton
                      label="Summarize"
                      selected={selectedTools.includes("Summarize")}
                      onClick={() => toggleTool("Summarize")}
                    />
                    <HexButton
                      label="Structured Outline"
                      selected={selectedTools.includes("Structured Outline")}
                      onClick={() => toggleTool("Structured Outline")}
                    />
                    <HexButton
                      label="Key Points"
                      selected={selectedTools.includes("Key Points")}
                      onClick={() => toggleTool("Key Points")}
                    />
                  </div>

                  {/* Bottom Row */}
                  <div className="-mt-8 flex justify-center">
                    <HexButton
                      label="Quiz"
                      selected={selectedTools.includes("Quiz")}
                      onClick={() => toggleTool("Quiz")}
                    />
                    <HexButton
                      label="Flashcards"
                      selected={selectedTools.includes("Flashcards")}
                      onClick={() => toggleTool("Flashcards")}
                    />
                  </div>
                </div>

                {/* Mobile layout: compact grid that still feels connected */}
                <div className="grid grid-cols-2 gap-4 place-items-center md:hidden">
                  <HexButton
                    label="Reviewer"
                    selected={selectedTools.includes("Reviewer")}
                    onClick={() => toggleTool("Reviewer")}
                  />
                  <HexButton
                    label="Quiz"
                    selected={selectedTools.includes("Quiz")}
                    onClick={() => toggleTool("Quiz")}
                  />
                  <HexButton
                    label="Flashcards"
                    selected={selectedTools.includes("Flashcards")}
                    onClick={() => toggleTool("Flashcards")}
                  />
                  <HexButton
                    label="Key Terms"
                    selected={selectedTools.includes("Key Terms")}
                    onClick={() => toggleTool("Key Terms")}
                  />
                  <div className="col-span-2 -mt-4 flex justify-center">
                    <HexButton
                      label="Simplify"
                      selected={selectedTools.includes("Simplify")}
                      onClick={() => toggleTool("Simplify")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="h-12 w-full rounded-full bg-[#f4b544] text-sm font-semibold text-[#3a362b] shadow-md hover:bg-[#f1ae35] transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
