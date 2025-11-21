import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Droplets, Sprout, Package, DollarSign, Users, UserCog, CheckSquare, BarChart3, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { path: '/sensors', label: 'Capteurs IoT', icon: Droplets },
    { path: '/irrigation', label: 'Irrigation', icon: Droplets },
    { path: '/plants', label: 'Plantes', icon: Sprout },
    { path: '/stock', label: 'Stock', icon: Package },
    { path: '/sales', label: 'Ventes', icon: DollarSign },
    { path: '/customers', label: 'Clients', icon: Users },
    { path: '/employees', label: 'Personnel', icon: UserCog },
    { path: '/tasks', label: 'Tâches', icon: CheckSquare },
    { path: '/reports', label: 'Rapports', icon: BarChart3 },
    { path: '/settings', label: 'Paramètres', icon: Settings },
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
