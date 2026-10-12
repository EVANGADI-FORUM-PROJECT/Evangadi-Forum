import { useEffect, useRef, useState } from 'react';

import { ArrowLeft, ChevronDown, Hash, Check, FileText, Image as ImageIcon, MessageCircle, Paperclip, Pencil, Send, Trash2, X } from 'lucide-react';

import MessageAttachment from './MessageAttachment.jsx';

import VoiceRecorder from './VoiceRecorder.jsx';

import { useAuth } from '../../contexts/useAuth.js';

import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import { useMessages } from '../../contexts/MessageContext.jsx';

import styles from './MessageThread.module.css';



// Both pages use the same small message component. Their services provide the API calls.

export default function MessageThread({ id, title, description, kind, service, onBack, headerActions }) {

  const { user } = useAuth();

  const confirm = useConfirm();

  const { markRead, refresh } = useMessages();

  const [messages, setMessages] = useState([]);

  const [content, setContent] = useState('');

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState('');

  const [loadError, setLoadError] = useState('');

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [pending, setPending] = useState(null);

  const [recording, setRecording] = useState(false);

  const photoInput = useRef(null);

  const fileInput = useRef(null);

  const bottom = useRef(null);

  const list = useRef(null);

  const followMessages = useRef(true);

  const lastRead = useRef(0);

  const reading = useRef(false);

  const [readError, setReadError] = useState('');



  useEffect(() => {

    let cancelled = false;

    let fetching = false;

    const load = async () => {

      if (fetching || document.hidden) return;

      fetching = true;

      try {

        const result = await service.listMessages(id);

        if (!cancelled) { setMessages(result.data || []); setLoadError(''); }

      } catch (err) { if (!cancelled) setLoadError(err.message); }

      finally { fetching = false; if (!cancelled) setLoading(false); }

    };

    load();

    const timer = setInterval(load, 3000);

    const onVisible = () => { if (!document.hidden) load(); };

    document.addEventListener('visibilitychange', onVisible);

    return () => { cancelled = true; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };

  }, [id, service]);



  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {

    if (followMessages.current) bottom.current?.scrollIntoView({ block: 'nearest' });

  }, [lastId]);



  useEffect(() => {

    let cancelled = false;

    const read = async () => {

      if (document.hidden || !lastId || lastId <= lastRead.current || reading.current) return;

      reading.current = true;

      try {

        await markRead(kind, id, lastId);

        if (!cancelled) { lastRead.current = lastId; setReadError(''); }

      } catch { if (!cancelled) setReadError('Unread badges could not be updated. Please try again.'); }

      finally { reading.current = false; }

    };

    read();

    const timer = setInterval(read, 3000);

    document.addEventListener('visibilitychange', read);

    return () => { cancelled = true; clearInterval(timer); document.removeEventListener('visibilitychange', read); };

  }, [id, kind, lastId, markRead]);



  useEffect(() => () => { if (pending?.preview) URL.revokeObjectURL(pending.preview); }, [pending]);



  const pickFile = event => {

    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!file.size || file.size > 25 * 1024 * 1024) { setError('Choose a non-empty file smaller than 25 MB.'); return; }

    setError('');

    const image = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);

    setPending({ file, kind: image ? 'image' : 'file', duration: 0, preview: image ? URL.createObjectURL(file) : null });

  };



  const editingMessage = messages.find(message => message.id === editingId);

  const canSubmit = Boolean(content.trim() || pending || (editingMessage && editingMessage.messageType && editingMessage.messageType !== 'text'));



  const submit = async (event) => {

    event.preventDefault();

    if (!canSubmit || busy || recording) return;

    setBusy(true);

    setError('');

    try {

      if (editingId) await service.editMessage(id, editingId, content.trim());

      else if (pending) await service.sendAttachment(id, pending.file, { kind: pending.kind, duration: pending.duration, caption: content.trim() });

      else await service.sendMessage(id, content.trim());

      followMessages.current = true;

      setContent('');

      setEditingId(null);

      setPending(null);

      setMessages((await service.listMessages(id)).data || []);

      await refresh();

    } catch (err) { setError(err.message); }

    finally { setBusy(false); }

  };



  const remove = async (message) => {

    const mine = Number(message.userId) === Number(user?.id);

    const choices = [{ value: 'me', label: 'Delete for me', description: 'Hide this message only from your view.' }];

    if (mine && !message.deletedForEveryone) choices.push({ value: 'everyone', label: 'Delete for everyone', description: 'Remove your message and its attachment for everyone in this conversation.' });

    const scope = await confirm({ title: 'Delete this message?', message: 'Choose a delete option.', choices });

    if (!scope) return;

    setBusy(true);

    setError('');

    try {

      await service.deleteMessage(id, message.id, scope);

      setMessages((await service.listMessages(id)).data || []);

      if (editingId === message.id) { setEditingId(null); setContent(''); }

      await refresh();

    } catch (err) { setError(err.message); }

    finally { setBusy(false); }

  };



  return (

    <section className={styles.thread} aria-label={title}>

      <header className={styles.header}>

        {onBack && <button type="button" className={styles.back} onClick={onBack} aria-label="Back to conversations"><ArrowLeft size={20} /></button>}

        <span className={styles.headerIcon}>{kind === 'chat' ? <span>{title.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase()}</span> : <Hash size={21} />}</span>

        <div><h2>{title}</h2><p>{description || (kind === 'chat' ? 'Private conversation' : 'An open space to learn and share ideas')}</p></div>

        {headerActions}
        <span className={styles.headerTag}>{kind === 'chat' ? 'Private' : 'Community'}</span>

      </header>

      {(error || loadError) && <p className={styles.error} role="alert">{error || loadError}</p>}

      {readError && <p className={styles.error} role="alert">{readError}</p>}

      <div ref={list} onScroll={() => { const area = list.current; followMessages.current = area.scrollHeight - area.scrollTop - area.clientHeight < 70; }} className={styles.messages} aria-live="polite" aria-relevant="additions text">

        {loading ? <p className={styles.empty} role="status">Loading messages…</p> : messages.length === 0 && <div className={styles.empty}><MessageCircle size={34} /><strong>Start with a hello</strong><p>This is the beginning of your conversation.</p></div>}

        {messages.map((message, index) => {

          const mine = Number(message.userId) === Number(user?.id);

          const date = new Date(message.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

          const previousDate = index > 0 ? new Date(messages[index - 1].createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';

          const initials = `${message.firstName?.[0] || ''}${message.lastName?.[0] || ''}`.toUpperCase();

          return (

            <div key={message.id}>

              {date !== previousDate && <div className={styles.day}><span>{date}</span></div>}

              <div className={`${styles.row} ${mine ? styles.rowMine : ''}`}>

              {!mine && <span className={styles.avatar} aria-hidden="true">{initials}</span>}

              <article className={`${styles.message} ${mine ? styles.mine : ''}`}>

              <div className={styles.meta}><strong>{mine ? 'You' : `${message.firstName} ${message.lastName}`}</strong></div>

              {message.deletedForEveryone ? <p className={styles.deleted}>This message was deleted</p> : <>

                {message.messageType && message.messageType !== 'text' && <MessageAttachment message={message} id={id} service={service} />}

                {message.content && <p className={styles.content}>{message.content}</p>}

              </>}

              <div className={styles.time}><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{message.editedAt && !message.deletedForEveryone && <span> · edited</span>}{mine && <Check size={12} aria-label="Sent" />}</div>

              <details className={styles.menu}><summary aria-label="Message options"><ChevronDown size={15} /></summary><div className={styles.actions}>

                {mine && !message.deletedForEveryone && <button type="button" disabled={busy || recording || Boolean(pending)} onClick={() => { setEditingId(message.id); setContent(message.content); }}><Pencil size={13} /> Edit</button>}

                <button type="button" disabled={busy || recording} onClick={() => remove(message)}><Trash2 size={13} /> Delete</button>

              </div></details>

              </article>

              </div>

            </div>

          );

        })}

        <div ref={bottom} />

      </div>

      <form onSubmit={submit} className={styles.form}>

        {pending && <div className={styles.pending}>

          {pending.kind === 'image' ? <img src={pending.preview} alt="Image ready to send" /> : pending.kind === 'voice' ? <audio controls src={pending.preview} /> : <FileText size={23} />}

          <span><strong>{pending.kind === 'voice' ? 'Voice message ready to send' : pending.file.name}</strong><small>{pending.kind === 'voice' ? `${pending.duration}s · ` : ''}{(pending.file.size / (1024 * 1024)).toFixed(1)} MB</small></span>

          <button type="button" disabled={busy} onClick={() => setPending(null)} aria-label="Remove attachment"><X size={17} /></button>

        </div>}

        {editingId && <div className={styles.editing}><Pencil size={14} /><span>Editing your message</span><button type="button" aria-label="Cancel edit" onClick={() => { setEditingId(null); setContent(''); }}><X size={16} /></button></div>}

        <label htmlFor="message-content" className={styles.composerLabel}>{editingId ? 'Edit your message' : 'Your message'}</label>

        <textarea id="message-content" value={content} onChange={event => setContent(event.target.value)} placeholder={pending ? 'Add a caption (optional)…' : 'Write a message…'} maxLength={5000} required={!pending && (!editingMessage?.messageType || editingMessage.messageType === 'text')} rows={1} disabled={busy} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(event); } }} />

        {!editingId && <div className={styles.tools}>

          <input type="file" ref={photoInput} hidden accept="image/jpeg,image/png,image/gif,image/webp" onChange={pickFile} aria-label="Choose an image" />

          <input type="file" ref={fileInput} hidden onChange={pickFile} aria-label="Choose a file" />

          <button type="button" className={styles.toolButton} aria-label="Image" title="Send an image" disabled={busy || recording || Boolean(pending)} onClick={() => photoInput.current.click()}><ImageIcon size={18} /><span>Image</span></button>

          <button type="button" className={styles.toolButton} aria-label="File" title="Send a file" disabled={busy || recording || Boolean(pending)} onClick={() => fileInput.current.click()}><Paperclip size={18} /><span>File</span></button>

          <VoiceRecorder disabled={busy || Boolean(pending)} onError={setError} onRecordingChange={setRecording} onRecorded={(file, duration) => { setError(''); setPending({ file, kind: 'voice', duration, preview: URL.createObjectURL(file) }); }} />

          <small>Up to 25 MB</small>

        </div>}

        <div className={styles.formActions}>

          <small>Enter to send · Shift + Enter for a new line</small>

          <button type="submit" className={styles.send} aria-label={busy ? 'Sending…' : editingId ? 'Save changes' : 'Send message'} title={editingId ? 'Save changes' : 'Send message'} disabled={busy || recording || !canSubmit}><Send size={14} />{busy ? 'Sending…' : editingId ? 'Save changes' : 'Send message'}</button>

        </div>

      </form>

    </section>

  );

}

