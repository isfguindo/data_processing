import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Droplets, Sprout, Package, DollarSign, Users, UserCog, CheckSquare, BarChart3, Settings, LogOut, Globe, Database } from 'lucide-react';
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
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(46, 125, 50, 0.1)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#66bb6a', fontSize: '0.875rem', fontWeight: 600 }}>
            <Globe size={16} />
            <span>{t('settings.language')}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => changeLanguage('fr')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: language === 'fr' ? '#2e7d32' : 'rgba(46, 125, 50, 0.1)',
                color: language === 'fr' ? 'white' : '#2e7d32',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              data-testid="lang-fr-button"
            >
              FR
            </button>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: language === 'en' ? '#2e7d32' : 'rgba(46, 125, 50, 0.1)',
                color: language === 'en' ? 'white' : '#2e7d32',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              data-testid="lang-en-button"
            >
              EN
            </button>
          </div>
        </div>
        <button 
          className="logout-btn" 
          onClick={onLogout}
          data-testid="logout-button"
        >
          <LogOut size={20} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
