import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const Sales = ({ onLogout }) => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [newSale, setNewSale] = useState({
    product_name: '',
    quantity: '',
    unit: '',
    price_per_unit: '',
    customer_id: '',
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get(`${API}/sales`);
      setSales(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des ventes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients');
    }
  };

  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      const quantity = parseFloat(newSale.quantity);
      const pricePerUnit = parseFloat(newSale.price_per_unit);
      await axios.post(`${API}/sales`, {
        ...newSale,
        quantity,
        price_per_unit: pricePerUnit,
        total_amount: quantity * pricePerUnit,
      });
      toast.success('Vente enregistrée !');
      setShowModal(false);
      setNewSale({ product_name: '', quantity: '', unit: '', price_per_unit: '', customer_id: '' });
      fetchSales();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la vente');
    }
  };

  const getForecast = async () => {
    setLoadingForecast(true);
    try {
      const response = await axios.get(`${API}/sales/forecast`);
      setForecast(response.data.forecast);
      toast.success('Prévision générée !');
    } catch (error) {
      toast.error('Erreur lors de la génération de la prévision');
    } finally {
      setLoadingForecast(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>Gestion des Ventes</h1>
          <p>Historique et prévisions des ventes</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} data-testid="add-sale-button">
            <Plus size={20} />
            Nouvelle Vente
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={getForecast} 
            disabled={loadingForecast}
            data-testid="forecast-button"
          >
            <TrendingUp size={20} />
            {loadingForecast ? 'Chargement...' : 'Prévision IA'}
          </button>
        </div>

        {forecast && (
          <div className="content-card" style={{ background: 'rgba(66, 165, 245, 0.05)', borderLeft: '4px solid #42a5f5', marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0288d1', marginBottom: '1rem' }}>
              <TrendingUp size={24} />
              Prévisions des Ventes
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#2e7d32' }} data-testid="forecast-result">
              {forecast}
            </p>
          </div>
        )}

        <div className="content-card">
          <h2>Historique des Ventes</h2>
          {loading ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : sales.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucune vente enregistrée</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th>Montant Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} data-testid={`sale-row-${sale.id}`}>
                      <td>{sale.product_name}</td>
                      <td>{sale.quantity} {sale.unit}</td>
                      <td>${sale.price_per_unit}</td>
                      <td data-testid={`sale-total-${sale.id}`}>${sale.total_amount.toFixed(2)}</td>
                      <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
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
              <h2 style={modalStyles.title}>Nouvelle Vente</h2>
              <form onSubmit={handleAddSale}>
                <div className="form-group">
                  <label>Produit</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newSale.product_name}
                    onChange={(e) => setNewSale({ ...newSale, product_name: e.target.value })}
                    required
                    data-testid="product-input"
                  />
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newSale.quantity}
                    onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })}
                    required
                    data-testid="quantity-input"
                  />
                </div>
                <div className="form-group">
                  <label>Unité</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newSale.unit}
                    onChange={(e) => setNewSale({ ...newSale, unit: e.target.value })}
                    required
                    data-testid="unit-input"
                  />
                </div>
                <div className="form-group">
                  <label>Prix Unitaire ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newSale.price_per_unit}
                    onChange={(e) => setNewSale({ ...newSale, price_per_unit: e.target.value })}
                    required
                    data-testid="price-input"
                  />
                </div>
                <div className="form-group">
                  <label>Client</label>
                  <select
                    className="form-input"
                    value={newSale.customer_id}
                    onChange={(e) => setNewSale({ ...newSale, customer_id: e.target.value })}
                    required
                    data-testid="customer-select"
                  >
                    <option value="">Sélectionnez un client</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" data-testid="submit-sale-button">Enregistrer</button>
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

export default Sales;
