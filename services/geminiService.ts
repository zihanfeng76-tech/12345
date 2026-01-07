
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ColorInfo } from "../types";

/**
 * Uses Gemini AI to analyze extracted hex colors in the historical context of Dunhuang Mogao pigments.
 * Returns enriched color data with traditional names and cultural descriptions.
 */
export const analyzeColorsWithAI = async (colors: ColorInfo[]): Promise<ColorInfo[]> => {
  // Create a fresh client instance to ensure up-to-date configuration
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const colorList = colors.map(c => c.hex).join(', ');
  
  // Use gemini-3-flash-preview for high-performance knowledge retrieval
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these hex colors in the context of Dunhuang Mogao Caves mural pigments: ${colorList}. Provide traditional Chinese pigment names (like 朱砂, 石青, 雌黄), English names, Pinyin, and a brief cultural description of their use in Dunhuang.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hex: {
              type: Type.STRING,
              description: 'The hex code of the analyzed color.',
            },
            name: {
              type: Type.STRING,
              description: 'Traditional Chinese pigment name.',
            },
            enName: {
              type: Type.STRING,
              description: 'English name of the pigment.',
            },
            pinyin: {
              type: Type.STRING,
              description: 'Standard Pinyin for the Chinese name.',
            },
            description: {
              type: Type.STRING,
              description: 'Contextual cultural description of the pigment in Dunhuang murals.',
            },
          },
          required: ["hex", "name", "enName", "pinyin", "description"],
          propertyOrdering: ["hex", "name", "enName", "pinyin", "description"]
        },
      },
    },
  });

  const text = response.text;
  if (!text) return colors;

  try {
    const aiResults = JSON.parse(text.trim());
    return colors.map(c => {
      // Find matching identification from AI results
      const match = aiResults.find((r: any) => r.hex.toLowerCase() === c.hex.toLowerCase());
      if (match) {
        return { 
          ...c, 
          name: match.name,
          enName: match.enName,
          pinyin: match.pinyin,
          description: match.description
        };
      }
      return c;
    });
  } catch (e) {
    console.error("Failed to parse Gemini pigment analysis", e);
    return colors;
  }
};
