// services/aiService.js
const axios = require('axios');

const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

/**
 * Build the prompt for funding stage analysis
 * Instructs the model to return only valid JSON.
 */
function buildPrompt(data) {
  return `
You are a startup funding advisor. Based on the following startup information, determine the most appropriate funding stage (Pre‑seed, Seed, Series A, Series B, or Series C+) and provide detailed guidance.

Startup Information:
- Company: ${data.companyName}
- Funding Required: $${data.fundingRequired}
- Current Market: ${data.currentMarket}
- Founder Net Worth: $${data.netWorth}
- Team Size: ${data.teamSize} people
- Product Cost: $${data.productCost} per unit/month
- Monthly Revenue: $${data.monthlyRevenue || 0}
- Years in Operation: ${data.yearsOperating || 0}

Consider these typical funding stages:
- Pre‑seed: Idea stage, friends/family funding, <$500K
- Seed: Product development, initial traction, $500K‑$2M
- Series A: Proven product‑market fit, scaling, $2M‑$15M
- Series B: Rapid scaling, $15M‑$50M
- Series C+: Late stage, $50M+

Provide your response as a JSON object with exactly these fields:
{
  "stage": "string",
  "confidence": number (0-100),
  "reasoning": "string",
  "nextSteps": ["string", "string", ...],
  "marketAnalysis": "string",
  "score": number (overall readiness 0-100)
}
Only return the JSON object, no other text, no markdown formatting.
  `;
}

/**
 * Attempt to extract a JSON object from a string that may contain extra text.
 * Falls back to a default error object if parsing fails.
 */
function extractJSON(text) {
  // Try to find a JSON object within the text (in case the model adds extra words)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('❌ Found JSON-like structure but parsing failed:', e.message);
    }
  }
  // If no JSON found or parsing failed, return a fallback
  return {
    stage: 'Unknown',
    confidence: 0,
    reasoning: 'AI response could not be parsed. Please try again.',
    nextSteps: ['Check Ollama model or prompt', 'Ensure model returns valid JSON'],
    marketAnalysis: 'Unavailable',
    score: 0,
    rawResponse: text.substring(0, 500) // include snippet for debugging
  };
}

/**
 * Call Ollama API (local)
 */
async function callOllama(prompt) {
  console.log('📡 Sending request to Ollama at:', OLLAMA_URL);
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: 'llama3:latest',          // ensure this model is pulled
      prompt: prompt,
      stream: false,
      temperature: 0.7,
      max_tokens: 2000
    });

    console.log('✅ Ollama HTTP status:', response.status);
    console.log('📦 Raw response data (first 500 chars):', JSON.stringify(response.data).substring(0, 500));

    // Ollama returns { "model": "...", "created_at": "...", "response": "generated text", "done": true }
    const generatedText = response.data.response;
    if (!generatedText) {
      throw new Error('Ollama response missing "response" field');
    }

    console.log('📝 Generated text (first 300 chars):', generatedText.substring(0, 300));

    // Extract JSON from the generated text
    const parsed = extractJSON(generatedText);
    if (parsed.stage !== 'Unknown') {
      console.log('✅ Successfully parsed JSON from Ollama');
    } else {
      console.warn('⚠️ Using fallback response (parsing failed)');
    }
    return parsed;
  } catch (error) {
    console.error('❌ Ollama request error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    // Return a fallback instead of throwing, so the API still responds gracefully
    return {
      stage: 'Error',
      confidence: 0,
      reasoning: `AI service failed: ${error.message}. Please ensure Ollama is running.`,
      nextSteps: ['Start Ollama with "ollama serve"', 'Pull llama3:latest'],
      marketAnalysis: 'Unavailable',
      score: 0
    };
  }
}

/**
 * Call OpenAI API (cloud)
 */
async function callOpenAI(prompt) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ OpenAI error:', error.message);
    // Fallback similar to Ollama
    return {
      stage: 'Error',
      confidence: 0,
      reasoning: `OpenAI service failed: ${error.message}`,
      nextSteps: ['Check API key', 'Try again later'],
      marketAnalysis: 'Unavailable',
      score: 0
    };
  }
}

/**
 * Main export – analyze startup data using the configured AI provider
 */
exports.analyzeStartup = async (startupData) => {
  console.log('🔍 Analyzing startup:', startupData.companyName);
  const prompt = buildPrompt(startupData);

  let result;
  if (AI_PROVIDER === 'ollama') {
    result = await callOllama(prompt);
  } else {
    result = await callOpenAI(prompt);
  }

  // Ensure result has all expected fields (in case of fallback)
  return {
    stage: result.stage || 'Unknown',
    confidence: result.confidence || 0,
    reasoning: result.reasoning || 'No reasoning provided',
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps : [],
    marketAnalysis: result.marketAnalysis || 'No market analysis',
    score: result.score || 0,
    ...(result.rawResponse && { debug: result.rawResponse }) // optional debug field
  };
};