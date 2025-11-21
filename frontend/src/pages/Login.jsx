import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Sprout, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? `${API}/auth/register` : `${API}/auth/login`;
      const payload = isRegister
        ? formData
        : { email: formData.email, password: formData.password };

      const response = await axios.post(endpoint, payload);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success(isRegister ? 'Compte créé avec succès !' : 'Connexion réussie !');
      onLogin();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoContainer}>
            <Sprout size={48} color="#2e7d32" />
          </div>
          <h1 style={styles.title}>AgroFarm</h1>
          <p style={styles.subtitle}>Gestion Intelligente de Ferme Agro-Pastorale</p>
          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <p>Monitoring IoT en temps réel</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <p>Diagnostic IA des plantes</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <p>Gestion automatique de l'irrigation</p>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <p>Analytics et rapports avancés</p>
            </div>
          </div>
        </div>
      </div>
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle} data-testid="login-title">
            {isRegister ? 'Créer un compte' : 'Connexion'}
          </h2>
          <p style={styles.formSubtitle}>
            {isRegister
              ? 'Rejoignez AgroFarm pour optimiser votre ferme'
              : 'Bienvenue ! Connectez-vous à votre compte'}
          </p>
          <form onSubmit={handleSubmit} style={styles.form}>
            {isRegister && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom complet</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  data-testid="fullname-input"
                  placeholder="Entrez votre nom complet"
                />
              </div>
            )}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <Mail size={20} style={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{...styles.input, paddingLeft: '2.75rem'}}
                  data-testid="email-input"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrapper}>
                <Lock size={20} style={styles.inputIcon} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{...styles.input, paddingLeft: '2.75rem'}}
                  data-testid="password-input"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {isRegister && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Rôle</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={styles.input}
                  data-testid="role-select"
                >
                  <option value="employee">Employé</option>
                  <option value="manager">Gestionnaire</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
              data-testid="submit-button"
            >
              {loading ? 'Chargement...' : isRegister ? 'Créer le compte' : 'Se connecter'}
            </button>
          </form>
          <p style={styles.toggleText}>
            {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <span
              onClick={() => setIsRegister(!isRegister)}
              style={styles.toggleLink}
              data-testid="toggle-auth-mode"
            >
              {isRegister ? 'Se connecter' : 'Créer un compte'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
  },
  leftContent: {
    maxWidth: '500px',
  },
  logoContainer: {
    width: '80px',
    height: '80px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2rem',
    boxShadow: '0 10px 40px rgba(46, 125, 50, 0.2)',
  },
  title: {
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '3.5rem',
    fontWeight: 700,
    color: '#1b5e20',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#2e7d32',
    marginBottom: '3rem',
    fontWeight: 500,
    lineHeight: 1.6,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: '1.125rem',
    boxShadow: '0 4px 15px rgba(46, 125, 50, 0.15)',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
  },
  formContainer: {
    width: '100%',
    maxWidth: '450px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(46, 125, 50, 0.15)',
    border: '1px solid rgba(46, 125, 50, 0.1)',
  },
  formTitle: {
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1b5e20',
    marginBottom: '0.5rem',
  },
  formSubtitle: {
    fontSize: '1rem',
    color: '#66bb6a',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#1b5e20',
    marginBottom: '0.5rem',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#66bb6a',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid rgba(46, 125, 50, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#1b5e20',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    background: '#2e7d32',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
    marginTop: '1rem',
  },
  toggleText: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#66bb6a',
    fontSize: '0.9375rem',
  },
  toggleLink: {
    color: '#2e7d32',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default Login;
