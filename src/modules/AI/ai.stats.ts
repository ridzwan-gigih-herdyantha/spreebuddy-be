import ChatSession from './chatSession.model.js';
import ChatMessage from './chatMessage.model.js';
import { env } from '../../config/env.js';
import { FALLBACK_REPLY } from './ai.service.js';
import AiCall from './aiCall.model.js';

const DAY = 86_400_000;
const SERIES_DAYS = 14;
const TOP_USERS = 8;

const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const startOfToday = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

// Buckets are UTC days, matching how createdAt is stored.
async function dailySeries(since: Date) {
  const group = (dateField: string) => [
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
  ];

  const [sessions, messages] = await Promise.all([
    ChatSession.aggregate(group('createdAt')),
    ChatMessage.aggregate(group('createdAt')),
  ]);

  const bySession = new Map(sessions.map((r) => [r._id as string, r.count as number]));
  const byMessage = new Map(messages.map((r) => [r._id as string, r.count as number]));

  return Array.from({ length: SERIES_DAYS }, (_, i) => {
    const date = dayKey(new Date(since.getTime() + i * DAY));
    return { date, sessions: bySession.get(date) ?? 0, messages: byMessage.get(date) ?? 0 };
  });
}

// One pass over messages, joined to their session, gives both counts per user.
async function busiestUsers() {
  const rows = await ChatMessage.aggregate([
    { $lookup: { from: 'chatsessions', localField: 'sessionId', foreignField: '_id', as: 'session' } },
    { $unwind: '$session' },
    {
      $group: {
        _id: '$session.userId',
        messages: { $sum: 1 },
        sessions: { $addToSet: '$sessionId' },
      },
    },
    { $project: { messages: 1, sessions: { $size: '$sessions' } } },
    { $sort: { messages: -1 } },
    { $limit: TOP_USERS },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ]);

  return rows.map((r) => ({
    id: String(r._id),
    name: r.user?.name ?? null,
    email: r.user?.email ?? null,
    username: r.user?.username ?? null,
    sessions: r.sessions as number,
    messages: r.messages as number,
  }));
}

export async function chatStats() {
  const today = startOfToday();
  const since = new Date(today.getTime() - (SERIES_DAYS - 1) * DAY);

  const [
    totalSessions,
    sessionsToday,
    distinctUsers,
    totalMessages,
    messagesToday,
    userMessages,
    assistantMessages,
    failedReplies,
    daily,
    topUsers,
  ] = await Promise.all([
    ChatSession.countDocuments({}),
    ChatSession.countDocuments({ createdAt: { $gte: today } }),
    ChatSession.distinct('userId').then((ids) => ids.length),
    ChatMessage.countDocuments({}),
    ChatMessage.countDocuments({ createdAt: { $gte: today } }),
    ChatMessage.countDocuments({ role: 'user' }),
    ChatMessage.countDocuments({ role: 'model' }),
    ChatMessage.countDocuments({ role: 'model', content: FALLBACK_REPLY }),
    dailySeries(since),
    busiestUsers(),
  ]);

  return {
    sessions: { total: totalSessions, today: sessionsToday, users: distinctUsers },
    messages: {
      total: totalMessages,
      today: messagesToday,
      fromUsers: userMessages,
      fromAssistant: assistantMessages,
      failed: failedReplies,
    },
    daily,
    topUsers,
    seriesDays: SERIES_DAYS,
  };
}

// Credit balance and spend for the configured OpenRouter key. The free-model
// daily cap is not part of this payload; it only surfaces in 429 headers.
export async function aiUsage() {
  if (!env.openrouter.apiKey) return { configured: false as const };

  const res = await fetch(`${env.openrouter.baseUrl}/key`, {
    headers: { Authorization: `Bearer ${env.openrouter.apiKey}` },
  });

  if (!res.ok) {
    return { configured: true as const, reachable: false as const, status: res.status };
  }

  const { data } = (await res.json()) as {
    data: Record<string, number | string | boolean | null>;
  };

  return {
    configured: true as const,
    reachable: true as const,
    model: env.openrouter.model,
    freeTier: Boolean(data.is_free_tier),
    // `limit` is a spending cap in USD: null means uncapped, 0 means no credit.
    limit: data.limit,
    limitRemaining: data.limit_remaining,
    limitReset: data.limit_reset,
    expiresAt: data.expires_at,
    usage: data.usage,
    usageDaily: data.usage_daily,
    usageWeekly: data.usage_weekly,
    usageMonthly: data.usage_monthly,
  };
}

// Requests and tokens actually spent through this server. The provider does not
// report either, so this ledger is the only record of them.
export async function aiMeter() {
  const today = startOfToday();
  const since = new Date(today.getTime() - (SERIES_DAYS - 1) * DAY);

  const sum = async (match: Record<string, unknown>) => {
    const [row] = await AiCall.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          calls: { $sum: 1 },
          prompt: { $sum: '$promptTokens' },
          completion: { $sum: '$completionTokens' },
          total: { $sum: '$totalTokens' },
          cost: { $sum: '$cost' },
        },
      },
    ]);
    return {
      calls: row?.calls ?? 0,
      prompt: row?.prompt ?? 0,
      completion: row?.completion ?? 0,
      total: row?.total ?? 0,
      cost: row?.cost ?? 0,
    };
  };

  const [allTime, todayTotals, failedToday, byModel, daily, lastRejection] = await Promise.all([
    sum({ ok: true }),
    sum({ ok: true, createdAt: { $gte: today } }),
    AiCall.countDocuments({ ok: false, createdAt: { $gte: today } }),
    AiCall.aggregate([
      { $match: { ok: true } },
      { $group: { _id: '$model', calls: { $sum: 1 }, tokens: { $sum: '$totalTokens' } } },
      { $sort: { calls: -1 } },
      { $limit: 6 },
    ]),
    AiCall.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          calls: { $sum: 1 },
          tokens: { $sum: '$totalTokens' },
        },
      },
    ]),
    AiCall.findOne({ ok: false, status: 429 }).sort({ createdAt: -1 }),
  ]);

  const byDay = new Map(daily.map((r) => [r._id as string, r]));

  return {
    allTime,
    today: todayTotals,
    failedToday,
    models: byModel.map((m) => ({ model: m._id as string, calls: m.calls, tokens: m.tokens })),
    daily: Array.from({ length: SERIES_DAYS }, (_, i) => {
      const date = dayKey(new Date(since.getTime() + i * DAY));
      const row = byDay.get(date);
      return { date, calls: row?.calls ?? 0, tokens: row?.tokens ?? 0 };
    }),
    // The requests-per-day cap only ever appears on a rejection.
    lastRejection: lastRejection
      ? { at: lastRejection.createdAt, rateLimit: lastRejection.rateLimit ?? null }
      : null,
  };
}

// Context window and completion ceiling for the configured model.
export async function modelLimits() {
  try {
    const res = await fetch(`${env.openrouter.baseUrl}/models`);
    if (!res.ok) return null;

    const { data } = (await res.json()) as { data: Array<Record<string, unknown>> };
    const model = data.find((m) => m.id === env.openrouter.model);
    if (!model) return null;

    const top = (model.top_provider ?? {}) as Record<string, number | null>;
    return {
      id: model.id as string,
      name: (model.name as string) ?? null,
      contextLength: (model.context_length as number) ?? top.context_length ?? null,
      maxCompletionTokens: top.max_completion_tokens ?? null,
    };
  } catch {
    return null;
  }
}
