import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../locales';

const Stock = ({ onLogout }) => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTasksPreview, setAiTasksPreview] = useState([]);
  const [showAiTasksModal, setShowAiTasksModal] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
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

  const fetchStockAI = async () => {
    setAiLoading(true);
    try {
      const response = await axios.post(`${API}/stock/ai-alerts`, { language });
      setAiAnalysis(response.data);
      if (response.data.critical_items?.length || response.data.warning_items?.length) {
        toast.success(language === 'fr' ? 'Analyse IA du stock générée' : 'AI stock analysis generated');
      } else {
        toast.success(language === 'fr' ? 'Stock sous contrôle' : 'Stock levels are under control');
      }
    } catch (error) {
      toast.error(language === 'fr' ? "Erreur lors de l'analyse IA du stock" : 'Error during AI stock analysis');
    } finally {
      setAiLoading(false);
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
      setNewItem({ item_name: '', category: 'seeds', quantity: '', unit: '', min_threshold: '', price_per_unit: '', currency: 'USD' });
      fetchStock();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/stock/${editingItemId}`, {
        item_name: newItem.item_name,
        category: newItem.category,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        min_threshold: parseFloat(newItem.min_threshold),
        price_per_unit: parseFloat(newItem.price_per_unit),
        currency: newItem.currency,
      });
      toast.success('Article modifié avec succès !');
      setShowModal(false);
      setIsEditing(false);
      setEditingItemId(null);
      setNewItem({ item_name: '', category: 'seeds', quantity: '', unit: '', min_threshold: '', price_per_unit: '', currency: 'USD' });
      fetchStock();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setEditingItemId(item.id);
    setNewItem({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      min_threshold: item.min_threshold.toString(),
      price_per_unit: item.price_per_unit.toString(),
      currency: item.currency || 'USD',
    });
    setShowModal(true);
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
          <h1>{t('stock.title')}</h1>
          <p>{t('stock.subtitle')}</p>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} data-testid="add-stock-button">
            <Plus size={20} />
            {t('stock.addItem')}
          </button>

          <button
            className="btn btn-secondary"
            onClick={fetchStockAI}
            disabled={aiLoading}
            data-testid="stock-ai-button"
          >
            {aiLoading ? (language === 'fr' ? "Analyse IA en cours..." : 'AI analysis in progress...') : (language === 'fr' ? 'Analyse IA du stock' : 'AI Stock Analysis')}
          </button>
        </div>

        {aiAnalysis && (
          <div className="content-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #f57f17' }} data-testid="stock-ai-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={22} color="#f57f17" />
              <h2 style={{ margin: 0 }}>{language === 'fr' ? 'Analyse IA & Alertes Stock' : 'AI Analysis & Stock Alerts'}</h2>
            </div>

            {aiAnalysis.critical_items?.length > 0 && (
              <p style={{ color: '#e53935', marginBottom: '0.5rem' }}>
                {language === 'fr'
                  ? `${aiAnalysis.critical_items.length} article(s) sont en dessous du seuil minimum.`
                  : `${aiAnalysis.critical_items.length} item(s) are below minimum threshold.`}
              </p>
            )}
            {aiAnalysis.warning_items?.length > 0 && (
              <p style={{ color: '#fb8c00', marginBottom: '0.5rem' }}>
                {language === 'fr'
                  ? `${aiAnalysis.warning_items.length} article(s) approchent du seuil minimum.`
                  : `${aiAnalysis.warning_items.length} item(s) are close to minimum threshold.`}
              </p>
            )}

            {aiAnalysis.recommendations && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 243, 224, 0.8)',
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {aiAnalysis.recommendations}
              </div>
            )}
          </div>
        )}

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
                      <td data-testid={`stock-quantity-${item.id}`}>{item.quantity.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                      <td>{item.unit}</td>
                      <td>{item.min_threshold.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                      <td>{getCurrencySymbol(item.currency || 'USD')}{item.price_per_unit.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`badge ${item.quantity <= item.min_threshold ? 'badge-danger' : 'badge-success'}`}>
                          {item.quantity <= item.min_threshold ? 'Stock Faible' : 'Disponible'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => openEditModal(item)}
                            data-testid={`edit-stock-${item.id}`}
                            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(item.id)}
                            data-testid={`delete-stock-${item.id}`}
                            style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div style={modalStyles.overlay} onClick={() => {
            setShowModal(false);
            setIsEditing(false);
            setEditingItemId(null);
            setNewItem({ item_name: '', category: 'seeds', quantity: '', unit: '', min_threshold: '', price_per_unit: '', currency: 'USD' });
          }}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={modalStyles.title}>{isEditing ? 'Modifier l\'Article' : 'Ajouter un Article au Stock'}</h2>
              <form onSubmit={isEditing ? handleEditItem : handleAddItem}>
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
                    min="0"
                    className="form-input"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    required
                    data-testid="quantity-input"
                    placeholder="0.00"
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
                    min="0"
                    className="form-input"
                    value={newItem.min_threshold}
                    onChange={(e) => setNewItem({ ...newItem, min_threshold: e.target.value })}
                    required
                    data-testid="threshold-input"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Devise</label>
                  <select
                    className="form-input"
                    value={newItem.currency}
                    onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
                    data-testid="currency-select"
                  >
                    <option value="USD">USD - Dollar Américain ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="XAF">XAF - Franc CFA (FCFA)</option>
                    <option value="GBP">GBP - Livre Sterling (£)</option>
                    <option value="MAD">MAD - Dirham Marocain (DH)</option>
                    <option value="CAD">CAD - Dollar Canadien (C$)</option>
                    <option value="CHF">CHF - Franc Suisse (CHF)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prix Unitaire</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={newItem.price_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, price_per_unit: e.target.value })}
                    required
                    data-testid="price-input"
                    placeholder="0.00"
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" data-testid="submit-stock-button">
                    {isEditing ? 'Modifier' : 'Ajouter'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setEditingItemId(null);
                    setNewItem({ item_name: '', category: 'seeds', quantity: '', unit: '', min_threshold: '', price_per_unit: '', currency: 'USD' });
                  }}>Annuler</button>
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

const getCurrencySymbol = (currency) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    XAF: 'FCFA ',
    GBP: '£',
    MAD: 'DH ',
    CAD: 'C$',
    CHF: 'CHF ',
  };
  return symbols[currency] || currency + ' ';
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
