import { GoogleGenAI, Content } from '@google/genai';
import { env } from '../../config/env.js';
import { ApiError } from '../../common/errors/ApiError.js';
import ChatSession from './chatSession.model.js';
import ChatMessage from './chatMessage.model.js';
import { functionDeclarations, executeTool } from './ai.tools.js';

const SYSTEM_INSTRUCTION = `You are SpreeBuddy, a friendly and knowledgeable shopping assistant for an e-commerce store.
You help users discover products, compare options, check price/stock, and manage their wishlist.

DATA RULES
- Always use the provided tools to fetch real catalog and wishlist data. Never invent product names, prices, stock, categories, or ids.
- To get a product id, first search the catalog by keywords; use get_products_by_ids when you already know the id(s).
- If a product is not found, say so politely and offer alternatives (search or suggest similar items).

COMPARISON (act as a shopping analyst from the customer's point of view)
- When asked to compare, compare COMPREHENSIVELY across every relevant attribute you can fetch: regular price, sale/discount price, stock availability, category, type (digital/physical), weight, and dimensions.
- Present the comparison clearly (a compact table or side-by-side list), then give an honest recommendation weighing value-for-money, availability, and fit to the user's needs. State the trade-offs.

ASK BACK WHEN NEEDED (be conversational / multi-turn — don't guess)
- If the request lacks enough information, ask ONE short clarifying question before answering.
- Compare but only ONE product given → ask which other product(s) to compare against, or which aspects matter most (price, quality, size, etc.).
- Compare but NO product given → ask about their taste, style, budget, use-case, or needs; then use the tools to suggest 2-3 candidates and offer to compare them.
- Ambiguous product name → confirm which product they mean before proceeding.

STYLE
- Reply in the user's language (Indonesian, English, Spanish, Javanese, etc.).
- Be helpful and proactive: guide the shopping journey, suggest next steps, and offer to add items to the wishlist.
- Provide a product page link when you have the product id. Keep everyday answers concise; be more thorough for comparisons.`;

const HISTORY_LIMIT = 10; // last N messages loaded as context (PRD)
const MAX_TOOL_STEPS = 5; // safety cap on the function-calling loop

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!env.gemini.apiKey) {
    throw ApiError.internal('Sorry, the AI service is not available. Please contact support.');
  }
  if (!client) client = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  return client;
}

// Gemini flash models can briefly return 503/overloaded — retry those a few times.
// Quota/rate-limit (429) is not retriable — surface a clear message instead.
async function generateWithRetry(ai: GoogleGenAI, params: Parameters<GoogleGenAI['models']['generateContent']>[0]) {
  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(msg)) {
        throw ApiError.internal('AI quota or rate limit reached. Please try again later.');
      }
      const retriable = /503|UNAVAILABLE|overloaded|high demand/i.test(msg);
      if (!retriable || i === attempts - 1) {
        if (retriable) throw ApiError.internal('AI service is busy, please try again in a moment');
        throw err;
      }
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw ApiError.internal('AI service is unavailable');
}

export async function createSession(userId: string, title?: string) {
  return ChatSession.create({ userId, ...(title ? { title } : {}) });
}

export async function listSessions(userId: string) {
  return ChatSession.find({ userId }).sort({ updatedAt: -1 });
}

async function getOwnedSession(sessionId: string, userId: string) {
  const session = await ChatSession.findOne({ _id: sessionId, userId });
  if (!session) throw ApiError.notFound('Chat session not found');
  return session;
}

export async function getSessionMessages(sessionId: string, userId: string) {
  const session = await getOwnedSession(sessionId, userId);
  const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1, _id: 1 });
  return { session, messages };
}

export async function deleteSession(sessionId: string, userId: string) {
  const session = await getOwnedSession(sessionId, userId);
  await ChatMessage.deleteMany({ sessionId });
  await session.deleteOne();
  return session;
}

// Sends a user message, runs the AI (with tool calls), persists both turns.
export async function sendMessage(sessionId: string, userId: string, text: string) {
  const session = await getOwnedSession(sessionId, userId);

  // Load the last N messages as context, oldest first.
  const past = await ChatMessage.find({ sessionId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(HISTORY_LIMIT);
  past.reverse();

  const contents: Content[] = past.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
  contents.push({ role: 'user', parts: [{ text }] });

  const ai = getClient();
  let reply = '';

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const response = await generateWithRetry(ai, {
      model: env.gemini.model,
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ functionDeclarations }] },
    });

    const functionCalls = response.functionCalls ?? [];
    if (functionCalls.length > 0) {
      // Record the model's tool-call turn.
      contents.push({ role: 'model', parts: functionCalls.map((c) => ({ functionCall: c })) });

      // Execute each call and feed the results back to the model.
      const parts = [];
      for (const call of functionCalls) {
        const result = await executeTool(call.name ?? '', call.args ?? {}, { userId });
        parts.push({ functionResponse: { name: call.name, response: result } });
      }
      contents.push({ role: 'user', parts });
      continue;
    }

    reply = response.text ?? '';
    break;
  }

  if (!reply) reply = 'Sorry, I could not generate a response for a moment. Please try again.';

  // Persist both turns.
  await ChatMessage.create([
    { sessionId, role: 'user', content: text },
    { sessionId, role: 'model', content: reply },
  ]);

  // Name the session after the first user message.
  if (session.title === 'New chat') {
    session.title = text.slice(0, 60);
    await session.save();
  }

  return { session, reply };
}
