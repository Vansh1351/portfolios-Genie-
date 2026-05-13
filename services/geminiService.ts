
import { Message, UserProfile, Attachment } from "../types";

export const chatWithGenie = async (
  history: Message[], 
  options: { thinkingMode?: boolean; attachments?: Attachment[] } = {}
) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        history, 
        options,
        // The system prompt is still stored in constants, we can pass it if we want
        // but the server can also have its own default.
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to chat with Genie');
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { text: "Something went wrong with our connection to the Genie. Please try again.", sources: [] };
  }
};

export const extractProfileData = async (history: Message[]): Promise<UserProfile | null> => {
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract profile data');
    }

    return await response.json();
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};
