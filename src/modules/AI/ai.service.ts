import { OpenAI } from 'openai';
import { env } from '../../config/env.js';
import { ApiError } from '../../common/errors/ApiError.js';
import ChatSession from './chatSession.model.js';
import ChatMessage from './chatMessage.model.js';
import { tools, executeTool } from './ai.tools.js';
import { recordFailure, recordUsage } from './ai.meter.js';

type Message = OpenAI.ChatCompletionMessageParam;

const SYSTEM_PROMPT = `You are SpreeBuddy, a friendly and knowledgeable shopping assistant for an e-commerce store.
You help users discover products, compare options, check price/stock, and manage their wishlist.

DATA RULES
- Always use the provided tools to fetch real catalog and wishlist data. Never invent product names, prices, stock, categories, or ids.
- To get a product id, first search the catalog by keywords; use get_products_by_ids when you already know the id(s).
- If a product is not found, say so politely and offer alternatives (search or suggest similar items).

COMPARISON (act as a shopping analyst from the customer's point of view)
- When the user wants to compare specific products, call compare_products with their ids — it returns a structured side-by-side comparison that the app renders as a table.
- After calling it, give an honest written recommendation weighing value-for-money, availability, and fit to the user's needs. State the trade-offs. Do not re-print the whole table in text; the app already shows it.
- Be concise and clear, but thorough enough to help the user make a decision. If the user asks for more details, you can summarize the comparison table in text.

ASK BACK WHEN NEEDED (be conversational / multi-turn — don't guess)
- If the request lacks enough information, ask ONE short clarifying question before answering.
- Compare but only ONE product given → ask which other product(s) to compare against, or which aspects matter most (price, quality, size, etc.).
- Compare but NO product given → ask about their taste, style, budget, use-case, or needs; then use the tools to suggest 2-3 candidates and offer to compare them.
- Ambiguous product name → confirm which product they mean before proceeding.

STYLE
- Reply in the user's language (Indonesian, English, Spanish, Javanese, etc.).
- Be helpful and proactive: guide the shopping journey, suggest next steps, and offer to add items to the wishlist.
- Provide a product page link when you have the product id. Keep everyday answers concise; be more thorough for comparisons.

STREAMING & FORMATTING (your reply is streamed to the user token-by-token — write so it reads well while it arrives)
- Write in complete, self-contained sentences. Finish each thought before starting the next so no line ever appears cut off mid-idea.
- Prefer short paragraphs and simple markdown lists. Keep list items roughly equal in length and structure so they render evenly — don't mix one-word bullets with paragraph-long ones.
- Never end a reply mid-sentence, mid-word, or with a dangling connector (e.g. "and", "but", "so", ":", "-"). Always close with a complete sentence.
- Avoid heavy markdown that streams awkwardly (large tables, deeply nested lists). The app already renders comparison tables from the attachment — describe them in prose instead.
- Keep formatting consistent within a reply: use the same bullet style and heading level throughout; don't switch mid-message.`;

const HISTORY_LIMIT = 10;
const MAX_TOOL_STEPS = 5;
export const FALLBACK_REPLY = 'Sorry, I could not generate a response right now. Please try again.';
const CLOSING_PROMPT =
  'Answer the user now, in plain text, using the tool results already gathered above. Do not call any tools.';

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!env.openrouter.apiKey) throw ApiError.internal('AI is not configured (OPENROUTER_API_KEY missing)');
  if (!client) {
    // X-Title fills the "App" column on OpenRouter.
    const defaultHeaders: Record<string, string> = { 'X-Title': env.openrouter.appName };
    if (env.openrouter.appUrl) defaultHeaders['HTTP-Referer'] = env.openrouter.appUrl;
    client = new OpenAI({ apiKey: env.openrouter.apiKey, baseURL: env.openrouter.baseUrl, defaultHeaders });
  }
  return client;
}

type Kind = 'chat' | 'title' | 'closing';

// Single funnel for non-streaming completions, so every upstream call is
// counted whether it succeeds or is rejected.
async function metered(
  ai: OpenAI,
  kind: Kind,
  userId: string | undefined,
  params: OpenAI.ChatCompletionCreateParamsNonStreaming,
) {
  try {
    const res = await ai.chat.completions.create(params);
    await recordUsage(kind, userId, res.model, res.usage);
    return res;
  } catch (err) {
    await recordFailure(kind, userId, err);
    throw err;
  }
}

export function friendlyAiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/429|quota|rate.?limit|insufficient/i.test(msg)) return 'AI quota or rate limit reached. Please try again later.';
  if (/50\d|overloaded|unavailable/i.test(msg)) return 'AI service is busy, please try again in a moment.';
  return err instanceof ApiError ? err.message : 'AI request failed. Please try again.';
}

