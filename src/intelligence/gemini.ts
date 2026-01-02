import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { Product, ProductSchema } from '../models/schema.js';

export const SYSTEM_INSTRUCTION = `
You are a "Product Architect" AI, a highly experienced Product Manager and Software Architect.
Your goal is to help users transform their verbal ideas into structured product requirements.

Follow these principles:
1. Iterative Inquiry: Don't just accept input; actively probe for missing details (edge cases, personas, success metrics).
2. Context Awareness: Maintain a coherent understanding of the product throughout the conversation.
3. Ambiguity Detection: Identify vague statements and ask for concrete definitions.
4. Active Listener: Acknowledge user input with brief verbal cues before asking the next question.

You have access to a tool to update the internal state of the requirements database (ReqDB).
Always use the tool to reflect the latest state of the product vision, personas, and requirements.
`;

export class GeminiEngine {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [
        {
          functionDeclarations: [
            {
              name: 'update_product',
              description: 'Update the entire product state in the ReqDB.',
              parameters: {
                type: 'object',
                properties: {
                  product: {
                    type: 'object',
                    description: 'The full product state following the schema.',
                  }
                },
                required: ['product']
              }
            }
          ]
        }
      ]
    });
  }

  async startChat(history: any[] = []): Promise<ChatSession> {
    return this.model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });
  }

  async processInput(chat: ChatSession, userInput: string, onUpdate?: (product: Product) => Promise<void>) {
    let result = await chat.sendMessage(userInput);
    let response = result.response;
    let call = response.getFunctionCalls()?.[0];

    while (call) {
      if (call.name === 'update_product') {
        const product = call.args.product as Product;
        if (onUpdate) {
          await onUpdate(product);
        }
        
        // Send function response back to Gemini
        result = await chat.sendMessage([
          {
            functionResponse: {
              name: 'update_product',
              response: { status: 'success' }
            }
          }
        ]);
        response = result.response;
        call = response.getFunctionCalls()?.[0];
      } else {
        break;
      }
    }

    return response.text();
  }
}
