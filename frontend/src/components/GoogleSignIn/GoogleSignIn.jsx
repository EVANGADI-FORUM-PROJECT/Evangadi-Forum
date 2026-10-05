import { useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function GoogleSignIn({ onCredential, onError, disabled = false }) {
  const pending = useRef(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId || clientId.startsWith('your_')) return null;
  const handleSuccess = async response => {
    if (pending.current || disabled) return;
    if (!response.credential) { onError('Google did not return a valid credential. Please try again.'); return; }
    pending.current = true;
    try { await onCredential(response.credential); }
    catch (error) { onError(error.message || 'Google sign-in failed. Please try again.'); }
    finally { pending.current = false; }
  };
  return <div inert={disabled} aria-busy={disabled}>
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin onSuccess={handleSuccess} onError={() => onError('Google sign-in was cancelled or could not be completed.')} useOneTap={false} />
    </GoogleOAuthProvider>
  </div>;
}
