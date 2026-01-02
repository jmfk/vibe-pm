import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface VoiceConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;
}

export class VoiceService extends EventEmitter {
  private ttsWs: WebSocket | null = null;
  private config: VoiceConfig;

  constructor(config: VoiceConfig) {
    super();
    this.config = config;
  }

  async connectTTS() {
    const modelId = this.config.modelId || 'eleven_turbo_v2_5';
    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}/stream-input?model_id=${modelId}`;
    
    this.ttsWs = new WebSocket(url);

    return new Promise((resolve, reject) => {
      this.ttsWs!.on('open', () => {
        // Send initial handshake
        this.ttsWs!.send(JSON.stringify({
          text: ' ',
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          xi_api_key: this.config.apiKey,
        }));
        resolve(true);
      });

      this.ttsWs!.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.audio) {
          this.emit('audio', Buffer.from(message.audio, 'base64'));
        }
        if (message.isFinal) {
          this.emit('final');
        }
      });

      this.ttsWs!.on('error', reject);
      this.ttsWs!.on('close', () => {
        this.emit('close');
      });
    });
  }

  streamTTS(text: string) {
    if (!this.ttsWs || this.ttsWs.readyState !== WebSocket.OPEN) {
      throw new Error('TTS WebSocket not connected');
    }
    this.ttsWs.send(JSON.stringify({
      text: text,
      try_trigger_generation: true,
    }));
  }

  sendEndOfStream() {
    if (this.ttsWs && this.ttsWs.readyState === WebSocket.OPEN) {
      this.ttsWs.send(JSON.stringify({ text: '' }));
    }
  }

  // Placeholder for STT integration
  handleUserAudio(audioChunk: Buffer) {
    // In a real implementation, this would send audio to an STT service (e.g. ElevenLabs or Deepgram)
    // For now, we'll emit a placeholder event or the user can pipe this elsewhere
    this.emit('user-audio', audioChunk);
  }

  stopSpeaking() {
    // Interrupt TTS playback
    this.emit('interrupt');
    // We might want to reconnect or send a null byte to ElevenLabs if needed
  }
}

