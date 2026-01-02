import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiEngine } from '../intelligence/gemini.js';

// Mock GoogleGenerativeAI
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          startChat: vi.fn(),
        };
      }
    },
    SchemaType: {
      OBJECT: 'object',
      STRING: 'string',
      ARRAY: 'array',
    }
  };
});

describe('GeminiEngine', () => {
  let engine: GeminiEngine;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new GeminiEngine(mockApiKey);
  });

  it('should process user input and return text response', async () => {
    const mockChat = {
      sendMessage: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Hello, I am your Product Architect.',
          functionCalls: () => [],
        },
      }),
    };
    
    const response = await engine.processInput(mockChat as any, 'Hello');
    expect(response).toBe('Hello, I am your Product Architect.');
  });

  it('should process user input and return streaming text response', async () => {
    const mockChunks = [
      { text: () => 'Hello. ' },
      { text: () => 'How are ' },
      { text: () => 'you today?' },
    ];

    const mockChat = {
      sendMessageStream: vi.fn().mockResolvedValue({
        stream: (async function* () {
          for (const chunk of mockChunks) yield chunk;
        })(),
        response: Promise.resolve({
          functionCalls: () => [],
        }),
      }),
    };

    const generator = engine.processInputStreaming(mockChat as any, 'Hello');
    const results: string[] = [];
    for await (const chunk of generator) {
      results.push(chunk);
    }

    expect(results).toEqual(['Hello.', 'How are you today?']);
  });

  it('should handle update_product function call in streaming mode', async () => {
    const mockProduct = { name: 'New Product' };
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    const mockChat = {
      sendMessageStream: vi.fn().mockResolvedValue({
        stream: (async function* () {
          yield { text: () => 'Updating... ' };
        })(),
        response: Promise.resolve({
          functionCalls: () => [{
            name: 'update_product',
            args: { product: mockProduct }
          }],
        }),
      }),
    };

    const generator = engine.processInputStreaming(mockChat as any, 'Update product', onUpdate);
    for await (const _ of generator) {}

    expect(onUpdate).toHaveBeenCalledWith(mockProduct);
  });

  it('should handle update_product function call', async () => {
    const mockProduct = { name: 'New Product' };
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    const mockChat = {
      sendMessage: vi.fn()
        .mockResolvedValueOnce({
          response: {
            text: () => '',
            functionCalls: () => [{
              name: 'update_product',
              args: { product: mockProduct }
            }],
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: () => 'Product updated.',
            functionCalls: () => [],
          },
        }),
    };

    const response = await engine.processInput(mockChat as any, 'Create a new product', onUpdate);
    
    expect(onUpdate).toHaveBeenCalledWith(mockProduct);
    expect(response).toBe('Product updated.');
  });
});
