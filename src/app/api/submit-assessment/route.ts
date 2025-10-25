import { NextResponse } from "next/server";
import { submitAssessment } from "@/lib/api-client";
import type { AssessmentResults } from "@/types/assessment";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.API_BASE_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: "API configuration missing" },
        { status: 500 }
      );
    }

    const body: AssessmentResults = await request.json();

    // Validate request body
    if (
      !body.high_risk_patients ||
      !body.fever_patients ||
      !body.data_quality_issues
    ) {
      return NextResponse.json(
        { error: "Invalid request body. Missing required fields." },
        { status: 400 }
      );
    }

    const result = await submitAssessment(apiKey, baseUrl, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      {
        error: "Failed to submit assessment",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

