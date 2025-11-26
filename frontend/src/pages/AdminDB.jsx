import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../contexts/LanguageContext';

const AdminDB = ({ onLogout }) => {
  const { language } = useLanguage();
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/admin/db/collections`);
      setCollections(response.data);
    } catch (err) {
      setError(language === 'fr' ? "Accès réservé aux administrateurs ou erreur serveur" : 'Access restricted to admins or server error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionDocs = async (name) => {
    setSelectedCollection(name);
    setDocuments([]);
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/admin/db/collection/${name}`, {
        params: { limit: 50 },
      });
      setDocuments(response.data || []);
    } catch (err) {
      setError(language === 'fr' ? "Erreur lors du chargement de la collection" : 'Error loading collection');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (collectionName, id) => {
    if (!window.confirm(language === 'fr' ? 'Confirmer la suppression de ce document ?' : 'Confirm deletion of this document?')) return;
    try {
      await axios.delete(`${API}/admin/db/collection/${collectionName}/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(language === 'fr' ? "Erreur lors de la suppression" : 'Error during deletion');
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>{language === 'fr' ? 'Administration Base de Données' : 'Database Administration'}</h1>
          <p>{language === 'fr' ? "Inspecter et nettoyer certaines collections (réservé aux administrateurs)" : 'Inspect and clean selected collections (admin only)'}</p>
        </div>

        {!isAdmin ? (
          <div className="content-card">
            <p style={{ color: '#e53935' }}>
              {language === 'fr'
                ? "Accès refusé : cette section est réservée aux administrateurs."
                : 'Access denied: this section is restricted to administrators.'}
            </p>
          </div>
        ) : (
          <div className="content-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
            <div className="content-card">
              <h2>{language === 'fr' ? 'Collections' : 'Collections'}</h2>
              {loading && <p>{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>}
              {error && <p style={{ color: '#e53935' }}>{error}</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {collections.map((col) => (
                  <li
                    key={col.name}
                    style={{
                      padding: '0.5rem 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                    onClick={() => fetchCollectionDocs(col.name)}
                  >
                    <strong>{col.name}</strong> ({col.count}){' '}
                    {!col.deletable && (
                      <span style={{ fontSize: '0.75rem', color: '#81c784' }}>
                        {language === 'fr' ? 'lecture seule' : 'read-only'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="content-card">
              <h2>
                {language === 'fr' ? 'Documents' : 'Documents'}{' '}
                {selectedCollection && `- ${selectedCollection}`}
              </h2>
              {loading && <p>{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>}
              {error && <p style={{ color: '#e53935' }}>{error}</p>}
              {!loading && documents.length === 0 && (
                <p style={{ fontSize: '0.9rem', color: '#9e9e9e' }}>
                  {language === 'fr' ? 'Aucun document à afficher.' : 'No documents to display.'}
                </p>
              )}
              {!loading && documents.length > 0 && (
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        {Object.keys(documents[0]).map((key) => (
                          <th key={key} style={{ textTransform: 'none' }}>{key}</th>
                        ))}
                        <th>{language === 'fr' ? 'Actions' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc, idx) => (
                        <tr key={idx}>
                          {Object.keys(doc).map((key) => (
                            <td key={key}>{String(doc[key])}</td>
                          ))}
                          <td>
                            {collections.find((c) => c.name === selectedCollection)?.deletable && doc.id && (
                              <button
                                className="btn btn-danger"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                onClick={() => handleDeleteDoc(selectedCollection, doc.id)}
                              >
                                {language === 'fr' ? 'Supprimer' : 'Delete'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDB;
