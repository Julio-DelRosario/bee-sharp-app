"use client";

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  LevelFormat,
  convertInchesToTwip,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";
import { saveAs } from "file-saver";
import { marked, Token, Tokens } from "marked";

// ─────────────────────────────────────────────────────────────────────────────
// Types for parsed inline tokens
// ─────────────────────────────────────────────────────────────────────────────
interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse inline tokens (bold, italic, code, links, plain text)
// ─────────────────────────────────────────────────────────────────────────────
function parseInlineTokens(tokens: Token[] | undefined): InlineRun[] {
  if (!tokens || tokens.length === 0) return [];

  const runs: InlineRun[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "text":
        runs.push({ text: (token as Tokens.Text).text });
        break;

      case "strong":
        // Bold text - recursively parse children
        const strongToken = token as Tokens.Strong;
        const boldChildren = parseInlineTokens(strongToken.tokens);
        for (const child of boldChildren) {
          runs.push({ ...child, bold: true });
        }
        break;

      case "em":
        // Italic text
        const emToken = token as Tokens.Em;
        const italicChildren = parseInlineTokens(emToken.tokens);
        for (const child of italicChildren) {
          runs.push({ ...child, italic: true });
        }
        break;

      case "codespan":
        // Inline code
        runs.push({
          text: (token as Tokens.Codespan).text,
          code: true,
        });
        break;

      case "link":
        // Links - just use the text
        const linkToken = token as Tokens.Link;
        const linkChildren = parseInlineTokens(linkToken.tokens);
        runs.push(...linkChildren);
        break;

      case "image":
        // Images - use alt text as placeholder
        const imgToken = token as Tokens.Image;
        const altText = (imgToken as unknown as { alt?: string }).alt || imgToken.text || imgToken.href;
        runs.push({ text: `[Image: ${altText}]` });
        break;

      case "br":
        runs.push({ text: "\n" });
        break;

      case "escape":
        runs.push({ text: (token as Tokens.Escape).text });
        break;

      default:
        // Fallback: try to extract raw text
        if ("text" in token && typeof (token as { text: string }).text === "string") {
          runs.push({ text: (token as { text: string }).text });
        } else if ("raw" in token && typeof (token as { raw: string }).raw === "string") {
          runs.push({ text: (token as { raw: string }).raw });
        }
    }
  }

  return runs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert InlineRun[] to TextRun[]
// ─────────────────────────────────────────────────────────────────────────────
function createTextRuns(inlineRuns: InlineRun[]): TextRun[] {
  return inlineRuns.map((run) => {
    return new TextRun({
      text: run.text,
      bold: run.bold,
      italics: run.italic,
      font: run.code ? "Consolas" : "Calibri",
      size: run.code ? 20 : 22, // 10pt for code, 11pt for normal
      shading: run.code
        ? { fill: "f0f0f0", type: "clear", color: "auto" }
        : undefined,
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Map heading depth to HeadingLevel
// ─────────────────────────────────────────────────────────────────────────────
function getHeadingLevel(depth: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (depth) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    case 6:
      return HeadingLevel.HEADING_6;
    default:
      return HeadingLevel.HEADING_1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Process list items recursively
// ─────────────────────────────────────────────────────────────────────────────
function processListItems(
  items: Tokens.ListItem[],
  ordered: boolean,
  level: number = 0
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Get inline content from the list item
    let inlineRuns: InlineRun[] = [];

    // Process tokens in the list item
    for (const token of item.tokens) {
      if (token.type === "text" || token.type === "paragraph") {
        const textToken = token as Tokens.Text | Tokens.Paragraph;
        if (textToken.tokens) {
          inlineRuns.push(...parseInlineTokens(textToken.tokens));
        } else if ("text" in textToken) {
          inlineRuns.push({ text: textToken.text });
        }
      } else if (token.type === "list") {
        // Nested list - process recursively after this item
        const nestedList = token as Tokens.List;
        const nestedParagraphs = processListItems(
          nestedList.items,
          nestedList.ordered,
          level + 1
        );
        // First add the current item, then nested items
        if (inlineRuns.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: createTextRuns(inlineRuns),
              bullet: ordered
                ? undefined
                : { level },
              numbering: ordered
                ? { reference: "numberedList", level }
                : undefined,
              spacing: { after: 80 },
            })
          );
          inlineRuns = [];
        }
        paragraphs.push(...nestedParagraphs);
      }
    }

    // Add paragraph for this item if we have content
    if (inlineRuns.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: createTextRuns(inlineRuns),
          bullet: ordered
            ? undefined
            : { level },
          numbering: ordered
            ? { reference: "numberedList", level }
            : undefined,
          spacing: { after: 80 },
        })
      );
    }
  }

  return paragraphs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main token processing function
