# PRD-003: LLM Requirements Engine and Logic

## 1. Overview
The Requirements Engine is the brain of Vibe PM. It uses Google Gemini 3 Flash to facilitate a discovery process that leads to a comprehensive product specification.

## 2. Intelligence Requirements
### 2.1. Discovery Logic
- **Iterative Inquiry**: The LLM must not just accept input but actively probe for missing details (e.g., edge cases, user personas, success metrics).
- **Context Awareness**: Maintain a coherent understanding of the product throughout a long conversation.
- **Ambiguity Detection**: Identify vague statements (e.g., "I want it to be fast") and ask for concrete definitions.

### 2.2. Requirements Database (ReqDB) Management
- **Stateful Tracking**: The LLM must maintain an internal state of what has been defined and what is still pending.
- **Categorization**: Automatically group requirements into sections: Functional, Non-functional, UI/UX, Technical Constraints, and Success Metrics.

## 3. Interaction Patterns
- **Active Listener**: Acknowledges user input with brief verbal cues before asking the next question.
- **Drafting Mode**: Occasionally summarizes the current state of the PRD to the user for validation.
- **Compilation Trigger**: Detects when the user is satisfied or when the core requirements are sufficiently detailed to generate the final files.

## 4. Prompt Engineering Strategy
- **System Instructions**: Define a "Product Architect" persona for Gemini.
- **Tool Use**: Use function calling or JSON structured output to update the internal Requirements DB schema.
- **Example Prompts**:
    - "Given the current requirements for [Product Name], what are the 3 most critical missing pieces of information?"
    - "Summarize the user's latest input and update the 'Functional Requirements' section of the YAML state."

