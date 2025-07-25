
import { GoogleGenAI, Chat, GenerateContentResponse, Part, Type, FunctionDeclaration, FunctionCall } from "@google/genai";
import { Source } from "../types";
import { localApps } from "../features/localApps";

export interface AssistantResponse {
  text: string;
  sources?: Source[];
  action?: {
    type: 'open_url';
    url: string;
  };
}

const openWebsiteTool: FunctionDeclaration = {
    name: 'openWebsite',
    description: 'Opens a given URL in a new browser tab. Use this for requests like "open google.com" or "take me to YouTube".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: 'The valid URL to open, including the protocol (e.g., https://www.google.com).',
        },
      },
      required: ['url'],
    },
};

const openLocalAppTool: FunctionDeclaration = {
    name: 'openLocalApp',
    description: 'Opens a locally installed application on the user\'s computer. Use this when the user asks to open a specific program like their code editor, Slack, or Spotify.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description: 'The name or a keyword for the application to open. For example: "VS Code", "Slack", "Spotify", "code editor", "music".',
        },
      },
      required: ['appName'],
    },
};


class AssistantService {
  private static instance: AssistantService;
  private chat: Chat | null = null;

  private constructor() {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      this.chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          tools: [{ functionDeclarations: [openWebsiteTool, openLocalAppTool] }],
          systemInstruction: `You are a sophisticated, intelligent, and professional AI assistant created by Prabal. 
          Your responses must be concise and to the point. 
          You have access to the user's camera feed or screen share. When an image is provided, use it as context to answer the user's question.
          You can open websites and locally installed applications for the user when they ask.
          Be conversational.`,
        },
      });
    } catch (e) {
        console.error("Failed to initialize AssistantService", e);
        this.chat = null;
    }
  }

  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  public async sendMessage(message: string, imageBase64: string | null = null): Promise<AssistantResponse> {
    if (!this.chat) {
        throw new Error("AI Assistant is not initialized. Check API Key.");
    }
    try {
      const promptParts: Part[] = [];
      
      if (imageBase64) {
        promptParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        });
      }
      promptParts.push({ text: message });
      
      const response = await this.chat.sendMessage({ message: promptParts });

      const functionCalls: FunctionCall[] | undefined = response.functionCalls;
      if (functionCalls && functionCalls[0]) {
        const call = functionCalls[0];
        
        if (call.name === 'openWebsite') {
          const { url } = call.args;
          if (typeof url === 'string') {
            let fullUrl = url;
            if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
              fullUrl = `https://${fullUrl}`;
            }
            return {
              text: `Of course, Prabal. Opening ${url} for you.`,
              action: { type: 'open_url', url: fullUrl }
            };
          }
        } else if (call.name === 'openLocalApp') {
            const { appName } = call.args;
            if (typeof appName === 'string') {
                const searchAppName = appName.toLowerCase();
                // Find app where the AI's requested name includes one of our keywords, or our app name is in the AI's request
                const app = localApps.find(app => 
                    app.name.toLowerCase().includes(searchAppName) ||
                    app.commandKeywords.some(kw => searchAppName.includes(kw))
                );

                if (app) {
                    return {
                        text: `Certainly, Prabal. Opening ${app.name}.`,
                        action: { type: 'open_url', url: app.urlScheme }
                    };
                } else {
                    return { text: `My apologies, Prabal. I don't have a configured command to open "${appName}". You can add it to the app list.` };
                }
            }
        }
      }

      let responseText = response.text;

      if (!responseText) {
          responseText = "My apologies, Prabal. I encountered an issue and couldn't get a response."
      }

      return {
          text: responseText,
      };

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      return { text: "My apologies, Prabal. I seem to be having some trouble connecting to my core processors." };
    }
  }
}

export const assistantService = AssistantService.getInstance();
