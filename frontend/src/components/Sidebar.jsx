import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Droplets, Sprout, Package, DollarSign, Users, UserCog, CheckSquare, BarChart3, Settings, LogOut, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../locales';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const { language, changeLanguage } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const navItems = [
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { path: '/sensors', labelKey: 'nav.sensors', icon: Droplets },
    { path: '/irrigation', labelKey: 'nav.irrigation', icon: Droplets },
    { path: '/plants', labelKey: 'nav.plants', icon: Sprout },
    { path: '/stock', labelKey: 'nav.stock', icon: Package },
    { path: '/sales', labelKey: 'nav.sales', icon: DollarSign },
    { path: '/customers', labelKey: 'nav.customers', icon: Users },
    { path: '/employees', labelKey: 'nav.employees', icon: UserCog },
    { path: '/tasks', labelKey: 'nav.tasks', icon: CheckSquare },
    { path: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
    { path: '/settings', labelKey: 'nav.settings', icon: Settings },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 data-testid="sidebar-title">AgroFarm</h1>
        <p>Gestion Intelligente</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.path.substring(1)}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button 
          className="logout-btn" 
          onClick={onLogout}
          data-testid="logout-button"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
