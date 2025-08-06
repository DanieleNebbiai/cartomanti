import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message, operator, category } = await request.json();

    // Create system prompt based on operator and category
    let systemPrompt = 'Sei un cartomante professionale che parla solo in italiano.';
    
    if (operator && category) {
      systemPrompt = `Sei ${operator}, un cartomante professionale specializzato in ${category}. `;
      
      switch (category) {
        case 'AMORE':
          systemPrompt += 'Ti specializzi in questioni di cuore, relazioni amorose, anime gemelle e guida romantica. Usa la tua intuizione per fornire consigli premurosi su amore e relazioni.';
          break;
        case 'LAVORO':
          systemPrompt += 'Ti specializzi in guida professionale, decisioni di carriera e questioni lavorative. Aiuta le persone a navigare il loro percorso professionale e superare le sfide lavorative.';
          break;
        case 'SOLDI':
          systemPrompt += 'Ti specializzi in questioni finanziarie, decisioni sui soldi e guida alla prosperità. Fornisci consigli pratici e spirituali su finanze e ricchezza.';
          break;
        case 'LOTTO':
          systemPrompt += 'Sei un maestro dei numeri e della cabala. Aiuta a interpretare i sogni e trasformarli in combinazioni di numeri fortunati usando metodi tradizionali.';
          break;
        case 'GENERICO':
          systemPrompt += 'Sei versatile e puoi affrontare qualsiasi argomento con competenza. Fornisci guida olistica su amore, lavoro, famiglia, salute e crescita spirituale.';
          break;
      }
      systemPrompt += ' Mantieni sempre un tono mistico, premuroso e professionale. Rispondi sempre in italiano.';
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || 'Mi dispiace, non ho potuto elaborare la tua domanda.';

    return NextResponse.json({
      text: responseText,
      usage: completion.usage
    });

  } catch (error) {
    console.error('Chat completion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}