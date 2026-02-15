"use client"

import React, { useState, useRef } from "react";
import LoadingScreen from "./LoadingScreen";
import OutputScreen from "./OutputScreen";
import HexButton from "./UI/HexButton";

export default function InputScreen() {
  const [step, setStep] = useState<"input" | "loading" | "output">("input");
  const [prompt, setPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [inputTab, setInputTab] = useState<"upload" | "notes">("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && files.length === 0) {
      // Nothing to process; stay on input step
      return;
    }

    setStep("loading");

    try {
      const formData = new FormData();
      formData.append("notes", prompt);
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      setStep("output");
    } catch (error) {
      setResult({ status: "error", message: "Failed to process input." });
      setStep("output");
    }
  };

  const handleReset = () => {
    setStep("input");
    setResult(null);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files
      ? Array.from(event.dataTransfer.files)
      : [];
    if (dropped.length === 0) return;
    setFiles((prev) => [...prev, ...dropped]);
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) return;
    setIsDragging(false);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (step === "loading") return <LoadingScreen />;
  if (step === "output") return <OutputScreen onReset={handleReset} data={result} />;

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
                <div
                  className="relative w-full h-full flex flex-col gap-3 text-[#3a362b] text-sm"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                >
                  {isDragging && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f4b544] bg-[#fff7e5]/90 text-xs text-[#6b6658] z-10">
                      <p className="font-semibold text-[#3a362b]">Drop files here</p>
                      <p>PDF, DOCX, PPTX, or TXT</p>
                    </div>
                  )}
                  {files.length === 0 ? (
                    <div className="flex-1 rounded-xl border-2 border-dashed border-[#d3d1cb] bg-[#f6f4ef] flex flex-col items-center justify-center gap-2 px-4 py-6 text-[#6b6658]">
                      <p className="font-semibold">Upload your study files</p>
                      <p className="text-xs text-[#9b978b] text-center">
                        Drag and drop PDF, DOCX, PPTX, or TXT here, or click
                        below to browse
                      </p>
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        className="mt-1 rounded-full border border-[#e0b74f] px-4 py-1 text-xs font-semibold text-[#3a362b] bg-white hover:bg-[#fff7e5] transition-colors"
                      >
                        Browse files
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 w-full space-y-2">
                        {files.map((file, index) => {
                          const ext = file.name.split(".").pop()?.toLowerCase() || "";
                          const typeLabel =
                            ext === "pdf"
                              ? "PDF"
                              : ext === "doc" || ext === "docx"
                              ? "DOCX"
                              : ext === "ppt" || ext === "pptx"
                              ? "PPTX"
                              : ext.toUpperCase();

                          const badgeClass =
                            ext === "pdf"
                              ? "bg-[#fef3f2] text-[#b42318]"
                              : ext === "doc" || ext === "docx"
                              ? "bg-[#eff4ff] text-[#1d4ed8]"
                              : ext === "ppt" || ext === "pptx"
                              ? "bg-[#fff4ed] text-[#c05621]"
                              : "bg-[#f3f4f6] text-[#374151]";

                          const sizeInMB = file.size / (1024 * 1024);
                          const sizeLabel =
                            sizeInMB < 1
                              ? `${(file.size / 1024).toFixed(0)} KB`
                              : `${sizeInMB.toFixed(1)} MB`;

                          return (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between rounded-xl bg-white shadow-sm px-3 py-2"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`flex h-8 w-10 items-center justify-center rounded-md text-[10px] font-semibold ${badgeClass}`}
                                >
                                  {typeLabel || "FILE"}
                                </div>
                                <span className="truncate text-xs" title={file.name}>
                                  {file.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] text-[#9b978b]">
                                  {sizeLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(index)}
                                  className="text-[11px] text-[#b91c1c] hover:text-[#7f1d1d]"
                                  aria-label="Remove file"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        className="self-center mt-1 rounded-full border border-[#e0b74f] px-4 py-1 text-xs font-semibold text-[#3a362b] bg-white hover:bg-[#fff7e5] transition-colors"
                      >
                        Add More Files
                      </button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,image/*"
                    className="hidden"
                    onChange={handleFilesSelected}
                  />
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
