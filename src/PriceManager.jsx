import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, ArrowLeft, Download } from 'lucide-react';
import { getSessionLevels } from './levelUtils';

const PriceManager = ({ onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [prices, setPrices] = useState({});
  const [priceTable, setPriceTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les branches depuis settings/global
      const globalRef = doc(db, 'settings', 'global');
      const globalSnap = await getDoc(globalRef);

      let branchList = ['Hay Salam', 'Doukkali', 'Saada'];
      if (globalSnap.exists()) {
        const data = globalSnap.data();
        branchList = data.branches || branchList;
        setBranches(branchList);
      }

      // Charger les sessions de toutes les branches
      const allSessions = {};

      for (const branch of branchList) {
        const branchRef = doc(db, 'branches', branch);
        const branchSnap = await getDoc(branchRef);
        if (branchSnap.exists()) {
          allSessions[branch] = branchSnap.data().sessions || [];
        }
      }

      setSessions(allSessions);

      // Charger les prix existants
      const pricesRef = doc(db, 'settings', 'prices');
      const pricesSnap = await getDoc(pricesRef);
      if (pricesSnap.exists()) {
        setPrices(pricesSnap.data());
      }

      // Générer le tableau des combinaisons niveau/matière/prof
      generatePriceTable(allSessions);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePriceTable = (allSessions) => {
    const combinations = new Map();

    Object.entries(allSessions).forEach(([branch, branchSessions]) => {
      if (!Array.isArray(branchSessions)) return;

      branchSessions.forEach(session => {
        if (!session.subject || !session.professor) return;

        const sessionLevels = getSessionLevels(session);
        sessionLevels.forEach(level => {
          const key = `${level}|${session.subject}|${session.professor}`;
          if (!combinations.has(key)) {
            combinations.set(key, {
              level,
              subject: session.subject,
              professor: session.professor
            });
          }
        });
      });
    });

    const table = Array.from(combinations.values()).sort((a, b) => {
      if (a.level !== b.level) return a.level.localeCompare(b.level);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return a.professor.localeCompare(b.professor);
    });

    setPriceTable(table);
  };

  const getPrice = (level, subject, professor) => {
    return prices[level]?.[subject]?.[professor] || { unitPrice: '', packPrice: '' };
  };

  const handleUpdatePrice = async (level, subject, professor, unitPrice, packPrice) => {
    if (!unitPrice) return;

    try {
      const priceData = {
        unitPrice: parseFloat(unitPrice),
        packPrice: parseFloat(packPrice) || 0,
        updatedAt: new Date().toISOString()
      };

      const updatedPrices = { ...prices };

      if (!updatedPrices[level]) {
        updatedPrices[level] = {};
      }
      if (!updatedPrices[level][subject]) {
        updatedPrices[level][subject] = {};
      }
      updatedPrices[level][subject][professor] = priceData;

      const pricesRef = doc(db, 'settings', 'prices');
      await setDoc(pricesRef, updatedPrices);

      setPrices(updatedPrices);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const pricesRef = doc(db, 'settings', 'prices');
      await setDoc(pricesRef, prices);
      alert('✅ Tous les prix ont été sauvegardés!');
    } catch (error) {
      alert('Erreur sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="hover:bg-blue-800 p-2 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">💰 Gestion des Prix</h1>
              <p className="text-blue-200 text-sm">Basé sur les emplois du temps saisies</p>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold transition"
          >
            <Download className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer Tout'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600 text-lg">⏳ Chargement des données...</div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 font-bold">📋 Tableau pré-rempli avec les combinaisons extraites des emplois du temps</p>
            <p className="text-blue-800 text-sm mt-2">Total: <strong>{priceTable.length}</strong> combinaisons niveau/matière/professeur</p>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {priceTable.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg font-bold mb-2">Aucune combinaison trouvée</p>
                <p>Veuillez d'abord ajouter des séances dans l'emploi du temps</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-blue-100 border-b-2 border-blue-300 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Niveau</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Matière</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Professeur</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-blue-900">Prix Unitaire (DH)</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-blue-900">Prix Pack +3 (DH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceTable.map((row, idx) => {
                      const priceData = getPrice(row.level, row.subject, row.professor);
                      return (
                        <tr
                          key={`${row.level}-${row.subject}-${row.professor}`}
                          className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-blue-700">{row.level}</td>
                          <td className="px-6 py-4 text-sm">{row.subject}</td>
                          <td className="px-6 py-4 text-sm">{row.professor}</td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              value={priceData.unitPrice || ''}
                              onChange={(e) => {
                                const updated = { ...prices };
                                if (!updated[row.level]) updated[row.level] = {};
                                if (!updated[row.level][row.subject]) updated[row.level][row.subject] = {};
                                updated[row.level][row.subject][row.professor] = {
                                  ...priceData,
                                  unitPrice: e.target.value ? parseFloat(e.target.value) : ''
                                };
                                setPrices(updated);
                              }}
                              placeholder="0"
                              className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              value={priceData.packPrice || ''}
                              onChange={(e) => {
                                const updated = { ...prices };
                                if (!updated[row.level]) updated[row.level] = {};
                                if (!updated[row.level][row.subject]) updated[row.level][row.subject] = {};
                                updated[row.level][row.subject][row.professor] = {
                                  ...priceData,
                                  packPrice: e.target.value ? parseFloat(e.target.value) : ''
                                };
                                setPrices(updated);
                              }}
                              placeholder="0"
                              className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceManager;
