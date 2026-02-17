import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart3, TrendingUp, Users, Award, CheckCircle, XCircle, Share2, Copy, Download, Eye } from 'lucide-react';
import QRCode from 'qrcode';

const ProfessorDashboard = ({ professorId, professorName }) => {
  const [myExams, setMyExams] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyData();
  }, [professorId]);

  const loadMyData = async () => {
    setLoading(true);
    try {
      // Charger MES examens uniquement
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const myExamsList = examsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(exam => exam.createdBy === professorId);
      
      setMyExams(myExamsList);

      // Charger tous les résultats
      const resultsSnapshot = await getDocs(collection(db, 'exam-attempts'));
      const allResults = resultsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      }));

      // Filtrer : seulement résultats de MES examens
      const myExamIds = myExamsList.map(e => e.id);
      const myResults = allResults.filter(r => myExamIds.includes(r.examId));

      setResults(myResults);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
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
      failed: totalAttempts - passed,
      passRate: Math.round((passed / totalAttempts) * 100),
      avgScore
    };
  };

  const handleShareExam = async (exam) => {
    setShowShareModal(exam);
    
    // Générer le lien
    const examUrl = `${window.location.origin}/test-niveau?exam=${exam.id}&prof=${professorId}`;
    
    // Générer QR Code
    try {
      const qr = await QRCode.toDataURL(examUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#3B82F6',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error('Erreur QR:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('✅ Lien copié !');
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `QR_${showShareModal.title.replace(/ /g, '_')}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  // Vue détaillée d'un examen
  if (selectedExam) {
    const examResults = results.filter(r => r.examId === selectedExam.id);
    const stats = getExamStats(selectedExam.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setSelectedExam(null)}
              className="mb-4 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-all"
            >
              ← Retour
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{selectedExam.title}</h1>
                <p className="text-blue-100 mt-2">
                  {selectedExam.level} • {selectedExam.subject} • {selectedExam.examType || 'Test de niveau'}
                </p>
              </div>
              <button
                onClick={() => handleShareExam(selectedExam)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-50 transition-all"
              >
                <Share2 className="w-5 h-5" />
                Partager
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalAttempts}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Réussis</p>
                    <p className="text-3xl font-bold text-green-600">{stats.passed}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Échoués</p>
                    <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.passRate}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Moyenne</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.avgScore}%</p>
                  </div>
                  <Award className="w-12 h-12 text-orange-500 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Tableau résultats ANONYMISÉS */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <h2 className="text-xl font-bold">Résultats (Anonymisés)</h2>
              <p className="text-blue-100 text-sm mt-1">
                Les données personnelles sont masquées pour respecter la confidentialité
              </p>
            </div>

            {examResults.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun résultat</h3>
                <p className="text-gray-600">Personne n'a encore passé cet examen</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Score</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Points</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Résultat</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Correctes</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {examResults
                      .sort((a, b) => b.submittedAt - a.submittedAt)
                      .map((result, index) => (
                        <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            Candidat #{examResults.length - index}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(result.submittedAt)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-bold ${
                              result.percentage >= 70 ? 'text-green-600' :
                              result.percentage >= 50 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {result.percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {result.score}/{result.totalPoints}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full font-medium ${
                              result.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.passed ? '✓ Réussi' : '✗ Échoué'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {result.correctAnswers}/{result.correctAnswers + result.wrongAnswers}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDuration(result.duration)}
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
  }

  // Vue liste de mes examens
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">📊 Mes Résultats</h1>
          <p className="text-blue-100 mt-2">Professeur: {professorName}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {myExams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun examen</h3>
            <p className="text-gray-600">Créez votre premier examen pour voir les résultats ici</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {myExams.map(exam => {
              const stats = getExamStats(exam.id);
              
              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
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

                      <div className="flex gap-6 text-sm text-gray-600 mb-4">
                        <span>📚 {exam.level}</span>
                        <span>📖 {exam.subject}</span>
                        <span>📝 {exam.questions?.length || 0} questions</span>
                        <span>⏱️ {exam.duration} min</span>
                        <span>💯 {exam.totalPoints} pts</span>
                      </div>

                      {stats ? (
                        <div className="flex gap-6 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <strong className="text-blue-600">{stats.totalAttempts}</strong> passages
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <strong className="text-purple-600">{stats.passRate}%</strong> réussite
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-orange-600" />
                            <strong className="text-orange-600">{stats.avgScore}%</strong> moyenne
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Aucun passage pour le moment</p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setSelectedExam(exam)}
                        className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                        title="Voir détails"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleShareExam(exam)}
                        className="p-3 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-all"
                        title="Partager"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Share2 className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Partager l'Examen</h2>
                    <p className="text-blue-100 text-sm">{showShareModal.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(null)}
                  className="bg-blue-700 hover:bg-blue-800 p-2 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Lien direct */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Lien Direct
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={`${window.location.origin}/test-niveau?exam=${showShareModal.id}&prof=${professorId}`}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/test-niveau?exam=${showShareModal.id}&prof=${professorId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                  >
                    <Copy className="w-5 h-5" />
                    Copier
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Partagez ce lien avec vos étudiants pour qu'ils passent l'examen
                </p>
              </div>

              {/* QR Code */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  QR Code
                </label>
                <div className="flex flex-col items-center gap-4">
                  {qrCodeUrl && (
                    <>
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                      </div>
                      <button
                        onClick={downloadQRCode}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                      >
                        <Download className="w-5 h-5" />
                        Télécharger le QR Code
                      </button>
                    </>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    Les étudiants peuvent scanner ce QR Code avec leur téléphone<br/>
                    pour accéder directement à l'examen
                  </p>
                </div>
              </div>

              {/* Instructions WhatsApp */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h4 className="font-bold text-green-900 mb-2">📱 Message WhatsApp :</h4>
                <div className="bg-white p-3 rounded border border-green-300 font-mono text-sm mb-3">
                  Bonjour,<br/>
                  Voici le lien pour passer l'examen "{showShareModal.title}" :<br/>
                  <br/>
                  🔗 {window.location.origin}/test-niveau?exam={showShareModal.id}&prof={professorId}<br/>
                  <br/>
                  Durée : {showShareModal.duration} minutes<br/>
                  Niveau : {showShareModal.level}<br/>
                  Matière : {showShareModal.subject}<br/>
                  <br/>
                  Bonne chance ! 🍀
                </div>
                <button
                  onClick={() => copyToClipboard(`Bonjour,\nVoici le lien pour passer l'examen "${showShareModal.title}" :\n\n🔗 ${window.location.origin}/test-niveau?exam=${showShareModal.id}&prof=${professorId}\n\nDurée : ${showShareModal.duration} minutes\nNiveau : ${showShareModal.level}\nMatière : ${showShareModal.subject}\n\nBonne chance ! 🍀`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  Copier le message WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;