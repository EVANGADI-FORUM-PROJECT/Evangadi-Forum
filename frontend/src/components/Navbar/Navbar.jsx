import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LogOut, Sparkles } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar({ title, subtitle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const searchKey = `${location.pathname}${location.search}`;
  const params = new URLSearchParams(location.search);
  const urlTerm = location.pathname === '/dashboard'
    ? params.get('q') || params.get('semantic') || ''
    : '';
  const [draft, setDraft] = useState(null);
  const searchTerm = draft?.key === searchKey ? draft.value : urlTerm;
  const draftKey = draft?.key;

  // Only typed edits trigger keyword search; URL-driven semantic searches stay intact.
  useEffect(() => {
    if (draftKey !== searchKey || searchTerm === urlTerm) return;
    const timer = setTimeout(() => {
      const query = searchTerm.trim();
      navigate(query ? `/dashboard?q=${encodeURIComponent(query)}` : '/dashboard', {
        replace: true,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [draftKey, searchKey, searchTerm, urlTerm, navigate]);

  const handleSemanticSearch = e => {
    e.preventDefault();
    if (searchTerm.trim().length >= 5) {
      navigate(`/dashboard?semantic=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className={styles.navbar}>
          <div className={styles.navbar__titleBlock}>
        <h2 className={styles.navbar__pageTitle}>{title}</h2>
        {subtitle ? (
          <p className={styles.navbar__pageSubtitle}>{subtitle}</p>
        ) : null}
      </div>

      <form className={styles.navbar__search} onSubmit={handleSearchSubmit}>
        <div className={styles['navbar__search-icon']}>
          <Search size={16} />
        </div>
        <input
          id='search'
          type='text'
          value={searchTerm}
          onChange={e => setDraft({ key: searchKey, value: e.target.value })}
          placeholder='Search questions by keyword…'
          className={styles['navbar__search-input']}
          aria-label='Search questions by keyword'
        />
        {searchTerm.length >= 5 && (
          <button
            type='button'
            onClick={handleSemanticSearch}
            className={styles['navbar__semantic-button']}
            title='Use AI Semantic Search'
          >
            <Sparkles size={14} />
            <span className={styles['navbar__semantic-text']}>AI Search</span>
          </button>
        )}
      </form>

      <div className={styles.navbar__actions}>
        <div className={styles.navbar__user}>
          <span className={styles['navbar__user-name']}>
            {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
          </span>
          <div className={styles['navbar__user-avatar']}>
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${
                  user?.firstName || 'User'
                }+${user?.lastName || ''}&background=random`
              }
              alt='avatar'
              referrerPolicy='no-referrer'
            />
          </div>
        </div>
        {user && (
          <button
            type='button'
            className={styles.navbar__logout}
            onClick={onLogout}
            aria-label='Logout'
            title='Logout'
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
