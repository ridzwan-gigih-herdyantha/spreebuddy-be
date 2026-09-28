import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';

// One row per provider event. The unique index on eventId is the idempotency
// guard: gateways retry, and a retry must not move an order twice. The status
// is there because a handler can die mid-apply — a row left in `processing`
// past its lease can be reclaimed, so a crash cannot swallow a settlement.
export type WebhookEventStatus = 'processing' | 'applied' | 'failed';

export interface IWebhookEvent {
  provider: string;
  eventId: string;
  type: string;
  status: WebhookEventStatus;
  attempts: number;
  receivedAt: Date;
  appliedAt?: Date | null;
  error?: string | null;
}

export type WebhookEventDocument = HydratedDocument<IWebhookEvent>;

const webhookEventSchema = new Schema<IWebhookEvent, Model<IWebhookEvent>>({
  provider: { type: String, required: true, default: 'stripe' },
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  status: {
    type: String,
    enum: ['processing', 'applied', 'failed'],
    required: true,
    default: 'processing',
    index: true,
  },
  attempts: { type: Number, required: true, default: 1 },
  receivedAt: { type: Date, required: true, default: Date.now },
  appliedAt: { type: Date, default: null },
  error: { type: String, default: null },
});

const WebhookEvent = mongoose.model<IWebhookEvent, Model<IWebhookEvent>>(
  'WebhookEvent',
  webhookEventSchema,
);
export default WebhookEvent;
