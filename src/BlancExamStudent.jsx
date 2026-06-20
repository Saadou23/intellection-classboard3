import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Send, BookOpen, BarChart3 } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';

const BlancExamStudent = ({ studentMatricule, onClose }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentEpreuveIndex, setCurrentEpreuveIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [examStartTime, setExamStartTime] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

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

  const handleStartExam = (exam) => {
    setSelectedExam(exam);
    setCurrentEpreuveIndex(0);
    setResponses({});
    setSubmitted(false);
    setExamStartTime(Date.now());
    setTimeLeft(null);
  };

  // Minuteur
  useEffect(() => {
    if (!selectedExam || submitted) return;

    if (!timeLeft && examStartTime) {
      const currentEpreuve = selectedExam.epreuves[currentEpreuveIndex];
      setTimeLeft(currentEpreuve.duree * 60);
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (currentEpreuveIndex < selectedExam.epreuves.length - 1) {
            handleNextEpreuve();
          }
          return (selectedExam.epreuves[currentEpreuveIndex + 1]?.duree || 60) * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedExam, currentEpreuveIndex, timeLeft, examStartTime, submitted]);

  const handleResponseChange = (questionId, response) => {
    setResponses({
      ...responses,
      [questionId]: response
    });
  };

  const handleNextEpreuve = () => {
    if (currentEpreuveIndex < selectedExam.epreuves.length - 1) {
      setCurrentEpreuveIndex(currentEpreuveIndex + 1);
      setTimeLeft(null);
    }
  };

  const handlePreviousEpreuve = () => {
    if (currentEpreuveIndex > 0) {
      setCurrentEpreuveIndex(currentEpreuveIndex - 1);
      setTimeLeft(null);
    }
  };

  const handleSubmitExam = async () => {
    if (!window.confirm('Êtes-vous sûr? Vous ne pourrez pas modifier vos réponses après submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      // Calculer le score
      let totalScore = 0;
      const epreuvesData = {};

      selectedExam.epreuves.forEach((epreuve, idx) => {
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

      // Sauvegarder les réponses
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
      alert(`✅ Examen soumis! Votre score: ${totalScore} points`);
    } catch (error) {
      console.error('Erreur submission:', error);
      alert('❌ Erreur lors de la submission');
    } finally {
      setSubmitting(false);
    }
  };

  // Format temps
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Vue initiale - Sélection d'examen
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
                {exams.map(exam => (
                  <div key={exam.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{exam.titre}</h3>
                        <p className="text-gray-600 text-sm mt-1">{exam.description}</p>
                        <div className="flex gap-6 mt-3 text-sm text-gray-600">
                          <span>📅 {new Date(exam.dateExamen).toLocaleDateString('fr-FR')}</span>
                          <span>📋 {exam.epreuves?.length || 0} épreuves</span>
                          <span>❓ {exam.epreuves?.reduce((sum, e) => sum + (e.questions?.length || 0), 0) || 0} questions</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartExam(exam)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-semibold ml-4 flex-shrink-0"
                      >
                        Commencer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vue examen - Répondre aux questions
  const currentEpreuve = selectedExam.epreuves[currentEpreuveIndex];
  const totalEpreuves = selectedExam.epreuves.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{selectedExam.titre}</h2>
            <p className="text-blue-100 text-sm mt-1">
              Épreuve {currentEpreuveIndex + 1}/{totalEpreuves}: {currentEpreuve.titre}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${timeLeft && timeLeft < 300 ? 'text-red-300' : 'text-white'}`}>
              {timeLeft ? formatTime(timeLeft) : '--:--'}
            </div>
            <div className="text-sm text-blue-100">Temps restant</div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold text-gray-700">
              <span>Progression</span>
              <span>{currentEpreuveIndex + 1}/{totalEpreuves}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                style={{ width: `${((currentEpreuveIndex + 1) / totalEpreuves) * 100}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {currentEpreuve.questions && currentEpreuve.questions.map((question) => (
              <div key={question.id} className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
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
                </div>

                {/* Options de réponse */}
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

                {/* Indicateur réponse */}
                <div className="ml-14 mt-3 text-sm">
                  {responses[question.id] ? (
                    <span className="text-blue-600 font-semibold">✓ Votre réponse: <strong>{responses[question.id]}</strong></span>
                  ) : (
                    <span className="text-gray-500">Aucune réponse</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Boutons navigation */}
          <div className="flex gap-3 justify-between pt-6 border-t">
            <button
              onClick={handlePreviousEpreuve}
              disabled={currentEpreuveIndex === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                currentEpreuveIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              ← Épreuve précédente
            </button>

            <div className="flex gap-3">
              {currentEpreuveIndex < totalEpreuves - 1 ? (
                <button
                  onClick={handleNextEpreuve}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  Épreuve suivante →
                </button>
              ) : (
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className={`px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {submitting ? (
                    <>⏳ Submission...</>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Soumettre l'examen
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlancExamStudent;
