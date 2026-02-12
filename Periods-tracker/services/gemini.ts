import { GoogleGenAI, Type } from "@google/genai";
import { PeriodLog, AnalysisResult } from "../types";

export const analyzeHealthRisks = async (logs: PeriodLog[], age: number, location?: string): Promise<AnalysisResult> => {
  // Use process.env.API_KEY directly as mapped in vite.config.ts
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error("API Key is missing or set to placeholder. Please update .env.local and restart your dev server (Ctrl+C then npm run dev).");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const historyString = logs.map(l => 
    `Cycle: ${l.cycleLength} days, Duration: ${l.duration} days, Flow: ${l.flowIntensity}, Pain: ${l.painLevel}, Symptoms: ${l.symptoms.join(', ')}`
  ).join('\n');

  const locationContext = location ? `The user is located in or near: ${location}. Please ensure the diet recommendations (ingredients, meals) are locally available, culturally appropriate, and relevant to this region.` : "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Analyze the following menstrual health data for a ${age}-year-old female and detect potential health risks. 
      Crucially, provide a personalized wellness plan including specific food habits, a daily diet chart (Breakfast, Lunch, Dinner, Snacks), and specific Yoga poses suited for their symptoms.
      
      ${locationContext}

      Current Data:
      ${historyString}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallHealthScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  condition: { type: Type.STRING },
                  riskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
                  reasoning: { type: Type.STRING },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["condition", "riskLevel", "reasoning", "recommendations"]
              }
            },
            wellnessPlan: {
              type: Type.OBJECT,
              properties: {
                dietChart: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      meal: { type: Type.STRING },
                      recommendation: { type: Type.STRING }
                    },
                    required: ["meal", "recommendation"]
                  }
                },
                yogaPoses: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      benefit: { type: Type.STRING }
                    },
                    required: ["name", "benefit"]
                  }
                },
                foodHabits: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["dietChart", "yogaPoses", "foodHabits"]
            },
            disclaimer: { type: Type.STRING }
          },
          required: ["overallHealthScore", "summary", "risks", "wellnessPlan", "disclaimer"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text.trim());
  } catch (err: any) {
    console.error("Gemini API Error details:", err);
    // Extract a readable message from the error object
    const errorMessage = err?.message || "Unknown API error";
    throw new Error(`API Error: ${errorMessage}`);
  }
};