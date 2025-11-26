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
  const [stats, setStats] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importFormat, setImportFormat] = useState('json');
  const [importing, setImporting] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API}/admin/db/collections`);
      setCollections(response.data);
    } catch (err) {
      setError(
        language === 'fr'
          ? "Accès réservé aux administrateurs ou erreur serveur"
          : 'Access restricted to admins or server error'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/db/stats`);
      setStats(response.data);
    } catch (err) {
      // stats are optional, no hard error
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchStats();
  }, []);

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
              <div className="content-card" style={{ marginBottom: '1.5rem' }}>
                <h2>{language === 'fr' ? 'Statistiques Globales' : 'Global Statistics'}</h2>
                {stats ? (
                  <ul style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    <li>
                      {language === 'fr' ? 'Nombre de collections :' : 'Total collections:'}{' '}
                      <strong>{stats.total_collections}</strong>
                    </li>
                    <li>
                      {language === 'fr' ? 'Nombre total de documents :' : 'Total documents:'}{' '}
                      <strong>{stats.total_documents}</strong>
                    </li>
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#9e9e9e' }}>
                    {language === 'fr' ? 'Statistiques non disponibles.' : 'Statistics not available.'}
                  </p>
                )}
              </div>

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

              {!loading && selectedCollection && (
                <>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ minWidth: '220px' }}>
                      <label style={{ fontSize: '0.8rem' }}>
                        {language === 'fr' ? 
                          'Importer des données (JSON ou CSV)' : 
                          'Import data (JSON or CSV)'}
                      </label>
                      <input
                        type="file"
                        accept={importFormat === 'json' ? '.json,application/json' : '.csv,text/csv'}
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ minWidth: '140px' }}>
                      <label style={{ fontSize: '0.8rem' }}>{language === 'fr' ? 'Format' : 'Format'}</label>
                      <select
                        className="form-input"
                        value={importFormat}
                        onChange={(e) => setImportFormat(e.target.value)}
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                      </select>
                    </div>
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={!importFile || importing}
                      onClick={async () => {
                        if (!importFile || !selectedCollection) return;
                        setImporting(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', importFile);
                          const response = await axios.post(
                            `${API}/admin/db/collection/${selectedCollection}/import`,
                            formData,
                            {
                              params: { fmt: importFormat },
                              headers: { 'Content-Type': 'multipart/form-data' },
                            },
                          );
                          const count = response.data?.imported_count ?? 0;
                          alert(
                            language === 'fr'
                              ? `${count} document(s) importé(s).`
                              : `${count} document(s) imported.`,
                          );
                          setImportFile(null);
                          fetchCollectionDocs(selectedCollection);
                          fetchCollections();
                        } catch (err) {
                          setError(
                            language === 'fr'
                              ? "Erreur lors de l'import (format ou contenu invalide)"
                              : 'Error during import (invalid format or content)',
                          );
                        } finally {
                          setImporting(false);
                        }
                      }}
                    >
                      {importing
                        ? language === 'fr'
                          ? 'Import en cours...'
                          : 'Importing...'
                        : language === 'fr'
                        ? 'Importer'
                        : 'Import'}
                    </button>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await axios.get(`${API}/admin/db/collection/${selectedCollection}/export`, {
                          params: { fmt: 'json' },
                          responseType: 'blob',
                        });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `${selectedCollection}.json`);
                        document.body.appendChild(link);
                        link.click();
                        link.parentNode.removeChild(link);
                      } catch (err) {
                        setError(language === 'fr' ? "Erreur lors de l'export JSON" : 'Error during JSON export');
                      }
                    }}
                  >
                    {language === 'fr' ? 'Exporter JSON' : 'Export JSON'}
                  </button>

                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await axios.get(`${API}/admin/db/collection/${selectedCollection}/export`, {
                          params: { fmt: 'csv' },
                          responseType: 'blob',
                        });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `${selectedCollection}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.parentNode.removeChild(link);
                      } catch (err) {
                        setError(language === 'fr' ? "Erreur lors de l'export CSV" : 'Error during CSV export');
                      }
                    }}
                  >
                    {language === 'fr' ? 'Exporter CSV' : 'Export CSV'}
                  </button>

                  {collections.find((c) => c.name === selectedCollection)?.deletable && (
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(language === 'fr' ? 'Vider complètement cette collection ?' : 'Clear this entire collection?')) return;
                        try {
                          const response = await axios.post(`${API}/admin/db/collection/${selectedCollection}/clear`);
                          setDocuments([]);
                          fetchCollections();
                        } catch (err) {
                          setError(language === 'fr' ? 'Erreur lors du vidage de la collection' : 'Error clearing collection');
                        }
                      }}
                    >
                      {language === 'fr' ? 'Vider la collection' : 'Clear collection'}
                    </button>
                  )}
                </div>
              )}

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
