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
      const response = await axios.post(`${API}/customers/ai-insights`, { language });
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

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>{language === 'fr' ? 'Gestion des Clients (CRM)' : 'Customer Management (CRM)'}</h1>
          <p>{language === 'fr' ? 'Suivi et gestion de la relation clientèle' : 'Tracking and managing customer relationships'}</p>
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
