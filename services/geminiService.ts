import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = 'gemini-2.5-flash';

interface ParsedTask {
  content: string;
  priority: Priority;
  dueString?: string;
  dueDate?: string;
  description?: string;
}

/**
 * Parses natural language input into structured task data.
 */
export const parseTaskNaturalLanguage = async (input: string): Promise<ParsedTask> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing. Returning raw input.");
    return {
      content: input,
      priority: Priority.P4
    };
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Parse this task input into structured data: "${input}". 
      Current reference date is ${today}.
      Extract the core task content, any due date/time mentions, and priority (p1=Urgent/4, p2=High/3, p3=Medium/2, p4=Low/1).
      IMPORTANT: Convert any relative date (tomorrow, next friday) into an ISO 8601 Date string (YYYY-MM-DD) in the 'dueDate' field.
      If no priority is specified, default to 1 (P4).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The main task action text, excluding date/priority keywords" },
            priority: { type: Type.INTEGER, description: "4 for P1 (Urgent), 3 for P2, 2 for P3, 1 for P4" },
            dueString: { type: Type.STRING, description: "The date/time text extracted from input, if any" },
            dueDate: { type: Type.STRING, description: "ISO 8601 date string (YYYY-MM-DD)" },
            description: { type: Type.STRING, description: "Any extra details mentioned" }
          },
          required: ["content", "priority"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);
    return {
      content: data.content,
      priority: data.priority || Priority.P4,
      dueString: data.dueString,
      dueDate: data.dueDate,
      description: data.description
    };
  } catch (error) {
    console.error("AI Parsing failed:", error);
    // Fallback
    return {
      content: input,
      priority: Priority.P4
    };
  }
};

/**
 * Generates subtasks for a given task
 */
export const generateSubtasks = async (taskContent: string): Promise<string[]> => {
  if (!process.env.API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Break down the following task into 3-5 smaller, actionable subtasks: "${taskContent}". Return only the subtask titles as a JSON string array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error(e);
    return [];
  }
}