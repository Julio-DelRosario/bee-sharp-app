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
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) => {
      if (prev.includes(tool)) {
        return prev.filter((t) => t !== tool);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, tool];
    });
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
      // Send the selected study tools to the API so it can
      // tailor the Groq prompt and outputs.
      formData.append("tools", JSON.stringify(selectedTools));
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
    setFiles((prev) => {
      const MAX_FILES = 3;
      const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 MB

      let next: File[] = [...prev];
      for (const file of selected) {
        if (next.length >= MAX_FILES) {
          setFileError("You can upload a maximum of 3 files.");
          break;
        }

        const totalBytes = next.reduce((sum, f) => sum + f.size, 0) + file.size;
        if (totalBytes > MAX_TOTAL_BYTES) {
          setFileError(
            "Combined file size is too large. Please keep uploads under 4 MB."
          );
          break;
        }

        next.push(file);
      }

      if (next.length === prev.length && !fileError) {
        setFileError("No files were added. Check the limits.");
      }

      return next;
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files
      ? Array.from(event.dataTransfer.files)
      : [];
    if (dropped.length === 0) return;
    setFiles((prev) => {
      const MAX_FILES = 3;
      const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 MB

      let next: File[] = [...prev];
      for (const file of dropped) {
        if (next.length >= MAX_FILES) {
          setFileError("You can upload a maximum of 3 files.");
          break;
        }

        const totalBytes = next.reduce((sum, f) => sum + f.size, 0) + file.size;
        if (totalBytes > MAX_TOTAL_BYTES) {
          setFileError(
            "Combined file size is too large. Please keep uploads under 4 MB."
          );
          break;
        }

        next.push(file);
      }

      if (next.length === prev.length && !fileError) {
        setFileError("No files were added. Check the limits.");
      }

      return next;
    });
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
    setFileError(null);
  };

  if (step === "loading") return <LoadingScreen />;
  if (step === "output") return <OutputScreen onReset={handleReset} data={result} />;

  return (
    <section className="flex flex-1 items-start justify-center pt-6 sm:pt-10 px-3 sm:px-4">
      <div className="w-full max-w-5xl flex flex-col gap-4 sm:gap-6">
        <div className="mx-auto max-w-xl pb-2 sm:pb-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Sharpen your mind.
          </h1>
          <p className="mt-2 sm:mt-3 text-xs text-slate-600 sm:text-sm md:text-base">
            Upload slides, textbook pages, or paste your notes. The bees filter the noise and keep the honey.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-stretch">
          {/* Left Panel */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="h-full rounded-2xl bg-[#FEFCF6] py-4 sm:py-6 px-4 sm:px-8 shadow-sm flex flex-col">
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
                      <p>PDF, DOCX, PPTX, TXT, or MD</p>
                    </div>
                  )}
                  {files.length === 0 ? (
                    <div
                      onClick={handleBrowseClick}
                      className="flex-1 rounded-xl border-2 border-dashed border-[#d3d1cb] bg-[#f6f4ef] flex flex-col items-center justify-center gap-3 px-4 py-8 text-[#6b6658] cursor-pointer hover:border-[#f4b544] hover:bg-[#fdf9f0] transition-colors"
                    >
                      {/* Cloud Upload Icon */}
                      <svg
                        className="w-12 h-12 text-[#c5c3bb]"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                        />
                      </svg>
                      <p className="text-base font-bold text-[#3a362b]">Drag & drop files here</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBrowseClick();
                        }}
                        className="text-sm text-[#e0b74f] hover:text-[#c9a03e] hover:underline transition-colors"
                      >
                        or click to browse
                      </button>
                      <p className="mt-2 text-[11px] text-[#9b978b]">
                        PDF, DOCX, PPTX, TXT, MD. Max 3 files (4MB total).
                      </p>
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
                      <div className="flex items-center justify-between text-[11px] text-[#6b6658] mt-1">
                        <span>
                          {files.length}/3 files
                        </span>
                        <span>
                          {(
                            files.reduce((sum, f) => sum + f.size, 0) /
                            (1024 * 1024)
                          ).toFixed(2)}{" "}
                          MB / 4.00 MB
                        </span>
                      </div>
                      {fileError && (
                        <p className="mt-1 text-[11px] text-[#b91c1c]">
                          {fileError}
                        </p>
                      )}
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
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,image/*"
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
          <div className="w-full md:w-1/2 rounded-2xl bg-[#FEFCF6] py-4 sm:py-6 px-4 sm:px-8 shadow-sm flex flex-col justify-between gap-4 sm:gap-6">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="text-center">
                <h2 className="text-base sm:text-lg font-semibold text-[#3a362b]">
                  Study Tool Selection
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6b6658]">
                  Select the study materials you want to generate.
                </p>
              </div>

              <div className="flex justify-center">
                {/* Honeycomb layout - responsive for all screen sizes */}
                <div className="flex flex-col items-center gap-2 scale-[1] sm:scale-100 origin-top">
                  {/* Top Row */}
                  <div className="flex justify-center">
                    <HexButton
                      label="Summarize"
                      selected={selectedTools.includes("Summarize")}
                      onClick={() => toggleTool("Summarize")}
                      icon={
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 5V4a1 1 0 0 0-1-1H8.914a1 1 0 0 0-.707.293L4.293 7.207A1 1 0 0 0 4 7.914V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5M9 3v4a1 1 0 0 1-1 1H4m11.383.772 2.745 2.746m1.215-3.906a2.089 2.089 0 0 1 0 2.953l-6.65 6.646L9 17.95l.739-3.692 6.646-6.646a2.087 2.087 0 0 1 2.958 0Z"/>
                        </svg>
                      }
                    />
                    <HexButton
                      label="Structured Outline"
                      selected={selectedTools.includes("Structured Outline")}
                      onClick={() => toggleTool("Structured Outline")}
                      icon={
                        <svg className="w-7 h-7 sm:w-10 sm:h-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M9 8h10M9 12h10M9 16h10M4.99 8H5m-.02 4h.01m0 4H5"/>
                        </svg>
                      }
                    />
                    <HexButton
                      label="Key Points"
                      selected={selectedTools.includes("Key Points")}
                      onClick={() => toggleTool("Key Points")}
                      icon={
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9a3 3 0 0 1 3-3m-2 15h4m0-3c0-4.1 4-4.9 4-9A6 6 0 1 0 6 9c0 4 4 5 4 9h4Z"/>
                        </svg>
                      }
                    />
                  </div>

                  {/* Bottom Row */}
                  <div className="-mt-6 sm:-mt-8 flex justify-center">
                    <HexButton
                      label="Quiz"
                      selected={selectedTools.includes("Quiz")}
                      onClick={() => toggleTool("Quiz")}
                      icon={
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.5A2.493 2.493 0 0 1 7.51 20H7.5a2.468 2.468 0 0 1-2.4-3.154 2.98 2.98 0 0 1-.85-5.274 2.468 2.468 0 0 1 .92-3.182 2.477 2.477 0 0 1 1.876-3.344 2.5 2.5 0 0 1 3.41-1.856A2.5 2.5 0 0 1 12 5.5m0 13v-13m0 13a2.493 2.493 0 0 0 4.49 1.5h.01a2.468 2.468 0 0 0 2.403-3.154 2.98 2.98 0 0 0 .847-5.274 2.468 2.468 0 0 0-.921-3.182 2.477 2.477 0 0 0-1.875-3.344A2.5 2.5 0 0 0 14.5 3 2.5 2.5 0 0 0 12 5.5m-8 5a2.5 2.5 0 0 1 3.48-2.3m-.28 8.551a3 3 0 0 1-2.953-5.185M20 10.5a2.5 2.5 0 0 0-3.481-2.3m.28 8.551a3 3 0 0 0 2.954-5.185"/>
                        </svg>
                      }
                    />
                    <HexButton
                      label="Flashcards"
                      selected={selectedTools.includes("Flashcards")}
                      onClick={() => toggleTool("Flashcards")}
                      icon={
                        <svg className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M8 5a1 1 0 0 1 1-1h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1a1 1 0 1 1 0-2h1V6H9a1 1 0 0 1-1-1Z" clipRule="evenodd"/>
                          <path fillRule="evenodd" d="M4 7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H4Zm0 11v-5.5h11V18H4Z" clipRule="evenodd"/>
                        </svg>
                      }
                    />
                  </div>
                </div>
              </div>

              <div
                className={`text-xs text-center ${
                  selectedTools.length >= 3
                    ? "text-[#b91c1c] font-semibold"
                    : "text-[#6b6658]"
                }`}
              >
                <span>
                  {selectedTools.length}/3 tools selected
                </span>
                {selectedTools.length < 3 ? (
                  <span className="ml-1">(you can choose up to 3)</span>
                ) : (
                  <span className="ml-1">maximum of 3 tools selected</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="h-12 w-full rounded-xl bg-[#f4b544] text-sm font-semibold text-[#3a362b] shadow-md hover:bg-[#f1ae35] transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
