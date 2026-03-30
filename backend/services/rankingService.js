const supabase = require('../config/supabaseClient');

/**
 * RL Ranking Engine
 * Analyzes previous 'Accept/Reject' feedback to calculate theme weights.
 */
async function getThemeWeights() {
  try {
    // Fetch all feedback with associated gift direction details (including metadata for categories)
    const { data: feedbackData, error } = await supabase
      .from('feedback')
      .select(`
        action, 
        gift_directions (
          title, 
          description,
          metadata
        )
      `);

    const weights = {
      nostalgic: 1.0,
      experiential: 1.0,
      sensory: 1.0,
      creative: 1.0,
      utilitarian: 1.0,
      wellness: 1.0,
      intellectual: 1.0,
      symbolic: 1.0
    };

    const counts = { nostalgic: 0, experiential: 0, sensory: 0, creative: 0, utilitarian: 0, wellness: 0, intellectual: 0, symbolic: 0 };
    const sums = { nostalgic: 0, experiential: 0, sensory: 0, creative: 0, utilitarian: 0, wellness: 0, intellectual: 0, symbolic: 0 };

    feedbackData.forEach(item => {
      // 1. Primary Mapping: Use AI-tagged category from metadata
      const category = item.gift_directions?.metadata?.category;
      const text = `${item.gift_directions?.title} ${item.gift_directions?.description}`.toLowerCase();
      const score = item.action === 'accept' ? 1.5 : 0.5;

      const keys = Object.keys(weights);
      keys.forEach(key => {
        // Universal match: metadata tag OR semantic keyword fallback
        if (category === key || text.includes(key)) {
          sums[key] += score;
          counts[key]++;
        }
      });
    });

    // Calculate final weights (normalized around 1.0)
    Object.keys(weights).forEach(key => {
      if (counts[key] > 0) {
        weights[key] = sums[key] / counts[key];
      }
    });

    return weights;
  } catch (error) {
    console.error('Ranking Logic Error:', error);
    return null;
  }
}

module.exports = { getThemeWeights };
