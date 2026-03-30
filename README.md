# Gift Meaning Engine

## The Problem

Traditional gifting systems fail because they focus on product discovery rather than the decision-making process. Existing tools rely on generic filters and categories that ignore the emotional context and the specific nature of the relationship between the giver and the recipient. This leads to:

- Lack of clarity about meaningful gift directions.
- Over-reliance on generic recommendations.
- Emotional uncertainty when selecting a gift.
- Inability to translate relationship understanding into a thoughtful decision.

## Features

- Adaptive Questioning: Dynamic conversation that adjusts based on user inputs to uncover deep relationship signals.
- Live Interpretation: Real-time processing of user answers to provide immediate insights into the relationship's core values.
- Thematic Gift Directions: Suggests high-level themes rather than specific products to allow for human-centered decision-making.
- Why This Works: Persistent rationales explaining the logic behind every suggestion based on extracted signals.
- Accept and Reject Actions: Integrated feedback loop to refine results and optimize future suggestions.

## Working

The system operates as a cognitive assistant through a four-stage process:

1. Conversation: The user interacts with an AI agent to share details about the recipient and their relationship.
2. Interpretation: LLM-based signal extraction identifies personality, interests, and emotional tone.
3. Exploration: The system generates thematic gift directions accompanied by detailed reasoning.
4. Decision: The user accepts or rejects directions, refining the system's understanding through an iterative feedback loop.

## Architecture

The system follows a multi-tier intelligent architecture:

- Frontend Layer: Built with React 19 and Vite, providing a high-density, compact UI scaled for desktop ergonomics.
- Backend Layer: A Node.js and Express server handling session management and API orchestration.
- Reasoning Layer: An LLM-driven engine for signal extraction (parsing transcripts into structured JSON) and direction generation.
- Learning System: A feedback mechanism that uses interaction data (Accept/Reject) to improve ranking and relevance via reinforcement logic.
- Memory System: A persistent storage layer for relationship patterns and past preferences.

## Running the Project

Navigate to the project root directory and execute the following command:

```bash
npm start
```

This command utilizes concurrently to launch both the backend and frontend services:

- Backend service: Running on port 5000.
- Frontend service: Running on port 5173 (or the next available port).
