import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export type ChatRole = 'user' | 'model';

export interface IChatMessage {
  sessionId: Types.ObjectId;
  role: ChatRole;
  content: string;
  attachments?: unknown; // structured, FE-renderable data (e.g. a comparison)
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
  },
  { timestamps: true },
);

const ChatMessage = mongoose.model<IChatMessage, ChatMessageModel>('ChatMessage', chatMessageSchema);
export default ChatMessage;
