import { useEffect, useState } from 'react';

import { LockKeyhole, MessageCircle, Search } from 'lucide-react';

import { useMessages } from '../../contexts/MessageContext.jsx';

import { chatService } from '../../services/chat/chat.service.js';

import MessageThread from '../../components/MessageThread/MessageThread.jsx';

import styles from '../DiscussionRooms/DiscussionRooms.module.css';



export default function PrivateChat() {

  const [users, setUsers] = useState([]);

  const { conversations, loading, error: listError, refresh } = useMessages();

  const [active, setActive] = useState(null);

  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState('');

  const filteredChats = conversations.filter(chat => `${chat.firstName} ${chat.lastName}`.toLowerCase().includes(search.toLowerCase()));



  useEffect(() => {

    let cancelled = false;

    const load = async () => {

      try {

        const members = await chatService.listUsers();

        if (!cancelled) { setUsers(members.data || []); setError(''); }

      } catch (err) { if (!cancelled) setError(err.message); }

    };

    load();

    return () => { cancelled = true; };

  }, []);



  const start = async (userId) => {

    if (busy || !userId) return;

    setBusy(true); setError('');

    try {

      const created = await chatService.create(Number(userId));

      const list = (await chatService.list()).data || [];

      await refresh();

      setActive(list.find(chat => Number(chat.id) === Number(created.data.id)));

    } catch (err) { setError(err.message); }

    finally { setBusy(false); }

  };



  return <div className={styles.page}>

    {(error || listError) && <p className={styles.error} role="alert">{error || listError}</p>}

    <div className={`${styles.grid} ${styles.private} ${active ? styles.showChat : ''}`}>

      <aside className={styles.panel}>

        <div className={styles.panelHeading}><div><h1>Chats</h1><small>{conversations.length} conversations</small></div><MessageCircle size={21} /></div>

        <div className={styles.search}><Search size={15} /><input aria-label="Search conversations" placeholder="Find a conversation…" value={search} onChange={event => setSearch(event.target.value)} /></div>

        {loading ? <p className={styles.empty} role="status">Loading conversations…</p> : conversations.length === 0 && <p className={styles.empty}>No conversations yet.</p>}

        <div className={styles.list}>{filteredChats.map(chat => <button type="button" key={chat.id} aria-pressed={active?.id === chat.id} className={`${styles.item} ${active?.id === chat.id ? styles.active : ''}`} onClick={() => setActive(chat)}><span className={styles.avatar}>{`${chat.firstName?.[0] || ''}${chat.lastName?.[0] || ''}`.toUpperCase()}</span><span className={styles.itemCopy}><strong>{chat.firstName} {chat.lastName}</strong><span>{chat.lastMessage || 'Say hello to start chatting'}</span></span>{Number(chat.unreadCount) > 0 && <span className={styles.badge} aria-label={`${chat.unreadCount} unread messages`}>{Number(chat.unreadCount) > 99 ? '99+' : chat.unreadCount}</span>}</button>)}</div>

        {!loading && conversations.length > 0 && filteredChats.length === 0 && <p className={styles.empty}>No conversations match your search.</p>}

        <div className={styles.form}>

          <h2>Start a new chat</h2>

          {users.filter(member => !conversations.some(chat => Number(chat.userId) === Number(member.id))).filter(member => `${member.firstName} ${member.lastName}`.toLowerCase().includes(search.toLowerCase())).map(member => <button type="button" key={member.id} className={styles.item} disabled={busy} onClick={() => start(member.id)}><span className={styles.avatar}>{`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase()}</span><span className={styles.itemCopy}><strong>{member.firstName} {member.lastName}</strong><span>Private conversation</span></span></button>)}

        </div>

      </aside>

      {active ? <MessageThread key={active.id} id={active.id} title={`${active.firstName} ${active.lastName}`} kind="chat" onBack={() => setActive(null)} service={chatService} /> : <section className={styles.placeholder}><span className={styles.placeholderIcon}><MessageCircle size={34} /></span><span className={styles.kicker}>A conversation starts with hello</span><h2>Make a connection</h2><p>Select a conversation or choose a member from the list. Your messages are accessible to the two participants through the forum.</p><span className={styles.privacyTag}><LockKeyhole size={14} /> Your own conversation space</span></section>}

    </div>

  </div>;

}

