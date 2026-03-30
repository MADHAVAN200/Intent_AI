const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabaseClient');
const { extractSignals } = require('./services/meaningEngine');
const { generateDirections } = require('./services/directionService');
const { getThemeWeights } = require('./services/rankingService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 0. Auth Identity Layer
app.post('/api/auth/identify', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Find or Create User
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });

  if (user) {
    return res.json({ userId: user.id });
  }

  const { data: newUser, error: createErr } = await supabase
    .from('users')
    .insert([{ email: email.toLowerCase() }])
    .select()
    .single();

  if (createErr) return res.status(500).json({ error: createErr.message });
  res.json({ userId: newUser.id });
});

// 1. List sessions for specific user
app.get('/api/sessions', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required for history' });

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Predefined Logical Chat Seeds (No Dummy Data)
const TEMPLATE_SEEDS = {
  birthday: {
    messages: [
      { role: 'assistant', content: "A milestone birthday! Tell me about the person—what makes them smile after a long day?" },
      { role: 'user', content: "It's my wife's 30th. She is very into 'slow fashion', loves sustainable materials like linen, and collects local handmade ceramics." },
      { role: 'assistant', content: "Sustainability and artisanal craft, I see. Does she prefer specific tones or more minimalist aesthetics?" },
      { role: 'user', content: "Total minimalist. She'd rather have one perfect bowl than a whole set of mass-produced ones." }
    ],
    signals: [
      { type: 'personality', value: 'Sustainable', evidence: "Loves slow fashion and sustainable materials", confidence: 0.9 },
      { type: 'interest', value: 'Minimalism', evidence: "Total minimalist, prefers quality over quantity", confidence: 0.95 },
      { type: 'interest', value: 'Handmade Ceramics', evidence: "Collects local handmade ceramics", confidence: 0.85 }
    ]
  },
  surprise: {
    messages: [
      { role: 'assistant', content: "An unexpected surprise! Who are we celebrating today?" },
      { role: 'user', content: "My best friend just got a massive promotion. She's a huge bookworm—like, she spends every weekend in old used bookstores." },
      { role: 'assistant', content: "A classic bibliophile. Does she collect specific genres or rare first editions?" },
      { role: 'user', content: "She's obsessed with 20th-century literature. She once mentioned wanting a rare first edition of 'The Great Gatsby'." }
    ],
    signals: [
      { type: 'personality', value: 'Intellectual', evidence: "Huge bookworm, spends weekends in bookstores", confidence: 0.8 },
      { type: 'interest', value: '20th Century Literature', evidence: "Obsessed with 20th-century literature", confidence: 0.9 },
      { type: 'interest', value: 'Antiquarian Books', evidence: "Mentioned wanting a rare first edition", confidence: 0.85 }
    ]
  },
  thanks: {
    messages: [
      { role: 'assistant', content: "Expressing gratitude is an elegant gesture. Tell me about your mentor." },
      { role: 'user', content: "He's a retired professor who coached me through my PhD. He's deeply into classical music and plays the cello." },
      { role: 'assistant', content: "Classical music is a profound interest. Is he more into the performance side or the history of the compositions?" },
      { role: 'user', content: "Both! He's currently trying to learn all of Bach's Cello Suites. He values tradition and refined things." }
    ],
    signals: [
      { type: 'interest', value: 'Classical Music', evidence: "Deeply into classical music", confidence: 0.95 },
      { type: 'interest', value: 'Cello', evidence: "Plays the cello and learning Bach's Suites", confidence: 0.9 },
      { type: 'personality', value: 'Traditional/Refined', evidence: "Retired professor, values tradition and refined things", confidence: 0.8 }
    ]
  },
  beginnings: {
    messages: [
      { role: 'assistant', content: "New beginnings are exciting. What's the context for this housewarming?" },
      { role: 'user', content: "My brother just bought his first apartment. He's into interior design—specifically 'mid-century modern'—and has a massive collection of indoor plants." },
      { role: 'assistant', content: "Mid-century modern and botany, a great combination. Is he looking for functional decor or something purely aesthetic?" },
      { role: 'user', content: "He loves things that are both. He's been looking for a 'statement planter' that matches his teak furniture." }
    ],
    signals: [
      { type: 'interest', value: 'Mid-century Modern', evidence: "Specifically into mid-century modern design", confidence: 0.9 },
      { type: 'interest', value: 'Botany', evidence: "Has a massive collection of indoor plants", confidence: 0.85 },
      { type: 'personality', value: 'Aesthetic-focused', evidence: "Looking for a statement planter to match teak furniture", confidence: 0.8 }
    ]
  },
  longdistance: {
    messages: [
      { role: 'assistant', content: "A gesture that feels like a warm embrace. How far away is your partner?" },
      { role: 'user', content: "She's in London for her grad school. We used to have this morning coffee ritual every single day. She's a total coffee snob now." },
      { role: 'assistant', content: "A shared ritual made special by specialty beans. Is she more into the gear or the specific origins of the coffee?" },
      { role: 'user', content: "She loves the roastery process. She's always talking about Ethiopian beans and local London roasters." }
    ],
    signals: [
      { type: 'interest', value: 'Specialty Coffee', evidence: "Total coffee snob, loves Ethiopian beans", confidence: 0.95 },
      { type: 'tone', value: 'Nostalgic', evidence: "Mentioned their daily shared morning coffee ritual", confidence: 0.85 },
      { type: 'interest', value: 'London Roasters', evidence: "Talks about local London roasters", confidence: 0.8 }
    ]
  }
};

// 2. Session Initialization
app.post('/api/sessions', async (req, res) => {
  const { userId, templateId, name } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required to create session' });

  // 1. Create specific session name based on template if not provided
  let sessionName = name;
  if (!sessionName && templateId && templateId !== 'custom') {
    const names = {
      birthday: "Partner's 30th Birthday",
      surprise: "Promotion Surprise",
      thanks: "Mentor Appreciation",
      beginnings: "New Home Celebration",
      longdistance: "Coffee Ritual Memory"
    };
    sessionName = names[templateId];
  }

  const { data: sessions, error } = await supabase
    .from('sessions')
    .insert([{ 
      user_id: userId,
      status: 'started', 
      name: sessionName || 'New Gift Chat',
      metadata: { templateId } 
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  const session = sessions[0];

  // 2. Insert Seeds if Template exists
  if (templateId && TEMPLATE_SEEDS[templateId]) {
    const seedData = TEMPLATE_SEEDS[templateId];
    
    // Seed Messages
    if (seedData.messages) {
      const messagesToInsert = seedData.messages.map(m => ({
        session_id: session.id,
        role: m.role,
        content: m.content
      }));
      await supabase.from('messages').insert(messagesToInsert);
    }

    // Seed Signals
    if (seedData.signals) {
      const signalsToInsert = seedData.signals.map(s => ({
        session_id: session.id,
        type: s.type,
        value: s.value,
        evidence: s.evidence,
        confidence: s.confidence
      }));
      await supabase.from('extracted_signals').insert(signalsToInsert);
    }
  } else {
    // Seed the initial welcome message so it's persisted for new custom sessions
    await supabase.from('messages').insert([{
      session_id: session.id,
      role: 'assistant',
      content: 'Tell me about this person in your own words. What makes them smile after a long day?'
    }]);
  }

  res.json(session);
});

// 2. Rename Session
app.patch('/api/sessions/:id', async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase
    .from('sessions')
    .update({ name })
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// 3. Delete Session (Cascading manually for safety)
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Clear related records (manual cascade or Supabase will handle if configured)
    await Promise.all([
      supabase.from('messages').delete().eq('session_id', id),
      supabase.from('extracted_signals').delete().eq('session_id', id),
      supabase.from('gift_directions').delete().eq('session_id', id)
    ]);

    // 2. Clear Session
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ status: 'deleted', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Session Retrieval (Full Hydration)
app.get('/api/sessions/:id', async (req, res) => {
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .select(`
      *,
      messages (id, role, content, created_at),
      extracted_signals (id, type, value, evidence, confidence, created_at),
      gift_directions (*)
    `)
    .eq('id', req.params.id)
    .single();

  if (sessErr) return res.status(500).json({ error: sessErr.message });
  
  // Sort messages and signals locally for consistency
  if (session.messages) {
    session.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  
  res.json(session);
});

// 2. Chat & Signal Extraction (Enhanced)
app.post('/api/messages', async (req, res) => {
  const { sessionId, content } = req.body;

  try {
    // Save user message
    await supabase
      .from('messages')
      .insert([{ session_id: sessionId, role: 'user', content }]);

    // Fetch history for AI context
    const { data: history } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Call "Meaning Engine" (Groq) to interpret signals
    const interpretation = await extractSignals(history);
    
    const summaryText = interpretation && interpretation.summary ? interpretation.summary : 'No signals detected.';
    const botReplyContent = `Got it. I'm starting to see a pattern: ${summaryText}`;

    // Save assistant message to ensure it's persisted for history re-hydration
    const { data: aiMsgData } = await supabase
      .from('messages')
      .insert([{ session_id: sessionId, role: 'assistant', content: botReplyContent }])
      .select();

    const replyId = aiMsgData && aiMsgData.length > 0 ? aiMsgData[0].id : Date.now();
    
    if (interpretation && interpretation.signals) {
      const allowedTypes = ['personality', 'interest', 'memory', 'tone'];
      const signalsToSave = interpretation.signals
        .map(s => ({
          session_id: sessionId,
          type: s.type.toLowerCase(),
          value: s.value,
          evidence: s.evidence, // Persistence of AI-cited evidence
          confidence: s.confidence || 0.5
        }))
        .filter(s => allowedTypes.includes(s.type));

      if (signalsToSave.length > 0) {
        await supabase.from('extracted_signals').insert(signalsToSave);
      }
    }

    res.json({ 
      status: 'interpreted', 
      signals: interpretation ? interpretation.signals : [], 
      summary: summaryText,
      reply: botReplyContent,
      replyId: replyId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Generate Thematic Directions (with RL Ranking)
app.post('/api/generate-directions', async (req, res) => {
  const { sessionId, signals: providedSignals } = req.body;

  try {
    let signals = providedSignals;
    
    // Auto-hydrate signals if not provided (allows shareable URLs)
    if (!signals || signals.length === 0) {
      const { data: fetchedSignals, error: signalError } = await supabase
        .from('extracted_signals')
        .select('*')
        .eq('session_id', sessionId);
      
      if (signalError) throw signalError;
      signals = fetchedSignals;
    }

    if (!signals || signals.length === 0) {
      return res.status(400).json({ error: 'No signals found for this session. Chat more first!' });
    }

    // 1. Fetch Learned Weights from Feedback History
    const weights = await getThemeWeights();

    // 2. Generate Directions using Signals + Weights
    const result = await generateDirections(signals, weights);

    if (result && result.directions) {
      const directionsToSave = result.directions.map(d => ({
        session_id: sessionId,
        title: d.title,
        description: d.description,
        why_works: d.why_works,
        confidence_level: d.confidence_level,
        metadata: { 
          category: d.category, // Enhanced mapping link
          is_learned_match: d.is_learned_match 
        }
      }));

      const { data, error } = await supabase.from('gift_directions').insert(directionsToSave).select();
      if (error) throw error;
      res.json({ directions: data });
    } else {
      res.status(500).json({ error: 'Failed to generate directions' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Feedback Telemetry
app.post('/api/feedback', async (req, res) => {
  const { directionId, action } = req.body;
  const { error } = await supabase
    .from('feedback')
    .insert([{ direction_id: directionId, action }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ status: 'success' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`[Meaning Engine] Live on port ${PORT}`));
