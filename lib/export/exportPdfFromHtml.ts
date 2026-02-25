"use client";

import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 15;

// Content area dimensions
const CONTENT_WIDTH_MM = A4_WIDTH_MM - 2 * MARGIN_MM;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - 2 * MARGIN_MM;

/**
 * Export the PDF container element to a high-quality A4 PDF
 * 
 * This utility captures the hidden PrintLayout component using html2canvas
 * and generates a properly paginated A4 PDF document.
 */
export async function exportToPdf(
  filename: string = "bee-sharp-study-materials"
): Promise<void> {
  // Get the container element
  const container = document.getElementById("pdf-export-container");

  if (!container) {
    throw new Error(
      "PDF export container not found. Make sure PrintLayout is rendered."
    );
  }

  // Temporarily make the container visible for capture
  const originalStyles = {
    position: container.style.position,
    left: container.style.left,
    top: container.style.top,
  };

  // Move to visible area temporarily (still off-screen visually)
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";

  try {
    // High-quality canvas scaling
    const scale = 2; // 2x for crisp rendering

    // Capture the container with html2canvas
    const canvas = await html2canvas(container, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      // Ensure proper rendering
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
      // Fix for Tailwind CSS v4 lab()/oklch() colors that html2canvas can't parse
      onclone: (clonedDoc) => {
        // Remove all existing stylesheets that might contain lab()/oklch() colors
        const styleSheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
        styleSheets.forEach((sheet) => {
          // Keep only inline styles on the pdf-export-container
          if (!sheet.closest("#pdf-export-container")) {
            sheet.remove();
          }
        });
        
        // Inject safe CSS reset that uses only hex/rgb colors
        const safeStyle = clonedDoc.createElement("style");
        safeStyle.textContent = `
          * {
            --tw-ring-color: rgba(59, 130, 246, 0.5) !important;
            --tw-ring-offset-color: #ffffff !important;
            --tw-border-opacity: 1 !important;
            --tw-bg-opacity: 1 !important;
            --tw-text-opacity: 1 !important;
          }
          :root {
            --background: #F6F1DD !important;
            --foreground: #171717 !important;
            color-scheme: light !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          #pdf-export-container {
            position: static !important;
            left: auto !important;
          }
          #pdf-export-container * {
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
          }
        `;
        clonedDoc.head.appendChild(safeStyle);
      },
    });

    // Create PDF document in portrait A4
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Calculate dimensions for proper scaling
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Convert canvas to image data
    const imgData = canvas.toDataURL("image/png", 1.0);

    // Calculate the width to fit within content area
    const imgWidthMM = CONTENT_WIDTH_MM;
    const imgHeightMM = (canvasHeight / canvasWidth) * imgWidthMM;

    // Calculate number of pages needed
    const pageHeightMM = CONTENT_HEIGHT_MM;
    const totalPages = Math.ceil(imgHeightMM / pageHeightMM);

    // Add pages with proper slicing
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Calculate the slice of the image to show on this page
      const yOffset = page * pageHeightMM;

      // Create a temporary canvas for the current page slice
      const pageCanvas = document.createElement("canvas");
      const ctx = pageCanvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Calculate pixels per mm based on the scaled canvas
      const pxPerMM = canvasWidth / imgWidthMM;

      // Page dimensions in pixels
      const pageWidthPx = canvasWidth;
      const pageHeightPx = Math.min(
        pageHeightMM * pxPerMM,
        canvasHeight - yOffset * pxPerMM
      );

      pageCanvas.width = pageWidthPx;
      pageCanvas.height = pageHeightPx;

      // Draw the slice of the original canvas
      ctx.drawImage(
        canvas,
        0, // source x
        yOffset * pxPerMM, // source y
        pageWidthPx, // source width
        pageHeightPx, // source height
        0, // dest x
        0, // dest y
        pageWidthPx, // dest width
        pageHeightPx // dest height
      );

      // Convert the slice to image data
      const pageImgData = pageCanvas.toDataURL("image/png", 1.0);

      // Calculate actual height for this page
      const actualHeightMM = pageHeightPx / pxPerMM;

      // Add image to PDF
      pdf.addImage(
        pageImgData,
        "PNG",
        MARGIN_MM, // x position
        MARGIN_MM, // y position
        CONTENT_WIDTH_MM, // width
        actualHeightMM // height
      );

      // Add page number footer (optional - comment out if not needed)
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175); // gray-400
      pdf.text(
        `Page ${page + 1} of ${totalPages}`,
        A4_WIDTH_MM / 2,
        A4_HEIGHT_MM - 8,
        { align: "center" }
      );
    }

    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } finally {
    // Restore original styles
    container.style.position = originalStyles.position;
    container.style.left = originalStyles.left;
    container.style.top = originalStyles.top;
  }
}

/**
 * Alternative simpler export that fits entire content on pages
 * without complex slicing (uses jsPDF's built-in pagination)
 */
export async function exportToPdfSimple(
  filename: string = "bee-sharp-study-materials"
): Promise<void> {
  const container = document.getElementById("pdf-export-container");

  if (!container) {
    throw new Error(
      "PDF export container not found. Make sure PrintLayout is rendered."
    );
  }

  // Temporarily position for capture
  const originalPosition = container.style.position;
  const originalLeft = container.style.left;
  container.style.position = "absolute";
  container.style.left = "0";

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Reset position
    container.style.position = originalPosition;
    container.style.left = originalLeft;

    const imgData = canvas.toDataURL("image/png", 1.0);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth - 2 * MARGIN_MM;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    let heightLeft = imgHeight;
    let position = MARGIN_MM;
    let pageNumber = 1;

    // Add first page
    pdf.addImage(
      imgData,
      "PNG",
      MARGIN_MM,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pdfHeight - 2 * MARGIN_MM;

    // Add subsequent pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + MARGIN_MM;
      pdf.addPage();
      pageNumber++;
      pdf.addImage(
        imgData,
        "PNG",
        MARGIN_MM,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pdfHeight - 2 * MARGIN_MM;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    container.style.position = originalPosition;
    container.style.left = originalLeft;
    throw error;
  }
}

export default exportToPdf;
