
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are NutriMate, a friendly and helpful AI assistant for a meal planning application.
Your goal is to help users with their meal plans, nutrition goals, and pantry management.
Keep your responses concise, helpful, and encouraging.
If the user asks for their shopping list, tell them you're opening it for them.
If the user talks about their goals, confirm that their goals have been noted and that the meal plan will be updated.
If the user talks about their pantry, acknowledge the new ingredients.
For any other topic, provide a helpful response or admit if you can't help with a specific request.
Do not mention you are an AI model.
`;

export async function getGeminiResponse(apiKey: string, userMessage: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID'))) {
        return "The provided API key is not valid. Please check and try again.";
    }
    return "Sorry, I encountered an error trying to connect to the AI. Please check the console for details.";
  }
}
