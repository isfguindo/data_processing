import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Sprout, Package, DollarSign, Users, AlertTriangle, TrendingUp, Droplets, ThermometerSun } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = ({ onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [sensorTrends, setSensorTrends] = useState([]);
  const [stockDistribution, setStockDistribution] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashResponse, salesResponse, sensorsResponse, stockResponse] = await Promise.all([
        axios.get(`${API}/reports/dashboard`),
        axios.get(`${API}/sales`),
        axios.get(`${API}/sensors/history?sensor_type=temperature&limit=10`),
        axios.get(`${API}/stock`)
      ]);
      
      setStats(dashResponse.data);
      
      // Process sales data for chart (last 7 days)
      const last7Days = salesResponse.data.slice(0, 7).reverse();
      const salesChartData = last7Days.map(sale => ({
        date: new Date(sale.sale_date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        montant: sale.total_amount
      }));
      setSalesData(salesChartData);
      
      // Process sensor trends
      const sensorChartData = sensorsResponse.data.reverse().map((sensor, idx) => ({
        time: `T${idx + 1}`,
        temperature: sensor.value
      }));
      setSensorTrends(sensorChartData);
      
      // Process stock distribution by category
      const categoryMap = {};
      stockResponse.data.forEach(item => {
        categoryMap[item.category] = (categoryMap[item.category] || 0) + 1;
      });
      const stockChart = Object.entries(categoryMap).map(([category, count]) => ({
        name: getCategoryLabel(category),
        value: count
      }));
      setStockDistribution(stockChart);
      
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

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Sales Trend Chart */}
          <div className="content-card">
            <h2 style={{ marginBottom: '1.5rem' }}>📈 Évolution des Ventes (7 derniers jours)</h2>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c8e6c9" />
                  <XAxis dataKey="date" stroke="#66bb6a" style={{ fontSize: '0.875rem' }} />
                  <YAxis stroke="#66bb6a" style={{ fontSize: '0.875rem' }} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #c8e6c9', borderRadius: '8px' }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Montant']}
                  />
                  <Area type="monotone" dataKey="montant" stroke="#2e7d32" strokeWidth={2} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucune donnée de vente</p>
            )}
          </div>

          {/* Stock Distribution Pie Chart */}
          <div className="content-card">
            <h2 style={{ marginBottom: '1.5rem' }}>📦 Répartition du Stock par Catégorie</h2>
            {stockDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stockDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucun stock</p>
            )}
          </div>
        </div>

        {/* Sensor Trend Chart */}
        <div className="content-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>🌡️ Tendance de la Température</h2>
          {sensorTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sensorTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c8e6c9" />
                <XAxis dataKey="time" stroke="#66bb6a" style={{ fontSize: '0.875rem' }} />
                <YAxis stroke="#66bb6a" style={{ fontSize: '0.875rem' }} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #c8e6c9', borderRadius: '8px' }}
                  formatter={(value) => [`${value}°C`, 'Température']}
                />
                <Line type="monotone" dataKey="temperature" stroke="#f57f17" strokeWidth={2} dot={{ fill: '#f57f17', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucune donnée de capteur</p>
          )}
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
