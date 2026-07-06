import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Send, BookOpen, BarChart3, ChevronDown, ChevronUp, XCircle, Share2, Download } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore';
import { formatDateLocal } from './utils/examAvailability';
import html2canvas from 'html2canvas';

const BlancExamStudent = ({ studentMatricule, onClose }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedEpreuves, setExpandedEpreuves] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [previousResults, setPreviousResults] = useState([]);
  const [allTimeResults, setAllTimeResults] = useState([]);
  const [currentEpreuveId, setCurrentEpreuveId] = useState(null);
  const [studentMassar, setStudentMassar] = useState('');
  const [showMassarForm, setShowMassarForm] = useState(false);
  const [examRating, setExamRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showScoreShare, setShowScoreShare] = useState(false);

  useEffect(() => {
    console.log('🎓 BlancExamStudent monté avec matricule:', studentMatricule);
    loadExams();
    loadStudentInfo(studentMatricule);
    loadAllTimeResults(studentMatricule);
  }, [studentMatricule]);

  const loadAllTimeResults = async (matricule) => {
    try {
      const q = query(
        collection(db, 'blanc_answers'),
        where('studentMatricule', '==', matricule)
      );
      const snapshot = await getDocs(q);

      const results = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            examId: data.examId,
            totalScore: data.totalScore,
            submittedAt: data.submittedAt,
            epreuves: data.epreuves
          };
        })
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

      setAllTimeResults(results);
      console.log('📊 Historique global chargé:', results.length, 'concours passés');
    } catch (error) {
      console.error('Erreur chargement historique global:', error);
    }
  };

  // Minuteur global
  useEffect(() => {
    if (!selectedExam || !startTime || submitted) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, selectedExam.dureeTotal * 60 - elapsed);

      setTimeLeft(remaining);

      if (remaining === 0) {
        alert('⏰ Temps écoulé! L\'examen est auto-soumis.');
        handleSubmitExam();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedExam, startTime, submitted]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'blanc_exams'));
      const examsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(exam => exam.status === 'active');
      setExams(examsData);
    } catch (error) {
      console.error('Erreur chargement examens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentInfo = async (matricule) => {
    try {
      const q = query(collection(db, 'students'), where('matricule', '==', matricule));
      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        const data = snapshot.docs[0].data();
        setStudentInfo({
          matricule: matricule,
          fullName: data.fullName || `${data.prenom} ${data.nom}`,
          prenom: data.prenom,
          nom: data.nom
        });
        return true;
      } else {
        setStudentInfo({
          matricule: matricule,
          fullName: matricule
        });
        return true;
      }
    } catch (error) {
      console.error('Erreur chargement infos étudiant:', error);
      return false;
    }
  };

  const loadPreviousResults = async (matricule, currentExamId) => {
    try {
      const q = query(
        collection(db, 'blanc_answers'),
        where('studentMatricule', '==', matricule)
      );
      const snapshot = await getDocs(q);

      const allResults = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            examId: data.examId,
            totalScore: data.totalScore,
            submittedAt: data.submittedAt,
            epreuves: data.epreuves
          };
        })
        .filter(r => r.examId !== currentExamId) // Exclure l'examen courant
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      setPreviousResults(allResults);
      console.log('📊 Historique chargé:', allResults.length, 'tentatives');
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const handleStartExam = (exam) => {
    setSelectedExam(exam);
    setShowMassarForm(true);
    setStudentMassar('');
  };

  const handleMassarSubmit = () => {
    if (!studentMassar.trim()) {
      alert('Veuillez entrer votre code MASSAR');
      return;
    }

    setResponses({});
    setSubmitted(false);
    setStartTime(Date.now());
    setTimeLeft(selectedExam.dureeTotal * 60);

    // Expand all épreuves par défaut
    const expanded = {};
    selectedExam.epreuves?.forEach((ep, idx) => {
      expanded[ep.id] = idx === 0;
    });
    setExpandedEpreuves(expanded);

    // Set current epreuve to the first one with PDF or just the first one
    if (selectedExam.epreuves && selectedExam.epreuves.length > 0) {
      const firstEpreuveWithPdf = selectedExam.epreuves.find(ep => ep.pdfUrl);
      setCurrentEpreuveId(firstEpreuveWithPdf?.id || selectedExam.epreuves[0].id);
    }

    setShowMassarForm(false);
  };

  const handleResponseChange = (questionId, response) => {
    setResponses({
      ...responses,
      [questionId]: response
    });
  };

  const toggleEpreuve = (epreuveId) => {
    setExpandedEpreuves({
      ...expandedEpreuves,
      [epreuveId]: !expandedEpreuves[epreuveId]
    });
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressStats = () => {
    if (!selectedExam) return null;

    let totalQuestions = 0;
    let answeredQuestions = 0;

    selectedExam.epreuves?.forEach(epreuve => {
      epreuve.questions?.forEach(question => {
        totalQuestions++;
        if (responses[question.id]) {
          answeredQuestions++;
        }
      });
    });

    return { totalQuestions, answeredQuestions, percentage: Math.round((answeredQuestions / totalQuestions) * 100) };
  };

  const handleDownloadScoreImage = async () => {
    try {
      const element = document.getElementById('score-share-card');
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `score_${selectedExam.titre}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();

      alert('✅ Image téléchargée ! Partage-la en story sur tes réseaux ! 📱');
    } catch (error) {
      console.error('Erreur génération image:', error);
      alert('❌ Erreur lors de la génération de l\'image');
    }
  };

  const handleSubmitRating = async () => {
    if (examRating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }

    try {
      await setDoc(doc(db, 'exam_ratings', `${studentMatricule}_${selectedExam.id}_${Date.now()}`), {
        studentMatricule,
        examId: selectedExam.id,
        examTitle: selectedExam.titre,
        rating: examRating,
        submittedAt: new Date().toISOString()
      });
      setRatingSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Erreur sauvegarde rating:', error);
      alert('❌ Erreur lors de la sauvegarde de votre avis');
    }
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir soumettre? Vous ne pourrez pas modifier vos réponses après.')) {
      return;
    }

    setSubmitting(true);
    try {
      let totalScore = 0;
      const epreuvesData = {};

      selectedExam.epreuves.forEach((epreuve) => {
        let epreuveScore = 0;
        const reponses = {};

        epreuve.questions.forEach(question => {
          const studentResponse = responses[question.id];
          reponses[question.id] = {
            reponse: studentResponse || '—',
            estCorrect: studentResponse === question.bonneReponse,
            points: studentResponse === question.bonneReponse ? (question.points || 1) : 0
          };

          if (studentResponse === question.bonneReponse) {
            epreuveScore += (question.points || 1);
          }
        });

        epreuvesData[epreuve.id] = {
          score: epreuveScore,
          reponses: reponses
        };

        totalScore += epreuveScore;
      });

      const answerId = `${selectedExam.id}_${studentMatricule}_${Date.now()}`;
      await setDoc(doc(db, 'blanc_answers', answerId), {
        examId: selectedExam.id,
        studentMatricule: studentMatricule,
        studentMassar: studentMassar,
        epreuves: epreuvesData,
        totalScore: totalScore,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      });

      setSubmitted(true);
      setExamResults({
        totalScore,
        epreuves: epreuvesData,
        epreuvesList: selectedExam.epreuves
      });
      console.log('✅ Examen soumis! Score:', totalScore);

      // Charger l'historique des résultats précédents
      await loadPreviousResults(studentMatricule, selectedExam.id);
    } catch (error) {
      console.error('Erreur submission:', error);
      alert('❌ Erreur lors de la submission');
    } finally {
      setSubmitting(false);
    }
  };

  // Vue écran de bienvenue
  if (studentInfo && showWelcome && !selectedExam && !submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 text-center">
            <div className="text-6xl mb-6">👋</div>
            <h2 className="text-3xl font-bold mb-2">Bonjour!</h2>
            <h3 className="text-2xl font-semibold text-blue-100 mb-6">{studentInfo.fullName}</h3>
            <p className="text-blue-100 text-lg font-semibold">Bonne chance!</p>
          </div>

          <div className="p-8 space-y-4">
            <p className="text-gray-600 text-center mb-6">Que veux-tu faire?</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowWelcome(false);
                  setShowProgress(true);
                }}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
              >
                <span>📈</span>
                Voir ma Progression
              </button>
              <button
                onClick={() => {
                  setShowWelcome(false);
                  setShowProgress(false);
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
              >
                <span>📚</span>
                Voir les Concours
              </button>
            </div>
            <button
              onClick={() => onClose()}
              className="w-full px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition mt-4"
            >
              Quitter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue progression globale (après welcome, avant examens)
  if (studentInfo && !showWelcome && showProgress && !selectedExam && !submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 sticky top-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📈</div>
                <div>
                  <h2 className="text-2xl font-bold">Votre Progression</h2>
                  <p className="text-purple-100 text-sm">{studentInfo.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(true)}
                className="text-purple-200 hover:text-white text-2xl"
              >
                ←
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {allTimeResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Aucun concours passé pour le moment</p>
                <p className="text-gray-500 text-sm mt-2">Commence ton premier concours pour voir ta progression!</p>
              </div>
            ) : (
              <>
                {/* Statistiques globales */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 text-center">
                    <p className="text-sm text-green-700 font-semibold">Meilleur Score</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {Math.max(...allTimeResults.map(r => r.totalScore))}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 text-center">
                    <p className="text-sm text-blue-700 font-semibold">Moyenne</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {(allTimeResults.reduce((sum, r) => sum + r.totalScore, 0) / allTimeResults.length).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200 text-center">
                    <p className="text-sm text-purple-700 font-semibold">Concours Passés</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{allTimeResults.length}</p>
                  </div>
                </div>

                {/* Timeline de progression */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Historique</h3>
                  <div className="space-y-3">
                    {allTimeResults.map((result, idx) => {
                      const prevScore = idx > 0 ? allTimeResults[idx - 1].totalScore : null;
                      const scoreDiff = prevScore ? result.totalScore - prevScore : null;
                      const isImprovement = scoreDiff > 0;

                      return (
                        <div key={result.id} className="bg-gray-50 p-4 rounded-lg border-l-4"
                          style={{
                            borderLeftColor: isImprovement ? '#10b981' : scoreDiff < 0 ? '#ef4444' : '#6b7280'
                          }}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">
                                {new Date(result.submittedAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="font-bold text-gray-900 mt-1">
                                Score: {result.totalScore} points
                              </p>
                            </div>
                            {scoreDiff !== null && (
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  isImprovement ? 'text-green-600' :
                                  scoreDiff < 0 ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {isImprovement ? '📈 +' : scoreDiff < 0 ? '📉 ' : '➡️ '}{Math.abs(scoreDiff)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bouton continuer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 sticky bottom-0 space-y-3">
            <button
              onClick={() => setShowProgress(false)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-bold"
            >
              Voir les Concours
            </button>
            <button
              onClick={() => setShowWelcome(true)}
              className="w-full px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue formulaire MASSAR
  if (showMassarForm && selectedExam) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">Code MASSAR</h2>
            <p className="text-blue-100">Identification de l'étudiant</p>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Veuillez entrer votre code MASSAR:
              </label>
              <input
                type="text"
                value={studentMassar}
                onChange={(e) => setStudentMassar(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleMassarSubmit()}
                placeholder="Ex: A123456"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-2">
                Ce code sera utilisé pour identifier vos résultats
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Note:</strong> Assurez-vous que votre code MASSAR est correct avant de commencer l'examen.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleMassarSubmit}
                disabled={!studentMassar.trim()}
                className={`w-full px-6 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
                  studentMassar.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                <span>▶️</span>
                Commencer l'examen
              </button>
              <button
                onClick={() => {
                  setShowMassarForm(false);
                  setSelectedExam(null);
                  setStudentMassar('');
                }}
                className="w-full px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue résultats après soumission
  if (submitted && examResults) {
    const totalMax = selectedExam.epreuves.reduce((sum, e) => sum + (e.questions.reduce((s, q) => s + (q.points || 1), 0)), 0);
    const percentage = ((examResults.totalScore / totalMax) * 100).toFixed(1);

    // Phrases de motivation personnalisées
    const getMotivationalMessage = (score) => {
      if (score >= 90) {
        return {
          emoji: '🌟',
          title: 'Excellent!',
          message: 'Tu as écrasé cet examen! Continue comme ça, tu es sur la bonne voie!',
          color: 'text-green-600'
        };
      } else if (score >= 80) {
        return {
          emoji: '🎉',
          title: 'Très bien!',
          message: 'Superbe performance! Tu maîtrises bien le sujet. Encore un petit effort!',
          color: 'text-green-600'
        };
      } else if (score >= 70) {
        return {
          emoji: '👍',
          title: 'Bien!',
          message: 'Bon travail! Tu progresses bien. Continue tes efforts pour améliorer tes scores!',
          color: 'text-blue-600'
        };
      } else if (score >= 60) {
        return {
          emoji: '💪',
          title: 'Pas mal!',
          message: 'Tu as les bases! Travaille un peu plus et tu vas maîtriser ce sujet complètement!',
          color: 'text-blue-600'
        };
      } else if (score >= 50) {
        return {
          emoji: '🚀',
          title: 'À améliorer',
          message: 'Ce n\'est qu\'un début! Reviens aux fondamentaux et réessaie bientôt. Tu vas t\'améliorer!',
          color: 'text-orange-600'
        };
      } else {
        return {
          emoji: '📚',
          title: 'Courage!',
          message: 'Ça arrive à tout le monde! Reprends les cours et recommence. Chaque tentative te rend plus fort(e)!',
          color: 'text-orange-600'
        };
      }
    };

    const motivation = getMotivationalMessage(parseFloat(percentage));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6">
            <h2 className="text-3xl font-bold">✅ Examen Soumis!</h2>
            <p className="text-green-100 text-sm mt-1">Vos résultats sont ci-dessous</p>
          </div>

          {/* Score Global */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-6 border-b border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-6">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Score Total</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{examResults.totalScore}/{totalMax}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pourcentage</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{percentage}%</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Appréciation</p>
                <p className={`text-2xl font-bold mt-2 ${
                  percentage >= 80 ? 'text-green-600' :
                  percentage >= 60 ? 'text-blue-600' :
                  percentage >= 40 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {percentage >= 80 ? '🌟 Excellent' :
                   percentage >= 60 ? '👍 Bien' :
                   percentage >= 40 ? '⚠️ Moyen' :
                   '❌ À revoir'}
                </p>
              </div>
            </div>

            {/* Phrase de motivation */}
            <div className="bg-white/70 rounded-lg p-4 border-2 border-blue-200 text-center">
              <p className="text-3xl mb-2">{motivation.emoji}</p>
              <h3 className={`text-xl font-bold mb-2 ${motivation.color}`}>{motivation.title}</h3>
              <p className="text-gray-700 text-base italic">{motivation.message}</p>
            </div>
          </div>

          {/* Historique & Progression */}
          {previousResults.length > 0 && (
            <div className="bg-blue-50 px-6 py-6 border-b border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Votre Progression</h3>
              <div className="space-y-3">
                {previousResults.map((result, idx) => {
                  const prevMax = Object.values(result.epreuves).reduce((sum, e) => sum + (e.score || 0), 0);
                  const scoreDiff = examResults.totalScore - result.totalScore;
                  const isImprovement = scoreDiff > 0;

                  return (
                    <div key={result.id} className="bg-white p-4 rounded-lg border-l-4"
                      style={{
                        borderLeftColor: isImprovement ? '#10b981' : scoreDiff < 0 ? '#ef4444' : '#6b7280'
                      }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(result.submittedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="font-semibold text-gray-900">
                            Score: {result.totalScore} points
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            isImprovement ? 'text-green-600' :
                            scoreDiff < 0 ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {isImprovement ? '📈 +' : scoreDiff < 0 ? '📉 ' : '➡️ '}{Math.abs(scoreDiff)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {isImprovement ? 'Amélioration!' : scoreDiff < 0 ? 'À améliorer' : 'Stable'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Statistiques de progression */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Meilleur Score</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {Math.max(examResults.totalScore, ...previousResults.map(r => r.totalScore))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Moyenne</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {(
                        (examResults.totalScore + previousResults.reduce((sum, r) => sum + r.totalScore, 0)) /
                        (previousResults.length + 1)
                      ).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Résultats par Épreuve */}
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Résultats par Épreuve</h3>

            {examResults.epreuvesList && examResults.epreuvesList.map(epreuve => {
              const epreuveData = examResults.epreuves[epreuve.id];
              const epreuveMax = epreuve.questions.reduce((sum, q) => sum + (q.points || 1), 0);
              const epreuvePercentage = ((epreuveData.score || 0) / epreuveMax * 100).toFixed(1);

              return (
                <div key={epreuve.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  {/* En-tête épreuve */}
                  <div className="bg-gray-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900">{epreuve.titre}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Score: <strong>{epreuveData.score || 0}/{epreuveMax}</strong> ({epreuvePercentage}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
                          style={{
                            backgroundColor: epreuvePercentage >= 80 ? '#dbeafe' :
                                            epreuvePercentage >= 60 ? '#dcfce7' :
                                            epreuvePercentage >= 40 ? '#fef3c7' :
                                            '#fee2e2',
                            color: epreuvePercentage >= 80 ? '#0369a1' :
                                   epreuvePercentage >= 60 ? '#16a34a' :
                                   epreuvePercentage >= 40 ? '#d97706' :
                                   '#dc2626'
                          }}>
                          {epreuvePercentage}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Questions et réponses */}
                  <div className="p-6 space-y-4">
                    {epreuve.questions && epreuve.questions.map(question => {
                      const answerData = epreuveData.reponses?.[question.id];
                      const isCorrect = answerData?.estCorrect;

                      return (
                        <div key={question.id} className={`p-4 rounded-lg border-2 ${
                          isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                        }`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {isCorrect ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-gray-900">Question {question.numero}</h5>
                                <span className={`font-bold text-lg ${
                                  isCorrect ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {isCorrect ? '+' : '-'}{answerData?.points || 0} pts
                                </span>
                              </div>
                              <p className="text-gray-700 mt-2">
                                Votre réponse: <strong>{answerData?.reponse || '—'}</strong>
                                {!isCorrect && (
                                  <span className="block text-red-600 mt-1">
                                    Bonne réponse: <strong>{question.bonneReponse}</strong>
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bouton Partager Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-200 px-6 py-4">
            <button
              onClick={() => setShowScoreShare(!showScoreShare)}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition font-bold flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              📱 Partager mon score en story
            </button>
          </div>

          {/* Aperçu et téléchargement */}
          {showScoreShare && (
            <div className="bg-white border-t border-gray-200 px-6 py-6">
              <div className="mb-4">
                {/* Carte de score à télécharger - Style Premium */}
                <div
                  id="score-share-card"
                  className="relative rounded-2xl p-8 text-white text-center max-w-sm mx-auto overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1a0a0a 0%, #4a1515 50%, #8b2e2e 100%)',
                    aspectRatio: '9/16'
                  }}
                >
                  {/* Fond géométrique décoratif */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 right-4 w-32 h-32 border-4 border-red-500/30 rounded-lg transform rotate-12"></div>
                    <div className="absolute bottom-20 left-4 w-24 h-24 border-4 border-red-500/30 rounded-lg transform -rotate-12"></div>
                  </div>

                  <div className="relative z-10 h-full flex flex-col justify-between">
                    {/* Header avec Logo */}
                    <div>
                      <div className="mb-2 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-red-500 rounded-full transform -rotate-45"></div>
                        </div>
                        <p className="text-xl font-black tracking-widest">INTELLECTION</p>
                        <p className="text-xs font-semibold text-yellow-300 tracking-widest">CENTRE DE SOUTIEN</p>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent my-3"></div>
                    </div>

                    {/* Score Principal */}
                    <div className="flex-1 flex flex-col justify-center">
                      {/* Cadre Score */}
                      <div className="border-2 border-yellow-500/50 rounded-2xl p-6 mb-4 bg-black/30 backdrop-blur">
                        <p className="text-6xl font-black mb-1">
                          {examResults.totalScore}/{totalMax}
                        </p>
                      </div>

                      {/* Pourcentage avec lauriers */}
                      <div className="mb-4">
                        <p className="text-5xl font-black text-yellow-300">
                          {percentage}%
                        </p>
                        <p className="text-xs text-yellow-300 mt-1">🏆 EXCELLENT 🏆</p>
                      </div>
                    </div>

                    {/* Infos Examen */}
                    <div className="space-y-2">
                      <div className="h-px bg-red-500/50 my-2"></div>
                      <p className="text-lg font-bold text-white tracking-wide">
                        {selectedExam.titre}
                      </p>
                      <p className="text-sm text-gray-300 flex items-center justify-center gap-1">
                        📅 {new Date().toLocaleDateString('fr-FR')}
                      </p>
                      <div className="h-px bg-red-500/50 my-2"></div>
                      <p className="text-xs text-gray-400 font-semibold">
                        Testé avec Intellection
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowScoreShare(false)}
                  className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition font-semibold"
                >
                  Fermer
                </button>
                <button
                  onClick={handleDownloadScoreImage}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger l'image
                </button>
              </div>
            </div>
          )}

          {/* Section Rating */}
          {!ratingSubmitted && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-t-2 border-yellow-200 px-6 py-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ⭐ Votre avis sur cette épreuve
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Aidez-nous à améliorer la plateforme en notant cette épreuve
                </p>

                {/* Stars Rating */}
                <div className="flex justify-center gap-3 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setExamRating(star)}
                      className={`text-4xl transition transform hover:scale-125 ${
                        star <= examRating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {examRating > 0 && (
                  <p className="text-sm text-gray-600 mb-4">
                    Vous avez noté : <strong>{examRating}/5 étoiles</strong>
                  </p>
                )}

                {/* Boutons */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition font-semibold"
                  >
                    Passer
                  </button>
                  <button
                    onClick={handleSubmitRating}
                    disabled={examRating === 0}
                    className={`px-6 py-2 rounded-lg transition font-semibold flex items-center gap-2 ${
                      examRating === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                  >
                    ✓ Envoyer mon avis
                  </button>
                </div>
              </div>
            </div>
          )}

          {ratingSubmitted && (
            <div className="bg-green-50 border-t-2 border-green-200 px-6 py-6 text-center">
              <p className="text-lg font-bold text-green-700">✅ Merci pour votre avis !</p>
              <p className="text-sm text-green-600 mt-2">Fermeture automatique...</p>
            </div>
          )}

          {/* Bouton Fermer */}
          {ratingSubmitted && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-bold"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vue sélection d'examen
  if (!selectedExam) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Concours Blancs</h2>
            </div>
            <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded-lg transition">
              ✕
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun concours disponible pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map(exam => {
                  const now = new Date();

                  // Parse dates correctly in local timezone
                  const [startYear, startMonth, startDay] = exam.dateDebut.split('-').map(Number);
                  const [endYear, endMonth, endDay] = (exam.dateFin || exam.dateDebut).split('-').map(Number);
                  const [startHour, startMin] = (exam.heureDebut || '00:00').split(':').map(Number);
                  const [endHour, endMin] = (exam.heureFin || '23:59').split(':').map(Number);

                  const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMin, 0);
                  const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMin, 59);

                  const isAvailable = now >= startDateTime && now <= endDateTime;
                  const isUpcoming = now < startDateTime;

                  return (
                    <div
                      key={exam.id}
                      className={`border-2 rounded-lg p-6 transition ${
                        isAvailable
                          ? 'border-green-400 bg-green-50'
                          : isUpcoming
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-red-400 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{exam.titre}</h3>
                          <p className="text-gray-600 text-sm mt-1">{exam.description}</p>
                          <div className="flex gap-6 mt-3 text-sm text-gray-600">
                            <span>📋 {exam.epreuves?.length || 0} épreuves</span>
                            <span>❓ {exam.epreuves?.reduce((sum, e) => sum + (e.questions?.length || 0), 0) || 0} questions</span>
                            <span>⏱️ {exam.dureeTotal} min</span>
                          </div>

                          {/* Statut de disponibilité */}
                          <div className="mt-4">
                            {isAvailable ? (
                              <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                ✅ Examen en cours - Disponible jusqu'au {formatDateLocal(exam.dateFin || exam.dateDebut)} à {exam.heureFin}
                              </div>
                            ) : isUpcoming ? (
                              <div className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                ⏳ Disponible à partir du {formatDateLocal(exam.dateDebut)} à {exam.heureDebut}
                              </div>
                            ) : (
                              <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                ❌ Examen terminé le {formatDateLocal(exam.dateFin || exam.dateDebut)} à {exam.heureFin}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartExam(exam)}
                          disabled={!isAvailable}
                          className={`px-6 py-2 rounded-lg transition font-semibold ml-4 flex-shrink-0 ${
                            isAvailable
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {isAvailable ? 'Commencer' : 'Non disponible'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vue examen
  const stats = getProgressStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-2xl w-[calc(100%-16px)] h-[calc(100%-16px)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 flex justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">{selectedExam.titre}</h2>
            <p className="text-blue-100 text-xs mt-0.5">{selectedExam.epreuves?.length || 0} épreuves - {stats?.totalQuestions || 0} questions</p>
          </div>
          <div className="text-right flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <div className={`text-3xl font-bold tabular-nums ${
                timeLeft && timeLeft < 300 ? 'text-red-300 animate-pulse' : 'text-white'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-blue-100">Temps</p>
            </div>
            <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition">
              ✕
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="bg-blue-50 px-6 py-2 border-b border-blue-200">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-bold text-gray-700">Progression: {stats?.answeredQuestions}/{stats?.totalQuestions}</span>
            <span className="font-bold text-blue-600">{stats?.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
              style={{ width: `${stats?.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Contenu - Layout 2 colonnes */}
        <div className="flex-1 flex overflow-hidden">
          {/* Colonne gauche - PDF */}
          <div className="w-3/4 border-r border-gray-200 overflow-hidden flex flex-col">
            {currentEpreuveId && selectedExam.epreuves?.find(e => e.id === currentEpreuveId)?.pdfUrl ? (
              <div className="flex flex-col h-full">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600">
                    📄 {selectedExam.epreuves?.find(e => e.id === currentEpreuveId)?.titre}
                  </p>
                </div>
                <iframe
                  src={selectedExam.epreuves?.find(e => e.id === currentEpreuveId)?.pdfUrl + '#zoom=75&view=FitH'}
                  className="flex-1 w-full border-0"
                  title="PDF Épreuve"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <p className="text-center text-gray-500 text-sm">
                  {currentEpreuveId ? '📄 Pas de PDF pour cette épreuve' : '← Sélectionnez une épreuve'}
                </p>
              </div>
            )}
          </div>

          {/* Colonne droite - Questions */}
          <div className="w-1/4 overflow-y-auto p-2 space-y-2">
            {selectedExam.epreuves && selectedExam.epreuves.map((epreuve) => (
              <div key={epreuve.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête épreuve */}
                <button
                  onClick={() => {
                    toggleEpreuve(epreuve.id);
                    setCurrentEpreuveId(epreuve.id);
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between transition ${
                    currentEpreuveId === epreuve.id
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-l-blue-600'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                  }`}
                >
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-sm">{epreuve.titre}</h3>
                    <p className="text-xs text-gray-600">
                      📋 {epreuve.questions?.length || 0} | ✅ {epreuve.questions?.filter(q => responses[q.id])?.length || 0}
                      {epreuve.pdfUrl && ' | 📄'}
                    </p>
                  </div>
                  {expandedEpreuves[epreuve.id] ? (
                    <ChevronUp className="w-4 h-4 text-gray-700 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-700 flex-shrink-0" />
                  )}
                </button>

                {/* Questions */}
                {expandedEpreuves[epreuve.id] && (
                  <div className="bg-white p-2 space-y-2 border-t border-gray-200">
                    {epreuve.questions && epreuve.questions.map((question) => (
                      <div key={question.id} className="pb-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start gap-2 mb-1">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white font-bold text-xs">
                              {question.numero}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-xs">Q{question.numero}</h4>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {question.points || 1}pts
                            </p>
                          </div>
                          {responses[question.id] && (
                            <div className="flex-shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-5 gap-1.5 ml-6">
                          {['A', 'B', 'C', 'D', 'E'].map(option => (
                            <button
                              key={option}
                              onClick={() => handleResponseChange(question.id, option)}
                              className={`p-1.5 rounded text-sm border-2 transition font-bold ${
                                responses[question.id] === option
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>

                        {/* Indicateur */}
                        <div className="ml-6 mt-1 text-xs">
                          {responses[question.id] ? (
                            <span className="text-green-600 font-semibold">✓ {responses[question.id]}</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Boutons action */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={() => onClose()}
            className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition font-semibold"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmitExam}
            disabled={submitting || stats?.answeredQuestions === 0}
            className={`px-8 py-3 rounded-lg transition font-bold text-white flex items-center gap-2 ${
              submitting || stats?.answeredQuestions === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {submitting ? (
              <>⏳ Submission...</>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Soumettre l'examen ({stats?.answeredQuestions}/{stats?.totalQuestions})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlancExamStudent;
