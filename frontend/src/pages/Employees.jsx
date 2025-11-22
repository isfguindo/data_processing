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
      const response = await axios.post(`${API}/employees/ai-insights`, { language });
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
          <h1>Gestion du Personnel</h1>
          <p>Suivi des employés et de leurs performances</p>
        </div>

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