async function generateTitle(userText: string, reply: string): Promise<string> {
  const fallback = userText.trim().slice(0, 60) || 'New chat';
  try {
    const res = await metered(getClient(), 'title', undefined, {
      model: env.openrouter.model,
      messages: [
        { role: 'system', content: 'Create a concise 3-6 word chat title summarizing the topic. Use the user\'s language. Return ONLY the title, no quotes or trailing punctuation.' },
        { role: 'user', content: `User: ${userText}\nAssistant: ${reply}` },
      ],
    });
    const t = (res.choices[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '').replace(/\.$/, '');
    return t ? t.slice(0, 80) : fallback;
  } catch {
    return fallback;
  }
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

export async function assertSession(sessionId: string, userId: string) {
  await getOwnedSession(sessionId, userId);
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

async function buildMessages(sessionId: string, text: string): Promise<Message[]> {
  // Past fallbacks are excluded: feeding "I could not answer" back as context
  // makes the model more likely to give up again.
  const past = await ChatMessage.find({ sessionId, content: { $ne: FALLBACK_REPLY } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(HISTORY_LIMIT);
  past.reverse();
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...past.map((m): Message => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: text },
  ];
}

// Reached when the tool budget ran out or a turn came back empty. The tool
// results are already in `messages`, so ask once more with no tools attached.
async function closingAnswer(
  ai: OpenAI,
  messages: Message[],
  ctx: { steps: number; finishReason?: string; userId?: string },
): Promise<string> {
  console.warn(
    `[ai] no reply after ${ctx.steps} step(s) (finish_reason=${ctx.finishReason ?? 'none'}), retrying without tools`,
  );

  try {
    const res = await metered(ai, 'closing', ctx.userId, {
      model: env.openrouter.model,
      messages: [...messages, { role: 'user', content: CLOSING_PROMPT }],
    });
    const text = res.choices[0]?.message?.content ?? '';
    if (!text.trim()) {
      console.warn(`[ai] closing call produced nothing (finish_reason=${res.choices[0]?.finish_reason ?? 'none'})`);
    }
    return text;
  } catch (err) {
    console.warn('[ai] closing call failed:', err instanceof Error ? err.message : err);
    return '';
  }
}

async function persist(sessionId: string, userText: string, reply: string, attachments: unknown) {
  await ChatMessage.create([
    { sessionId, role: 'user', content: userText },
    { sessionId, role: 'model', content: reply, attachments },
  ]);
}

export async function sendMessage(sessionId: string, userId: string, text: string) {
  const session = await getOwnedSession(sessionId, userId);
  const needsTitle = (session.title ?? '').trim().toLowerCase() === 'new chat';
  const messages = await buildMessages(sessionId, text);
  const ai = getClient();

  let reply = '';
  let attachments: Record<string, unknown> | null = null;
  let finishReason: string | undefined;
  let steps = 0;

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    steps = step + 1;
    const res = await metered(ai, 'chat', userId, { model: env.openrouter.model, messages, tools });
    const choice = res.choices[0];
    finishReason = choice?.finish_reason;
    const msg = choice?.message;
    const toolCalls = msg?.tool_calls ?? [];

    if (toolCalls.length > 0) {
      messages.push({ role: 'assistant', content: msg?.content ?? '', tool_calls: toolCalls });
      for (const call of toolCalls) {
        if (call.type !== 'function') continue;
        const result = await executeTool(call.function.name, safeParse(call.function.arguments), { userId });
        if (call.function.name === 'compare_products' && !('error' in result)) attachments = result;
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
      continue;
    }

    reply = msg?.content ?? '';
    break;
  }

  if (!reply.trim()) reply = await closingAnswer(ai, messages, { steps, finishReason, userId });
  if (!reply.trim()) reply = FALLBACK_REPLY;

  await persist(sessionId, text, reply, attachments);

  if (needsTitle) {
    session.title = await generateTitle(text, reply);
    await session.save();
  }
  return { session, reply, attachments };
}

export type StreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'attachment'; attachment: Record<string, unknown> }
  | { type: 'title'; title: string }
  | { type: 'done'; attachments: Record<string, unknown> | null };

export async function* streamMessage(sessionId: string, userId: string, text: string): AsyncGenerator<StreamEvent> {
  const session = await getOwnedSession(sessionId, userId);
  const needsTitle = (session.title ?? '').trim().toLowerCase() === 'new chat';
  const messages = await buildMessages(sessionId, text);
  const ai = getClient();

  let reply = '';
  let attachments: Record<string, unknown> | null = null;
  let finishReason: string | undefined;
  let steps = 0;

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    steps = step + 1;
    const stream = await ai.chat.completions.create({
      model: env.openrouter.model,
      messages,
      tools,
      stream: true,
      stream_options: { include_usage: true },
    });

    let servedModel: string | undefined;
    let usage: OpenAI.CompletionUsage | undefined;
    let content = '';
    const acc: Record<number, { id: string; name: string; args: string }> = {};
    for await (const chunk of stream) {
      finishReason = chunk.choices[0]?.finish_reason ?? finishReason;
      servedModel = chunk.model ?? servedModel;
      if (chunk.usage) usage = chunk.usage;
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        content += delta.content;
        yield { type: 'chunk', text: delta.content };
      }
      for (const tc of delta?.tool_calls ?? []) {
        const slot = (acc[tc.index] ??= { id: '', name: '', args: '' });
        if (tc.id) slot.id = tc.id;
        if (tc.function?.name) slot.name += tc.function.name;
        if (tc.function?.arguments) slot.args += tc.function.arguments;
      }
    }

    await recordUsage('chat', userId, servedModel, usage);

    const calls = Object.values(acc);
    if (calls.length > 0) {
      messages.push({
        role: 'assistant',
        content: content || null,
        tool_calls: calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.args } })),
      });
      for (const c of calls) {
        const result = await executeTool(c.name, safeParse(c.args), { userId });
        if (c.name === 'compare_products' && !('error' in result)) {
          attachments = result;
          yield { type: 'attachment', attachment: result };
        }
        messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
      }
      continue;
    }

    reply = content;
    break;
  }

  if (!reply.trim()) {
    // The stream produced nothing, so the recovered text is emitted in one go.
    reply = await closingAnswer(ai, messages, { steps, finishReason, userId });
    if (reply.trim()) yield { type: 'chunk', text: reply };
  }
  if (!reply.trim()) {
    reply = FALLBACK_REPLY;
    yield { type: 'chunk', text: reply };
  }

  await persist(sessionId, text, reply, attachments);

  if (needsTitle) {
    session.title = await generateTitle(text, reply);
    await session.save();
    yield { type: 'title', title: session.title };
  }
  yield { type: 'done', attachments };
}

function safeParse(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json || '{}');
  } catch {
    return {};
  }
}
