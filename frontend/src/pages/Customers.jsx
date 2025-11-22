import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../locales';

const Customers = ({ onLogout }) => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [customers, setCustomers] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [aiTasksPreview, setAiTasksPreview] = useState([]);
  const [showAiTasksModal, setShowAiTasksModal] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    customer_type: 'retailer',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAI = async () => {
    setAiLoading(true);
    try {
      const customer_types = filterType === 'all' ? null : [filterType];
      let since_days = null;
      if (filterPeriod === '30d') since_days = 30;
      else if (filterPeriod === '90d') since_days = 90;
      else if (filterPeriod === '365d') since_days = 365;

      const payload = {
        language,
        customer_types,
        since_days,
      };

      const response = await axios.post(`${API}/customers/ai-insights`, payload);
      setAiAnalysis(response.data);
      toast.success(language === 'fr' ? 'Insights IA clients générés' : 'AI customer insights generated');
    } catch (error) {
      toast.error(language === 'fr' ? "Erreur lors de l'analyse IA clients" : 'Error during customer AI insights');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/customers`, newCustomer);
      toast.success('Client ajouté !');
      setShowModal(false);
      setNewCustomer({ name: '', email: '', phone: '', address: '', customer_type: 'retailer' });
      fetchCustomers();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du client');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await axios.delete(`${API}/customers/${id}`);
      toast.success('Client supprimé !');
      fetchCustomers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handlePreviewTasksFromAI = async () => {
    if (!aiAnalysis || !aiAnalysis.analysis) {
      toast.error(language === 'fr' ? "Aucune recommandation IA disponible" : 'No AI recommendations available');
      return;
    }
    try {
      const payload = {
        language,
        source: 'customers',
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
            {aiAnalysis.analysis && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={handlePreviewTasksFromAI}
                  style={{ fontSize: '0.875rem' }}
                >
                  {language === 'fr' ? 'Créer des tâches IA' : 'Create AI Tasks'}
                </button>
              </div>
            )}



    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>{language === 'fr' ? 'Gestion des Clients (CRM)' : 'Customer Management (CRM)'}</h1>
          <p>{language === 'fr' ? 'Suivi et gestion de la relation clientèle' : 'Tracking and managing customer relationships'}</p>
        </div>

        {/* Filtres IA Clients */}
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
        }}>
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.85rem' }}>{language === 'fr' ? 'Type de client' : 'Customer type'}</label>
            <select
              className="form-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Tous les types' : 'All types'}</option>
              <option value="retailer">{language === 'fr' ? 'Détaillant' : 'Retailer'}</option>
              <option value="distributor">{language === 'fr' ? 'Distributeur' : 'Distributor'}</option>
              <option value="direct_consumer">{language === 'fr' ? 'Consommateur Direct' : 'Direct consumer'}</option>
            </select>
          </div>

          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.85rem' }}>{language === 'fr' ? 'Période' : 'Period'}</label>
            <select
              className="form-input"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Toutes les périodes' : 'All periods'}</option>
              <option value="30d">{language === 'fr' ? '30 derniers jours' : 'Last 30 days'}</option>
              <option value="90d">{language === 'fr' ? '90 derniers jours' : 'Last 90 days'}</option>
              <option value="365d">{language === 'fr' ? '12 derniers mois' : 'Last 12 months'}</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} data-testid="add-customer-button">
            <Plus size={20} />
            {language === 'fr' ? 'Ajouter un Client' : 'Add Customer'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={fetchCustomersAI}
            disabled={aiLoading}
            data-testid="customers-ai-button"
          >
            {aiLoading
              ? (language === 'fr' ? 'Analyse IA en cours...' : 'AI analysis in progress...')
              : (language === 'fr' ? 'Insights IA clients' : 'AI Customer Insights')}
          </button>
        </div>

        {aiAnalysis && (
          <div className="content-card" style={{ marginBottom: '2rem' }} data-testid="customers-ai-panel">
            <h2>{language === 'fr' ? 'Analyse IA du portefeuille clients' : 'AI Customer Portfolio Analysis'}</h2>
            {aiAnalysis.summary && (
              <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', color: '#81c784' }}>
                {aiAnalysis.summary}
              </p>
            )}
            {aiAnalysis.analysis && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(227, 242, 253, 0.9)',
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
          <h2>Liste des Clients</h2>
          {loading ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : customers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucun client enregistré</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Type</th>
                    <th>Achats Totaux</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} data-testid={`customer-row-${customer.id}`}>
                      <td>{customer.name}</td>
                      <td>{customer.email || 'N/A'}</td>
                      <td>{customer.phone}</td>
                      <td>{getCustomerTypeLabel(customer.customer_type)}</td>
                      <td data-testid={`customer-purchases-${customer.id}`}>${customer.total_purchases.toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(customer.id)}
                          data-testid={`delete-customer-${customer.id}`}
        {showAiTasksModal && (
          <div style={modalStyles.overlay} onClick={() => setShowAiTasksModal(false)}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={modalStyles.title}>
                {language === 'fr' ? 'Tâches IA proposées (Clients)' : 'AI Tasks from Customer Insights'}
              </h2>

              {aiTasksPreview.length === 0 ? (
                <p>{language === 'fr' ? 'Aucune tâche proposée.' : 'No tasks proposed.'}</p>
              ) : (
                <div>
                  <p style={{ marginBottom: '1rem', color: '#666' }}>
                    {language === 'fr'
                      ? `${aiTasksPreview.length} tâche(s) seront créées :`
                      : `${aiTasksPreview.length} task(s) will be created:`}
                  </p>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {aiTasksPreview.map((task, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{task.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{task.description}</p>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                          <span>Priorité: {task.priority}</span>
                          {task.due_date && (
                            <span>
                              {' '}
                              • Échéance: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAiTasksModal(false)}
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                {aiTasksPreview.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmAITasks}
                    disabled={creatingTasks}
                  >
                    {creatingTasks
                      ? language === 'fr'
                        ? 'Création...'
                        : 'Creating...'
                      : language === 'fr'
                      ? 'Créer les tâches'
                      : 'Create tasks'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

                          style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
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
              <h2 style={modalStyles.title}>Ajouter un Client</h2>
              <form onSubmit={handleAddCustomer}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    required
                    data-testid="name-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    data-testid="email-input"
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                    data-testid="phone-input"
                  />
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <textarea
                    className="form-input"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    rows="3"
                    data-testid="address-input"
                  />
                </div>
                <div className="form-group">
                  <label>Type de Client</label>
                  <select
                    className="form-input"
                    value={newCustomer.customer_type}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customer_type: e.target.value })}
                    data-testid="type-select"
                  >
                    <option value="retailer">Détaillant</option>
                    <option value="distributor">Distributeur</option>
                    <option value="direct_consumer">Consommateur Direct</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" data-testid="submit-customer-button">Ajouter</button>
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

const getCustomerTypeLabel = (type) => {
  const labels = {
    retailer: 'Détaillant',
    distributor: 'Distributeur',
    direct_consumer: 'Consommateur Direct',
  };
  return labels[type] || type;
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

export default Customers;
