import { makeResource } from '../../common/http/resource.js';
import { ChatSessionDocument } from './chatSession.model.js';
import { ChatMessageDocument } from './chatMessage.model.js';

export interface ChatSessionResponse {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatSessionResource = makeResource<ChatSessionDocument, ChatSessionResponse>((s) => ({
  id: s.id,
  title: s.title,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
}));

export interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  attachments?: unknown;
  createdAt: Date;
}

export const ChatMessageResource = makeResource<ChatMessageDocument, ChatMessageResponse>((m) => ({
  id: m.id,
  role: m.role,
  content: m.content,
  attachments: m.attachments ?? null,
  createdAt: m.createdAt,
}));
