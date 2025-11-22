import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Sprout, Plus, Upload, Camera, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../locales';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const Plants = ({ onLogout }) => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiagnoseModal, setShowDiagnoseModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTasksPreview, setAiTasksPreview] = useState([]);
  const [showAiTasksModal, setShowAiTasksModal] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [newPlant, setNewPlant] = useState({
    name: '',
    plant_type: '',
    location: '',
    planting_date: '',
    status: 'healthy',
  });

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const response = await axios.get(`${API}/plants`);
      setPlants(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des plantes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantsAI = async () => {
    setAiLoading(true);
    try {
      // Construire les filtres pour le backend
      const plantTypes = filterType === 'all' ? null : [filterType];
      const statusesMap = {
        all: null,
        healthy: ['healthy'],
        sick: ['sick'],
        treated: ['treated'],
      };
      const statuses = statusesMap[filterStatus] || null;

      let from_date = null;
      let to_date = null;
      if (filterPeriod !== 'all') {
        const now = new Date();
        const days = filterPeriod === '30d' ? 30 : filterPeriod === '90d' ? 90 : 0;
        if (days > 0) {
          const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          from_date = from.toISOString().slice(0, 10);
        }
      }

      const payload = {
        language,
        plant_types: plantTypes,
        statuses,
        from_date,
        to_date,
      };

      const response = await axios.post(`${API}/plants/ai-recommendations`, payload);
      setAiAnalysis(response.data);
      toast.success(language === 'fr' ? 'Analyse IA des cultures générée' : 'AI crop analysis generated');
    } catch (error) {
      toast.error(language === 'fr' ? "Erreur lors de l'analyse IA des cultures" : 'Error during crop AI analysis');
    } finally {
  const handlePreviewTasksFromAI = async () => {
    if (!aiAnalysis || !aiAnalysis.analysis) {
      toast.error(language === 'fr' ? "Aucune recommandation IA disponible" : 'No AI recommendations available');
      return;
    }
    try {
      const payload = {
        language,
        source: 'plants',
        ai_text: aiAnalysis.analysis,
      };
      const response = await axios.post(`${API}/tasks/from-ai/preview`, payload);
      setAiTasksPreview(response.data || []);
      if ((response.data || []).length === 0) {
        toast.error(language === 'fr' ? "Aucune tâche proposée par l'IA" : 'No tasks suggested by AI');
        return;
      }
      setShowAiTasksModal(true);
    } catch (error) {
      toast.error(language === 'fr' ? "Erreur lors de la génération des tâches IA" : 'Error while generating AI tasks');
    }
  };

  const handleConfirmAITasks = async () => {
    if (!aiTasksPreview || aiTasksPreview.length === 0) {
      setShowAiTasksModal(false);
      return;
    }
    setCreatingTasks(true);
    try {
      const response = await axios.post(`${API}/tasks/from-ai/confirm`, aiTasksPreview);
      const created = response.data || [];
      toast.success(
        language === 'fr'
          ? `${created.length} tâche(s) IA créée(s).`
          : `${created.length} AI task(s) created.`,
      );
      setShowAiTasksModal(false);
      setAiTasksPreview([]);
    } catch (error) {
      toast.error(language === 'fr' ? "Erreur lors de la création des tâches IA" : 'Error while creating AI tasks');
    } finally {
      setCreatingTasks(false);
    }
  };


      setAiLoading(false);
    }
  };

  const handleAddPlant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/plants`, newPlant);
      toast.success('Plante ajoutée avec succès !');
      setShowAddModal(false);
      setNewPlant({ name: '', plant_type: '', location: '', planting_date: '', status: 'healthy' });
      fetchPlants();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la plante');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionner l'image (max 800px de largeur)
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compresser en JPEG qualité 80%
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setDiagnosing(true);
    try {
      // Compresser l'image avant l'envoi
      const compressedBase64 = await compressImage(file);
      
      const response = await axios.post(`${API}/plants/diagnose`, {
        plant_id: selectedPlant.id,
        image_base64: compressedBase64,
        language: language,
      });
      setDiagnosis(response.data);
      toast.success('Diagnostic terminé !');
    } catch (error) {
      toast.error('Erreur lors du diagnostic');
    } finally {
      setDiagnosing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
  });

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1 data-testid="plants-title">{t('plants.title')}</h1>
          <p>{t('plants.subtitle')}</p>
        </div>

        {/* Filtres pour l'analyse IA */}
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
        }}>
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.85rem' }}>{language === 'fr' ? 'Type de plante' : 'Plant type'}</label>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Tous les types' : 'All types'}</option>
              {[...new Set(plants.map((p) => p.plant_type).filter(Boolean))].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.85rem' }}>{language === 'fr' ? 'Statut' : 'Status'}</label>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
              <option value="healthy">{language === 'fr' ? 'Saines' : 'Healthy'}</option>
              <option value="sick">{language === 'fr' ? 'Malades' : 'Sick'}</option>
              <option value="treated">{language === 'fr' ? 'Traitées' : 'Treated'}</option>
            </select>
          </div>

          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.85rem' }}>{language === 'fr' ? 'Période' : 'Period'}</label>
            <select
              className="form-input"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Toutes les dates' : 'All dates'}</option>
              <option value="30d">{language === 'fr' ? '30 derniers jours' : 'Last 30 days'}</option>
              <option value="90d">{language === 'fr' ? '90 derniers jours' : 'Last 90 days'}</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddModal(true)}
            data-testid="add-plant-button"
          >
            <Plus size={20} />
            {t('plants.addPlant')}
          </button>

          <button
            className="btn btn-secondary"
            onClick={fetchPlantsAI}
            disabled={aiLoading}
            data-testid="plants-ai-button"
          >
            {aiLoading
              ? (language === 'fr' ? 'Analyse IA en cours...' : 'AI analysis in progress...')
              : (language === 'fr' ? 'Analyse IA des cultures' : 'AI Crop Analysis')}
          </button>
        </div>

        {aiAnalysis && (
          <div className="content-card" style={{ marginBottom: '2rem' }} data-testid="plants-ai-panel">
            <h2>{language === 'fr' ? 'Analyse IA globale des cultures' : 'Global AI Crop Analysis'}</h2>

            {/* Jauges circulaires pour les indices de risque */}
            {aiAnalysis.indices && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
                {['disease_risk', 'water_stress', 'nutrient_deficiency_risk'].map((key) => {
                  const value = aiAnalysis.indices[key];
                  if (value === undefined || value === null) return null;
                  const labelMap = {
                    disease_risk: language === 'fr' ? 'Risque maladie' : 'Disease risk',
                    water_stress: language === 'fr' ? 'Stress hydrique' : 'Water stress',
                    nutrient_deficiency_risk: language === 'fr' ? 'Risque carence' : 'Nutrient risk',
                  };
                  const displayValue = Number(value) || 0;
                  const chartData = [{ name: key, value: displayValue, fill: '#2e7d32' }];
                  return (
                    <div key={key} style={{ width: 140, height: 140, textAlign: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="90%"
                          barSize={10}
                          data={chartData}
                          startAngle={220}
                          endAngle={-40}
                        >
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            dataKey="value"
                            tick={false}
                          />
                          <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={100}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div style={{ marginTop: '-2.2rem', fontWeight: 700, color: '#1b5e20', fontSize: '0.9rem' }}>
                        {displayValue.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#558b2f' }}>
                        {labelMap[key]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {aiAnalysis.summary && (
              <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', color: '#81c784' }}>
                <strong>{language === 'fr' ? 'Résumé des cultures :' : 'Crop summary:'}</strong>{'\n'}
                {aiAnalysis.summary}
              </p>
            )}
            {aiAnalysis.analysis && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(232, 245, 233, 0.9)',
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {aiAnalysis.analysis}
              </div>
            )}
          </div>
        )}

        <div className="content-card">
          <h2>Liste des Plantes</h2>
          {loading ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : plants.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucune plante enregistrée</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Localisation</th>
                    <th>Date de Plantation</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plants.map((plant) => (
                    <tr key={plant.id} data-testid={`plant-row-${plant.id}`}>
                      <td>{plant.name}</td>
                      <td>{plant.plant_type}</td>
                      <td>{plant.location}</td>
                      <td>{plant.planting_date}</td>
                      <td>
                        <span className={`badge ${plant.status === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
                          {plant.status === 'healthy' ? 'Saine' : plant.status === 'sick' ? 'Malade' : 'Traitée'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setSelectedPlant(plant);
                            setShowDiagnoseModal(true);
                            setDiagnosis(null);
                          }}
                          data-testid={`diagnose-button-${plant.id}`}
                          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        >
                          <Camera size={16} />
                          Diagnostiquer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Plant Modal */}
        {showAddModal && (
          <div style={modalStyles.overlay} onClick={() => setShowAddModal(false)}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={modalStyles.title}>Ajouter une Plante</h2>
              <form onSubmit={handleAddPlant}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPlant.name}
                    onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                    required
                    data-testid="plant-name-input"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPlant.plant_type}
                    onChange={(e) => setNewPlant({ ...newPlant, plant_type: e.target.value })}
                    required
                    data-testid="plant-type-input"
                  />
                </div>
                <div className="form-group">
                  <label>Localisation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPlant.location}
                    onChange={(e) => setNewPlant({ ...newPlant, location: e.target.value })}
                    required
                    data-testid="plant-location-input"
                  />
                </div>
                <div className="form-group">
                  <label>Date de Plantation</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPlant.planting_date}
                    onChange={(e) => setNewPlant({ ...newPlant, planting_date: e.target.value })}
                    required
                    data-testid="plant-date-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" data-testid="submit-plant-button">
                    Ajouter
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Diagnose Modal */}
        {showDiagnoseModal && (
          <div style={modalStyles.overlay} onClick={() => setShowDiagnoseModal(false)}>
            <div style={{...modalStyles.modal, maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
              <h2 style={modalStyles.title}>Diagnostic IA - {selectedPlant?.name}</h2>
              {!diagnosis ? (
                <div>
                  <div {...getRootProps()} style={dropzoneStyles.container}>
                    <input {...getInputProps()} data-testid="image-upload-input" />
                    {diagnosing ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                        <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#2e7d32', marginBottom: '0.5rem' }}>
                          Analyse IA en cours...
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#66bb6a' }}>
                          L'IA analyse l'image de votre plante. Cela peut prendre 10-30 secondes.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload size={48} color="#66bb6a" style={{ marginBottom: '1rem' }} />
                        <p>{isDragActive ? 'Déposez l\'image ici' : 'Glissez une image ou cliquez pour sélectionner'}</p>
                        <p style={{ fontSize: '0.875rem', color: '#81c784', marginTop: '0.5rem' }}>
                          Formats acceptés: JPG, PNG, WEBP
                        </p>
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowDiagnoseModal(false)}
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'rgba(46, 125, 50, 0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#1b5e20' }}>Résultat du Diagnostic</h3>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#2e7d32' }} data-testid="diagnosis-result">
                      {diagnosis.diagnosis}
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      setShowDiagnoseModal(false);
                      setDiagnosis(null);
                    }}
                    style={{ width: '100%' }}
                    data-testid="close-diagnosis-button"
                  >
                    Fermer
                  </button>
                </div>
              )}
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

const dropzoneStyles = {
  container: {
    border: '2px dashed rgba(46, 125, 50, 0.3)',
    borderRadius: '12px',
    padding: '3rem 2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'rgba(46, 125, 50, 0.02)',
  },
};

export default Plants;
