import { NextResponse } from "next/server";
import { gradeQuizAnswers } from "@/app/lib/groq";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const grading = await gradeQuizAnswers(payload);

    return NextResponse.json({
      status: "success",
      grading,
    });
  } catch (error) {
    console.error("Quiz grading failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to grade quiz answers.",
      },
      { status: 500 }
    );
  }
}
