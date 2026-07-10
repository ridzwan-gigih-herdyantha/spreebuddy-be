import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

export interface IChatSession {
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatSessionDocument = HydratedDocument<IChatSession>;
type ChatSessionModel = Model<IChatSession>;

const chatSessionSchema = new Schema<IChatSession, ChatSessionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New chat' },
  },
  { timestamps: true },
);

const ChatSession = mongoose.model<IChatSession, ChatSessionModel>('ChatSession', chatSessionSchema);
export default ChatSession;
