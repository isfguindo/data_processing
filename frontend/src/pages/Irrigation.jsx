import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Plus, Brain, Power, Settings as SettingsIcon, Zap, History } from 'lucide-react';
import { toast } from 'sonner';

const Irrigation = ({ onLogout }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAutoSettings, setShowAutoSettings] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [triggeringAuto, setTriggeringAuto] = useState(false);
  const [autoSettings, setAutoSettings] = useState(null);
  const [autoHistory, setAutoHistory] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    zone_name: '',
    start_time: '',
    duration_minutes: '',
    water_amount_liters: '',
    status: 'scheduled',
  });

  useEffect(() => {
    fetchSchedules();
    fetchAutoSettings();
    fetchAutoHistory();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${API}/irrigation`);
      setSchedules(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des horaires');
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoSettings = async () => {
    try {
      const response = await axios.get(`${API}/irrigation/auto-settings`);
      setAutoSettings(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres auto');
    }
  };

  const fetchAutoHistory = async () => {
    try {
      const response = await axios.get(`${API}/irrigation/auto-history?limit=5`);
      setAutoHistory(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique');
    }
  };

  const handleToggleAutoIrrigation = async () => {
    try {
      const newSettings = { ...autoSettings, enabled: !autoSettings.enabled };
      await axios.put(`${API}/irrigation/auto-settings`, newSettings);
      setAutoSettings(newSettings);
      toast.success(newSettings.enabled ? 'Irrigation automatique activée !' : 'Irrigation automatique désactivée');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSaveAutoSettings = async () => {
    try {
      await axios.put(`${API}/irrigation/auto-settings`, autoSettings);
      toast.success('Paramètres sauvegardés !');
      setShowAutoSettings(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleTriggerAutoIrrigation = async () => {
    setTriggeringAuto(true);
    try {
      const response = await axios.post(`${API}/irrigation/trigger-auto`, { language: 'fr' });
      
      if (response.data.triggered) {
        toast.success(`Irrigation déclenchée ! ${response.data.zones_irrigated.length} zones irriguées avec ${response.data.total_water_used.toFixed(0)}L d'eau.`);
        setAiRecommendation(response.data.ai_recommendation);
      } else {
        toast.info(response.data.message);
      }
      
      fetchSchedules();
      fetchAutoHistory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du déclenchement');
    } finally {
      setTriggeringAuto(false);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/irrigation`, {
        ...newSchedule,
        duration_minutes: parseInt(newSchedule.duration_minutes),
        water_amount_liters: parseFloat(newSchedule.water_amount_liters),
      });
      toast.success('Horaire d\'irrigation ajouté !');
      setShowModal(false);
      setNewSchedule({ zone_name: '', start_time: '', duration_minutes: '', water_amount_liters: '', status: 'scheduled' });
      fetchSchedules();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const getAIRecommendation = async () => {
    setGeneratingAI(true);
    try {
      const response = await axios.post(`${API}/irrigation/ai-recommend`);
      setAiRecommendation(response.data.recommendation);
      toast.success('Recommandation IA générée !');
    } catch (error) {
      toast.error('Erreur lors de la génération de la recommandation');
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>Gestion de l'Irrigation</h1>
          <p>Planification et optimisation automatique</p>
        </div>

        {/* Auto Irrigation System Card */}
        <div className="content-card" style={{ background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(102, 187, 106, 0.05) 100%)', borderLeft: '4px solid #2e7d32', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap size={28} color="#2e7d32" />
              <div>
                <h2 style={{ margin: 0 }}>Système d'Irrigation Automatique</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#66bb6a' }}>
                  Déclenchement intelligent basé sur l'IA et les conditions environnementales
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleAutoIrrigation}
              style={{
                padding: '0.75rem 1.5rem',
                background: autoSettings?.enabled ? '#2e7d32' : 'rgba(46, 125, 50, 0.1)',
                color: autoSettings?.enabled ? 'white' : '#2e7d32',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              data-testid="toggle-auto-irrigation"
            >
              <Power size={20} />
              {autoSettings?.enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
            </button>
          </div>

          {autoSettings && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
                <p style={{ fontSize: '0.875rem', color: '#66bb6a', marginBottom: '0.5rem', fontWeight: 600 }}>Seuil Température</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2e7d32', margin: 0 }}>{autoSettings.temperature_threshold}°C</p>
                {autoSettings.recommended_temp_threshold && (
                  <p style={{ fontSize: '0.75rem', color: '#81c784', marginTop: '0.25rem' }}>
                    IA recommande: {autoSettings.recommended_temp_threshold}°C
                  </p>
                )}
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
                <p style={{ fontSize: '0.875rem', color: '#66bb6a', marginBottom: '0.5rem', fontWeight: 600 }}>Seuil Humidité</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2e7d32', margin: 0 }}>{autoSettings.humidity_threshold}%</p>
                {autoSettings.recommended_humidity_threshold && (
                  <p style={{ fontSize: '0.75rem', color: '#81c784', marginTop: '0.25rem' }}>
                    IA recommande: {autoSettings.recommended_humidity_threshold}%
                  </p>
                )}
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
                <p style={{ fontSize: '0.875rem', color: '#66bb6a', marginBottom: '0.5rem', fontWeight: 600 }}>Dernier Déclenchement</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: '#2e7d32', margin: 0 }}>
                  {autoSettings.last_triggered ? new Date(autoSettings.last_triggered).toLocaleString('fr-FR') : 'Jamais'}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleTriggerAutoIrrigation}
              disabled={triggeringAuto}
              data-testid="trigger-auto-button"
              style={{ flex: 1, minWidth: '200px' }}
            >
              <Zap size={20} />
              {triggeringAuto ? 'Analyse en cours...' : 'Analyser et Déclencher'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAutoSettings(true)}
              data-testid="config-auto-button"
              style={{ flex: 1, minWidth: '200px' }}
            >
              <SettingsIcon size={20} />
              Configurer les Seuils
            </button>
          </div>

          {/* Auto History */}
          {autoHistory.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #c8e6c9' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#2e7d32' }}>
                <History size={20} />
                Historique des Déclenchements (5 derniers)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {autoHistory.map((trigger, idx) => (
                  <div key={idx} style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#2e7d32' }}>
                          {trigger.zones_irrigated.join(', ')}
                        </span>
                        <span style={{ color: '#66bb6a', marginLeft: '1rem' }}>
                          {trigger.total_water_used.toFixed(0)}L d'eau
                        </span>
                      </div>
                      <span style={{ color: '#81c784' }}>
                        {new Date(trigger.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} data-testid="add-schedule-button">
            <Plus size={20} />
            Ajouter un Horaire
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={getAIRecommendation} 
            disabled={generatingAI}
            data-testid="ai-recommend-button"
          >
            <Brain size={20} />
            {generatingAI ? 'Génération...' : 'Recommandation IA'}
          </button>
        </div>

        {aiRecommendation && (
          <div className="content-card" style={{ background: 'rgba(66, 165, 245, 0.05)', borderLeft: '4px solid #42a5f5', marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0288d1', marginBottom: '1rem' }}>
              <Brain size={24} />
              Recommandation IA
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#2e7d32' }} data-testid="ai-recommendation">
              {aiRecommendation}
            </p>
          </div>
        )}

        <div className="content-card">
          <h2>Horaires d'Irrigation</h2>
          {loading ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : schedules.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucun horaire planifié</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Heure de début</th>
                    <th>Durée (min)</th>
                    <th>Quantité d'eau (L)</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} data-testid={`schedule-row-${schedule.id}`}>
                      <td>{schedule.zone_name}</td>
                      <td>{schedule.start_time}</td>
                      <td>{schedule.duration_minutes}</td>
                      <td>{schedule.water_amount_liters}</td>
                      <td>
                        <span className={`badge ${
                          schedule.status === 'completed' ? 'badge-success' :
                          schedule.status === 'running' ? 'badge-info' :
                          schedule.status === 'cancelled' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {schedule.status === 'scheduled' ? 'Planifié' :
                           schedule.status === 'running' ? 'En cours' :
                           schedule.status === 'completed' ? 'Terminé' : 'Annulé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auto Settings Modal */}
        {showAutoSettings && autoSettings && (
          <div style={modalStyles.overlay} onClick={() => setShowAutoSettings(false)}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={modalStyles.title}>Configuration des Seuils Automatiques</h2>
              <p style={{ color: '#66bb6a', marginBottom: '1.5rem' }}>
                Ajustez les seuils pour déclencher l'irrigation automatique. L'IA a recommandé des valeurs optimales.
              </p>
              
              <div className="form-group">
                <label>Seuil de Température (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={autoSettings.temperature_threshold}
                  onChange={(e) => setAutoSettings({ ...autoSettings, temperature_threshold: parseFloat(e.target.value) })}
                  data-testid="temp-threshold-input"
                />
                {autoSettings.recommended_temp_threshold && (
                  <p style={{ fontSize: '0.875rem', color: '#81c784', marginTop: '0.5rem' }}>
                    💡 IA recommande: {autoSettings.recommended_temp_threshold}°C
                  </p>
                )}
                <p style={{ fontSize: '0.875rem', color: '#66bb6a', marginTop: '0.5rem' }}>
                  L'irrigation se déclenchera si la température dépasse ce seuil
                </p>
              </div>

              <div className="form-group">
                <label>Seuil d'Humidité (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={autoSettings.humidity_threshold}
                  onChange={(e) => setAutoSettings({ ...autoSettings, humidity_threshold: parseFloat(e.target.value) })}
                  data-testid="humidity-threshold-input"
                />
                {autoSettings.recommended_humidity_threshold && (
                  <p style={{ fontSize: '0.875rem', color: '#81c784', marginTop: '0.5rem' }}>
                    💡 IA recommande: {autoSettings.recommended_humidity_threshold}%
                  </p>
                )}
                <p style={{ fontSize: '0.875rem', color: '#66bb6a', marginTop: '0.5rem' }}>
                  L'irrigation se déclenchera si l'humidité descend sous ce seuil
                </p>
              </div>

              <div style={{ background: 'rgba(66, 165, 245, 0.05)', padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#0288d1', margin: 0 }}>
                  <strong>Note:</strong> L'IA analysera vos plantes (type, état, croissance) et recommandera automatiquement la quantité d'eau optimale pour chaque zone lors du déclenchement.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={handleSaveAutoSettings} data-testid="save-auto-settings">
                  Sauvegarder
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAutoSettings(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div style={modalStyles.overlay} onClick={() => setShowModal(false)}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={modalStyles.title}>Ajouter un Horaire d'Irrigation</h2>
              <form onSubmit={handleAddSchedule}>
                <div className="form-group">
                  <label>Zone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newSchedule.zone_name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, zone_name: e.target.value })}
                    required
                    data-testid="zone-input"
                  />
                </div>
                <div className="form-group">
                  <label>Heure de début</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    required
                    data-testid="time-input"
                  />
                </div>
                <div className="form-group">
                  <label>Durée (minutes)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newSchedule.duration_minutes}
                    onChange={(e) => setNewSchedule({ ...newSchedule, duration_minutes: e.target.value })}
                    required
                    data-testid="duration-input"
                  />
                </div>
                <div className="form-group">
                  <label>Quantité d'eau (litres)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={newSchedule.water_amount_liters}
                    onChange={(e) => setNewSchedule({ ...newSchedule, water_amount_liters: e.target.value })}
                    required
                    data-testid="water-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" data-testid="submit-schedule-button">Ajouter</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1b5e20',
    marginBottom: '1.5rem',
  },
};

export default Irrigation;
