import { useEffect, useRef, useState } from 'react';
import { Mic, Square, X } from 'lucide-react';
import styles from './MessageThread.module.css';

export default function VoiceRecorder({ disabled, onRecorded, onRecordingChange, onError }) {
  const [recording, setRecording] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const session = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const current = session.current;
      if (!current) return;
      current.cancelled = true;
      clearInterval(current.timer);
      if (current.recorder.state !== 'inactive') current.recorder.stop();
      current.stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const stop = cancel => {
    const current = session.current;
    if (!current) return;
    current.cancelled = cancel;
    if (current.recorder.state !== 'inactive') current.recorder.stop();
  };

  const start = async () => {
    if (disabled || requesting) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError('Voice recording needs a supported browser and HTTPS or localhost.');
      return;
    }
    setRequesting(true);
    onRecordingChange(true);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { stream.getTracks().forEach(track => track.stop()); return; }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const current = { recorder, stream, chunks: [], started: Date.now(), cancelled: false, timer: null };
      session.current = current;
      recorder.ondataavailable = event => { if (event.data.size) current.chunks.push(event.data); };
      recorder.onstop = () => {
        clearInterval(current.timer);
        stream.getTracks().forEach(track => track.stop());
        if (!mounted.current) return;
        setRecording(false); onRecordingChange(false); setSeconds(0);
        if (current.cancelled || !current.chunks.length) return;
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        const duration = Math.min(3600, Math.max(1, Math.round((Date.now() - current.started) / 1000)));
        const file = new File(current.chunks, `voice-${Date.now()}.${extension}`, { type });
        if (file.size > 25 * 1024 * 1024) { onError('This recording is too large. Please record a shorter message.'); return; }
        onRecorded(file, duration);
      };
      recorder.start(1000);
      setRecording(true); setSeconds(0);
      current.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - current.started) / 1000);
        setSeconds(elapsed);
        if (elapsed >= 3600 || current.chunks.reduce((size, chunk) => size + chunk.size, 0) >= 24 * 1024 * 1024) stop(false);
      }, 1000);
    } catch {
      stream?.getTracks().forEach(track => track.stop());
      if (mounted.current) { onRecordingChange(false); onError('Microphone access was denied or recording is unavailable.'); }
    } finally { if (mounted.current) setRequesting(false); }
  };

  if (recording) return <div className={styles.recording}><span className={styles.recordDot} /><span>Recording {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span><button type="button" onClick={() => stop(false)} aria-label="Stop recording"><Square size={15} /> Stop</button><button type="button" onClick={() => stop(true)} aria-label="Cancel recording"><X size={16} /></button></div>;
  return <button type="button" className={styles.toolButton} onClick={start} disabled={disabled || requesting} aria-label="Record voice message" title="Record voice message"><Mic size={18} /><span>{requesting ? 'Opening microphone…' : 'Voice'}</span></button>;
}
