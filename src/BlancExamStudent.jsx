import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Send, BookOpen, BarChart3, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore';

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
    setResponses({});
    setSubmitted(false);
    setStartTime(Date.now()); // Démarrer le chronomètre
    setTimeLeft(exam.dureeTotal * 60);

    // Expand all épreuves par défaut
    const expanded = {};
    exam.epreuves?.forEach((ep, idx) => {
      expanded[ep.id] = idx === 0; // Expand first one
    });
    setExpandedEpreuves(expanded);
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

          {/* Bouton Fermer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-bold"
            >
              Fermer
            </button>
          </div>
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
                  const startDateTime = new Date(`${exam.dateDebut}T${exam.heureDebut}`);
                  const endDateTime = new Date(`${exam.dateDebut}T${exam.heureFin}`);
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
                                ✅ Examen en cours - Disponible jusqu'à {exam.heureFin}
                              </div>
                            ) : isUpcoming ? (
                              <div className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                ⏳ Disponible à partir du {new Date(exam.dateDebut).toLocaleDateString('fr-FR')} à {exam.heureDebut}
                              </div>
                            ) : (
                              <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                ❌ Examen terminé le {new Date(exam.dateDebut).toLocaleDateString('fr-FR')} à {exam.heureFin}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{selectedExam.titre}</h2>
            <p className="text-blue-100 text-sm mt-1">{selectedExam.epreuves?.length || 0} épreuves - {stats?.totalQuestions || 0} questions</p>
          </div>
          <div className="text-right flex items-center gap-6">
            <div>
              <div className={`text-4xl font-bold tabular-nums ${
                timeLeft && timeLeft < 300 ? 'text-red-300 animate-pulse' : 'text-white'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-blue-100">Temps restant</p>
            </div>
            <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded-lg transition">
              ✕
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Progression: {stats?.answeredQuestions}/{stats?.totalQuestions} questions</span>
            <span className="text-sm font-bold text-blue-600">{stats?.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
              style={{ width: `${stats?.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {selectedExam.epreuves && selectedExam.epreuves.map((epreuve) => (
            <div key={epreuve.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
              {/* En-tête épreuve */}
              <button
                onClick={() => toggleEpreuve(epreuve.id)}
                className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 px-6 py-4 flex items-center justify-between transition"
              >
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">{epreuve.titre}</h3>
                  <p className="text-sm text-gray-600">
                    📋 {epreuve.questions?.length || 0} questions |
                    ✅ {epreuve.questions?.filter(q => responses[q.id])?.length || 0} répondues
                  </p>
                </div>
                {expandedEpreuves[epreuve.id] ? (
                  <ChevronUp className="w-6 h-6 text-gray-700" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-700" />
                )}
              </button>

              {/* Questions */}
              {expandedEpreuves[epreuve.id] && (
                <div className="bg-white p-6 space-y-6 border-t border-gray-200">
                  {epreuve.questions && epreuve.questions.map((question) => (
                    <div key={question.id} className="pb-6 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                            {question.numero}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">Question {question.numero}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Points: <strong>{question.points || 1}</strong>
                          </p>
                        </div>
                        {responses[question.id] && (
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 ml-14">
                        {['A', 'B', 'C', 'D'].map(option => (
                          <button
                            key={option}
                            onClick={() => handleResponseChange(question.id, option)}
                            className={`p-4 rounded-lg border-2 transition font-bold text-lg ${
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
                      <div className="ml-14 mt-3 text-sm">
                        {responses[question.id] ? (
                          <span className="text-green-600 font-semibold">✓ Réponse: <strong>{responses[question.id]}</strong></span>
                        ) : (
                          <span className="text-gray-500">Pas de réponse</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
