import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, Clock, BookOpen, BarChart3, FileDown, CheckCircle, AlertCircle, Loader, Calendar, TrendingDown, Upload, File } from 'lucide-react';
import { db, storage } from './firebase';
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
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
    dureeTotal: 120,
    dateDebut: new Date().toISOString().split('T')[0],
    heureDebut: '14:00',
    heureFin: '16:00',
    epreuves: []
  });

  const [currentEpreuve, setCurrentEpreuve] = useState({
    titre: '',
    duree: 60,
    nombreQuestions: 20,
    questions: [],
    pdfUrl: null
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    numero: '',
    bonneReponse: 'A',
    points: 1
  });

  const [uploadingPdf, setUploadingPdf] = useState(null);

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
      dureeTotal: 120,
      dateDebut: new Date().toISOString().split('T')[0],
      heureDebut: '14:00',
      heureFin: '16:00',
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
      questions: [],
      pdfUrl: null
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

    // Auto-increment le numéro de question suivant
    const nextNum = parseInt(currentQuestion.numero) + 1;
    setCurrentQuestion({ numero: nextNum.toString(), bonneReponse: 'A', points: 1 });
  };

  const handleEditQuestion = (questionId, updatedQuestion) => {
    setCurrentEpreuve({
      ...currentEpreuve,
      questions: currentEpreuve.questions.map(q => q.id === questionId ? { ...q, ...updatedQuestion } : q)
    });
  };

  const handleRemoveQuestion = (questionId) => {
    setCurrentEpreuve({
      ...currentEpreuve,
      questions: currentEpreuve.questions.filter(q => q.id !== questionId)
    });
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage('❌ Veuillez sélectionner un fichier PDF');
      return;
    }

    setUploadingPdf(true);
    try {
      const storageRef = ref(storage, `blanc_exams_pdf/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setCurrentEpreuve({ ...currentEpreuve, pdfUrl: downloadUrl });
      setMessage('✅ PDF uploadé avec succès!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Erreur upload PDF:', error);
      setMessage('❌ Erreur lors de l\'upload');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleRemovePdf = async () => {
    if (!currentEpreuve.pdfUrl) return;

    try {
      const fileRef = ref(storage, currentEpreuve.pdfUrl);
      await deleteObject(fileRef);
      setCurrentEpreuve({ ...currentEpreuve, pdfUrl: null });
      setMessage('✅ PDF supprimé');
    } catch (error) {
      console.error('Erreur suppression PDF:', error);
      setMessage('❌ Erreur lors de la suppression');
    }
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

    // Mode édition - mise à jour d'une épreuve existante
    if (currentEpreuve.id && formData.epreuves.find(e => e.id === currentEpreuve.id)) {
      setFormData({
        ...formData,
        epreuves: formData.epreuves.map(e =>
          e.id === currentEpreuve.id
            ? { ...currentEpreuve, nombreQuestions: currentEpreuve.questions.length }
            : e
        )
      });
      setMessage('✅ Épreuve mise à jour');
    } else {
      // Mode création - nouvelle épreuve
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
      setMessage('✅ Épreuve ajoutée');
    }

    setTimeout(() => setMessage(''), 2000);
    setCurrentEpreuve({ titre: '', duree: 60, nombreQuestions: 20, questions: [], pdfUrl: null });
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

  const handleGenerateReport = async (exam) => {
    try {
      setMessage('⏳ Génération du rapport en cours...');

      // Charger tous les résultats pour cet examen
      const q = query(collection(db, 'blanc_answers'), where('examId', '==', exam.id));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert('❌ Aucun résultat pour cet examen');
        setMessage('');
        return;
      }

      // Analyser les questions par épreuve
      const analysisByEpreuve = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        Object.entries(data.epreuves || {}).forEach(([epreuveId, epreuveData]) => {
          if (!analysisByEpreuve[epreuveId]) {
            analysisByEpreuve[epreuveId] = {
              questions: {},
              totalCorrect: 0,
              totalIncorrect: 0
            };
          }

          Object.entries(epreuveData.reponses || {}).forEach(([questionId, answerData]) => {
            if (!analysisByEpreuve[epreuveId].questions[questionId]) {
              analysisByEpreuve[epreuveId].questions[questionId] = {
                questionId,
                correct: 0,
                incorrect: 0
              };
            }

            if (answerData.estCorrect) {
              analysisByEpreuve[epreuveId].questions[questionId].correct++;
              analysisByEpreuve[epreuveId].totalCorrect++;
            } else {
              analysisByEpreuve[epreuveId].questions[questionId].incorrect++;
              analysisByEpreuve[epreuveId].totalIncorrect++;
            }
          });
        });
      });

      // Générer PDF professionnel
      const pdfDoc = new jsPDF();
      let yPos = 15;

      // En-tête professionnel
      pdfDoc.setFillColor(31, 78, 121); // Bleu foncé professionnel
      pdfDoc.rect(0, 0, 210, 30, 'F');

      pdfDoc.setTextColor(255, 255, 255);
      pdfDoc.setFontSize(18);
      pdfDoc.setFont(undefined, 'bold');
      pdfDoc.text('INTELLECTION', 15, 12);
      pdfDoc.setFontSize(10);
      pdfDoc.text('RAPPORT D\'ANALYSE DES RÉSULTATS D\'EXAMEN', 15, 20);

      pdfDoc.setTextColor(0, 0, 0);
      pdfDoc.setFontSize(10);
      pdfDoc.text(`${exam.titre}`, 15, 35);
      pdfDoc.text(`Date: ${new Date().toLocaleDateString('fr-FR')} | Nombre de participants: ${snapshot.size}`, 15, 41);
      pdfDoc.line(15, 43, 195, 43);

      yPos = 50;

      // Pour chaque épreuve
      const epreuvesList = exam.epreuves || [];
      epreuvesList.forEach((epreuve, epIdx) => {
        if (yPos > 240) {
          pdfDoc.addPage();
          yPos = 20;
        }

        // Titre de l'épreuve
        pdfDoc.setFillColor(66, 139, 202);
        pdfDoc.rect(15, yPos - 4, 180, 8, 'F');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(11);
        pdfDoc.setFont(undefined, 'bold');
        pdfDoc.text(epreuve.titre, 20, yPos + 2);
        yPos += 12;

        pdfDoc.setTextColor(0, 0, 0);

        // Statistiques globales de l'épreuve
        const epreuveAnalysis = analysisByEpreuve[epreuve.id];
        if (epreuveAnalysis) {
          const totalRep = epreuveAnalysis.totalCorrect + epreuveAnalysis.totalIncorrect;
          const epreuveSuccessRate = totalRep > 0 ? ((epreuveAnalysis.totalCorrect / totalRep) * 100).toFixed(1) : 0;

          pdfDoc.setFontSize(9);
          pdfDoc.setFont(undefined, 'normal');
          pdfDoc.text(`Taux de réussite global: ${epreuveSuccessRate}% | Réponses correctes: ${epreuveAnalysis.totalCorrect}/${totalRep}`, 20, yPos);
          yPos += 6;
        }

        yPos += 2;

        // Tableau des questions
        const tableData = epreuve.questions.map(question => {
          const qAnalysis = epreuveAnalysis?.questions[question.id] || { correct: 0, incorrect: 0 };
          const total = qAnalysis.correct + qAnalysis.incorrect;
          const correctPercent = total > 0 ? ((qAnalysis.correct / total) * 100).toFixed(1) : 0;
          const incorrectPercent = total > 0 ? ((qAnalysis.incorrect / total) * 100).toFixed(1) : 0;

          return [
            `Q${question.numero}`,
            `${correctPercent}%`,
            `${incorrectPercent}%`,
            `${qAnalysis.correct}/${total}`
          ];
        });

        pdfDoc.autoTable({
          startY: yPos,
          head: [['Question', '✅ Correct', '❌ Faux', 'Total']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [31, 78, 121],
            textColor: 255,
            fontSize: 9,
            font: 'bold'
          },
          bodyStyles: { fontSize: 8 },
          alternateRowStyles: { fillColor: [240, 245, 250] },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 35 },
            2: { cellWidth: 35 },
            3: { cellWidth: 30 }
          }
        });

        yPos = pdfDoc.lastAutoTable.finalY + 12;
      });

      // Pied de page
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(128, 128, 128);
      pdfDoc.text('Rapport généré automatiquement par INTELLECTION', 105, pdfDoc.internal.pageSize.getHeight() - 10, { align: 'center' });

      pdfDoc.save(`rapport_${exam.titre}_${new Date().toISOString().split('T')[0]}.pdf`);
      setMessage('✅ Rapport généré avec succès!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      setMessage('❌ Erreur lors de la génération du rapport');
    }
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
                            onClick={() => handleGenerateReport(exam)}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition text-sm"
                            title="Exporte un rapport sur les questions difficiles"
                          >
                            <TrendingDown className="w-4 h-4" />
                            Rapport
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">⏱️ Durée totale du concours (minutes)</label>
                <input
                  type="number"
                  value={formData.dureeTotal}
                  onChange={(e) => setFormData({ ...formData, dureeTotal: parseInt(e.target.value) })}
                  placeholder="120"
                  min="5"
                  max="480"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Cette durée s'applique à TOUT le concours, indépendamment du nombre d'épreuves</p>
              </div>

              {/* Disponibilité */}
              <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-4">📅 Disponibilité de l'examen</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Heure de début</label>
                    <input
                      type="time"
                      value={formData.heureDebut}
                      onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Heure de fin</label>
                    <input
                      type="time"
                      value={formData.heureFin}
                      onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Ex: Samedi 20/06 de 14:00 à 16:00 - Les étudiants verront un message s'ils tentent d'accéder en dehors de cette période
                </p>
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
                          ⏱️ {epreuve.duree}min | 📋 {epreuve.questions.length} questions {epreuve.pdfUrl && '| 📄 PDF'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCurrentEpreuve(epreuve);
                            setMessage('');
                          }}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"
                          title="Éditer cette épreuve"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemoveEpreuve(epreuve.id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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

                  {/* Upload PDF */}
                  <div className="bg-purple-50 p-3 rounded-lg mb-3 border-2 border-purple-200">
                    <h5 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" /> 📄 Upload PDF de l'épreuve
                    </h5>
                    {currentEpreuve.pdfUrl ? (
                      <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                        <div className="flex items-center gap-2">
                          <File className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">✅ PDF uploadé</span>
                        </div>
                        <button
                          onClick={handleRemovePdf}
                          className="text-red-600 hover:bg-red-100 px-2 py-1 rounded text-sm"
                        >
                          ✕ Supprimer
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 transition">
                        <Upload className="w-6 h-6 text-purple-600 mb-2" />
                        <span className="text-sm font-semibold text-purple-700">Cliquez pour uploadé un PDF</span>
                        <span className="text-xs text-purple-600 mt-1">ou déposez le fichier ici</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          disabled={uploadingPdf}
                          className="hidden"
                        />
                      </label>
                    )}
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
                        <option value="E">🅴️ E</option>
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
                          <div key={q.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs border border-gray-200 group">
                            <span>Q{q.numero} → <strong>{q.bonneReponse}</strong> ({q.points}pts)</span>
                            <button
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentEpreuve({ titre: '', duree: 60, nombreQuestions: 20, questions: [], pdfUrl: null })}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition font-semibold text-sm"
                    >
                      🔄 Réinitialiser
                    </button>
                    <button
                      onClick={handleAddEpreuveToExam}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                    >
                      {currentEpreuve.id && formData.epreuves.find(e => e.id === currentEpreuve.id)
                        ? '✅ Mettre à jour cette épreuve'
                        : '✅ Ajouter cette épreuve'
                      }
                    </button>
                  </div>
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
