import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, voice = "nova", category } = await request.json();

    // Get voice based on category (all female voices)
    let selectedVoice = voice;
    if (category) {
      switch (category) {
        case "AMORE":
          selectedVoice = "nova"; // Warm, caring female voice for love readings
          break;
        case "LAVORO":
          selectedVoice = "shimmer"; // Clear, confident female voice for career
          break;
        case "SOLDI":
          selectedVoice = "fable"; // Expressive female voice for financial advice
          break;
        case "LOTTO":
          selectedVoice = "coral"; // Bright female voice for numbers and luck
          break;
        case "GENERICO":
          selectedVoice = "alloy"; // Balanced female voice for general readings
          break;
        default:
          selectedVoice = "nova";
      }
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Fastest TTS model instead of tts-1-hd
      voice: selectedVoice as any,
      input: text,
      instructions:
        "Parla con un tono mistico, caldo e professionale come una cartomante italiana.",
      response_format: "mp3",
      speed: 1.1, // Slightly faster speech for reduced latency
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
