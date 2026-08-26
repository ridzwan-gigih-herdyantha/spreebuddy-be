import { OpenAI } from 'openai';
import { env } from '../../config/env.js';
import AiCall from './aiCall.model.js';

type Kind = 'chat' | 'title' | 'closing';
type Usage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };

// Metering must never break a reply, so every write is best-effort.
async function save(entry: Record<string, unknown>) {
  try {
    await AiCall.create(entry);
  } catch (err) {
    console.warn('[ai] could not record usage:', err instanceof Error ? err.message : err);
  }
}

export function recordUsage(
  kind: Kind,
  userId: string | undefined,
  model: string | undefined,
  usage: Usage | undefined | null,
) {
  return save({
    kind,
    userId: userId ?? null,
    model: model || env.openrouter.model,
    ok: true,
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
    cost: usage?.cost ?? 0,
  });
}

// A 429 is the only response that carries the requests-per-day counters, so it
// is worth keeping: it is the sole authoritative reading of that cap.
export function recordFailure(kind: Kind, userId: string | undefined, err: unknown) {
  const status = err instanceof OpenAI.APIError ? err.status : undefined;
  const headers = err instanceof OpenAI.APIError ? err.headers : undefined;
  const read = (name: string) => {
    const raw =
      headers && typeof (headers as Headers).get === 'function'
        ? (headers as Headers).get(name)
        : (headers as Record<string, string> | undefined)?.[name];
    return raw ?? null;
  };

  return save({
    kind,
    userId: userId ?? null,
    model: env.openrouter.model,
    ok: false,
    status: status ?? null,
    rateLimit:
      status === 429
        ? {
            limit: Number(read('x-ratelimit-limit')) || null,
            remaining: Number(read('x-ratelimit-remaining')) ?? null,
            reset: read('x-ratelimit-reset'),
          }
        : null,
  });
}
