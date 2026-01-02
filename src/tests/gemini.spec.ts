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
          getFunctionCalls: () => [],
        },
      }),
    };
    
    const response = await engine.processInput(mockChat as any, 'Hello');
    expect(response).toBe('Hello, I am your Product Architect.');
  });

  it('should handle update_product function call', async () => {
    const mockProduct = { name: 'New Product' };
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    const mockChat = {
      sendMessage: vi.fn()
        .mockResolvedValueOnce({
          response: {
            text: () => '',
            getFunctionCalls: () => [{
              name: 'update_product',
              args: { product: mockProduct }
            }],
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: () => 'Product updated.',
            getFunctionCalls: () => [],
          },
        }),
    };

    const response = await engine.processInput(mockChat as any, 'Create a new product', onUpdate);
    
    expect(onUpdate).toHaveBeenCalledWith(mockProduct);
    expect(response).toBe('Product updated.');
  });
});
