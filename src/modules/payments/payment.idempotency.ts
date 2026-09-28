import WebhookEvent, { type WebhookEventStatus } from './webhookEvent.model.js';

// How long one delivery may hold an event before another is allowed to take it
// over. Long enough that a slow-but-alive handler is never overtaken, short
// enough that a handler killed mid-apply does not block the settlement for
// long. Stripe keeps retrying for days, so a reclaim will come.
export const LEASE_MS = 2 * 60_000;

export type ClaimDecision =
  | 'apply' // first time this event has been seen
  | 'retry' // a previous attempt failed or died, take it over
  | 'duplicate' // already applied; acknowledge and do nothing
  | 'in-progress'; // another delivery holds a live claim

type Claimable = { status?: WebhookEventStatus; receivedAt: Date } | null;

// Pure, so the rule can be reasoned about and tested without a database.
export function decideClaim(existing: Claimable, now: number, leaseMs = LEASE_MS): ClaimDecision {
  if (!existing) return 'apply';

  // Rows written before this lifecycle existed carry no status. Back then a row
  // was only ever written after a successful apply — a failure deleted it — so
  // finding one means the event is done.
  if (!existing.status) return 'duplicate';

  if (existing.status === 'applied') return 'duplicate';
  if (existing.status === 'failed') return 'retry';

  const heldFor = now - new Date(existing.receivedAt).getTime();
  return heldFor >= leaseMs ? 'retry' : 'in-progress';
}

export interface Claim {
  decision: ClaimDecision;
  attempts: number;
}

// Inserts the row if this event is new; otherwise reads the existing one and
// decides what this delivery is allowed to do with it.
export async function claimEvent(
  provider: string,
  eventId: string,
  type: string,
): Promise<Claim> {
  const now = new Date();
  // Read lean: hydrating would apply the schema default for `status` and hide
  // the fact that an older row never had one.
  const existing = await WebhookEvent.findOneAndUpdate(
    { eventId },
    {
      $setOnInsert: {
        provider,
        eventId,
        type,
        status: 'processing' as WebhookEventStatus,
        attempts: 1,
        receivedAt: now,
      },
    },
    { upsert: true, new: false },
  ).lean();

  const decision = decideClaim(existing, now.getTime());
  if (decision !== 'retry') {
    return { decision, attempts: existing?.attempts ?? 1 };
  }

  // Taking over is conditional on the status not having moved since it was
  // read, so two deliveries racing to reclaim cannot both win.
  const taken = await WebhookEvent.updateOne(
    { eventId, status: existing!.status },
    { $set: { status: 'processing', receivedAt: now, error: null }, $inc: { attempts: 1 } },
  );

  return taken.modifiedCount === 1
    ? { decision: 'retry', attempts: (existing!.attempts ?? 1) + 1 }
    : { decision: 'in-progress', attempts: existing!.attempts ?? 1 };
}

export const markEventApplied = (eventId: string) =>
  WebhookEvent.updateOne(
    { eventId },
    { $set: { status: 'applied', appliedAt: new Date(), error: null } },
  );

// The row is kept rather than deleted: it is the record of what went wrong,
// and `failed` is what lets the next delivery take it over immediately.
export const markEventFailed = (eventId: string, error: string) =>
  WebhookEvent.updateOne({ eventId }, { $set: { status: 'failed', error: error.slice(0, 500) } });
