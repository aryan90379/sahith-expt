import { ExperimentResult } from "../types";

export async function generateInsight(result: ExperimentResult): Promise<string> {
  try {
    const res = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result })
    });
    
    const data = await res.json();
    return data.insight;
  } catch (error) {
    console.error("Failed to fetch insight:", error);
    return "Your brain is processing the contrast by compensating for the specific wavelengths you were focused on.";
  }
}