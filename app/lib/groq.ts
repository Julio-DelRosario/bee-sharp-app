import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY in environment");
}

const groq = new Groq({ apiKey });

const MODEL_ID = "openai/gpt-oss-120b";

export async function generateStudySummary(prompt: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: MODEL_ID,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
  });

  const choice = response.choices?.[0];
  const text = choice?.message?.content || "";
  return text.trim();
}

type GradingRequest = any;

type GradingResult = {
  results: {
    questionId: string;
    status: "Correct" | "Partial" | "Incorrect";
    feedback: string;
  }[];
};

export async function gradeQuizAnswers(
  questionsAndAnswers: GradingRequest
): Promise<GradingResult> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_ID,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are the Bee Sharp Auto-Grader. You will receive a list of quiz questions and the student's submitted answers.\n\n" +
            "Your job is to evaluate the student's answers for conceptual accuracy.\n" +
            "- Ignore minor typos or grammar mistakes.\n" +
            "- If the core concept is correct, mark it as \"Correct\".\n" +
            "- If it is partially right but missing key details, mark it as \"Partial\".\n" +
            "- If it is wrong or unrelated, mark it as \"Incorrect\".\n\n" +
            "You MUST return your evaluation in this exact JSON format. Do not include any markdown formatting, just the raw JSON object:\n" +
            "{\n" +
            "  \"results\": [\n" +
            "    {\n" +
            "      \"questionId\": \"1\",\n" +
            "      \"status\": \"Correct\" | \"Partial\" | \"Incorrect\",\n" +
            "      \"feedback\": \"1-2 sentences explaining why, and what they missed if applicable.\"\n" +
            "    }\n" +
            "  ]\n" +
            "}\n",
        },
        {
          role: "user",
          content: JSON.stringify(questionsAndAnswers),
        },
      ],
      temperature: 0,
    });

    const rawContent = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(rawContent) as GradingResult;
  } catch (error) {
    console.error("Error grading quiz:", error);
    throw new Error("Failed to grade answers.");
  }
}
