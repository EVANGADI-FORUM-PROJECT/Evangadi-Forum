import { avatarUrl } from '../../services/core/avatar.url.js';
import { useEffect, useState } from 'react';
import { Camera, Loader2, Save, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth.js';
import { authService } from '../../services/auth/auth.service.js';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', avatar: null });
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    authService.getProfile().then(profile => {
      if (cancelled) return;
      setForm({ firstName: profile.firstName, lastName: profile.lastName, email: profile.email, avatar: profile.avatar });
      setPreview(profile.avatar || '');
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [user]);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const chooseImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Choose a PNG, JPG, WEBP, or GIF image smaller than 2 MB.'); return;
    }
    const reader = new FileReader();
    reader.onload = () => { setPreview(String(reader.result)); setForm(current => ({ ...current, avatar: String(reader.result) })); };
    reader.readAsDataURL(file); setError('');
  };
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await updateProfile(form); setMessage('Your profile has been updated.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <section className={styles.page}><header><span>Account settings</span><h1>Edit profile</h1><p>Update your name, email address, and profile photo.</p></header><form onSubmit={submit} className={styles.card}><div className={styles.photoRow}><div className={styles.avatar}>{preview ? <img src={avatarUrl(preview)} alt="Profile preview"/> : <UserRound/>}</div><label className={styles.upload}><Camera size={15}/> Choose photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseImage}/></label><small>PNG, JPG, WEBP, or GIF · up to 2 MB</small></div><div className={styles.fields}><label>First name<input name="firstName" value={form.firstName} onChange={update} minLength={3} maxLength={50} required/></label><label>Last name<input name="lastName" value={form.lastName} onChange={update} minLength={3} maxLength={50} required/></label><label>Email address<input name="email" type="email" value={form.email} onChange={update} required/></label></div>{error && <div className={styles.error} role="alert">{error}</div>}{message && <div className={styles.success} role="status">{message}</div>}<button className={styles.save} disabled={busy}>{busy ? <Loader2 className={styles.spin}/> : <Save size={15}/>} Save profile</button></form></section>;
}
