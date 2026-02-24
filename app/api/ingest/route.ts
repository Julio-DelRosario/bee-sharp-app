import { NextResponse } from "next/server";
import { generateStudySummary } from "@/app/lib/groq";
import {
  getExtension,
  extractTextFromPdf,
  extractTextFromDocx,
  extractTextFromTxt,
} from "@/app/lib/ingest/extractText";
import { buildStudyPrompt, getSelectedTools } from "@/app/lib/ingest/buildPrompt";

export const runtime = "nodejs";

type ContentItem = {
  type: "text";
  value: string;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const content: ContentItem[] = [];

    const selectedTools = getSelectedTools(formData);

    const notes = formData.get("notes");
    if (typeof notes === "string" && notes.trim().length > 0) {
      content.push({ type: "text", value: notes });
    }

    const fileEntries = formData.getAll("files");

    const MAX_FILES = 3;
    const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 MB

    if (fileEntries.length > MAX_FILES) {
      return NextResponse.json(
        {
          status: "error",
          message: "You can upload a maximum of 3 files.",
        },
        { status: 400 }
      );
    }

    let totalBytes = 0;

    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;

       totalBytes += entry.size;
       if (totalBytes > MAX_TOTAL_BYTES) {
         return NextResponse.json(
           {
             status: "error",
             message:
               "Combined file size is too large. Please keep uploads under 4 MB.",
           },
           { status: 400 }
         );
       }

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

    // Combine all extracted text (notes + files) for the LLM prompt.
    const combinedText = content.map((item) => item.value).join("\n\n");

    let groqResponse: string | null = null;

    const prompt = buildStudyPrompt(combinedText, selectedTools);

    try {
      const text = await generateStudySummary(prompt);
      groqResponse = text || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown Groq error";
      groqResponse = `Groq error: ${message}`;
    }

    return NextResponse.json({
      status: "success",
      content,
      groqResponse,
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
