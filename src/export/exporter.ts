import { Product } from '../models/schema.js';
import yaml from 'js-yaml';

export class Exporter {
  exportToMarkdown(product: Product): string {
    return `
# PRD: ${product.name}
**Version:** ${product.version}
**Status:** ${product.status}

## 1. Executive Summary
${product.vision.summary}

## 2. Goals
${product.vision.goals.map(g => `- ${g}`).join('\n')}

## 3. Target Audience & Personas
${product.personas.map(p => `### ${p.name}\n${p.description}`).join('\n\n')}

## 4. Functional Requirements
${product.requirements.functional.map(r => `### ${r.id}: ${r.title} (${r.priority})\n${r.description}`).join('\n\n')}

## 5. Non-Functional Requirements
${product.requirements.non_functional.map(r => `### ${r.id}: ${r.title} (${r.priority})\n${r.description}`).join('\n\n')}

## 6. Technical Constraints
${product.technical_constraints.map(c => `- ${c}`).join('\n')}

## 7. Success Metrics
${product.success_metrics.map(m => `- ${m}`).join('\n')}
`.trim();
  }

  exportToYAML(product: Product): string {
    return yaml.dump(product);
  }
}

