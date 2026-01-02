import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface VoiceConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;
  sttModelId?: string;
}

export class VoiceService extends EventEmitter {
  private ttsWs: WebSocket | null = null;
  private sttWs: WebSocket | null = null;
  private config: VoiceConfig;

  constructor(config: VoiceConfig) {
    super();
    this.config = config;
  }

  async connectSTT() {
    const modelId = this.config.sttModelId || 'scribe_v1';
    const url = `wss://api.elevenlabs.io/v1/speech-to-text/stream?model_id=${modelId}`;

    this.sttWs = new WebSocket(url);

    return new Promise((resolve, reject) => {
      this.sttWs!.on('open', () => {
        this.sttWs!.send(JSON.stringify({
          xi_api_key: this.config.apiKey,
        }));
        resolve(true);
      });

      this.sttWs!.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.text) {
          this.emit('transcript', {
            text: message.text,
            isFinal: message.is_final,
          });
        }
      });

      this.sttWs!.on('error', reject);
      this.sttWs!.on('close', () => {
        this.emit('stt-close');
      });
    });
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

  // Handle user audio by streaming it to STT
  handleUserAudio(audioChunk: Buffer) {
    if (this.sttWs && this.sttWs.readyState === WebSocket.OPEN) {
      // Send raw audio chunk to ElevenLabs STT
      // The STT API expects binary data directly or wrapped in a JSON if metadata is needed.
      // For streaming, we often send binary frames after the initial handshake.
      this.sttWs.send(audioChunk);
    }
    this.emit('user-audio', audioChunk);
  }

  sendEndOfAudio() {
    if (this.sttWs && this.sttWs.readyState === WebSocket.OPEN) {
      this.sttWs.send(JSON.stringify({ type: 'end_of_audio' }));
    }
  }

  stopSpeaking() {
    // Interrupt TTS playback
    this.emit('interrupt');
    // We might want to reconnect or send a null byte to ElevenLabs if needed
  }
}

