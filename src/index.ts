import 'dotenv/config';
import readline from 'readline';
import { ProductRepository } from './db/repository.js';
import { GeminiEngine } from './intelligence/gemini.js';
import { VoiceService } from './voice/voice-service.js';
import { DiscoveryManager } from './orchestration/discovery-manager.js';
import { Exporter } from './export/exporter.js';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  const repo = new ProductRepository();
  await repo.init('vibe-pm.sqlite');

  const gemini = new GeminiEngine(process.env.GEMINI_API_KEY || '');
  const voice = new VoiceService({
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgmqS0vC4O0p', // Default voice
  });

  const manager = new DiscoveryManager(repo, gemini, voice);
  const exporter = new Exporter();

  console.log('--- Vibe PM: Voice-First AI Product Manager ---');

  // Initialize voice connections
  try {
    await voice.connectTTS();
    await voice.connectSTT();
    console.log('Connected to ElevenLabs Voice Pipeline.');
  } catch (error) {
    console.error('Failed to connect to voice services:', error);
  }
  
  rl.question('Enter product name to start (or leave empty to load latest): ', async (name) => {
    let greeting: string;
    if (name) {
      greeting = await manager.startNewSession(name);
    } else {
      // Logic to load latest could be added here
      console.log('Starting new session: "New Product"');
      greeting = await manager.startNewSession('New Product');
    }

    console.log(`\nAI: ${greeting}`);

    const chatLoop = () => {
      rl.question('\nYou: ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'save') {
          // Export on exit
          const product = await repo.getProduct(1); // Simplification: get ID 1
          if (product) {
            fs.writeFileSync('PRD.md', exporter.exportToMarkdown(product));
            fs.writeFileSync('spec.yaml', exporter.exportToYAML(product));
            console.log('PRD.md and spec.yaml generated.');
          }
          console.log('Goodbye!');
          process.exit(0);
        }

        const response = await manager.processUserText(input);
        console.log(`\nAI: ${response}`);
        chatLoop();
      });
    };

    chatLoop();
  });
}

main().catch(console.error);

