import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, Clock, BookOpen, BarChart3, FileDown, CheckCircle, AlertCircle, Loader, Calendar } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where, updateDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import BlancExamResults from './BlancExamResults';

const BlancExamAdmin = ({ onClose }) => {
  const [view, setView] = useState('list'); // list, create, edit, results
  const [exams, setExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    dateExamen: new Date().toISOString().split('T')[0],
    epreuves: []
  });

  const [currentEpreuve, setCurrentEpreuve] = useState({
    titre: '',
    duree: 60,
    nombreQuestions: 20,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    numero: '',
    bonneReponse: 'A',
    points: 1
  });

  // Charger les examens au montage
  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'blanc_exams'));
      const examsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.dateExamen) - new Date(a.dateExamen));
      setExams(examsData);
    } catch (error) {
      console.error('Erreur chargement examens:', error);
      setMessage('❌ Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = () => {
    setFormData({
      titre: '',
      description: '',
      dateExamen: new Date().toISOString().split('T')[0],
      epreuves: []
    });
    setView('create');
  };

  const handleEditExam = (exam) => {
    setCurrentExam(exam);
    setFormData(exam);
    setView('edit');
  };

  const handleAddEpreuve = () => {
    setCurrentEpreuve({
      titre: '',
      duree: 60,
      nombreQuestions: 20,
      questions: []
    });
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.numero) {
      alert('Entrez le numéro de question');
      return;
    }

    const questionId = `q_${Date.now()}`;
    const newQuestion = {
      id: questionId,
      ...currentQuestion,
      numero: parseInt(currentQuestion.numero)
    };

    const updatedQuestions = [...currentEpreuve.questions, newQuestion].sort((a, b) => a.numero - b.numero);
    setCurrentEpreuve({ ...currentEpreuve, questions: updatedQuestions });
    setCurrentQuestion({ numero: '', bonneReponse: 'A', points: 1 });
  };

  const handleRemoveQuestion = (questionId) => {
    setCurrentEpreuve({
      ...currentEpreuve,
      questions: currentEpreuve.questions.filter(q => q.id !== questionId)
    });
  };

  const handleAddEpreuveToExam = () => {
    if (!currentEpreuve.titre) {
      alert('Entrez le titre de l\'épreuve');
      return;
    }

    if (currentEpreuve.questions.length === 0) {
      alert('Ajoutez au moins une question');
      return;
    }

    const epreuveId = `ep_${Date.now()}`;
    const newEpreuve = {
      id: epreuveId,
      ...currentEpreuve,
      nombreQuestions: currentEpreuve.questions.length
    };

    setFormData({
      ...formData,
      epreuves: [...formData.epreuves, newEpreuve]
    });

    setCurrentEpreuve({ titre: '', duree: 60, nombreQuestions: 20, questions: [] });
    setMessage('✅ Épreuve ajoutée');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemoveEpreuve = (epreuveId) => {
    setFormData({
      ...formData,
      epreuves: formData.epreuves.filter(e => e.id !== epreuveId)
    });
  };

  const handleSaveExam = async () => {
    if (!formData.titre) {
      alert('Entrez le titre du concours');
      return;
    }

    if (formData.epreuves.length === 0) {
      alert('Ajoutez au moins une épreuve');
      return;
    }

    setSaving(true);
    try {
      const examId = currentExam?.id || `exam_${Date.now()}`;
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      if (!currentExam?.id) {
        dataToSave.createdAt = new Date().toISOString();
      }

      await setDoc(doc(db, 'blanc_exams', examId), dataToSave);
      setMessage('✅ Concours sauvegardé avec succès!');
      setTimeout(() => {
        loadExams();
        setView('list');
      }, 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Êtes-vous sûr? Cette action est irréversible.')) return;

    try {
      await deleteDoc(doc(db, 'blanc_exams', examId));
      setExams(exams.filter(e => e.id !== examId));
      setMessage('✅ Concours supprimé');
    } catch (error) {
      console.error('Erreur suppression:', error);
      setMessage('❌ Erreur lors de la suppression');
    }
  };

  const handleViewResults = (exam) => {
    setCurrentExam(exam);
    setView('results');
  };

  const filteredExams = exams.filter(exam =>
    exam.titre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Gestion des Concours Blancs</h2>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.includes('✅') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message}
            </div>
          )}

          {/* VIEW: List */}
          {view === 'list' && (
            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Rechercher un concours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreateExam}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Nouveau Concours
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun concours. Créez-en un pour commencer!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredExams.map(exam => (
                    <div key={exam.id} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{exam.titre}</h3>
                          <p className="text-gray-600 text-sm mt-1">{exam.description}</p>
                          <div className="flex gap-6 mt-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(exam.dateExamen).toLocaleDateString('fr-FR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {exam.epreuves?.length || 0} épreuves
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" />
                              {exam.epreuves?.reduce((sum, e) => sum + (e.questions?.length || 0), 0) || 0} questions
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewResults(exam)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Résultats
                          </button>
                          <button
                            onClick={() => handleEditExam(exam)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: Create/Edit */}
          {(view === 'create' || view === 'edit') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Titre du concours</label>
                  <input
                    type="text"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    placeholder="Ex: Concours Blanc Maths - 2026"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date d'examen</label>
                  <input
                    type="date"
                    value={formData.dateExamen}
                    onChange={(e) => setFormData({ ...formData, dateExamen: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du concours..."
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Épreuves */}
              <div className="border-t-2 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Épreuves ({formData.epreuves.length})</h3>

                {formData.epreuves.map((epreuve, idx) => (
                  <div key={epreuve.id} className="bg-blue-50 p-4 rounded-lg mb-4 border-2 border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{epreuve.titre}</h4>
                        <p className="text-sm text-gray-600">
                          ⏱️ {epreuve.duree}min | 📋 {epreuve.questions.length} questions
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveEpreuve(epreuve.id)}
                        className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Questions de l'épreuve */}
                    <div className="bg-white rounded-lg p-3 text-sm space-y-2">
                      {epreuve.questions.map(q => (
                        <div key={q.id} className="flex items-center justify-between text-sm border-b pb-2">
                          <span>Q{q.numero} → Réponse: <strong>{q.bonneReponse}</strong> ({q.points}pts)</span>
                          <button
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Formulaire ajout épreuve */}
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <h4 className="font-bold text-gray-900 mb-3">Ajouter une épreuve</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      value={currentEpreuve.titre}
                      onChange={(e) => setCurrentEpreuve({ ...currentEpreuve, titre: e.target.value })}
                      placeholder="Titre épreuve"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={currentEpreuve.duree}
                      onChange={(e) => setCurrentEpreuve({ ...currentEpreuve, duree: parseInt(e.target.value) })}
                      placeholder="Durée (min)"
                      min="5"
                      max="480"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Ajouter questions */}
                  <div className="bg-white p-3 rounded-lg mb-3 border border-gray-200">
                    <h5 className="font-semibold text-gray-800 mb-3 text-sm">Ajouter des questions</h5>

                    {/* Labels explicatifs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                      <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        📌 N° Question
                      </div>
                      <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        ✅ Bonne Réponse
                      </div>
                      <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        🎯 Points
                      </div>
                      <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        Ajouter
                      </div>
                    </div>

                    {/* Champs de saisie */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <input
                        type="number"
                        value={currentQuestion.numero}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, numero: e.target.value })}
                        placeholder="Ex: 1, 2, 3..."
                        min="1"
                        max="999"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <select
                        value={currentQuestion.bonneReponse}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, bonneReponse: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                      >
                        <option value="A">🅰️ A</option>
                        <option value="B">🅱️ B</option>
                        <option value="C">🅲️ C</option>
                        <option value="D">🅳️ D</option>
                      </select>
                      <input
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) })}
                        placeholder="Ex: 1, 2.5..."
                        step="0.5"
                        min="0.5"
                        max="10"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        onClick={handleAddQuestion}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition text-sm font-semibold"
                      >
                        ➕ Ajouter
                      </button>
                    </div>

                    {/* Exemple d'utilisation */}
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border border-blue-200 mb-3">
                      <strong>Exemple:</strong> Question 1 → Bonne réponse B → 2 points
                    </div>

                    {/* Liste questions */}
                    {currentEpreuve.questions.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {currentEpreuve.questions.map(q => (
                          <div key={q.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs border border-gray-200">
                            <span>Q{q.numero} → <strong>{q.bonneReponse}</strong> ({q.points}pts)</span>
                            <button
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAddEpreuveToExam}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                  >
                    ✅ Ajouter cette épreuve
                  </button>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setView('list')}
                  className="flex-1 px-4 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveExam}
                  disabled={saving}
                  className={`flex-1 px-4 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
                    saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Sauvegarder le concours
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Results */}
          {view === 'results' && currentExam && (
            <BlancExamResults exam={currentExam} onBack={() => setView('list')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BlancExamAdmin;
