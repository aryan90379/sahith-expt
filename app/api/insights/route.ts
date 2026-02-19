import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { result } = await request.json();
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Context: The user is participating in a visual perception experiment about "Negative Afterimages" (retinal fatigue).
        
        Trial Data:
        - Stimulus Color: ${result.colorName}
        - Stare Duration: ${result.stareDuration} seconds
        - Afterimage Persistence: ${result.persistenceDuration} seconds
        - What the user actually saw: "${result.perceivedColor}"
        
        Provide a concise, scientific but engaging 2-sentence explanation. Analyze if what they saw matches the expected complementary color. Explain why this happened based on their specific retinal fatigue. Use the tone of a curious neuroscientist.
      `,
      config: { temperature: 0.7, topP: 0.95 },
    });

    return NextResponse.json({ insight: response.text || "Insight generated successfully." });
  } catch (error) {
    return NextResponse.json({ 
      insight: "Your brain is processing the contrast by compensating for the specific wavelengths you were focused on." 
    }, { status: 500 });
  }
}