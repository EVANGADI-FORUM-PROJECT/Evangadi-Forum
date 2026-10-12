import { useEffect, useState } from 'react';
import { ArrowRight, Hash, MessageSquarePlus, Search, UsersRound, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useMessages } from '../../contexts/MessageContext.jsx';
import { discussionService } from '../../services/discussion/discussion.service.js';
import MessageThread from '../../components/MessageThread/MessageThread.jsx';
import styles from './DiscussionRooms.module.css';

export default function DiscussionRooms() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [renaming, setRenaming] = useState(null);
  const [roomName, setRoomName] = useState('');
  const { rooms, loading, error: listError, refresh } = useMessages();
  const [active, setActive] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const filteredRooms = rooms.filter(room => `${room.name} ${room.description}`.toLowerCase().includes(search.toLowerCase()));

  // Keep an open room in sync when the shared room list refreshes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear the selected room if it was removed from the refreshed list.
    if (!loading) setActive(current => current ? rooms.find(room => Number(room.id) === Number(current.id)) || null : null);
  }, [rooms, loading]);

  const create = async (event) => {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const created = await discussionService.create(name.trim(), description.trim());
      const list = (await discussionService.list()).data || [];
      await refresh();
      setActive(list.find(room => Number(room.id) === Number(created.data.id)));
      setName(''); setDescription('');
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const rename = async event => {
    event.preventDefault();
    if (busy || !roomName.trim()) return;
    setBusy(true); setError('');
    try {
      await discussionService.rename(renaming, roomName.trim());
      setActive(current => current && Number(current.id) === Number(renaming) ? { ...current, name: roomName.trim() } : current);
      setRenaming(null);
      await refresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const removeRoom = async room => {
    if (busy) return;
    const accepted = await confirm({ title: 'Delete discussion room?', message: `Delete “${room.name}” and all its messages and attachments? This cannot be undone.`, confirmLabel: 'Delete room' });
    if (!accepted) return;
    setBusy(true); setError('');
    try {
      await discussionService.remove(room.id);
      setActive(current => Number(current?.id) === Number(room.id) ? null : current); setRenaming(null);
      await refresh();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <div className={styles.page}>
    {(error || listError) && <p className={styles.error} role="alert">{error || listError}</p>}
    <div className={`${styles.grid} ${active ? styles.showChat : ''}`}>
      <aside className={styles.panel}>
        <div className={styles.panelHeading}><div><h1>Discussion rooms</h1><small>{rooms.length} rooms</small></div><button type="button" className={styles.addButton} aria-label="New room" onClick={() => setShowForm(true)}><MessageSquarePlus size={18} /></button></div>
        <div className={styles.search}><Search size={15} /><input aria-label="Search discussion rooms" placeholder="Find a room…" value={search} onChange={event => setSearch(event.target.value)} /></div>
        {loading ? <p className={styles.empty} role="status">Loading rooms…</p> : rooms.length === 0 && <p className={styles.empty}>No rooms yet. Create the first one.</p>}
        <div className={styles.list}>{filteredRooms.map(room => <div key={room.id} className={`${styles.roomRow} ${active?.id === room.id ? styles.active : ''}`}>
          <div className={styles.roomHeading}>
            <button type="button" aria-pressed={active?.id === room.id} className={styles.item} disabled={busy} onClick={() => setActive(room)}>
              <span className={styles.avatar}><Hash size={19} /></span><span className={styles.itemCopy}><strong title={room.name}>{room.name}</strong></span>
              {Number(room.unreadCount) > 0 && <span className={styles.badge} aria-label={`${room.unreadCount} unread messages`}>{Number(room.unreadCount) > 99 ? '99+' : room.unreadCount}</span>}
            </button>
            {Number(room.userId) === Number(user?.id) && <div className={styles.roomIcons}>
              <button type="button" className={styles.roomAction} aria-label={`Edit ${room.name}`} title="Edit room name" disabled={busy} onClick={() => { setRoomName(room.name); setRenaming(room.id); }}><Pencil size={15} /></button>
              <button type="button" className={styles.roomAction} aria-label={`Delete ${room.name}`} title="Delete room" disabled={busy} onClick={() => removeRoom(room)}><Trash2 size={15} /></button>
            </div>}
          </div>
          {Number(room.userId) === Number(user?.id) && Number(renaming) === Number(room.id) && <div className={styles.roomControls}>
            <form onSubmit={rename} className={styles.renameForm}>
              <input autoFocus aria-label="New room name" value={roomName} onChange={event => setRoomName(event.target.value)} maxLength={100} required disabled={busy} />
              <button type="submit" className={styles.primary} disabled={busy || !roomName.trim()}>Save</button>
              <button type="button" className={styles.iconButton} aria-label="Cancel rename" disabled={busy} onClick={() => setRenaming(null)}><X size={16} /></button>
            </form>
          </div>}
          <p className={styles.roomPreview}>{room.lastMessage || room.description || `Created by ${room.firstName} ${room.lastName}`}</p>
        </div>)}</div>
        {!loading && rooms.length > 0 && filteredRooms.length === 0 && <p className={styles.empty}>No rooms match your search.</p>}
        {showForm ? <form onSubmit={create} className={styles.form}>
          <div className={styles.panelHeading}><h2>Create a room</h2><button type="button" className={styles.iconButton} aria-label="Close room form" onClick={() => setShowForm(false)}><X size={16} /></button></div>
          <label htmlFor="room-name">Room name</label><input id="room-name" autoFocus value={name} onChange={event => setName(event.target.value)} maxLength={100} required placeholder="e.g. React study group" />
          <label htmlFor="room-description">Description (optional)</label><textarea id="room-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={500} rows={2} placeholder="What will you discuss?" />
          <button disabled={busy || !name.trim()} className={styles.primary}><MessageSquarePlus size={14} />{busy ? 'Creating…' : 'Create room'}</button>
        </form> : <button type="button" className={styles.newRoom} onClick={() => setShowForm(true)}><MessageSquarePlus size={16} /> Create a room <ArrowRight size={14} /></button>}
      </aside>
      {active ? <MessageThread key={active.id} id={active.id} title={active.name} description={active.description} kind="discussion" onBack={() => { setActive(null); setRenaming(null); }} service={discussionService} /> : <section className={styles.placeholder}><span className={styles.placeholderIcon}><UsersRound size={34} /></span><span className={styles.kicker}>Ideas grow here</span><h2>Find your next conversation</h2><p>Choose a room to share what you’re learning, ask for a fresh perspective, or help someone move forward.</p><button type="button" className={styles.primary} onClick={() => setShowForm(true)}><MessageSquarePlus size={15} /> Create a discussion room</button></section>}
    </div>
  </div>;
}
