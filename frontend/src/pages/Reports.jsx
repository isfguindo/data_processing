import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { BarChart3, TrendingUp, Package, Leaf, Droplet, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = ({ onLogout }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [yieldReport, setYieldReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [statsRes, yieldRes] = await Promise.all([
        axios.get(`${API}/reports/dashboard`),
        axios.get(`${API}/reports/yield`),
      ]);
      setDashboardStats(statsRes.data);
      setYieldReport(yieldRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des rapports');
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
          <h1>Rapports & Analytics</h1>
          <p>Analyse approfondie des performances de la ferme</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card" data-testid="report-plants-card">
            <div className="stat-card-header">
              <h3>Plantes</h3>
              <div className="stat-card-icon"><Leaf size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="report-total-plants">{dashboardStats?.total_plants || 0}</div>
            <div className="stat-card-label">
              Taux de santé: {dashboardStats?.plant_health_rate || 0}%
            </div>
          </div>

          <div className="stat-card" data-testid="report-stock-card">
            <div className="stat-card-header">
              <h3>Stock</h3>
              <div className="stat-card-icon"><Package size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="report-total-stock">{dashboardStats?.total_stock_items || 0}</div>
            <div className="stat-card-label">
              {dashboardStats?.low_stock_items || 0} en stock faible
            </div>
          </div>

          <div className="stat-card" data-testid="report-revenue-card">
            <div className="stat-card-header">
              <h3>Revenus</h3>
              <div className="stat-card-icon"><TrendingUp size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="report-total-revenue">${dashboardStats?.total_revenue?.toFixed(2) || '0.00'}</div>
            <div className="stat-card-label">
              {dashboardStats?.total_sales || 0} ventes
            </div>
          </div>

          <div className="stat-card" data-testid="report-yield-card">
            <div className="stat-card-header">
              <h3>Rendement</h3>
              <div className="stat-card-icon"><BarChart3 size={20} /></div>
            </div>
            <div className="stat-card-value" data-testid="report-total-yield">{yieldReport?.total_yield?.toFixed(2) || 0}</div>
            <div className="stat-card-label">
              Unités récoltées
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2>Produits Récoltés</h2>
          {yieldReport?.products?.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucun produit récolté dans le stock</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Unité</th>
                    <th>Prix Unitaire</th>
                    <th>Valeur Totale</th>
                  </tr>
                </thead>
                <tbody>
                  {yieldReport?.products?.map((product) => (
                    <tr key={product.id} data-testid={`yield-row-${product.id}`}>
                      <td>{product.item_name}</td>
                      <td data-testid={`yield-quantity-${product.id}`}>{product.quantity}</td>
                      <td>{product.unit}</td>
                      <td>${product.price_per_unit}</td>
                      <td data-testid={`yield-value-${product.id}`}>${(product.quantity * product.price_per_unit).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="content-card" style={{ background: 'rgba(76, 175, 80, 0.05)', borderLeft: '4px solid #4caf50' }}>
          <h2 style={{ color: '#2e7d32' }}>Impact Écologique</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#66bb6a', fontWeight: 600, marginBottom: '0.5rem' }}>Consommation d'Eau</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1b5e20' }}>2,450 L</p>
              <p style={{ fontSize: '0.875rem', color: '#81c784' }}>Ce mois-ci</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#66bb6a', fontWeight: 600, marginBottom: '0.5rem' }}>Empreinte Carbone</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1b5e20' }}>145 kg CO₂</p>
              <p style={{ fontSize: '0.875rem', color: '#81c784' }}>Réduite de 12% vs mois dernier</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#66bb6a', fontWeight: 600, marginBottom: '0.5rem' }}>Utilisation de Pesticides</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1b5e20' }}>8.5 L</p>
              <p style={{ fontSize: '0.875rem', color: '#81c784' }}>Optimisé par IA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
