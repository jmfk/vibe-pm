# PRD-001: System Overview and Architecture

## 1. Overview
The Vibe PM system is a voice-first AI product manager designed to transform verbal ideas into structured product requirements. It leverages low-latency voice interaction to facilitate real-time brainstorming and specification drafting.

## 2. Goals
- Provide a seamless voice interface for product discovery.
- Automatically build and maintain a requirements database from user conversations.
- Generate high-quality Markdown PRDs and YAML configuration files.
- Minimize latency to ensure a natural conversational flow.

## 3. Target Audience
- Product Managers
- Software Engineers
- Startup Founders

## 4. High-Level Architecture
The system consists of three main layers:
- **Interaction Layer**: Handles Speech-to-Text (STT) and Text-to-Speech (TTS) using ElevenLabs.
- **Intelligence Layer**: Uses Google Gemini 3 Flash to process input, ask clarifying questions, and structure requirements.
- **Persistence Layer**: A local or remote database to store structured requirements, and a file system for Markdown/YAML exports.

## 5. Technical Stack
- **LLM**: Google Gemini 3 Flash (via API)
- **Voice**: ElevenLabs (STT/TTS via WebSocket for low latency)
- **Backend**: Node.js/TypeScript (suggested for handling async streams)
- **Storage**: Local SQLite or JSON for the Requirements DB
- **Output**: Markdown and YAML

## 6. Key Workflows
1. **Discovery Phase**: User speaks, LLM transcribed via ElevenLabs STT, Gemini analyzes and asks follow-up questions.
2. **Structuring Phase**: Gemini updates the Requirements DB state based on new information.
3. **Compilation Phase**: System generates human-readable Markdown and machine-readable YAML files.

