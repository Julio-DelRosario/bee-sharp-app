import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY in environment");
}

const groq = new Groq({ apiKey });

const MODEL_ID = "llama-3.3-70b-versatile";

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
    max_tokens: 4000,
  });

  const choice = response.choices?.[0];
  const text = choice?.message?.content || "";
  return text.trim();
}
