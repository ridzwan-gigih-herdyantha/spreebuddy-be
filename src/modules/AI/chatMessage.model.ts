import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export type ChatRole = 'user' | 'model';

// Result of checking a reply against the catalogue rows its tools returned.
export interface GroundingRecord {
  ok: boolean;
  checked: number;
  retried: boolean;
  violations: { kind: string; value: string }[];
}

export interface IChatMessage {
  sessionId: Types.ObjectId;
  role: ChatRole;
  content: string;
  attachments?: unknown; // FE-renderable data (e.g. a comparison)
  grounding?: GroundingRecord | null; // assistant replies only
  createdAt: Date;
  updatedAt: Date;
}

export type ChatMessageDocument = HydratedDocument<IChatMessage>;
type ChatMessageModel = Model<IChatMessage>;

const chatMessageSchema = new Schema<IChatMessage, ChatMessageModel>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
    role: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
    attachments: { type: Schema.Types.Mixed, default: null },
    grounding: {
      type: new Schema<GroundingRecord>(
        {
          ok: { type: Boolean, required: true },
          checked: { type: Number, required: true, default: 0 },
          retried: { type: Boolean, required: true, default: false },
          violations: [
            {
              _id: false,
              kind: { type: String, required: true },
              value: { type: String, required: true },
            },
          ],
        },
        { _id: false },
      ),
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

const ChatMessage = mongoose.model<IChatMessage, ChatMessageModel>('ChatMessage', chatMessageSchema);
export default ChatMessage;
