import { ProductRepository } from '../db/repository.js';
import { GeminiEngine } from '../intelligence/gemini.js';
import { VoiceService } from '../voice/voice-service.js';
import { Product } from '../models/schema.js';
import { ChatSession } from '@google/generative-ai';

export class DiscoveryManager {
  private repo: ProductRepository;
  private gemini: GeminiEngine;
  private voice: VoiceService;
  private chat: ChatSession | null = null;
  private productId: number | null = null;
  private currentState: 'listening' | 'thinking' | 'speaking' | 'idle' = 'idle';

  constructor(repo: ProductRepository, gemini: GeminiEngine, voice: VoiceService) {
    this.repo = repo;
    this.gemini = gemini;
    this.voice = voice;

    this.setupVoiceHandlers();
  }

  private setupVoiceHandlers() {
    this.voice.on('transcript', async (data) => {
      if (data.isFinal) {
        console.log(`\n[User]: ${data.text}`);
        await this.processUserText(data.text);
      }
    });

    this.voice.on('user-started-speaking', () => {
      this.setState('listening');
    });

    this.voice.on('user-stopped-speaking', () => {
      this.setState('thinking');
    });

    this.voice.on('audio', () => {
      if (this.currentState !== 'speaking') {
        this.setState('speaking');
      }
    });

    this.voice.on('final', () => {
      this.setState('idle');
    });
  }

  private setState(state: typeof this.currentState) {
    this.currentState = state;
    const indicators = {
      listening: '👂 Listening...',
      thinking: '🤔 Thinking...',
      speaking: '🗣️ Speaking...',
      idle: '⚪ Idle',
    };
    process.stdout.write(`\r[State]: ${indicators[state]}          `);
  }

  async startNewSession(productName: string) {
    const initialProduct: Product = {
      name: productName,
      version: '0.1.0',
      status: 'Discovery',
      vision: { summary: '', goals: [] },
      personas: [],
      requirements: { functional: [], non_functional: [], ui_ux: [] },
      technical_constraints: [],
      success_metrics: [],
    };

    this.productId = await this.repo.saveProduct(initialProduct);
    this.chat = await this.gemini.startChat();
    
    // Initial greeting
    const greeting = `Hi! I'm your Product Architect. Let's start building ${productName}. What's the main vision for this product?`;
    this.voice.streamTTS(greeting);
    return greeting;
  }

  async processUserText(text: string) {
    if (!this.chat || this.productId === null) {
      throw new Error('Session not started');
    }

    this.setState('thinking');
    const generator = this.gemini.processInputStreaming(
      this.chat,
      text,
      async (updatedProduct: Product) => {
        if (this.productId !== null) {
          await this.repo.updateProduct(this.productId, updatedProduct);
          if (updatedProduct.status === 'Completed') {
            console.log('\n[System]: Product discovery marked as Completed.');
            this.voice.streamTTS('Great! I have all the information I need to finalize the product requirements.');
          }
        }
      }
    );

    let fullResponse = '';
    for await (const chunk of generator) {
      fullResponse += chunk + ' ';
      this.voice.streamTTS(chunk);
    }

    this.voice.sendEndOfStream();
    return fullResponse.trim();
  }

  async loadSession(productId: number) {
    const product = await this.repo.getProduct(productId);
    if (!product) throw new Error('Product not found');
    
    this.productId = productId;
    this.chat = await this.gemini.startChat();
    
    const resumeMessage = `Welcome back. We are working on ${product.name}. Where should we pick up?`;
    this.voice.streamTTS(resumeMessage);
    return resumeMessage;
  }
}

