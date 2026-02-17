import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Users, Plus, Edit2, Trash2, Key, BookOpen, Award, Download, BarChart3, X, Eye, EyeOff, Settings, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExamSystemSettings from './ExamSystemSettings';
import MathFormula from './MathFormula';

const ExamAdmin = () => {
  const [view, setView] = useState('professors');
  const [professors, setProfessors] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAddProfModal, setShowAddProfModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfExamsModal, setShowProfExamsModal] = useState(null);
  const [showExamDetailsModal, setShowExamDetailsModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profForm, setProfForm] = useState({
    name: '',
    email: '',
    password: '',
    subjects: [],
    levels: [],
    active: true
  });

  const [filters, setFilters] = useState({
    level: '',
    subject: '',
    city: '',
    dateFrom: '',
    dateTo: '',
    passed: 'all'
  });

  const allSubjects = ['MATHS', 'PHYSIQUE', 'SVT', 'PC', 'FRANÇAIS', 'ANGLAIS', 'ARABE', 'PHILOSOPHIE', 'HISTOIRE-GEO', 'ÉCONOMIE'];
  const allLevels = ['TC', '1BAC', '2BAC', 'Universitaire'];
  const adminPassword = 'intellection2026';

  useEffect(() => {
    if (isAuthenticated) {
      loadProfessors();
      loadExams();
      loadResults();
      loadRequests();
    }
  }, [isAuthenticated]);

  const loadRequests = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'professor-requests'));
      const requestsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(requestsData.sort((a, b) => b.requestedAt?.toDate() - a.requestedAt?.toDate()));
    } catch (error) { console.error('Erreur chargement demandes:', error); }
  };

  const handleApproveRequest = async (request) => {
    try {
      const profRef = doc(collection(db, 'exam-professors'));
      await setDoc(profRef, {
        name: request.name, email: request.email, password: request.password,
        phone: request.phone || '', subjects: request.subjects || [],
        levels: request.levels || [], active: true,
        createdAt: new Date(), approvedAt: new Date(), createdBy: 'admin'
      });
      await updateDoc(doc(db, 'professor-requests', request.id), { status: 'approved', approvedAt: new Date() });
      alert(`✅ Compte approuvé pour ${request.name} !`);
      loadProfessors(); loadRequests();
    } catch (error) { alert('❌ Erreur lors de l\'approbation'); }
  };

  const handleRejectRequest = async (request) => {
    if (!confirm(`Refuser la demande de ${request.name} ?`)) return;
    try {
      await updateDoc(doc(db, 'professor-requests', request.id), { status: 'rejected', rejectedAt: new Date() });
      alert(`❌ Demande de ${request.name} refusée`);
      loadRequests();
    } catch (error) { alert('❌ Erreur lors du refus'); }
  };

  const loadProfessors = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'exam-professors'));
      const profs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProfessors(profs);
    } catch (error) {
      console.error('Erreur chargement profs:', error);
    }
  };

  const loadExams = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'exams'));
      const examsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExams(examsData);
    } catch (error) {
      console.error('Erreur chargement examens:', error);
    }
  };

  const loadResults = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'exam-attempts'));
      const attemptsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      }));
      setResults(attemptsData.sort((a, b) => b.submittedAt - a.submittedAt));
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
    }
  };

  const handleLogin = () => {
    if (password === adminPassword) {
      setIsAuthenticated(true);
    } else {
      alert('❌ Mot de passe incorrect');
      setPassword('');
    }
  };

  const handleAddProfessor = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profRef = doc(collection(db, 'exam-professors'));
      const profData = {
        ...profForm,
        createdAt: new Date(),
        createdBy: 'admin'
      };

      await setDoc(profRef, profData);
      
      alert(`✅ Professeur ${profForm.name} créé avec succès !`);
      setProfForm({
        name: '',
        email: '',
        password: '',
        subjects: [],
        levels: [],
        active: true
      });
      setShowAddProfModal(false);
      loadProfessors();
    } catch (error) {
      console.error('Erreur création prof:', error);
      alert('❌ Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfessor = async (profId, updates) => {
    try {
      const profRef = doc(db, 'exam-professors', profId);
      await updateDoc(profRef, updates);
      loadProfessors();
      alert('✅ Professeur mis à jour');
    } catch (error) {
      console.error('Erreur update:', error);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  const handleDeleteProfessor = async (profId, profName) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${profName} ?`)) return;

    try {
      await deleteDoc(doc(db, 'exam-professors', profId));
      loadProfessors();
      alert('✅ Professeur supprimé');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleToggleExam = async (examId, currentStatus) => {
    try {
      const examRef = doc(db, 'exams', examId);
      await updateDoc(examRef, { active: !currentStatus });
      loadExams();
      alert(`✅ Examen ${!currentStatus ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur toggle exam:', error);
    }
  };

  const handleDeleteExam = async (examId, examTitle) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${examTitle}" ?`)) return;

    try {
      await deleteDoc(doc(db, 'exams', examId));
      loadExams();
      alert('✅ Examen supprimé');
    } catch (error) {
      console.error('Erreur suppression exam:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const getProfExams = (profId) => {
    return exams.filter(e => e.createdBy === profId);
  };

  const getExamStats = (examId) => {
    const examResults = results.filter(r => r.examId === examId);
    if (examResults.length === 0) return null;

    const totalAttempts = examResults.length;
    const passed = examResults.filter(r => r.passed).length;
    const avgScore = Math.round(
      examResults.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts
    );

    return {
      totalAttempts,
      passed,
      passRate: Math.round((passed / totalAttempts) * 100),
      avgScore
    };
  };

  const exportToExcel = () => {
    const filteredResults = getFilteredResults();
    
    const data = filteredResults.map(result => ({
      'Date': result.submittedAt?.toLocaleDateString('fr-FR'),
      'Heure': result.submittedAt?.toLocaleTimeString('fr-FR'),
      'Nom Complet': result.studentInfo?.fullName || '-',
      'Téléphone': result.studentInfo?.phone || '-',
      'Tél. Parent': result.studentInfo?.parentPhone || '-',
      'Ville': result.studentInfo?.city || '-',
      'Niveau': result.level || '-',
      'Matière': result.subject || '-',
      'Examen': result.examTitle || '-',
      'Score': `${result.percentage}%`,
      'Points': `${result.score}/${result.totalPoints}`,
      'Réussite': result.passed ? 'OUI' : 'NON',
      'Correctes': result.correctAnswers,
      'Incorrectes': result.wrongAnswers,
      'Durée (min)': Math.floor(result.duration / 60),
      'Étudiant INTELLECTION': result.studentInfo?.isIntellectionStudent ? 'OUI' : 'NON',
      'Veut Offres': result.studentInfo?.wantsOffers ? 'OUI' : 'NON',
      'Email': result.studentInfo?.email || '-',
      'Code QR': result.verificationCode || '-',
      'Vérifié': result.verified ? 'OUI' : 'NON'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
    
    const filename = `Resultats_Tests_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const getFilteredResults = () => {
    return results.filter(result => {
      if (filters.level && result.level !== filters.level) return false;
      if (filters.subject && result.subject !== filters.subject) return false;
      if (filters.city && result.studentInfo?.city !== filters.city) return false;
      if (filters.passed !== 'all') {
        if (filters.passed === 'true' && !result.passed) return false;
        if (filters.passed === 'false' && result.passed) return false;
      }
      if (filters.dateFrom) {
        const resultDate = result.submittedAt;
        const filterDate = new Date(filters.dateFrom);
        if (resultDate < filterDate) return false;
      }
      if (filters.dateTo) {
        const resultDate = result.submittedAt;
        const filterDate = new Date(filters.dateTo);
        filterDate.setHours(23, 59, 59);
        if (resultDate > filterDate) return false;
      }
      return true;
    });
  };

  const stats = {
    totalAttempts: results.length,
    passRate: results.length > 0 ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0,
    averageScore: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0,
    todayAttempts: results.filter(r => {
      const today = new Date().toDateString();
      return r.submittedAt?.toDateString() === today;
    }).length
  };

  // LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-t-4 border-red-600">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Administration</h1>
            <p className="text-gray-600 mt-2">Gestion des Examens INTELLECTION</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mot de passe Admin
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:ring focus:ring-red-200"
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
            >
              Se connecter
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>⚠️ Accès réservé aux administrateurs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Administration Examens</h1>
              <p className="text-red-100 mt-1">INTELLECTION - Gestion Complète</p>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setPassword('');
              }}
              className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded-lg transition-all"
            >
              Déconnexion
            </button>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setView('professors')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                view === 'professors'
                  ? 'bg-white text-red-600'
                  : 'bg-red-700 text-white hover:bg-red-800'
              }`}
            >
              <Users className="w-5 h-5" />
              Professeurs ({professors.length})
            </button>

            <button
              onClick={() => setView('requests')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all relative ${
                view === 'requests'
                  ? 'bg-white text-red-600'
                  : 'bg-red-700 text-white hover:bg-red-800'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Demandes
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setView('exams')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                view === 'exams'
                  ? 'bg-white text-red-600'
                  : 'bg-red-700 text-white hover:bg-red-800'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Examens ({exams.length})
            </button>

            <button
              onClick={() => setView('results')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                view === 'results'
                  ? 'bg-white text-red-600'
                  : 'bg-red-700 text-white hover:bg-red-800'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Résultats ({results.length})
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-red-700 text-white hover:bg-red-800"
            >
              <Settings className="w-5 h-5" />
              Paramètres
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests Aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-800">{stats.todayAttempts}</p>
              </div>
              <Award className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux Réussite</p>
                <p className="text-3xl font-bold text-gray-800">{stats.passRate}%</p>
              </div>
              <Award className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score Moyen</p>
                <p className="text-3xl font-bold text-gray-800">{stats.averageScore}%</p>
              </div>
              <Award className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalAttempts}</p>
              </div>
              <Award className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* VUE PROFESSEURS */}
        {/* VUE DEMANDES */}
        {view === 'requests' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Demandes de Compte Professeur
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-3 bg-yellow-400 text-yellow-900 text-sm px-3 py-1 rounded-full font-medium">
                  {requests.filter(r => r.status === 'pending').length} en attente
                </span>
              )}
            </h2>

            {requests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune demande</h3>
                <p className="text-gray-600">Les professeurs peuvent créer un compte depuis la page connexion</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {requests.map(req => (
                  <div key={req.id} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                    req.status === 'pending' ? 'border-yellow-400' :
                    req.status === 'approved' ? 'border-green-500' : 'border-red-400'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {req.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{req.name}</h3>
                            <p className="text-gray-600 text-sm">{req.email}</p>
                            {req.phone && <p className="text-gray-500 text-xs">{req.phone}</p>}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {req.status === 'pending' ? '⏳ En attente' :
                             req.status === 'approved' ? '✅ Approuvé' : '❌ Refusé'}
                          </span>
                        </div>

                        <div className="flex gap-6 text-sm mb-2">
                          <div>
                            <span className="text-gray-500">Matières :</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {req.subjects?.map(s => (
                                <span key={s} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{s}</span>
                              ))}
                              {(!req.subjects || req.subjects.length === 0) && <span className="text-gray-400 text-xs">Non spécifiées</span>}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Niveaux :</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {req.levels?.map(l => (
                                <span key={l} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">{l}</span>
                              ))}
                              {(!req.levels || req.levels.length === 0) && <span className="text-gray-400 text-xs">Non spécifiés</span>}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400">
                          Demande soumise le {req.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}
                          {req.approvedAt && ` • Traitée le ${req.approvedAt?.toDate?.()?.toLocaleDateString('fr-FR')}`}
                        </p>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
                          >
                            ✅ Approuver
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium flex items-center gap-2 transition-all"
                          >
                            ❌ Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'professors' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Gestion des Professeurs</h2>
              <button
                onClick={() => setShowAddProfModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Ajouter un Professeur
              </button>
            </div>

            {professors.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun professeur</h3>
                <p className="text-gray-600">Créez votre premier compte professeur</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {professors.map(prof => {
                  const profExams = getProfExams(prof.id);
                  
                  return (
                    <div
                      key={prof.id}
                      className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-bold text-lg">
                                {prof.name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{prof.name}</h3>
                              <p className="text-gray-600">{prof.email}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              prof.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {prof.active ? '✓ Actif' : '✗ Inactif'}
                            </span>
                          </div>

                          <div className="flex gap-6 text-sm mb-3">
                            <div>
                              <span className="text-gray-600">Matières:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {prof.subjects?.map(subject => (
                                  <span key={subject} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-600">Niveaux:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {prof.levels?.map(level => (
                                  <span key={level} className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    {level}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            Mot de passe: {prof.password}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowProfExamsModal(prof)}
                            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-all flex items-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            📚 {profExams.length} examen{profExams.length > 1 ? 's' : ''}
                          </button>

                          <button
                            onClick={() => handleUpdateProfessor(prof.id, { active: !prof.active })}
                            className={`p-2 rounded-lg transition-all ${
                              prof.active
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                : 'bg-green-100 hover:bg-green-200 text-green-600'
                            }`}
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProfessor(prof.id, prof.name)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VUE EXAMENS - Inchangé */}
        {view === 'exams' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Liste des Examens</h2>

            {exams.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun examen</h3>
                <p className="text-gray-600">Les professeurs n'ont pas encore créé d'examens</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {exams.map(exam => (
                  <div
                    key={exam.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                      exam.active ? 'border-green-500' : 'border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            exam.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {exam.active ? '✓ Actif' : '✗ Inactif'}
                          </span>
                        </div>

                        {exam.description && (
                          <p className="text-gray-600 mb-3">{exam.description}</p>
                        )}

                        <div className="flex gap-6 text-sm">
                          <span className="text-gray-600">📚 <strong>{exam.level}</strong></span>
                          <span className="text-gray-600">📖 <strong>{exam.subject}</strong></span>
                          <span className="text-gray-600">⏱️ <strong>{exam.duration} min</strong></span>
                          <span className="text-gray-600">📝 <strong>{exam.questions?.length || 0} questions</strong></span>
                          <span className="text-gray-600">💯 <strong>{exam.totalPoints} points</strong></span>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          Créé par: {exam.createdByName || 'Inconnu'} • {exam.statistics?.totalAttempts || 0} passage(s)
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleExam(exam.id, exam.active)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            exam.active
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                        >
                          {exam.active ? 'Désactiver' : 'Activer'}
                        </button>

                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VUE RÉSULTATS - Inchangé mais trop long, je garde le code existant */}
        {view === 'results' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Résultats des Tests</h2>
              <button
                onClick={exportToExcel}
                disabled={results.length === 0}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Exporter Excel
              </button>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Filtres</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({...filters, level: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Tous niveaux</option>
                  {allLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                <select
                  value={filters.subject}
                  onChange={(e) => setFilters({...filters, subject: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Toutes matières</option>
                  {allSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>

                <select
                  value={filters.passed}
                  onChange={(e) => setFilters({...filters, passed: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="all">Tous résultats</option>
                  <option value="true">Réussis uniquement</option>
                  <option value="false">Échoués uniquement</option>
                </select>

                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />

                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />

                <button
                  onClick={() => setFilters({level: '', subject: '', city: '', dateFrom: '', dateTo: '', passed: 'all'})}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Tableau résultats */}
            {getFilteredResults().length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun résultat</h3>
                <p className="text-gray-600">Aucun test n'a été passé pour le moment</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Nom</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Ville</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Niveau</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Matière</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Score</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Résultat</th>
                        <th className="px-4 py-3 text-left text-sm font-bold">Tél.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getFilteredResults().map((result, index) => (
                        <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm">
                            {result.submittedAt?.toLocaleDateString('fr-FR')}<br/>
                            <span className="text-xs text-gray-500">
                              {result.submittedAt?.toLocaleTimeString('fr-FR')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{result.studentInfo?.fullName}</td>
                          <td className="px-4 py-3 text-sm">{result.studentInfo?.city}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{result.level}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{result.subject}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold">{result.percentage}%</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded font-medium ${
                              result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.passed ? '✓ Réussi' : '✗ Échoué'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{result.studentInfo?.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Ajout Professeur - Code existant */}
      {showAddProfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Ajouter un Professeur</h2>
                <button onClick={() => setShowAddProfModal(false)} className="bg-red-800 hover:bg-red-900 p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddProfessor} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nom Complet *</label>
                <input
                  type="text"
                  value={profForm.name}
                  onChange={(e) => setProfForm({...profForm, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={profForm.email}
                  onChange={(e) => setProfForm({...profForm, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe *</label>
                <input
                  type="text"
                  value={profForm.password}
                  onChange={(e) => setProfForm({...profForm, password: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Matières *</label>
                <select
                  multiple
                  value={profForm.subjects}
                  onChange={(e) => setProfForm({...profForm, subjects: Array.from(e.target.selectedOptions, option => option.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                  size={6}
                  required
                >
                  {allSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Niveaux *</label>
                <select
                  multiple
                  value={profForm.levels}
                  onChange={(e) => setProfForm({...profForm, levels: Array.from(e.target.selectedOptions, option => option.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                  size={4}
                  required
                >
                  {allLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddProfModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer le Professeur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Paramètres Système */}
      {showSettingsModal && (
        <ExamSystemSettings onClose={() => setShowSettingsModal(false)} />
      )}

      {/* Modal Examens du Prof */}
      {showProfExamsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Examens de {showProfExamsModal.name}</h2>
                  <p className="text-blue-100 text-sm mt-1">{getProfExams(showProfExamsModal.id).length} examen(s)</p>
                </div>
                <button
                  onClick={() => setShowProfExamsModal(null)}
                  className="bg-blue-700 hover:bg-blue-800 p-2 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {getProfExams(showProfExamsModal.id).length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Ce professeur n'a pas encore créé d'examens</p>
                </div>
              ) : (
                getProfExams(showProfExamsModal.id).map(exam => {
                  const stats = getExamStats(exam.id);
                  
                  return (
                    <div key={exam.id} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              exam.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {exam.active ? '✓ Actif' : '✗ Inactif'}
                            </span>
                          </div>

                          {exam.description && (
                            <p className="text-gray-600 mb-3">{exam.description}</p>
                          )}

                          <div className="flex gap-6 text-sm text-gray-600">
                            <span>📚 {exam.level}</span>
                            <span>📖 {exam.subject}</span>
                            <span>📝 {exam.questions?.length || 0} questions</span>
                            <span>⏱️ {exam.duration} min</span>
                            <span>💯 {exam.totalPoints} pts</span>
                          </div>

                          {stats && (
                            <div className="mt-3 flex gap-4 text-sm">
                              <span className="text-blue-600 font-medium">📊 {stats.totalAttempts} passages</span>
                              <span className="text-green-600 font-medium">✅ {stats.passRate}% réussite</span>
                              <span className="text-purple-600 font-medium">📈 {stats.avgScore}% moyenne</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setShowExamDetailsModal(exam)}
                          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          Consulter
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Examen */}
      {showExamDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-2xl sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{showExamDetailsModal.title}</h2>
                  <p className="text-green-100 text-sm mt-1">
                    {showExamDetailsModal.level} • {showExamDetailsModal.subject}
                  </p>
                </div>
                <button
                  onClick={() => setShowExamDetailsModal(null)}
                  className="bg-green-700 hover:bg-green-800 p-2 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {showExamDetailsModal.questions?.map((q, index) => (
                <div key={q.id} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{q.question}</h3>
                      <span className="text-sm text-gray-500">{q.points} point(s)</span>
                    </div>
                  </div>

                  {q.formulaLatex && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4 border-2 border-blue-200">
                      <p className="text-xs text-blue-800 font-bold mb-2">Formule :</p>
                      <MathFormula formula={q.formulaLatex} inline={false} />
                    </div>
                  )}

                  {q.imageUrl && (
                    <img src={q.imageUrl} alt="Question" className="max-w-full rounded-lg mb-4" />
                  )}

                  <div className="space-y-2">
                    {q.type === 'multiple_choice' ? (
                      q.options?.map(opt => (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-lg border-2 ${
                            opt.id === q.correctAnswer
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-medium">{opt.id.toUpperCase()}. {opt.text}</span>
                            {opt.id === q.correctAnswer && (
                              <span className="text-green-600 font-bold">✓ Correcte</span>
                            )}
                          </div>
                          {opt.imageUrl && (
                            <img 
                              src={opt.imageUrl} 
                              alt={`Option ${opt.id}`}
                              className="max-w-xs max-h-32 rounded border-2 border-gray-300 mt-2"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-lg border-2 ${
                          q.correctAnswer === 'true' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}>
                          Vrai {q.correctAnswer === 'true' && <span className="text-green-600 font-bold">✓</span>}
                        </div>
                        <div className={`p-3 rounded-lg border-2 ${
                          q.correctAnswer === 'false' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}>
                          Faux {q.correctAnswer === 'false' && <span className="text-green-600 font-bold">✓</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                      <p className="font-bold text-yellow-900 text-sm">Explication:</p>
                      <p className="text-yellow-800 text-sm">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAdmin;