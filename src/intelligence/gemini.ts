import { GoogleGenerativeAI, ChatSession, SchemaType } from '@google/generative-ai';
import { Product, ProductSchema } from '../models/schema.js';

export const SYSTEM_INSTRUCTION = `
You are a "Product Architect" AI, a highly experienced Product Manager and Software Architect.
Your goal is to help users transform their verbal ideas into structured product requirements.

Follow these principles:
1. Iterative Inquiry: Don't just accept input; actively probe for missing details. Ask about edge cases, user personas, success metrics, and technical constraints.
2. Context Awareness: Maintain a coherent understanding of the product throughout the conversation.
3. Ambiguity Detection: Identify vague statements (e.g., "I want it to be fast") and ask for concrete definitions or metrics.
4. Active Listener: Acknowledge user input with brief verbal cues before asking the next question.
5. Drafting Mode: Occasionally summarize the current state of the requirements to the user for validation.
6. Compilation Trigger: Detect when the user is satisfied or when the core requirements are sufficiently detailed to generate the final files. When this happens, update the product status to 'Completed'.

Categorization: Automatically group requirements into sections: Functional, Non-functional, UI/UX, Technical Constraints, and Success Metrics.

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
                type: SchemaType.OBJECT,
                properties: {
                  product: {
                    type: SchemaType.OBJECT,
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

  async *processInputStreaming(chat: ChatSession, userInput: string, onUpdate?: (product: Product) => Promise<void>) {
    const result = await chat.sendMessageStream(userInput);
    let fullText = '';
    let currentSentence = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      currentSentence += chunkText;

      // Split by sentence boundaries but keep the punctuation
      const sentenceEndRegex = /[.!?]\s+/;
      let match;
      while ((match = sentenceEndRegex.exec(currentSentence)) !== null) {
        const sentence = currentSentence.slice(0, match.index + match[0].length).trim();
        if (sentence) {
          yield sentence;
        }
        currentSentence = currentSentence.slice(match.index + match[0].length);
      }
    }

    // Yield any remaining text
    if (currentSentence.trim()) {
      yield currentSentence.trim();
    }

    // Handle function calls if any (Gemini streaming might still produce function calls at the end or in between)
    const response = await result.response;
    let call = response.functionCalls()?.[0];

    while (call) {
      if (call.name === 'update_product') {
        const args = call.args as { product: Product };
        const product = args.product;
        if (onUpdate) {
          await onUpdate(product);
        }
        
        // Function responses in streaming are a bit more complex, but for now 
        // we'll follow a similar pattern to the non-streaming version if needed.
        // However, usually we just want the text output for the user.
        break; 
      }
      break;
    }
  }

  async processInput(chat: ChatSession, userInput: string, onUpdate?: (product: Product) => Promise<void>) {
    let result = await chat.sendMessage(userInput);
    let response = result.response;
    let call = response.functionCalls()?.[0];

    while (call) {
      if (call.name === 'update_product') {
        const args = call.args as { product: Product };
        const product = args.product;
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
        call = response.functionCalls()?.[0];
      } else {
        break;
      }
    }

    return response.text();
  }
}
