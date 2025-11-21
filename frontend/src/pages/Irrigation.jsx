import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Plus, Brain } from 'lucide-react';
import { toast } from 'sonner';

const Irrigation = ({ onLogout }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    zone_name: '',
    start_time: '',
    duration_minutes: '',
    water_amount_liters: '',
    status: 'scheduled',
  });

  useEffect(() => {
    fetchSchedules();
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
