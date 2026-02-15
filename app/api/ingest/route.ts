import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

type ContentItem = {
  type: "text";
  value: string;
};

function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  return buffer.toString("utf8");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const content: ContentItem[] = [];

    const notes = formData.get("notes");
    if (typeof notes === "string" && notes.trim().length > 0) {
      content.push({ type: "text", value: notes });
    }

    const fileEntries = formData.getAll("files");

    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;

      const arrayBuffer = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext = getExtension(entry.name);
      let text = "";

      if (ext === "pdf") {
        text = await extractTextFromPdf(buffer);
      } else if (ext === "docx") {
        text = await extractTextFromDocx(buffer);
      } else if (ext === "txt") {
        text = await extractTextFromTxt(buffer);
      } else {
        // Unsupported type for this MVP: skip silently
        continue;
      }

      if (text && text.length > 0) {
        content.push({ type: "text", value: text });
      }
    }

    return NextResponse.json({
      status: "success",
      content,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process input.",
      },
      { status: 500 }
    );
  }
}
