import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export interface IAiCall {
  userId?: Types.ObjectId | null;
  kind: 'chat' | 'title' | 'closing';
  model: string;
  ok: boolean;
  status?: number | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  rateLimit?: { limit?: number | null; remaining?: number | null; reset?: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AiCallDocument = HydratedDocument<IAiCall>;

const aiCallSchema = new Schema<IAiCall, Model<IAiCall>>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    kind: { type: String, enum: ['chat', 'title', 'closing'], default: 'chat' },
    model: { type: String, required: true },
    ok: { type: Boolean, default: true, index: true },
    status: { type: Number, required: false },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    rateLimit: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

aiCallSchema.index({ createdAt: -1 });

const AiCall = mongoose.model<IAiCall, Model<IAiCall>>('AiCall', aiCallSchema);
export default AiCall;
