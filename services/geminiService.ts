
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateProductDescription = async (
  productName: string,
  category: string
): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve(
      "AI service is unavailable. Please enter a description manually."
    );
  }

  const prompt = `Generate a short, appealing, and marketable product description for a product named "${productName}" in the "${category}" category for an online marketplace in Bangladesh. Keep it under 50 words. Focus on freshness, quality, and taste.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating description with Gemini API:", error);
    return "Failed to generate AI description. Please try again or write one manually.";
  }
};
