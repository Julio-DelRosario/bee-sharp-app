"use client";

import React, { useState } from "react";
import { exportToWord } from "@/lib/export/exportToWord";
import { exportToPdf } from "@/lib/export/exportPdfFromHtml";
import { PrintLayout } from "../PrintLayout";

interface ExportButtonsProps {
  /** The raw Markdown content to export */
  markdownContent: string;
  /** Optional title for the document */
  title?: string;
  /** Optional custom filename (without extension) */
  filename?: string;
  /** Size variant for the buttons */
  size?: "sm" | "md" | "lg";
  /** Layout direction */
  direction?: "row" | "column";
}

/**
 * ExportButtons - A component that provides PDF and DOCX export functionality
 *
 * This component renders export buttons and includes the hidden PrintLayout
 * component needed for PDF capture.
 *
 * @example
 * ```tsx
 * <ExportButtons
 *   markdownContent={groqResponse}
 *   title="Biology Notes"
 *   filename="biology-study-guide"
 * />
 * ```
 */
export function ExportButtons({
  markdownContent,
  title = "Study Materials",
  filename = "bee-sharp-export",
  size = "md",
  direction = "row",
}: ExportButtonsProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Size variants
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setError(null);

    try {
      // Small delay to ensure PrintLayout is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));
      await exportToPdf(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
      setError("Failed to export PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportWord = async () => {
    setIsExportingWord(true);
    setError(null);

    try {
      await exportToWord(markdownContent, filename);
    } catch (err) {
      console.error("Word export failed:", err);
      setError("Failed to export Word document. Please try again.");
    } finally {
      setIsExportingWord(false);
    }
  };

  const buttonBaseClass = `
    inline-flex items-center justify-center font-medium rounded-full
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const pdfButtonClass = `
    ${buttonBaseClass}
    ${sizeClasses[size]}
    bg-red-600 text-white
    hover:bg-red-700
    focus:ring-red-500
    shadow-sm hover:shadow-md
  `;

  const wordButtonClass = `
    ${buttonBaseClass}
    ${sizeClasses[size]}
    bg-blue-600 text-white
    hover:bg-blue-700
    focus:ring-blue-500
    shadow-sm hover:shadow-md
  `;

  return (
    <>
      {/* Hidden PrintLayout for PDF capture */}
      <PrintLayout markdownContent={markdownContent} title={title} />

      {/* Export Buttons */}
      <div
        className={`flex ${
          direction === "column" ? "flex-col" : "flex-row"
        } gap-2`}
      >
        {/* PDF Export Button */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExportingPdf || !markdownContent}
          className={pdfButtonClass}
          title="Export as PDF"
        >
          {isExportingPdf ? (
            <LoadingSpinner className={iconSizes[size]} />
          ) : (
            <PdfIcon className={iconSizes[size]} />
          )}
          <span>{isExportingPdf ? "Exporting..." : "Export PDF"}</span>
        </button>

        {/* Word Export Button */}
        <button
          type="button"
          onClick={handleExportWord}
          disabled={isExportingWord || !markdownContent}
          className={wordButtonClass}
          title="Export as Word Document"
        >
          {isExportingWord ? (
            <LoadingSpinner className={iconSizes[size]} />
          ) : (
            <WordIcon className={iconSizes[size]} />
          )}
          <span>{isExportingWord ? "Exporting..." : "Export Word"}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon Components
// ─────────────────────────────────────────────────────────────────────────────

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 12v6" />
      <path d="M8 15h4" />
      <path d="M16 12v6" />
    </svg>
  );
}

function WordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h.01" />
      <path d="M12 13h.01" />
      <path d="M16 13h.01" />
      <path d="M8 17h.01" />
      <path d="M12 17h.01" />
      <path d="M16 17h.01" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact Export Dropdown (Alternative)
// ─────────────────────────────────────────────────────────────────────────────

interface ExportDropdownProps {
  markdownContent: string;
  title?: string;
  filename?: string;
}

/**
 * ExportDropdown - A compact dropdown menu for export options
 */
export function ExportDropdown({
  markdownContent,
  title = "Study Materials",
  filename = "bee-sharp-export",
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: "pdf" | "docx") => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      if (type === "pdf") {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await exportToPdf(filename);
      } else {
        await exportToWord(markdownContent, filename);
      }
    } catch (err) {
      console.error(`${type.toUpperCase()} export failed:`, err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PrintLayout markdownContent={markdownContent} title={title} />

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting || !markdownContent}
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full
                     border border-[#e0ded6] bg-white text-[#3a362b]
                     hover:bg-[#fff7e5] transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <DownloadIcon className="w-4 h-4" />
          )}
          <span>{isExporting ? "Exporting..." : "Export"}</span>
          <ChevronDownIcon className="w-3 h-3 ml-1" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg
                        border border-gray-100 overflow-hidden z-50"
          >
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors text-left"
            >
              <PdfIcon className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-gray-400">High-quality document</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleExport("docx")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
            >
              <WordIcon className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium">Export as Word</div>
                <div className="text-xs text-gray-400">Editable .docx file</div>
              </div>
            </button>
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default ExportButtons;
