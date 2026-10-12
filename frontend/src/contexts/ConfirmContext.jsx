import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import styles from '../components/ConfirmDialog/ConfirmDialog.module.css';

const ConfirmContext = createContext(null);

// One styled confirmation dialog serves the whole forum.
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);
  const dialog = useRef(null);
  const cancelButton = useRef(null);

  const confirm = useCallback(options => new Promise(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    setRequest(options);
  }), []);

  const finish = useCallback(accepted => {
    dialog.current?.close();
    resolver.current?.(accepted);
    resolver.current = null;
    setRequest(null);
  }, []);

  useEffect(() => {
    if (request) { dialog.current.showModal(); cancelButton.current?.focus(); }
  }, [request]);

  useEffect(() => () => { resolver.current?.(false); }, []);

  return <ConfirmContext.Provider value={confirm}>
    {children}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="confirmation-title" aria-describedby="confirmation-description" onCancel={event => { event.preventDefault(); finish(false); }}>
      {request && <div className={styles.body}>
        <button type="button" className={styles.close} aria-label="Close confirmation" onClick={() => finish(false)}><X size={20} /></button>
        <span className={styles.icon}><Trash2 size={22} /></span>
        <h2 id="confirmation-title">{request.title || 'Delete this item?'}</h2>
        <p id="confirmation-description">{request.message}</p>
        {request.choices && <div className={styles.choices}>
          {request.choices.map(choice => <button key={choice.value} type="button" onClick={() => finish(choice.value)}><strong>{choice.label}</strong><span>{choice.description}</span></button>)}
        </div>}
        <div className={styles.actions}>
          <button type="button" ref={cancelButton} className={styles.cancel} onClick={() => finish(false)}>Keep it</button>
          {!request.choices && <button type="button" className={styles.confirm} onClick={() => finish(true)}>{request.confirmLabel || 'Delete'}</button>}
        </div>
      </div>}
    </dialog>
  </ConfirmContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Keep the context hook beside its provider, as in the existing forum contexts.
export function useConfirm() {
  return useContext(ConfirmContext);
}
