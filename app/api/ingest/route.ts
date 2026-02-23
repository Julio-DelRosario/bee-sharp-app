import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { generateStudySummary } from "@/app/lib/groq";

export const runtime = "nodejs";

type ContentItem = {
  type: "text";
  value: string;
};

type StudyTool =
  | "Summarize"
  | "Quiz"
  | "Structured Outline"
  | "Flashcards"
  | "Key Points";

function getSelectedTools(formData: FormData): StudyTool[] {
  const raw = formData.get("tools");
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validTools: StudyTool[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      switch (item) {
        case "Summarize":
        case "Quiz":
        case "Structured Outline":
        case "Flashcards":
        case "Key Points":
          if (!validTools.includes(item)) {
            validTools.push(item);
          }
          break;
        default:
          break;
      }
    }
    return validTools;
  } catch {
    return [];
  }
}

function buildStudyPrompt(combinedText: string, tools: StudyTool[]): string {
  const activeTools = tools.length > 0 ? tools : ["Summarize"];

  if (!combinedText.trim()) {
    return `You are BeeSharp, an AI study assistant. The user did not provide any study material. For each of the following tools: ${activeTools.join(", ")}, write a short, friendly one-sentence message explaining that they need to upload files or paste notes first.`;
  }

  const sections: string[] = [];

  if (activeTools.includes("Summarize")) {
    sections.push(
      `For the **Summarize** section:
      - Start with the markdown heading "### Summarize".
      Objective: Produce a structured, high-clarity summary of the provided content.

      Instructions:
      - Do NOT add information not present in the text.
      - Preserve key terminology, definitions, names, formulas, and technical concepts.
      - Eliminate redundancy and filler.
      - Maintain conceptual accuracy.
      - Use clear academic language.

      Output Structure:

      1. Executive Overview (3 to 5 sentences)
        - Core idea of the entire text.

      2. Core Concepts
        - Bullet list of main ideas with short explanations.

      3. Critical Details
        - Important examples, data, processes, formulas, or mechanisms.

      4. Why It Matters
        - Explain the significance in 2 to 3 sentences (based only on provided content).`
    );
  }

  if (activeTools.includes("Quiz")) {
    sections.push(
      `For the **Quiz** section:
      - Start with the markdown heading "### Quiz".
      Task: Create a rigorous quiz based only on the provided content.

      Structure:
      Section A: Conceptual Understanding
      - 5 multiple-choice questions
      - 4 options each
      - Only 1 correct answer
      - Include explanation for the correct answer

      Section B: Short Answer
      - 4 questions requiring 2 to 4 sentence answers

      Section C: Application / Critical Thinking
      - 3 scenario-based questions
      - Require applying concepts from the text

      Difficulty Distribution:
      - 30% Easy
      - 40% Moderate
      - 30% Challenging

      At the end:
      Provide an answer key with explanations.
`
    );
  }

  if (activeTools.includes("Structured Outline")) {
    sections.push(
      `For the **Structured Outline** section:
      - Start with the markdown heading "### Structured Outline".
      Task: Convert the content into a logically structured, exam-ready outline.

      Rules:
      - Use hierarchical structure:
        I. Main Topics
          A. Subtopics
              1. Supporting Details
                a. Specific examples or mechanisms
      - Group related ideas properly.
      - Remove repetition.
      - Maintain technical terms.
      - Do NOT summarize excessively — preserve detail.
      - Do NOT add outside knowledge.

      Additionally:
      At the end, include:
      - 3 potential exam questions derived from the outline.`
    );
  }

  if (activeTools.includes("Flashcards")) {
    sections.push(
      `For the **Flashcards** section:
      - Start with the markdown heading "### Flashcards".
      Task:
      Create high-retention flashcards using active recall principles.

      Rules:
      - One concept per card.
      - Avoid vague prompts.
      - Answers must be concise but complete.
      - Avoid yes/no questions.
      - Include both direct and reverse cards when useful.

      Structure:

      Section 1: Definitions (Q/A)
      Section 2: Processes & Mechanisms (Step-based cards)
      Section 3: Comparisons (Contrast-based cards)
      Section 4: Cause & Effect Relationships
      Section 5: Application Scenarios

      Generate at least 20 flashcards.

      After generation:
      - Identify 5 cards that are most exam-critical.
      - Suggest 3 cards that could be converted into cloze deletion format (Anki-style).`
    );
  }

  if (activeTools.includes("Key Points")) {
    sections.push(
      `For the **Key Points** section:
      - Start with the markdown heading "### Key Points".
      Task: Extract only the most critical knowledge units from the text.

      Requirements:
      - Limit to 12 to 18 key points.
      - Each point must contain a complete idea.
      - Prioritize:
        • Definitions
        • Mechanisms
        • Cause-and-effect relationships
        • Comparisons
        • Processes
        • Formulas
      - Remove examples unless essential.
      - Remove filler.
      - No repetition.
      - Rank from most important (1) to least important.

      After listing key points, include:
      - 3 insights that connect multiple points together.
`
    );
  }

  const instructions = sections.join("\n\n");

  return `You are BeeSharp, an AI study assistant for high school and college students. The user has provided one or more study materials (possibly from multiple files) and selected some study tools.

CRITICAL GUARDRAIL: First, analyze the provided STUDY MATERIAL. If the text is clearly NOT educational or academic (for example: a shopping list, a recipe, random letters, or casual conversation), you MUST completely ignore the tool instructions and output exactly this single phrase: [ERROR_NON_ACADEMIC_CONTENT]. Do not output anything else.

If the text IS educational, generate markdown output with one section per selected tool, in this exact order: ${activeTools.join(", ")}. Do not add any sections that are not in this list. You MUST include every listed section at least briefly. If you are short on space, keep each section concise but do not skip any tool.

For each section, follow these instructions.

${instructions}

Use only the study material below. If something is not mentioned in the material, you may use general background knowledge but never contradict the given content.

STUDY MATERIAL:
"""${combinedText}"""`;
}

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
