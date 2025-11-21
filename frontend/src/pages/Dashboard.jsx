import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Sprout, Package, DollarSign, Users, AlertTriangle, TrendingUp, Droplets, ThermometerSun } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = ({ onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/reports/dashboard`);
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar onLogout={onLogout} />
        <div className="main-content">
          <div className="loading-screen"><div className="spinner"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1 data-testid="dashboard-title">Tableau de Bord</h1>
          <p>Vue d'ensemble de votre ferme en temps réel</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card" data-testid="plants-stat-card">
            <div className="stat-card-header">
              <h3>Plantes</h3>
              <div className="stat-card-icon"><Sprout size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="total-plants">{stats?.total_plants || 0}</div>
            <div className="stat-card-label">
              {stats?.healthy_plants || 0} en bonne santé ({stats?.plant_health_rate || 0}%)
            </div>
          </div>

          <div className="stat-card" data-testid="stock-stat-card">
            <div className="stat-card-header">
              <h3>Stock</h3>
              <div className="stat-card-icon"><Package size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="total-stock">{stats?.total_stock_items || 0}</div>
            <div className="stat-card-label">
              {stats?.low_stock_items || 0} articles à restock
            </div>
          </div>

          <div className="stat-card" data-testid="sales-stat-card">
            <div className="stat-card-header">
              <h3>Ventes</h3>
              <div className="stat-card-icon"><DollarSign size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="total-revenue">${stats?.total_revenue?.toFixed(2) || '0.00'}</div>
            <div className="stat-card-label">
              {stats?.total_sales || 0} transactions
            </div>
          </div>

          <div className="stat-card" data-testid="customers-stat-card">
            <div className="stat-card-header">
              <h3>Clients</h3>
              <div className="stat-card-icon"><Users size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="total-customers">{stats?.total_customers || 0}</div>
            <div className="stat-card-label">
              {stats?.pending_tasks || 0} tâches en attente
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2>Capteurs en Temps Réel</h2>
          <div className="sensor-grid">
            {stats?.recent_sensors?.map((sensor, index) => (
              <div key={index} className="sensor-card" data-testid={`sensor-${sensor.sensor_type}`}>
                <h4>{getSensorLabel(sensor.sensor_type)}</h4>
                <div>
                  <span className="sensor-value" data-testid={`sensor-value-${sensor.sensor_type}`}>
                    {sensor.value}
                  </span>
                  <span className="sensor-unit">{sensor.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {stats?.low_stock_items > 0 && (
          <div className="content-card" style={{ borderLeft: '4px solid #f57f17' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} color="#f57f17" />
              <h2 style={{ margin: 0 }}>Alertes Stock</h2>
            </div>
            <p style={{ color: '#f57f17', fontSize: '1rem' }}>
              {stats.low_stock_items} articles en stock sont sous le seuil minimum. Consultez la page Stock pour plus de détails.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const getSensorLabel = (type) => {
  const labels = {
    humidity: 'Humidité du Sol',
    temperature: 'Température',
    ph: 'pH du Sol',
    wind: 'Vent',
    rain: 'Pluie',
    sunlight: 'Ensoleillement',
  };
  return labels[type] || type;
};

export default Dashboard;
