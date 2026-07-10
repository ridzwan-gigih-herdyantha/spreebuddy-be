import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import * as aiService from './ai.service.js';
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

export async function getSessionHandler(req: Request, res: Response) {
  const { session, messages } = await aiService.getSessionMessages(
    String(req.params.id),
    req.user!.id,
  );
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
  const { reply } = await aiService.sendMessage(String(req.params.id), req.user!.id, message);
  return sendSuccess(res, { reply }, 'Reply generated');
}
