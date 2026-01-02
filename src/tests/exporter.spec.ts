import { describe, it, expect, afterAll } from 'vitest';
import { Exporter } from '../export/exporter.js';
import { Product } from '../models/schema.js';
import fs from 'fs';
import path from 'path';

describe('Exporter', () => {
  const exporter = new Exporter();
  const mockProduct: Product = {
    name: 'Vibe PM',
    version: '1.0.0',
    status: 'Drafted',
    vision: {
      summary: 'AI PM',
      goals: ['Goal 1'],
    },
    personas: [{ name: 'PM', description: 'Writes PRDs' }],
    user_stories: [{ id: 'US-1', as_a: 'PM', i_want_to: 'record audio', so_that: 'I can multitask' }],
    requirements: {
      functional: [{ id: 'REQ-1', title: 'Voice', description: 'Voice input', priority: 'P0' }],
      non_functional: [],
      ui_ux: [],
    },
    technical_constraints: ['Node.js'],
    success_metrics: ['Speed'],
  };

  it('should export to markdown', () => {
    const md = exporter.exportToMarkdown(mockProduct);
    expect(md).toContain('# PRD: Vibe PM');
    expect(md).toContain('## 1. Executive Summary');
    expect(md).toContain('## 3. User Stories');
    expect(md).toContain('**US-1**: As a PM');
    expect(md).toContain('REQ-1: Voice');
  });

  it('should export to YAML', () => {
    const yml = exporter.exportToYAML(mockProduct);
    expect(yml).toContain('name: Vibe PM');
    expect(yml).toContain('priority: P0');
  });

  it('should save synced exports', async () => {
    const testDir = './test-exports';
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    const { mdPath, yamlPath } = await exporter.saveSyncedExports(mockProduct, testDir);
    expect(fs.existsSync(mdPath)).toBe(true);
    expect(fs.existsSync(yamlPath)).toBe(true);
    
    // Clean up
    fs.unlinkSync(mdPath);
    fs.unlinkSync(yamlPath);
  });

  afterAll(() => {
    const testDir = './test-exports';
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
});
