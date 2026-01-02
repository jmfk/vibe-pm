import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceService } from '../voice/voice-service.js';

// Mock WebSocket class
const mockOn = vi.fn();
const mockSend = vi.fn();

vi.mock('ws', () => {
  class MockWebSocket {
    static OPEN = 1;
    on = mockOn;
    send = mockSend;
    readyState = 1; // OPEN
    close = vi.fn();
  }
  return {
    default: MockWebSocket,
  };
});

describe('VoiceService', () => {
  let service: VoiceService;
  const config = { apiKey: 'test-key', voiceId: 'test-voice' };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VoiceService(config);
  });

  it('should connect to ElevenLabs STT WebSocket', async () => {
    const connectPromise = service.connectSTT();
    
    // Find the 'open' callback and call it
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open' && call[1] !== undefined)[1];
    openCallback();

    await expect(connectPromise).resolves.toBe(true);
    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('xi_api_key'));
  });

  it('should emit transcript when STT message is received', async () => {
    const connectPromise = service.connectSTT();
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open')[1];
    openCallback();
    await connectPromise;

    const messageCallback = mockOn.mock.calls.find(call => call[0] === 'message')[1];

    let receivedTranscript: any = null;
    service.on('transcript', (data) => {
      receivedTranscript = data;
    });

    messageCallback(JSON.stringify({ text: 'Hello world', is_final: true }));
    expect(receivedTranscript).toEqual({ text: 'Hello world', isFinal: true });
  });

  it('should stream user audio to STT', async () => {
    const connectPromise = service.connectSTT();
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open')[1];
    openCallback();
    await connectPromise;

    const audioChunk = Buffer.from('test-audio');
    service.handleUserAudio(audioChunk);
    expect(mockSend).toHaveBeenCalledWith(audioChunk);
  });

  it('should send end of audio to STT', async () => {
    const connectPromise = service.connectSTT();
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open')[1];
    openCallback();
    await connectPromise;

    service.sendEndOfAudio();
    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('end_of_audio'));
  });

  it('should connect to ElevenLabs TTS WebSocket', async () => {
    const connectPromise = service.connectTTS();
    
    // Find the 'open' callback and call it
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open')[1];
    openCallback();

    await expect(connectPromise).resolves.toBe(true);
    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('xi_api_key'));
  });

  it('should emit audio when message is received', async () => {
    const connectPromise = service.connectTTS();
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open')[1];
    openCallback();
    await connectPromise;

    const audioData = Buffer.from('test-audio').toString('base64');
    const messageCallback = mockOn.mock.calls.find(call => call[0] === 'message')[1];

    let receivedAudio: Buffer | null = null;
    service.on('audio', (data) => {
      receivedAudio = data;
    });

    messageCallback(JSON.stringify({ audio: audioData }));
    expect(receivedAudio!.toString()).toBe('test-audio');
  });

  it('should send text to TTS stream', async () => {
    const connectPromise = service.connectTTS();
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open')[1];
    openCallback();
    await connectPromise;

    service.streamTTS('Hello world');
    expect(mockSend).toHaveBeenCalledWith(expect.stringContaining('Hello world'));
  });

  it('should send end of stream', async () => {
    const connectPromise = service.connectTTS();
    const openCallback = mockOn.mock.calls.find(call => call[0] === 'open')[1];
    openCallback();
    await connectPromise;

    service.sendEndOfStream();
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify({ text: '' }));
  });

  it('should emit interrupt when stopSpeaking is called', () => {
    let interrupted = false;
    service.on('interrupt', () => {
      interrupted = true;
    });
    service.stopSpeaking();
    expect(interrupted).toBe(true);
  });
});
