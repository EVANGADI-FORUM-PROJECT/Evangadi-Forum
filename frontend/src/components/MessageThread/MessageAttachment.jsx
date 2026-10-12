import { useEffect, useState } from 'react';
import { Download, FileText, Mic } from 'lucide-react';
import styles from './MessageThread.module.css';

const fileSize = bytes => Number(bytes) < 1024 * 1024 ? `${Math.ceil(Number(bytes) / 1024)} KB` : `${(Number(bytes) / (1024 * 1024)).toFixed(1)} MB`;

export default function MessageAttachment({ message, id, service }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (message.messageType === 'file') return;
    let cancelled = false;
    let objectUrl;
    service.getAttachment(id, message.id)
      .then(blob => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl); setError('');
      })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, message.id, message.messageType, service, attempt]);

  const download = async () => {
    setDownloading(true); setError('');
    try {
      const blob = await service.getAttachment(id, message.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl; link.download = message.attachmentName || 'attachment';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) { setError(err.message); }
    finally { setDownloading(false); }
  };

  if (message.messageType === 'file') return <>
    <button type="button" className={styles.fileCard} onClick={download} disabled={downloading}><FileText size={23} /><span><strong>{message.attachmentName || 'Attachment'}</strong><small>{downloading ? 'Downloading…' : fileSize(message.attachmentSize)}</small></span><Download size={17} /></button>
    {error && <p className={styles.attachmentError} role="alert">{error}</p>}
  </>;

  if (error) return <div className={styles.attachmentError}><p>{error}</p><button type="button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Retry</button></div>;
  if (!url) return <p className={styles.attachmentLoading}>Loading attachment…</p>;
  if (message.messageType === 'image') return <a href={url} target="_blank" rel="noreferrer" aria-label="Open full image"><img className={styles.photo} src={url} alt={message.attachmentName || 'Shared image'} /></a>;
  if (message.messageType === 'voice') return <div className={styles.voice}><span><Mic size={15} /> Voice message {message.durationSeconds ? `· ${message.durationSeconds}s` : ''}</span><audio controls preload="metadata" src={url} /></div>;
  return null;
}
