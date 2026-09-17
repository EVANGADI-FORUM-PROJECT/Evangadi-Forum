import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, MessageSquare, FileText, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';


const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: MessageSquare, label: 'Your Topics', path: '/my-questions' },
  { icon: FileText, label: 'Knowledge Base', path: '/rag-documents' },
];

export default function Sidebar() {
  
  return ();
}
