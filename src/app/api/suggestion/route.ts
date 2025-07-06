import { NextRequest, NextResponse } from "next/server";
import { generateAutocomplete } from "@/lib/utils/groq"; // Assuming this path is correct

export async function POST(req: NextRequest) {
  try {
    const { fullText, currLine } = await req.json();

    if (typeof fullText !== "string" || typeof currLine !== "string") {
      return NextResponse.json(
        {
          error:
            "Invalid request body. 'fullText' and 'currLine' must be strings.",
        },
        { status: 400 },
      );
    }

    const completion = await generateAutocomplete(fullText, currLine);

    console.log(completion);

    return NextResponse.json(completion);
  } catch (error) {
    console.error("Error generating autocomplete suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate completion." },
      { status: 500 },
    );
  }
}
