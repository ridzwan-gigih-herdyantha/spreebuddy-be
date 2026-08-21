import { makeResource } from '../../common/http/resource.js';
import { formatDateDMY } from '../../common/utils/formatDate.js';
import { ChatSessionDocument } from './chatSession.model.js';
import { ChatMessageDocument } from './chatMessage.model.js';

export interface ChatSessionResponse {
  id: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export const ChatSessionResource = makeResource<ChatSessionDocument, ChatSessionResponse>((s) => ({
  id: s.id,
  title: s.title,
  createdAt: formatDateDMY(s.createdAt),
  updatedAt: formatDateDMY(s.updatedAt),
}));

export interface ChatMessageResponse {
  id: string;
  role: string;
  content: string;
  attachments?: unknown;
  createdAt: string | null;
}

export const ChatMessageResource = makeResource<ChatMessageDocument, ChatMessageResponse>((m) => ({
  id: m.id,
  role: m.role,
  content: m.content,
  attachments: m.attachments ?? null,
  createdAt: formatDateDMY(m.createdAt),
}));
