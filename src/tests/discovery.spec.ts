import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscoveryManager } from '../orchestration/discovery-manager.js';

import { EventEmitter } from 'events';

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
      processInputStreaming: vi.fn().mockImplementation(async function* () {
        yield 'Gemini';
        yield 'response';
      }),
    };
    mockVoice = new EventEmitter() as any;
    mockVoice.streamTTS = vi.fn();
    mockVoice.sendEndOfStream = vi.fn();

    manager = new DiscoveryManager(mockRepo, mockGemini, mockVoice);
  });

  it('should start a new session', async () => {
    const greeting = await manager.startNewSession('My App');
    expect(mockRepo.saveProduct).toHaveBeenCalled();
    expect(mockGemini.startChat).toHaveBeenCalled();
    expect(mockVoice.streamTTS).toHaveBeenCalledWith(expect.stringContaining('My App'));
    expect(greeting).toContain('My App');
  });

  it('should process user text with streaming and update product', async () => {
    await manager.startNewSession('My App');
    const response = await manager.processUserText('Some user input');
    
    expect(mockGemini.processInputStreaming).toHaveBeenCalled();
    expect(mockVoice.streamTTS).toHaveBeenCalledWith('Gemini');
    expect(mockVoice.streamTTS).toHaveBeenCalledWith('response');
    expect(response).toBe('Gemini response');
  });

  it('should handle transcript events from voice service', async () => {
    await manager.startNewSession('My App');
    const processSpy = vi.spyOn(manager, 'processUserText');
    
    mockVoice.emit('transcript', { text: 'Hello', isFinal: true });
    
    // Wait for async handler
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(processSpy).toHaveBeenCalledWith('Hello');
  });

  it('should update state on voice events', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write');
    
    mockVoice.emit('user-started-speaking');
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Listening'));
    
    mockVoice.emit('user-stopped-speaking');
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Thinking'));
  });

  it('should handle product updates during processInputStreaming', async () => {
    await manager.startNewSession('My App');
    
    mockGemini.processInputStreaming.mockImplementation(async function* (chat: any, text: string, onUpdate: any) {
      await onUpdate({ name: 'Updated Product' });
      yield 'Updated';
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

