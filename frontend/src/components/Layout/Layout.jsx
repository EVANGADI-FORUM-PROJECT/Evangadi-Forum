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

}
