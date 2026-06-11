// ============================================================
// controllers/chatbotController.js
// Medical AI Chatbot — powered by Google Gemini 1.5 Flash (FREE tier)
// Free tier: 15 requests/min, 1500 requests/day — no billing needed
// ============================================================

/*const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";*/

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

// System prompt — keeps bot focused on medical topics only
const MEDICAL_SYSTEM_PROMPT = `You are MediBot, a helpful AI health assistant for a doctor appointment platform called HealthCare+.

Your role:
- Answer patient questions about medicine, disease symptoms, general health advice, and wellness
- Help patients understand their symptoms in plain, simple language
- Suggest when a patient should see a doctor urgently vs. when home care is appropriate
- Provide general information about common medications (usage, side effects, precautions)
- Explain medical terms in easy-to-understand language

Rules you MUST follow:
1. NEVER diagnose a patient definitively — always say "this may be related to..." or "these symptoms can be associated with..."
2. For serious/emergency symptoms (chest pain, difficulty breathing, severe bleeding, stroke signs), ALWAYS tell them to call emergency services or go to the ER immediately
3. NEVER recommend specific prescription medications by name without advising the patient to consult their doctor
4. Keep answers concise, warm, and easy to understand — avoid excessive medical jargon
5. If asked about something completely unrelated to health/medicine, politely say you can only help with health-related questions
6. Always end with a gentle reminder that you are not a substitute for professional medical advice when relevant

Format your responses in short paragraphs. Use bullet points for lists of symptoms or steps. Keep total response under 200 words unless the question genuinely requires more detail.`;

/**
 * POST /api/chatbot/message
 * Body: { message: string, history: [{role, content}] }
 */
const sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({ error: "Message too long (max 1000 characters)" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Chatbot service not configured. Please add GEMINI_API_KEY to .env" });
    }

    // Gemini uses a "contents" array with role: "user" | "model"
    // Build last 10 turns of history
    const geminiHistory = history.slice(-10).map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add current user message
    const contents = [
      ...geminiHistory,
      { role: "user", parts: [{ text: message.trim() }] },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: MEDICAL_SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API error:", response.status, errBody);

      // Handle quota exceeded specifically
      if (response.status === 429) {
        return res
          .status(429)
          .json({ error: "Too many requests. Please wait a moment and try again." });
      }

      return res.status(502).json({ error: "AI service unavailable. Please try again." });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    return res.json({ reply });
  } catch (error) {
    console.error("Chatbot controller error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { sendMessage };
