import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth.js';
import { chatService } from '../services/chat/chat.service.js';
import { discussionService } from '../services/discussion/discussion.service.js';

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const { user } = useAuth();
  return <MessageStateProvider key={user?.id || 'guest'} userId={user?.id} >{children}</MessageStateProvider>;
}

function MessageStateProvider({ children, userId }) {
  const [rooms, setRooms] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState('');
  const currentUser = useRef(userId || null);
  const requestNumber = useRef(0);

  const refresh = useCallback(async () => {
    const userId = currentUser.current;
    if (!userId) return;
    const requestId = ++requestNumber.current;
    try {
      const [roomList, chatList] = await Promise.all([discussionService.list(), chatService.list()]);
      if (currentUser.current !== userId || requestId !== requestNumber.current) return;
      setRooms(roomList.data || []);
      setConversations(chatList.data || []);
      setError('');
    } catch (err) { if (currentUser.current === userId && requestId === requestNumber.current) setError(err.message); }
    finally { if (currentUser.current === userId && requestId === requestNumber.current) setLoading(false); }
  }, []);

  useEffect(() => {
    currentUser.current = userId || null;
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- This starts asynchronous API requests; state is updated when their responses arrive.
    refresh();
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, 5000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { currentUser.current = null; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [userId, refresh]);

  const markRead = useCallback(async (kind, id, lastMessageId) => {
    const service = kind === 'chat' ? chatService : discussionService;
    await service.markRead(id, lastMessageId);
    await refresh();
  }, [refresh]);

  const roomUnread = rooms.reduce((count, room) => count + Number(room.unreadCount || 0), 0);
  const chatUnread = conversations.reduce((count, chat) => count + Number(chat.unreadCount || 0), 0);
  return <MessageContext.Provider value={{ rooms, conversations, loading, error, refresh, markRead, roomUnread, chatUnread }}>{children}</MessageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Keep the context hook beside its provider, as in the existing forum contexts.
export function useMessages() { return useContext(MessageContext); }
