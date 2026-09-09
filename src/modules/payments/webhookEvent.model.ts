import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';

// One row per provider event we have already applied. The unique index on
// eventId is the idempotency guard: gateways retry, and a retry must not move
// an order twice.
export interface IWebhookEvent {
  provider: string;
  eventId: string;
  type: string;
  receivedAt: Date;
}

export type WebhookEventDocument = HydratedDocument<IWebhookEvent>;

const webhookEventSchema = new Schema<IWebhookEvent, Model<IWebhookEvent>>({
  provider: { type: String, required: true, default: 'stripe' },
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  receivedAt: { type: Date, required: true, default: Date.now },
});

const WebhookEvent = mongoose.model<IWebhookEvent, Model<IWebhookEvent>>(
  'WebhookEvent',
  webhookEventSchema,
);
export default WebhookEvent;
