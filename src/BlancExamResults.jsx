import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Eye, TrendingUp, Medal, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const BlancExamResults = ({ exam, onBack }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState('score'); // score, name, epreuve

  useEffect(() => {
    loadResults();
  }, [exam.id]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'blanc_answers'),
        where('examId', '==', exam.id)
      );
      const snapshot = await getDocs(q);

      const resultsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const studentRef = await getDocs(
            query(collection(db, 'students'), where('matricule', '==', data.studentMatricule))
          );

          const studentInfo = studentRef.docs[0]?.data() || {};

          return {
            id: doc.id,
            ...data,
            studentName: studentInfo.fullName || data.studentMatricule,
            studentMatricule: data.studentMatricule
          };
        })
      );

      setResults(resultsData);
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcul statistiques
  const calculateStats = () => {
    if (results.length === 0) return null;

    const scores = results.map(r => r.totalScore || 0);
    const totalMax = exam.epreuves.reduce((sum, e) => sum + (e.questions.reduce((s, q) => s + (q.points || 1), 0)), 0);

    return {
      total: results.length,
      moyenne: (scores.reduce((a, b) => a + b, 0) / results.length).toFixed(2),
      max: Math.max(...scores).toFixed(2),
      min: Math.min(...scores).toFixed(2),
      totalMax: totalMax
    };
  };

  const getSortedResults = () => {
    const sorted = [...results];
    if (sortBy === 'score') {
      sorted.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.studentName.localeCompare(b.studentName));
    }
    return sorted;
  };

  const exportToExcel = () => {
    const stats = calculateStats();
    const data = [];

    data.push(['CONCOURS BLANC - RÉSULTATS']);
    data.push([exam.titre]);
    data.push(['']);
    data.push(['STATISTIQUES']);
    data.push(['Total étudiants', stats.total]);
    data.push(['Moyenne', stats.moyenne]);
    data.push(['Score max', stats.max]);
    data.push(['Score min', stats.min]);
    data.push(['Score max possible', stats.totalMax]);
    data.push(['']);
    data.push(['CLASSEMENT']);
    data.push(['Rang', 'Matricule', 'Nom', 'Score', 'Pourcentage']);

    getSortedResults().forEach((result, idx) => {
      const percentage = ((result.totalScore || 0) / stats.totalMax * 100).toFixed(2);
      data.push([
        idx + 1,
        result.studentMatricule,
        result.studentName,
        result.totalScore || 0,
        `${percentage}%`
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
    XLSX.writeFile(wb, `resultats_${exam.titre}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const stats = calculateStats();
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // En-tête
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('CONCOURS BLANC - RÉSULTATS', 105, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(exam.titre, 105, yPos, { align: 'center' });
    yPos += 10;

    // Statistiques
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('STATISTIQUES', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const statsData = [
      ['Total étudiants', stats.total.toString()],
      ['Moyenne', stats.moyenne],
      ['Score max', `${stats.max} / ${stats.totalMax}`],
      ['Score min', `${stats.min} / ${stats.totalMax}`]
    ];

    statsData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 25, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Classement
    doc.setFont(undefined, 'bold');
    doc.text('CLASSEMENT', 20, yPos);
    yPos += 8;

    // Table
    const tableData = getSortedResults().slice(0, 50).map((result, idx) => {
      const percentage = ((result.totalScore || 0) / stats.totalMax * 100).toFixed(1);
      return [
        (idx + 1).toString(),
        result.studentMatricule,
        result.studentName.substring(0, 20),
        `${result.totalScore || 0}/${stats.totalMax}`,
        `${percentage}%`
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Rang', 'Matricule', 'Nom', 'Score', '%']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 25 }, 2: { cellWidth: 50 } }
    });

    doc.save(`resultats_${exam.titre}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const stats = calculateStats();
  const sortedResults = getSortedResults();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{exam.titre}</h3>
          <p className="text-gray-600 text-sm mt-1">Résultats du concours blanc</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition"
        >
          ← Retour
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-sm text-blue-700 font-semibold">Participants</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
            <div className="text-sm text-green-700 font-semibold">Moyenne</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.moyenne}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border-2 border-yellow-200">
            <div className="text-sm text-yellow-700 font-semibold">Maximum</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.max}</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border-2 border-red-200">
            <div className="text-sm text-red-700 font-semibold">Minimum</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.min}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
            <div className="text-sm text-purple-700 font-semibold">Max possible</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{stats.totalMax}</div>
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div className="flex gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="score">Trier par score (↓)</option>
          <option value="name">Trier par nom</option>
        </select>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-semibold"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>

        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-semibold"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Chargement des résultats...</p>
        </div>
      ) : sortedResults.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun résultat pour le moment</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Rang</th>
                <th className="px-4 py-3 text-left font-bold">Matricule</th>
                <th className="px-4 py-3 text-left font-bold">Nom</th>
                <th className="px-4 py-3 text-center font-bold">Score</th>
                <th className="px-4 py-3 text-center font-bold">%</th>
                {exam.epreuves && exam.epreuves.map(ep => (
                  <th key={ep.id} className="px-4 py-3 text-center font-bold text-xs">{ep.titre.substring(0, 10)}</th>
                ))}
                <th className="px-4 py-3 text-center font-bold">Détails</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, idx) => {
                const percentage = stats ? ((result.totalScore || 0) / stats.totalMax * 100).toFixed(1) : 0;
                const medalColor = idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-500' : '';

                return (
                  <tr key={result.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-bold">
                      <span className={medalColor}>
                        {idx < 3 ? '🏅' : ''} {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{result.studentMatricule}</td>
                    <td className="px-4 py-3">{result.studentName}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">
                      {result.totalScore || 0}/{stats?.totalMax || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{percentage}%</td>
                    {exam.epreuves && exam.epreuves.map(ep => {
                      const epreuveScore = result.epreuves?.[ep.id]?.score || 0;
                      const epreuveMax = ep.questions.reduce((sum, q) => sum + (q.points || 1), 0);
                      return (
                        <td key={ep.id} className="px-4 py-3 text-center text-sm">
                          {epreuveScore}/{epreuveMax}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedStudent(result)}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center gap-1 mx-auto"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détails étudiant */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent.studentName}</h3>
                <p className="text-gray-600">Matricule: {selectedStudent.studentMatricule}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {exam.epreuves && exam.epreuves.map(epreuve => {
                const epreuveData = selectedStudent.epreuves?.[epreuve.id];
                if (!epreuveData) return null;

                return (
                  <div key={epreuve.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                    <h4 className="font-bold text-gray-900 mb-3">{epreuve.titre}</h4>
                    <div className="space-y-2 text-sm">
                      {epreuve.questions && epreuve.questions.map(question => {
                        const studentAnswer = epreuveData.reponses?.[question.id];
                        const isCorrect = studentAnswer === question.bonneReponse;

                        return (
                          <div key={question.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <span className="font-semibold">Q{question.numero}</span>
                              <span className="text-gray-600 ml-2">
                                Réponse: <strong>{studentAnswer || '—'}</strong>
                                {!isCorrect && <span className="text-red-600 ml-2">(Correct: {question.bonneReponse})</span>}
                              </span>
                            </div>
                            <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {isCorrect ? '+' : '-'}{question.points || 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t font-bold text-right">
                      Score: {epreuveData.score || 0} / {epreuve.questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlancExamResults;
