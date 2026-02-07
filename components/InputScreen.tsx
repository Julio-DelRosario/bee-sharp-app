"use client"

import React, { useState } from "react";
import LoadingScreen from "./LoadingScreen";
import OutputScreen from "./OutputScreen";

export default function InputScreen() {
  const [step, setStep] = useState<"input" | "loading" | "output">("input");
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    setStep("loading");
    setTimeout(() => setStep("output"), 1000);
  };

  const handleReset = () => setStep("input");

  if (step === "loading") return <LoadingScreen />;
  if (step === "output") return <OutputScreen onReset={handleReset} />;

  return (
    <section className="flex flex-1 items-start justify-center pt-20">
      <div className="max-w-4xl w-full mx-auto text-center px-6">
        <div className="mx-auto max-w-xl pb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sharpen your mind.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Upload slides, textbook pages, or paste your notes. The bees filter the noise and keep the honey.
          </p>
        </div>

        <div className="mt-6 w-full text-left">
          <div className="mx-auto w-full max-w-2xl">
            <div className="relative mt-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-yellow-200 bg-white px-4 py-4 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-200/10"
                placeholder="Describe what you want to learn..."
                style={{ resize: "none" }}
              />
            <div className="flex absolute left-4 bottom-5 gap-3 text-[#D97706]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
            </div>

            <button
                onClick={handleGenerate}
                className="absolute right-4 bottom-4 items-center inline-flex rounded-lg bg-[#D97706] px-3 py-2 gap-2 text-sm text-white"
            >
                Generate Reviewer
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
