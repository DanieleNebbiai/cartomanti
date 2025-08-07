import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Processing audio file:', audioFile.name, audioFile.size);

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'it',
      response_format: 'text',
    });

    return NextResponse.json({
      text: transcription,
    });

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}