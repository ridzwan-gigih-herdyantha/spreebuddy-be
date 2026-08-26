import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import * as aiService from './ai.service.js';
import * as aiStats from './ai.stats.js';
import { ChatSessionResource, ChatMessageResource } from './ai.resource.js';
import { CreateSessionBody, SendMessageBody } from './ai.schema.js';

export async function createSessionHandler(req: Request, res: Response) {
  const { title } = req.body as CreateSessionBody;
  const session = await aiService.createSession(req.user!.id, title);
  return sendCreated(res, ChatSessionResource.item(session), 'Session created');
}

export async function listSessionsHandler(req: Request, res: Response) {
  const sessions = await aiService.listSessions(req.user!.id);
  return sendSuccess(res, ChatSessionResource.collection(sessions), 'Sessions retrieved');
}

// Admin-only: store-wide chat usage.
export async function chatStatsHandler(_req: Request, res: Response) {
  return sendSuccess(res, await aiStats.chatStats(), 'Chat stats retrieved');
}

// Admin-only: credit usage for the configured AI key.
export async function aiUsageHandler(_req: Request, res: Response) {
  return sendSuccess(res, await aiStats.aiUsage(), 'AI usage retrieved');
}

export async function getSessionHandler(req: Request, res: Response) {
  const { session, messages } = await aiService.getSessionMessages(String(req.params.id), req.user!.id);
  return sendSuccess(
    res,
    { ...ChatSessionResource.item(session), messages: ChatMessageResource.collection(messages) },
    'Session retrieved',
  );
}

export async function deleteSessionHandler(req: Request, res: Response) {
  await aiService.deleteSession(String(req.params.id), req.user!.id);
  return sendSuccess(res, null, 'Session deleted');
}

export async function sendMessageHandler(req: Request, res: Response) {
  const { message } = req.body as SendMessageBody;
  const { reply, attachments } = await aiService.sendMessage(String(req.params.id), req.user!.id, message);
  return sendSuccess(res, { reply, attachments }, 'Reply generated');
}

// SSE: streams text deltas as the AI generates them.
export async function streamMessageHandler(req: Request, res: Response) {
  const { message } = req.body as SendMessageBody;
  const sessionId = String(req.params.id);
  const userId = req.user!.id;

  // Check ownership before committing SSE headers, so "not found" returns a real 404.
  await aiService.assertSession(sessionId, userId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    for await (const ev of aiService.streamMessage(sessionId, userId, message)) {
      if (ev.type === 'chunk') send('chunk', { text: ev.text });
      else if (ev.type === 'attachment') send('attachment', ev.attachment);
      else if (ev.type === 'title') send('title', { title: ev.title });
      else if (ev.type === 'done') send('done', { attachments: ev.attachments });
    }
  } catch (err) {
    send('error', { message: aiService.friendlyAiError(err) });
  } finally {
    res.end();
  }
}
