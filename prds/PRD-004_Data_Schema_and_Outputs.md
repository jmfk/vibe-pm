# PRD-004: Data Schema and Output Formats

## 1. Overview
This document defines the structure of the requirements database and the formats for the generated PRD files.

## 2. Requirements Database (Internal State)
The system maintains a JSON or SQLite state that reflects the current understanding of the product.

### 2.1. Core Schema (YAML/JSON)
```yaml
product:
  name: String
  version: String
  status: "Discovery" | "Drafted" | "Completed"
vision:
  summary: String
  goals: [String]
personas:
  - name: String
    description: String
requirements:
  functional:
    - id: REQ-001
      title: String
      description: String
      priority: "P0" | "P1" | "P2"
  non_functional:
    - id: NFR-001
      title: String
      description: String
technical_constraints: [String]
success_metrics: [String]
```

## 3. Human-Readable PRD (Markdown)
The Markdown output should be formatted for easy reading in tools like Notion, GitHub, or Obsidian.

### 3.1. Standard Template
- **Title and Metadata**
- **Executive Summary**
- **Target Audience & Personas**
- **User Stories**
- **Functional Requirements**
- **Non-Functional Requirements**
- **Architecture & Technical Considerations**
- **Milestones & Success Metrics**

## 4. Computer-Friendly Specs (YAML)
The YAML output is designed for programmatic consumption, potentially feeding into AI code generators or project management tools (e.g., Jira, Trello).

### 4.1. YAML Structure
The YAML file will mirror the Core Schema defined in section 2.1, providing a clean, parseable version of the Markdown document.

## 5. Synchronization Logic
The system must ensure that every time a Markdown PRD is generated, a corresponding YAML file is updated to match. The YAML file serves as the "source of truth" for the LLM's internal state.

