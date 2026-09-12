import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, get, set, update, remove } from 'firebase/database';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

const PriceManager = ({ onBack }) => {
  const [prices, setPrices] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [packPrice, setPackPrice] = useState('');
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const sessionsRef = ref(db, 'sessions');
      const snapshot = await get(sessionsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const subjectsSet = new Set();
        const professorsSet = new Set();

        Object.values(data).forEach(branch => {
          if (Array.isArray(branch)) {
            branch.forEach(session => {
              if (session.subject) subjectsSet.add(session.subject);
              if (session.professor) professorsSet.add(session.professor);
            });
          }
        });

        setSubjects(Array.from(subjectsSet).sort());
        setProfessors(Array.from(professorsSet).sort());
      }

      const pricesRef = ref(db, 'prices');
      const pricesSnapshot = await get(pricesRef);
      if (pricesSnapshot.exists()) {
        setPrices(pricesSnapshot.val());
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (subject, professor) => {
    return prices[subject]?.[professor] || { unitPrice: '', packPrice: '' };
  };

  const handleSavePrice = async () => {
    if (!selectedSubject || !selectedProfessor || !unitPrice) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      const priceData = {
        unitPrice: parseFloat(unitPrice),
        packPrice: parseFloat(packPrice) || 0,
        updatedAt: new Date().toISOString()
      };

      const pricePath = `prices/${selectedSubject}/${selectedProfessor}`;
      await set(ref(db, pricePath), priceData);

      setPrices(prev => ({
        ...prev,
        [selectedSubject]: {
          ...(prev[selectedSubject] || {}),
          [selectedProfessor]: priceData
        }
      }));

      setUnitPrice('');
      setPackPrice('');
      setSelectedProfessor('');
      setEditingKey(null);
    } catch (error) {
      alert('Erreur sauvegarde: ' + error.message);
    }
  };

  const handleDeletePrice = async (subject, professor) => {
    if (!window.confirm('Supprimer ce prix?')) return;

    try {
      await remove(ref(db, `prices/${subject}/${professor}`));

      setPrices(prev => {
        const updated = { ...prev };
        if (updated[subject]) {
          const newSubject = { ...updated[subject] };
          delete newSubject[professor];
          if (Object.keys(newSubject).length === 0) {
            delete updated[subject];
          } else {
            updated[subject] = newSubject;
          }
        }
        return updated;
      });
    } catch (error) {
      alert('Erreur suppression: ' + error.message);
    }
  };

  const handleEditPrice = (subject, professor) => {
    const price = getPrice(subject, professor);
    setSelectedSubject(subject);
    setSelectedProfessor(professor);
    setUnitPrice(price.unitPrice);
    setPackPrice(price.packPrice);
    setEditingKey(`${subject}-${professor}`);
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
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="hover:bg-blue-800 p-2 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">💰 Gestion des Prix</h1>
            <p className="text-blue-200">Gérer les prix unitaires et pack par matière/professeur</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Ajouter/Modifier un Prix</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Matière</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Professeur</label>
              <select
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {professors.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Prix Unitaire (DH)</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Ex: 150"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Prix Pack +3 (DH)</label>
              <input
                type="number"
                value={packPrice}
                onChange={(e) => setPackPrice(e.target.value)}
                placeholder="Ex: 400"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSavePrice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
          >
            <Save className="w-4 h-4" />
            {editingKey ? 'Modifier' : 'Ajouter'}
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Prix Enregistrés</h2>
            <p className="text-gray-600 text-sm mt-1">
              Total: {Object.values(prices).reduce((sum, subj) => sum + Object.keys(subj).length, 0)} prix
            </p>
          </div>

          {Object.keys(prices).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucun prix enregistré. Ajoutez-en un pour commencer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold">Matière</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Professeur</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Prix Unitaire</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Prix Pack +3</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(prices).flatMap(([subject, profList]) =>
                    Object.entries(profList).map(([professor, priceData], idx) => (
                      <tr
                        key={`${subject}-${professor}`}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-6 py-3 text-sm">{subject}</td>
                        <td className="px-6 py-3 text-sm">{professor}</td>
                        <td className="px-6 py-3 text-sm font-bold text-green-600">
                          {priceData.unitPrice} DH
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-blue-600">
                          {priceData.packPrice} DH
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          <button
                            onClick={() => handleEditPrice(subject, professor)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-bold"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeletePrice(subject, professor)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="text-xs font-bold">Supprimer</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceManager;
