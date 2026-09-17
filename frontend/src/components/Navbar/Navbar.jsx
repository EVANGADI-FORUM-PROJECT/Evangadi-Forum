import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LogOut, Sparkles } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar({ title, subtitle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || params.get('semantic') || '';
  });

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      const params = new URLSearchParams(location.search);
      setSearchTerm(params.get('q') || params.get('semantic') || '');
    } else {
      setSearchTerm('');
    }
  }, [location.search, location.pathname]);



  return (

  );
}
