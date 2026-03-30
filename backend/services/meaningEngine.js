const groq = require('../config/groqClient');

/**
 * Signal Extraction Engine
 * Uses Llama 3.3 70B via Groq to parse conversation history into 
 * structured JSON signals as per the Product Documentation.
 */
async function extractSignals(messages) {
  const conversationString = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const prompt = `
    Analyze the following conversation history for a gift-finding session. 
    Extract structured "Relationship Signals" as defined in the product philosophy.
    For each signal, you MUST provide "evidence" (a direct quote or phrase from the user's input).

    ### CONVERSATION HISTORY:
    ${conversationString}

    ### GUIDELINES:
    1.  **Personality**: Focus on traits (e.g., "adventurous", "minimalist").
    2.  **Interest**: Focus on hobbies/passions (e.g., "gardening", "photography").
    3.  **Memory**: Focus on shared history or tokens (e.g., "20th anniversary", "Venice trip").
    4.  **Tone**: Focus on the emotional vibe (e.g., "nostalgic", "playful").

    ### OUTPUT FORMAT (Strict JSON):
    {
      "signals": [
        { 
          "type": "personality | interest | memory | tone", 
          "value": "e.g., Highly adventurous", 
          "evidence": "e.g., They spend every weekend climbing.",
          "confidence": 0.0-1.0 
        }
      ],
      "summary": "A 1-sentence summary of the relationship state."
    }

    Return ONLY the JSON object. No intro or outro text.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    return JSON.parse(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('Signal Extraction Error:', error);
    return null;
  }
}

module.exports = { extractSignals };
