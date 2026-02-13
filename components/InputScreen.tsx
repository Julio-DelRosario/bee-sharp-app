"use client"

import React, { useState } from "react";
import LoadingScreen from "./LoadingScreen";
import OutputScreen from "./OutputScreen";
import HexButton from "./UI/HexButton";

export default function InputScreen() {
  const [step, setStep] = useState<"input" | "loading" | "output">("input");
  const [prompt, setPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

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
      <div className="w-full max-w-4xl rounded-2xl bg-[#FEFCF6] py-6 px-8 shadow-sm">
        <div className="w-full h-40 rounded-xl bg-[#f6f4ef] border-2 border-dashed border-[#d3d1cb]" />

        <div className="mt-6 flex flex-col gap-4">
          {/* Study Tool Selection */}
          <div className="rounded-xl px-6 py-5 flex flex-col gap-6">
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
                </div>
                
                {/* Bottom Row */}
                <div className="-mt-8 flex justify-center">
                  <HexButton
                    label="Key Terms"
                    selected={selectedTools.includes("Key Terms")}
                    onClick={() => toggleTool("Key Terms")}
                  />
                  <HexButton
                    label="Simplify"
                    selected={selectedTools.includes("Simplify")}
                    onClick={() => toggleTool("Simplify")}
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
    </section>
  );
}
