import { NextResponse } from "next/server";
import { fetchAllPatients } from "@/lib/api-client";

export async function GET() {
  try {
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.API_BASE_URL;

    console.log("Environment check:", {
      hasApiKey: !!apiKey,
      hasBaseUrl: !!baseUrl,
      apiKeyLength: apiKey?.length,
      baseUrl: baseUrl,
    });

    if (!apiKey || !baseUrl) {
      console.error("Missing environment variables:", { apiKey: !!apiKey, baseUrl: !!baseUrl });
      return NextResponse.json(
        { 
          error: "API configuration missing",
          details: {
            hasApiKey: !!apiKey,
            hasBaseUrl: !!baseUrl,
          }
        },
        { status: 500 }
      );
    }

    const patients = await fetchAllPatients(apiKey, baseUrl);
    console.log(patients , "===========")
    return NextResponse.json({
      success: true,
      patients,
      count: patients.length,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Full error details:", { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      {
        error: "Failed to fetch patients",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

