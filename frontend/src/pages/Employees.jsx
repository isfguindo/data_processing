import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Sidebar from '../components/Sidebar';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

const Employees = ({ onLogout }) => {
  const { language } = useLanguage();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('30d');
  const [aiTasksPreview, setAiTasksPreview] = useState([]);
  const [showAiTasksModal, setShowAiTasksModal] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du personnel');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesAI = async () => {
    setAiLoading(true);
    try {
      const roles = filterRole === 'all' ? null : [filterRole];
      let since_days = null;
      if (filterPeriod === '7d') since_days = 7;
      else if (filterPeriod === '30d') since_days = 30;
      else if (filterPeriod === '90d') since_days = 90;

      const payload = {
        language,
        roles,
        since_days,
      };

      const response = await axios.post(`${API}/employees/ai-insights`, payload);
      setAiAnalysis(response.data);
      toast.success(language === 'fr' ? 'Analyse IA du personnel générée' : 'AI staff analysis generated');
    } catch (error) {
      toast.error(language === 'fr' ? "Erreur lors de l'analyse IA du personnel" : 'Error during staff AI analysis');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <div className="page-header">
          <h1>{language === 'fr' ? 'Gestion du Personnel' : 'Staff Management'}</h1>
          <p>{language === 'fr' ? 'Suivi des employés et de leurs performances' : 'Tracking employees and their performance'}</p>
        </div>

        {/* Filtres IA Personnel */}
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
        }}>
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.85rem' }}>{language === 'fr' ? 'Rôle' : 'Role'}</label>
            <select
              className="form-input"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Tous les rôles' : 'All roles'}</option>
              <option value="admin">Admin</option>
              <option value="manager">{language === 'fr' ? 'Gestionnaire' : 'Manager'}</option>
              <option value="employee">{language === 'fr' ? 'Employé' : 'Employee'}</option>
            </select>
          </div>

          <div className="form-group" style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '0.85rem' }}>{language === 'fr' ? 'Période des tâches' : 'Task period'}</label>
            <select
              className="form-input"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            >
              <option value="7d">{language === 'fr' ? '7 derniers jours' : 'Last 7 days'}</option>
              <option value="30d">{language === 'fr' ? '30 derniers jours' : 'Last 30 days'}</option>
              <option value="90d">{language === 'fr' ? '90 derniers jours' : 'Last 90 days'}</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchEmployeesAI}
            disabled={aiLoading}
            data-testid="employees-ai-button"
          >
            {aiLoading
              ? (language === 'fr' ? 'Analyse IA en cours...' : 'AI analysis in progress...')
              : (language === 'fr' ? 'Analyse IA du personnel' : 'AI Staff Analysis')}
          </button>
        </div>

        {aiAnalysis && (
          <div className="content-card" style={{ marginBottom: '2rem' }} data-testid="employees-ai-panel">
            <h2>{language === 'fr' ? 'Analyse IA de la charge de travail' : 'AI Workload Analysis'}</h2>
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
          <h2>Liste du Personnel</h2>
          {loading ? (
            <div className="loading-screen"><div className="spinner"></div></div>
          ) : employees.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#66bb6a', padding: '2rem' }}>Aucun employé enregistré</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Tâches Terminées</th>
                    <th>Score de Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} data-testid={`employee-row-${employee.id}`}>
                      <td>{employee.full_name}</td>
                      <td>{employee.email}</td>
                      <td>
                        <span className={`badge ${
                          employee.role === 'admin' ? 'badge-danger' :
                          employee.role === 'manager' ? 'badge-info' :
                          'badge-success'
                        }`}>
                          {employee.role === 'admin' ? 'Admin' : employee.role === 'manager' ? 'Gestionnaire' : 'Employé'}
                        </span>
                      </td>
                      <td data-testid={`tasks-completed-${employee.id}`}>{employee.tasks_completed || 0}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Star size={16} fill="#f57f17" color="#f57f17" />
                          <span data-testid={`performance-score-${employee.id}`}>{employee.performance_score || '0.0'} / 5.0</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employees;