// ─────────────────────────────────────────────────────────────────────────────
function processTokens(tokens: Token[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "heading": {
        const headingToken = token as Tokens.Heading;
        const inlineRuns = parseInlineTokens(headingToken.tokens);
        paragraphs.push(
          new Paragraph({
            children: createTextRuns(inlineRuns),
            heading: getHeadingLevel(headingToken.depth),
            spacing: {
              before: headingToken.depth === 1 ? 400 : 280,
              after: 120,
            },
          })
        );
        break;
      }

      case "paragraph": {
        const paraToken = token as Tokens.Paragraph;
        const inlineRuns = parseInlineTokens(paraToken.tokens);
        paragraphs.push(
          new Paragraph({
            children: createTextRuns(inlineRuns),
            spacing: { after: 160 },
          })
        );
        break;
      }

      case "list": {
        const listToken = token as Tokens.List;
        const listParagraphs = processListItems(
          listToken.items,
          listToken.ordered
        );
        paragraphs.push(...listParagraphs);
        break;
      }

      case "code": {
        const codeToken = token as Tokens.Code;
        // Render code block as pre-formatted text
        const codeLines = codeToken.text.split("\n");
        for (const line of codeLines) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line || " ",
                  font: "Consolas",
                  size: 18, // 9pt
                }),
              ],
              shading: { fill: "f5f5f5", type: "clear", color: "auto" },
              spacing: { after: 0 },
              indent: { left: convertInchesToTwip(0.25) },
            })
          );
        }
        // Add spacing after code block
        paragraphs.push(new Paragraph({ spacing: { after: 160 } }));
        break;
      }

      case "blockquote": {
        const quoteToken = token as Tokens.Blockquote;
        const quoteParagraphs = processTokens(quoteToken.tokens);
        for (const p of quoteParagraphs) {
          // Add left border styling via indent
          paragraphs.push(
            new Paragraph({
              ...p,
              indent: { left: convertInchesToTwip(0.5) },
              border: {
                left: { style: "single", size: 12, color: "cccccc" },
              },
            })
          );
        }
        break;
      }

      case "hr": {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "─".repeat(50) })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
        break;
      }

      case "space": {
        // Empty line
        paragraphs.push(new Paragraph({ spacing: { after: 120 } }));
        break;
      }

      case "html": {
        // Skip HTML blocks in Word export
        break;
      }

      default: {
        // Fallback: try to render raw text
        if ("raw" in token && typeof (token as { raw: string }).raw === "string") {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: (token as { raw: string }).raw })],
              spacing: { after: 160 },
            })
          );
        }
      }
    }
  }

  return paragraphs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch and convert logo SVG to PNG buffer
// ─────────────────────────────────────────────────────────────────────────────
async function fetchLogoAsBuffer(): Promise<ArrayBuffer | null> {
  try {
    // Create an image from the SVG
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, 48, 48);
        
        // Convert to PNG blob
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          blob.arrayBuffer().then(resolve).catch(() => resolve(null));
        }, "image/png");
      };
      
      img.onerror = () => resolve(null);
      img.src = "/logo.svg";
    });
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Create the Bee Sharp branded header
// ─────────────────────────────────────────────────────────────────────────────
function createBeeSharpHeader(logoBuffer?: ArrayBuffer): Paragraph[] {
  const headerChildren: (TextRun | ImageRun)[] = [];
  
  // Add logo if available
  if (logoBuffer) {
    headerChildren.push(
      new ImageRun({
        data: logoBuffer,
        transformation: {
          width: 36,
          height: 36,
        },
        type: "png",
      })
    );
    headerChildren.push(
      new TextRun({
        text: "  ",
      })
    );
  }
  
  headerChildren.push(
    new TextRun({
      text: "Bee Sharp",
      bold: true,
      size: 32, // 16pt
      color: "b45309", // Amber-700
    })
  );
  headerChildren.push(
    new TextRun({
      text: "  |  Study Materials",
      size: 24,
      color: "6b7280",
    })
  );

  return [
    new Paragraph({
      children: headerChildren,
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on ${new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          size: 18,
          color: "9ca3af",
          italics: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      border: {
        bottom: { style: "single", size: 6, color: "e5e7eb" },
      },
      spacing: { after: 300 },
    }),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export function
// ─────────────────────────────────────────────────────────────────────────────
export async function exportToWord(
  markdownContent: string,
  filename: string = "bee-sharp-study-materials"
): Promise<void> {
  // Fetch logo for header
  const logoBuffer = await fetchLogoAsBuffer();

  // Parse markdown into tokens
  const tokens = marked.lexer(markdownContent);

  // Process tokens into docx paragraphs
  const contentParagraphs = processTokens(tokens);

  // Create branded header with logo
  const headerParagraphs = createBeeSharpHeader(logoBuffer ?? undefined);

  // Create document with numbering definitions for ordered lists
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "numberedList",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } },
            },
            {
              level: 1,
              format: LevelFormat.LOWER_LETTER,
              text: "%2)",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) } } },
            },
            {
              level: 2,
              format: LevelFormat.LOWER_ROMAN,
              text: "%3.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.25) } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
          },
        },
        heading1: {
          run: {
            font: "Calibri",
            size: 32, // 16pt
            bold: true,
            color: "1f2937",
          },
          paragraph: {
            spacing: { before: 400, after: 120 },
          },
        },
        heading2: {
          run: {
            font: "Calibri",
            size: 28, // 14pt
            bold: true,
            color: "374151",
          },
          paragraph: {
            spacing: { before: 280, after: 100 },
          },
        },
        heading3: {
          run: {
            font: "Calibri",
            size: 24, // 12pt
            bold: true,
            color: "4b5563",
          },
          paragraph: {
            spacing: { before: 240, after: 80 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Bee Sharp Study Materials",
                    size: 18,
                    color: "9ca3af",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: "9ca3af",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [...headerParagraphs, ...contentParagraphs],
      },
    ],
  });

  // Generate blob and trigger download
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

export default exportToWord;
