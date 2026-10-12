import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, MessageSquare, HelpCircle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import styles from './NotificationBell.module.css';

// Small, dependency-free relative time formatter — good enough for "a few
// minutes ago" style notification timestamps, no need for a date library.
function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close the dropdown on any click outside it.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = notification => {
    if (!notification.isRead) markAsRead(notification.id);
    setOpen(false);
    if (notification.questionHash) navigate(`/questions/${notification.questionHash}`);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={markAllAsRead}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 && (
              <div className={styles.empty}>No notifications yet.</div>
            )}
            {notifications.map(n => {
              const Icon = n.type === 'new_answer' ? MessageSquare : HelpCircle;
              return (
                <button
                  type="button"
                  key={n.id}
                  className={`${styles.item} ${!n.isRead ? styles.itemUnread : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  <Icon size={15} className={styles.itemIcon} />
                  <div className={styles.itemBody}>
                    <p>{n.message}</p>
                    <span>{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.isRead && <span className={styles.dot} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
