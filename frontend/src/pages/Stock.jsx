import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const Stock = ({ onLogout }) => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: 'seeds',
    quantity: '',
    unit: '',
    min_threshold: '',
    price_per_unit: '',
    currency: 'USD',
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const response = await axios.get(`${API}/stock`);
      setStock(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/stock`, {
        ...newItem,
        quantity: parseFloat(newItem.quantity),
        min_threshold: parseFloat(newItem.min_threshold),
        price_per_unit: parseFloat(newItem.price_per_unit),
      });
      toast.success('Article ajouté au stock !');
      setShowModal(false);
      setNewItem({ item_name: '', category: 'seeds', quantity: '', unit: '', min_threshold: '', price_per_unit: '' });
      fetchStock();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await axios.delete(`${API}/stock/${id}`);
      toast.success('Article supprimé !');
      fetchStock();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>Gestion du Stock</h1>
          <p>Inventaire et suivi des ressources</p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} data-testid="add-stock-button">
            <Plus size={20} />
            Ajouter un Article
          </button>
        </div>

        <div className="content-card">
          <h2>Liste du Stock</h2>
          {loading ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : stock.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucun article en stock</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Catégorie</th>
                    <th>Quantité</th>
                    <th>Unité</th>
                    <th>Seuil Min</th>
                    <th>Prix Unitaire</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item) => (
                    <tr key={item.id} data-testid={`stock-row-${item.id}`}>
                      <td>{item.item_name}</td>
                      <td>{getCategoryLabel(item.category)}</td>
                      <td data-testid={`stock-quantity-${item.id}`}>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td>{item.min_threshold}</td>
                      <td>${item.price_per_unit}</td>
                      <td>
                        <span className={`badge ${item.quantity <= item.min_threshold ? 'badge-danger' : 'badge-success'}`}>
                          {item.quantity <= item.min_threshold ? 'Stock Faible' : 'Disponible'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`delete-stock-${item.id}`}
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
              <h2 style={modalStyles.title}>Ajouter un Article au Stock</h2>
              <form onSubmit={handleAddItem}>
                <div className="form-group">
                  <label>Nom de l'article</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                    required
                    data-testid="item-name-input"
                  />
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    className="form-input"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    data-testid="category-select"
                  >
                    <option value="seeds">Graines</option>
                    <option value="fertilizers">Fertilisants</option>
                    <option value="pesticides">Pesticides</option>
                    <option value="harvested_products">Produits Récoltés</option>
                    <option value="tools">Outils</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantité</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    required
                    data-testid="quantity-input"
                  />
                </div>
                <div className="form-group">
                  <label>Unité</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    required
                    placeholder="kg, L, unités"
                    data-testid="unit-input"
                  />
                </div>
                <div className="form-group">
                  <label>Seuil Minimum</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newItem.min_threshold}
                    onChange={(e) => setNewItem({ ...newItem, min_threshold: e.target.value })}
                    required
                    data-testid="threshold-input"
                  />
                </div>
                <div className="form-group">
                  <label>Prix Unitaire ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newItem.price_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, price_per_unit: e.target.value })}
                    required
                    data-testid="price-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" data-testid="submit-stock-button">Ajouter</button>
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

const getCategoryLabel = (category) => {
  const labels = {
    seeds: 'Graines',
    fertilizers: 'Fertilisants',
    pesticides: 'Pesticides',
    harvested_products: 'Produits Récoltés',
    tools: 'Outils',
  };
  return labels[category] || category;
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

export default Stock;
