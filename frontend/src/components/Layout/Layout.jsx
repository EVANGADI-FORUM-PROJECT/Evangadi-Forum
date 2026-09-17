import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar.jsx';
import Sidebar from '../Sidebar/Sidebar.jsx';
import styles from './Layout.module.css';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  // The sidebar stays visible on desktop. On smaller screens it starts open and
  // can be dismissed with the X button inside the sidebar.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const closeSidebarOnMobile = () => {
    if (window.matchMedia('(max-width: 900px)').matches) setSidebarOpen(false);
  };

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Home';
    if (path === '/my-questions') return 'Your topics';
    if (path === '/questions/ask') return 'Ask a question';
    if (path.startsWith('/question/') || path.startsWith('/questions/')) return 'Discussion';
    if (path === '/rag-documents') return 'Knowledge base';
    return 'Forum';
  };

  const getSubtitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Browse the feed, search by keyword, or run AI similarity search.';
    if (path === '/my-questions') return 'Questions you have posted. Open any thread to read replies or edit context.';
    if (path === '/questions/ask') return 'A clear title and reproducible steps get faster, more accurate answers.';
    if (path.startsWith('/question/') || path.startsWith('/questions/')) return 'Read the thread, review related topics, and reply with markdown if you can help.';
    if (path === '/rag-documents') return 'Private PDF library: reader, semantic search, and AI answers with citations per document.';
    return '';
  };

  return(
    <div className={`${styles.layout} ${sidebarOpen ? styles['layout--sidebarOpen'] : styles['layout--sidebarClosed']}`}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebarOnMobile} />
      {!sidebarOpen && (
        <button
          type="button"
          className={styles.sidebarShowButton}
          onClick={() => setSidebarOpen(true)}
          aria-label="Show navigation"
          title="Show navigation"
        >
          <Menu size={22} />
        </button>
      )}
      {sidebarOpen && <button className={styles.sidebarOverlay} aria-label="Close navigation" onClick={closeSidebarOnMobile} />}

      <div className={styles.layout__content}>
        <Navbar
          title={getTitle()}
          subtitle={getSubtitle()}
          user={user}
          onLogout={logout}
        />
        <main className={styles.layout__main}>
          <div className={styles.layout__mainInner}>
            <Outlet />
          </div>
        </main>


        <footer className={styles.layout__footer}>
          <div className={styles['layout__footer-content']}>
            <div className={styles['layout__footer-branding']}>
              <h4 className={styles['layout__footer-title']}>Evangadi Forum</h4>
              <p className={styles['layout__footer-tagline']}>
                A practice space for technical Q&A, peer feedback, and AI-assisted search, built for Evangadi learners and mentors.
              </p>
              <p className={styles['layout__footer-copyright']}>© 2026 Evangadi Forum. For educational use.</p>
            </div>
            <nav className={styles['layout__footer-nav']} aria-label="Footer navigation">
              <a href="#" className={styles['layout__footer-link']}>About</a>
              <a href="#" className={styles['layout__footer-link']}>Privacy</a>
              <a href="#" className={styles['layout__footer-link']}>Terms</a>
              <a href="#" className={styles['layout__footer-link']}>Contact</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  )
}
