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

  constructor(repo: ProductRepository, gemini: GeminiEngine, voice: VoiceService) {
    this.repo = repo;
    this.gemini = gemini;
    this.voice = voice;
  }

  async startNewSession(productName: string) {
    const initialProduct: Product = {
      name: productName,
      version: '0.1.0',
      status: 'Discovery',
      vision: { summary: '', goals: [] },
      personas: [],
      requirements: { functional: [], non_functional: [] },
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

    const responseText = await this.gemini.processInput(
      this.chat,
      text,
      async (updatedProduct: Product) => {
        if (this.productId !== null) {
          await this.repo.updateProduct(this.productId, updatedProduct);
        }
      }
    );

    this.voice.streamTTS(responseText);
    return responseText;
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

