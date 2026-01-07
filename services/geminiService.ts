import { GoogleGenAI, Type } from '@google/genai';
import { ColorInfo } from '../types';

export const getDunhuangColorNames = async (colors: ColorInfo[]): Promise<ColorInfo[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return colors;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const hexList = colors.map(c => c.hex).join(', ');

  const prompt = `
    You are an expert in traditional Chinese art and Dunhuang mural pigments.
    For the following list of HEX color codes, identify a poetic, traditional Chinese name that fits the Dunhuang aesthetic (e.g., Cinnabar, Ochre, Malachite, Azurite).
    Also provide an English translation and Pinyin.
    
    Hex Codes: ${hexList}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hex: { type: Type.STRING },
              name: { type: Type.STRING, description: "Traditional Chinese Name" },
              pinyin: { type: Type.STRING },
              enName: { type: Type.STRING, description: "English Name" },
              description: { type: Type.STRING, description: "Short cultural context (max 10 words)" }
            },
            required: ["hex", "name", "enName"]
          }
        }
      }
    });

    const generatedData = JSON.parse(response.text || "[]");
    
    // Merge AI data back into color objects
    return colors.map(color => {
      const match = generatedData.find((d: any) => d.hex.toLowerCase() === color.hex.toLowerCase());
      if (match) {
        return {
          ...color,
          name: match.name,
          pinyin: match.pinyin,
          enName: match.enName,
          description: match.description
        };
      }
      return color;
    });

  } catch (error) {
    console.error("Gemini AI Error:", error);
    // Return original colors if AI fails
    return colors.map(c => ({...c, name: "Unknown", enName: "Custom Color"}));
  }
};