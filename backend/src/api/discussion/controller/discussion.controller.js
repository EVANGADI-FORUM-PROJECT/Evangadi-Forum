import * as service from '../service/discussion.service.js';

export const list = async (req, res, next) => {
  try { res.json({ success: true, data: await service.listRooms(req.user.id) }); }
  catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const data = await service.createRoom(req.user.id, req.body.name, req.body.description);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};



export const listMessages = async (req, res, next) => {
  try { res.json({ success: true, data: await service.listMessages(Number(req.params.id), req.user.id) }); }
  catch (error) { next(error); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const data = await service.sendMessage(Number(req.params.id), req.user.id, req.body.content);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const editMessage = async (req, res, next) => {
  try {
    await service.editMessage(Number(req.params.id), Number(req.params.messageId), req.user.id, req.body.content);
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const deleteMessage = async (req, res, next) => {
  try {
    await service.deleteMessage(Number(req.params.id), Number(req.params.messageId), req.user.id, req.query.scope || 'me');
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const markRead = async (req, res, next) => {
  try {
    await service.markRead(Number(req.params.id), req.user.id, Number(req.body.lastMessageId));
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const checkAccess = async (req, res, next) => {
  try { await service.getRoom(Number(req.params.id)); next(); }
  catch (error) { next(error); }
};

export const sendAttachment = async (req, res, next) => {
  try {
    const data = await service.sendAttachment(Number(req.params.id), req.user.id, req.file, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const getAttachment = async (req, res, next) => {
  try {
    const file = await service.getAttachment(Number(req.params.id), Number(req.params.messageId), req.user.id);
    res.set({ 'Content-Type': file.mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' });
    res.download(file.path, file.name);
  } catch (error) { next(error); }
};

export const renameRoom = async (req, res, next) => {
  try {
    await service.renameRoom(Number(req.params.id), req.user.id, req.body.name);
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const deleteRoom = async (req, res, next) => {
  try {
    await service.deleteRoom(Number(req.params.id), req.user.id);
    res.json({ success: true });
  } catch (error) { next(error); }
};
