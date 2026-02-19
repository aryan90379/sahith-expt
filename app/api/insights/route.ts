import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  console.log("=== [START] GEMINI API REQUEST ===");

  // 1. Validate API Key Presence
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
    return NextResponse.json({ insight: "API Key missing." }, { status: 500 });
  }

  try {
    // 2. Parse and Validate Payload
    const body = await request.json();
    console.log("✅ 1. Received payload successfully.");
    
    const { result } = body;
    if (!result) {
      console.error("❌ ERROR: 'result' object is missing from the payload:", body);
      return NextResponse.json({ insight: "Invalid payload sent from client." }, { status: 400 });
    }

    // 3. Initialize AI Client
    console.log("✅ 2. Initializing GoogleGenAI client...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      Context: The user is participating in a visual perception experiment about "Negative Afterimages" (retinal fatigue).
      
      Trial Data:
      - Stimulus Color: ${result.colorName}
      - Stare Duration: ${result.stareDuration} seconds
      - Afterimage Persistence: ${result.persistenceDuration} seconds
      - What the user actually saw: "${result.perceivedColor}"
      
      Provide a concise, scientific but engaging 2-sentence explanation. Analyze if what they saw matches the expected complementary color. Explain why this happened based on their specific retinal fatigue. Use the tone of a curious neuroscientist.
    `;
    
    // 4. Send Request (Using a definitively stable model name)
    const targetModel = "gemini-1.5-flash"; // Swapped to a standard stable model
    console.log(`✅ 3. Sending prompt to Google. Target Model: ${targetModel}`);

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: prompt,
      config: { temperature: 0.7, topP: 0.95 },
    });

    console.log("✅ 4. Success! Received response from Gemini.");
    console.log("=== [END] GEMINI API REQUEST ===");

    return NextResponse.json({ insight: response.text || "Insight generated successfully." });

  } catch (error: any) {
    // 5. DEEP ERROR LOGGING
    console.error("\n❌ === GEMINI API FATAL ERROR ===");
    console.error("Error Message:", error.message);
    console.error("Error Name:", error.name);
    if (error.status) console.error("HTTP Status:", error.status);
    console.error("Full Stack Trace:", error.stack);
    console.error("=================================\n");
    
    return NextResponse.json({ 
      insight: "Your brain is processing the contrast by compensating for the specific wavelengths you were focused on.",
      // Sending the error message back to the browser network tab for easier debugging
      debug_error: error.message 
    }, { status: 500 });
  }
}