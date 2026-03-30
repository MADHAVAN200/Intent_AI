const groq = require('../config/groqClient');

/**
 * Direction Generation Logic
 * Translates signals (personality, interests) into 4 distinct thematic directions 
 * with reasoning, as per the Product Philosophy.
 */
async function generateDirections(signals, weights = {}) {
  const signalSummary = signals.map(s => `${s.type.toUpperCase()}: ${s.value} (Evidence: "${s.evidence}")`).join('\n');
  const weightSummary = weights ? JSON.stringify(weights) : 'No specific weights yet.';

  const prompt = `
    Using the following relationship signals and learned preferences, generate 4 distinct "Gift Directions" (thematic paths).
    
    ### SIGNALS (User Quotes):
    ${signalSummary}

    ### UNIVERSAL LEARNED WEIGHTS (Global Trends):
    ${weightSummary}
    (Instructions: Prioritize categories with highest weights. Avoid types where weights < 0.8).

    ### STRATEGIC RULES:
    1.  **Strict Anti-Brand Policy**: No specific product brands or store links.
    2.  **Signal-to-Meaning Mapping**: CITE the evidence quotes in your "Why This Works" rationale. 
    3.  **Categories**: Each direction MUST belong to ONE of: [nostalgic, experiential, sensory, creative, utilitarian, wellness, intellectual, symbolic].
    4.  **Ranking Policy**: Use weights >= 1.2 to set "is_learned_match": true.

    ### OUTPUT FORMAT (Strict JSON):
    {
      "directions": [
        {
          "title": "Creative Name",
          "category": "one of the 8 allowed categories",
          "description": "Clear 2-sentence strategy.",
          "why_works": "Deep rationale citing evidence.",
          "confidence_level": "high | medium | low",
          "is_learned_match": true/false
        }
      ]
    }

    Return ONLY JSON.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: 'You are the Gift Meaning Engine. You translate human signals into high-reasoning gift directions.' }, { role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    return JSON.parse(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('Direction Generation Error:', error);
    return null;
  }
}

module.exports = { generateDirections };
