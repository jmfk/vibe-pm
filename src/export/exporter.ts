import { Product } from '../models/schema.js';
import yaml from 'js-yaml';

export class Exporter {
  exportToMarkdown(product: Product): string {
    return `
# PRD: ${product.name}

## 1. Executive Summary
- **Version:** ${product.version}
- **Status:** ${product.status}

### Summary
${product.vision.summary}

### Goals
${product.vision.goals.map(g => `- ${g}`).join('\n')}

## 2. Target Audience & Personas
${product.personas.map(p => `### ${p.name}\n${p.description}`).join('\n\n')}

## 3. User Stories
${product.user_stories.map(us => `- **${us.id}**: As a ${us.as_a}, I want to ${us.i_want_to}, so that ${us.so_that}`).join('\n')}

## 4. Functional Requirements
${product.requirements.functional.map(r => `### ${r.id}: ${r.title} (${r.priority})\n${r.description}`).join('\n\n')}

## 5. Non-Functional Requirements
${product.requirements.non_functional.map(r => `### ${r.id}: ${r.title} (${r.priority})\n${r.description}`).join('\n\n')}

## 6. UI/UX Requirements
${product.requirements.ui_ux.map(r => `### ${r.id}: ${r.title} (${r.priority})\n${r.description}`).join('\n\n')}

## 7. Technical Constraints
${product.technical_constraints.map(c => `- ${c}`).join('\n')}

## 8. Milestones & Success Metrics
${product.success_metrics.map(m => `- ${m}`).join('\n')}
`.trim();
  }

  exportToYAML(product: Product): string {
    return yaml.dump(product);
  }
}

