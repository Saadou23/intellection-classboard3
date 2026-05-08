import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, User } from 'lucide-react';
import { getCheckoutQuestions } from './OTPService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import * as XLSX from 'xlsx';

const CheckoutResponsesViewer = () => {
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDirecteur, setFilterDirecteur] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [directeurs, setDirecteurs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [questionsData, responsesData] = await Promise.all([
        getCheckoutQuestions(),
        loadCheckoutResponses()
      ]);
      setQuestions(questionsData);
      setResponses(responsesData);

      const uniqueDirecteurs = [...new Set(responsesData.map(r => r.directeurName))];
      setDirecteurs(uniqueDirecteurs);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCheckoutResponses = async () => {
    try {
      const q = query(
        collection(db, 'checkout_responses'),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.() || new Date()
      }));
    } catch (e) {
      console.error('Error loading responses:', e);
      return [];
    }
  };

  const getFilteredResponses = () => {
    return responses.filter(r => {
      if (filterDirecteur && r.directeurName !== filterDirecteur) return false;
      if (filterDateStart) {
        const start = new Date(filterDateStart);
        if (r.timestamp < start) return false;
      }
      if (filterDateEnd) {
        const end = new Date(filterDateEnd);
        end.setHours(23, 59, 59, 999);
        if (r.timestamp > end) return false;
      }
      return true;
    });
  };

  const exportToExcel = () => {
    const filteredData = getFilteredResponses();

    const excelData = filteredData.map(response => {
      const row = {
        'Directeur': response.directeurName,
        'Date': response.timestamp.toLocaleDateString('fr-FR'),
        'Heure': response.timestamp.toLocaleTimeString('fr-FR')
      };

      questions.forEach(question => {
        row[question.text] = response.responses[question.id] || '—';
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Réponses');
    XLSX.writeFile(wb, 'reponses_checkout.xlsx');
  };

  const filteredResponses = getFilteredResponses();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-400">Chargement des réponses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-teal-400" />
        <h2 className="text-2xl font-bold">Réponses aux Questionnaires de Checkout</h2>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
        <h3 className="font-semibold mb-4">🔍 Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Directeur</label>
            <select
              value={filterDirecteur}
              onChange={e => setFilterDirecteur(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="">— Tous les directeurs —</option>
              {directeurs.map(dir => (
                <option key={dir} value={dir}>
                  {dir}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">De</label>
            <input
              type="date"
              value={filterDateStart}
              onChange={e => setFilterDateStart(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">À</label>
            <input
              type="date"
              value={filterDateEnd}
              onChange={e => setFilterDateEnd(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
        </div>
        <button
          onClick={exportToExcel}
          disabled={filteredResponses.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition font-semibold flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter Excel
        </button>
      </div>

      {/* Results Info */}
      <div className="bg-blue-900/30 border border-blue-500 rounded p-4 text-blue-200 text-sm">
        <p><strong>{filteredResponses.length}</strong> réponse(s) trouvée(s)</p>
      </div>

      {/* Responses List */}
      {filteredResponses.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400 border border-gray-700">
          Aucune réponse trouvée
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResponses.map(response => (
            <div key={response.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                    <User className="w-5 h-5 text-teal-400" />
                    {response.directeurName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {response.timestamp.toLocaleDateString('fr-FR')} à {response.timestamp.toLocaleTimeString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-3">
                {questions.map((question, idx) => (
                  <div key={question.id} className="bg-gray-700/50 rounded p-4">
                    <p className="text-sm font-semibold text-gray-300 mb-2">
                      {idx + 1}. {question.text}
                      {question.required && <span className="text-red-400 ml-1">*</span>}
                    </p>
                    <p className="text-white text-sm bg-gray-600/50 rounded p-3 whitespace-pre-wrap">
                      {response.responses[question.id] || <span className="text-gray-500">— Pas de réponse —</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckoutResponsesViewer;
