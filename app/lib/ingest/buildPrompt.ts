export type StudyTool =
  | "Summarize"
  | "Quiz"
  | "Structured Outline"
  | "Flashcards"
  | "Key Points";

export function getSelectedTools(formData: FormData): StudyTool[] {
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

export function buildStudyPrompt(
  combinedText: string,
  tools: StudyTool[]
): string {
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

      1. Overview (3 to 5 sentences)
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
      Objective: Create a rigorous quiz based only on the provided content.

      Structure:
      Section A: Conceptual Understanding
      - 5 multiple-choice questions
      - 4 options each
      - Only 1 correct answer
      - Do NOT include inline answers after each question.

      Section B: Short Answer
      - 4 questions requiring 2 to 4 sentence answers
      - Do NOT include inline answers.

      Section C: Application / Critical Thinking
      - 3 scenario-based questions
      - Require applying concepts from the text
      - Do NOT include inline answers.

      Difficulty Distribution:
      - 30% Easy
      - 40% Moderate
      - 30% Challenging

      CRITICAL: Quizzes MUST place the Answer Key separated at the very bottom under a "### Answer Key" heading. Format the Answer Key as:
      
      ### Answer Key
      **Section A:**
      1. [Letter] - [Brief explanation]
      2. [Letter] - [Brief explanation]
      ...
      
      **Section B:**
      1. [Model answer in 2-4 sentences]
      ...
      
      **Section C:**
      1. [Model answer]
      ...
`
    );
  }

  if (activeTools.includes("Structured Outline")) {
    sections.push(
      `For the **Structured Outline** section:
      - Start with the markdown heading "### Structured Outline".
      Task: Convert the content into a logically structured, exam-ready outline.

      Rules:
      - Use hierarchical structure with STRICTLY consistent indentation:
        I. Main Topics (no indentation)
            A. Subtopics (4 spaces indentation)
                1. Supporting Details (8 spaces indentation)
                    a. Specific examples or mechanisms (12 spaces indentation)
      - CRITICAL: Structured Outline MUST use strictly 4 spaces for Level 2 (A, B, C), 8 spaces for Level 3 (1, 2, 3), and 12 spaces for Level 4 (a, b, c) indentation. Do NOT use tabs or inconsistent spacing.
      - Group related ideas properly.
      - Remove repetition.
      - Maintain technical terms.
      - Do NOT summarize excessively — preserve detail.
      - Do NOT add outside knowledge.
      - The outline should be comprehensive enough to serve as a study guide for exams.`
    );
  }

  if (activeTools.includes("Flashcards")) {
    sections.push(
      `For the **Flashcards** section:
      - Start with the markdown heading "### Flashcards".
      Task: Create high-retention flashcards using active recall principles.

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

      Generate at least 20 flashcards.`
    );
  }

  if (activeTools.includes("Key Points")) {
    sections.push(
      `For the **Key Points** section:

      - Start with the markdown heading "### Key Points".
      - CRITICAL: Key Points MUST be a standard Markdown bulleted list. NEVER output raw JSON.
      - Use this exact format:

      ### Key Points

      **1. [Concept Title]**
      - [Clear, complete explanation of the concept in 2-4 sentences]

      **2. [Next Concept Title]**
      - [Explanation]

      ... and so on.

      RULES:
      - Include 12 to 18 key points.
      - Each explanation should be 2 to 4 sentences, concise but complete.
      - Titles must NOT be generic like "Key Point 1"; they should summarize the specific concept.
      - Use only information present in the study material; do not invent unsupported facts.
      - Avoid repetition and filler.
      - Rank concepts from most foundational (1) to most advanced.`
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
