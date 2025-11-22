import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Sensors = ({ onLogout }) => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchSensors();
  }, []);

  const fetchSensors = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`${API}/sensors/current`);
      setSensors(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des capteurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const response = await axios.post(`${API}/sensors/ai-analysis`, { language: 'fr' });
      setAiAnalysis(response.data);
    } catch (error) {
      toast.error("Erreur lors de l'analyse IA des capteurs");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>Capteurs IoT</h1>
          <p>Surveillance environnementale en temps réel</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={fetchSensors} 
            disabled={refreshing}
            data-testid="refresh-sensors-button"
          >
            <RefreshCw size={20} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Actualisation...' : 'Actualiser les données'}
          </button>
        </div>

        <div className="sensor-grid">
          {sensors.map((sensor, index) => (
            <div key={index} className="sensor-card" style={{ padding: '2rem' }} data-testid={`sensor-card-${sensor.sensor_type}`}>
              <h4>{getSensorLabel(sensor.sensor_type)}</h4>
              <div>
                <span className="sensor-value" data-testid={`sensor-value-${sensor.sensor_type}`}>{sensor.value}</span>
                <span className="sensor-unit">{sensor.unit}</span>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#81c784' }}>
                Localisation: {sensor.location}
              </div>
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                background: getStatusColor(sensor.sensor_type, sensor.value),
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textAlign: 'center',
                color: '#1b5e20'
              }}>
                {getStatus(sensor.sensor_type, sensor.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const getSensorLabel = (type) => {
  const labels = {
    humidity: 'Humidité du Sol',
    temperature: 'Température',
    ph: 'pH du Sol',
    wind: 'Vitesse du Vent',
    rain: 'Précipitations',
    sunlight: 'Ensoleillement',
  };
  return labels[type] || type;
};

const getStatus = (type, value) => {
  if (type === 'humidity') {
    if (value < 50) return 'Faible';
    if (value > 70) return 'Élevé';
    return 'Optimal';
  }
  if (type === 'temperature') {
    if (value < 20) return 'Frais';
    if (value > 30) return 'Chaud';
    return 'Idéal';
  }
  if (type === 'ph') {
    if (value < 6) return 'Acide';
    if (value > 7) return 'Alcalin';
    return 'Neutre';
  }
  return 'Normal';
};

const getStatusColor = (type, value) => {
  if (type === 'humidity') {
    if (value < 50 || value > 70) return 'rgba(245, 127, 23, 0.15)';
    return 'rgba(56, 142, 60, 0.15)';
  }
  if (type === 'temperature') {
    if (value < 20 || value > 30) return 'rgba(245, 127, 23, 0.15)';
    return 'rgba(56, 142, 60, 0.15)';
  }
  return 'rgba(56, 142, 60, 0.15)';
};

export default Sensors;
