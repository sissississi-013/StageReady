import { GoogleGenAI, Type } from "@google/genai";
import { Comment, SummaryStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const COMMENT_SYSTEM_PROMPT = `
You are simulating a live stream audience chat. 
You will receive audio chunks of a streamer talking.
Your goal is to generate 1 to 3 realistic, short viewer comments based SPECIFICALLY on what is being said in the audio.
- If the audio is silent or unclear, return an empty list.
- Mix of supportive fans, curious askers, and casual observers.
- Use internet slang appropriately but don't overdo it.
- 30% of comments should be questions prompting the streamer to say more.
- Generate realistic usernames.
- Return ONLY JSON.
`;

const SUMMARY_SYSTEM_PROMPT = `
You are an expert content editor. 
Analyze the provided audio from a video recording and generate a text summary/post in a specific style.
`;

export const generateLiveComments = async (audioBase64: string): Promise<Omit<Comment, 'id' | 'timestamp' | 'color'>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav",
              data: audioBase64
            }
          },
          {
            text: "Listen to this live stream audio and generate 1-3 distinct audience comments. If nothing substantial is said, return empty array."
          }
        ]
      },
      config: {
        systemInstruction: COMMENT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              username: { type: Type.STRING },
              text: { type: Type.STRING },
              isQuestion: { type: Type.BOOLEAN }
            },
            required: ["username", "text"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating comments:", error);
    return [];
  }
};

export const generateSummary = async (audioBlob: Blob, style: SummaryStyle): Promise<string> => {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
    });
    reader.readAsDataURL(audioBlob);
    const audioBase64 = await base64Promise;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
           {
            inlineData: {
              // Use the blob's type if available, otherwise default to audio/webm
              mimeType: audioBlob.type || "audio/webm",
              data: audioBase64
            }
          },
          {
            text: `Summarize the content of this recording in the following style: ${style}. Return the text formatted with Markdown.`
          }
        ]
      },
      config: {
        systemInstruction: SUMMARY_SYSTEM_PROMPT,
      }
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error generating summary. Please try again.";
  }
};
