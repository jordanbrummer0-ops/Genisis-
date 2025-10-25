
import { GoogleGenAI, Modality } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTextResponse = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
};

export const generateLowLatencyResponse = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
    });
    return response.text;
  };

export const generateGroundedResponse = async (prompt: string): Promise<{ text: string, sources: any[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { text: response.text, sources };
};

export const generateComplexResponse = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response.text;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<{ text: string | null, image: string | undefined }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ],
    },
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });

  let newImageBase64: string | undefined;
  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      newImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }

  return { text: response.text, image: newImageBase64 };
};


export const generateSpeech = async (text: string): Promise<string | null> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};
