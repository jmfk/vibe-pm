import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscoveryManager } from '../orchestration/discovery-manager.js';

describe('DiscoveryManager', () => {
  let manager: DiscoveryManager;
  let mockRepo: any;
  let mockGemini: any;
  let mockVoice: any;

  beforeEach(() => {
    mockRepo = {
      saveProduct: vi.fn().mockResolvedValue(1),
      updateProduct: vi.fn().mockResolvedValue(undefined),
      getProduct: vi.fn().mockResolvedValue({ name: 'Test' }),
    };
    mockGemini = {
      startChat: vi.fn().mockResolvedValue({}),
      processInput: vi.fn().mockResolvedValue('Gemini response'),
    };
    mockVoice = {
      streamTTS: vi.fn(),
    };

    manager = new DiscoveryManager(mockRepo, mockGemini, mockVoice);
  });

  it('should start a new session', async () => {
    const greeting = await manager.startNewSession('My App');
    expect(mockRepo.saveProduct).toHaveBeenCalled();
    expect(mockGemini.startChat).toHaveBeenCalled();
    expect(mockVoice.streamTTS).toHaveBeenCalledWith(expect.stringContaining('My App'));
    expect(greeting).toContain('My App');
  });

  it('should process user text and update product', async () => {
    await manager.startNewSession('My App');
    const response = await manager.processUserText('Some user input');
    
    expect(mockGemini.processInput).toHaveBeenCalled();
    expect(mockVoice.streamTTS).toHaveBeenCalledWith('Gemini response');
    expect(response).toBe('Gemini response');
  });

  it('should handle product updates during processInput', async () => {
    await manager.startNewSession('My App');
    
    // Simulate Gemini calling the update callback
    mockGemini.processInput.mockImplementation(async (chat: any, text: string, onUpdate: any) => {
      await onUpdate({ name: 'Updated Product' });
      return 'Updated';
    });

    await manager.processUserText('Update product');
    expect(mockRepo.updateProduct).toHaveBeenCalledWith(1, { name: 'Updated Product' });
  });

  it('should load an existing session', async () => {
    const resumeMessage = await manager.loadSession(1);
    expect(mockRepo.getProduct).toHaveBeenCalledWith(1);
    expect(mockVoice.streamTTS).toHaveBeenCalled();
    expect(resumeMessage).toContain('Test');
  });
});

