import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Save, Brain } from 'lucide-react';
import { toast } from 'sonner';

const Settings = ({ onLogout }) => {
  const [settings, setSettings] = useState({
    ai_provider: 'openai',
    ai_model: 'gpt-4o',
    auto_irrigation: true,
    notifications_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success('Paramètres enregistrés !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar onLogout={onLogout} />
        <div className="main-content">
          <div className="loading-screen"><div className="spinner"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>Paramètres</h1>
          <p>Configurez votre système de gestion</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="content-card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain size={24} />
              Configuration de l'IA
            </h2>
            <p style={{ color: '#66bb6a', marginBottom: '2rem' }}>
              Choisissez le fournisseur et le modèle d'IA pour l'analyse des plantes et les recommandations
            </p>

            <div className="form-group">
              <label>Fournisseur d'IA</label>
              <select
                className="form-input"
                value={settings.ai_provider}
                onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value })}
                data-testid="ai-provider-select"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            <div className="form-group">
              <label>Modèle</label>
              <select
                className="form-input"
                value={settings.ai_model}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                data-testid="ai-model-select"
              >
                {settings.ai_provider === 'openai' && (
                  <>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-5">GPT-5</option>
                  </>
                )}
                {settings.ai_provider === 'anthropic' && (
                  <>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4</option>
                  </>
                )}
                {settings.ai_provider === 'gemini' && (
                  <>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ background: 'rgba(66, 165, 245, 0.05)', padding: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#0288d1', margin: 0 }}>
                Note: L'application utilise la clé universelle Emergent pour tous les fournisseurs d'IA.
              </p>
            </div>
          </div>

          <div className="content-card">
            <h2>Automatisation</h2>
            <p style={{ color: '#66bb6a', marginBottom: '2rem' }}>
              Configurez les fonctionnalités automatiques de votre ferme
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.auto_irrigation}
                  onChange={(e) => setSettings({ ...settings, auto_irrigation: e.target.checked })}
                  data-testid="auto-irrigation-checkbox"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#1b5e20' }}>Irrigation Automatique</div>
                  <div style={{ fontSize: '0.875rem', color: '#66bb6a' }}>
                    Active l'irrigation automatique basée sur les capteurs et l'IA
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                  data-testid="notifications-checkbox"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#1b5e20' }}>Notifications</div>
                  <div style={{ fontSize: '0.875rem', color: '#66bb6a' }}>
                    Recevez des alertes pour les événements importants
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} data-testid="save-settings-button">
              <Save size={20} />
              {saving ? 'Sauvegarde...' : 'Enregistrer les Paramètres'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
