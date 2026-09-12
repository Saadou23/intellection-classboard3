import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

const PriceManager = ({ onBack }) => {
  const [prices, setPrices] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [packPrice, setPackPrice] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger depuis la même source que ClassBoard
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSubjects(data.subjects || []);
        setProfessors(data.professors || []);
        setLevels(data.levels || []);
      }

      // Charger les prix existants (structure: prices/{niveau}/{matière}/{professeur})
      const pricesRef = doc(db, 'settings', 'prices');
      const pricesSnap = await getDoc(pricesRef);
      if (pricesSnap.exists()) {
        setPrices(pricesSnap.data());
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (level, subject, professor) => {
    return prices[level]?.[subject]?.[professor] || { unitPrice: '', packPrice: '' };
  };

  const handleSavePrice = async () => {
    if (!selectedLevel || !selectedSubject || !selectedProfessor || !unitPrice) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setSaving(true);
    try {
      const priceData = {
        unitPrice: parseFloat(unitPrice),
        packPrice: parseFloat(packPrice) || 0,
        updatedAt: new Date().toISOString()
      };

      const pricesRef = doc(db, 'settings', 'prices');
      const updatedPrices = { ...prices };

      if (!updatedPrices[selectedLevel]) {
        updatedPrices[selectedLevel] = {};
      }
      if (!updatedPrices[selectedLevel][selectedSubject]) {
        updatedPrices[selectedLevel][selectedSubject] = {};
      }
      updatedPrices[selectedLevel][selectedSubject][selectedProfessor] = priceData;

      await setDoc(pricesRef, updatedPrices);

      setPrices(updatedPrices);
      setUnitPrice('');
      setPackPrice('');
      setSelectedProfessor('');
      setEditingKey(null);
      alert('Prix sauvegardé avec succès!');
    } catch (error) {
      alert('Erreur sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrice = async (level, subject, professor) => {
    if (!window.confirm('Supprimer ce prix?')) return;

    setSaving(true);
    try {
      const updatedPrices = { ...prices };
      if (updatedPrices[level]?.[subject]) {
        delete updatedPrices[level][subject][professor];
        if (Object.keys(updatedPrices[level][subject]).length === 0) {
          delete updatedPrices[level][subject];
        }
        if (Object.keys(updatedPrices[level]).length === 0) {
          delete updatedPrices[level];
        }
      }

      const pricesRef = doc(db, 'settings', 'prices');
      await setDoc(pricesRef, updatedPrices);

      setPrices(updatedPrices);
      alert('Prix supprimé avec succès!');
    } catch (error) {
      alert('Erreur suppression: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditPrice = (level, subject, professor) => {
    const price = getPrice(level, subject, professor);
    setSelectedLevel(level);
    setSelectedSubject(subject);
    setSelectedProfessor(professor);
    setUnitPrice(price.unitPrice);
    setPackPrice(price.packPrice);
    setEditingKey(`${level}-${subject}-${professor}`);
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Niveau</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {levels.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

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
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : (editingKey ? 'Modifier' : 'Ajouter')}
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
                    <th className="px-6 py-3 text-left text-sm font-bold">Niveau</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Matière</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Professeur</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Prix Unitaire</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Prix Pack +3</th>
                    <th className="px-6 py-3 text-left text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(prices).flatMap(([level, subjList]) =>
                    Object.entries(subjList).flatMap(([subject, profList]) =>
                      Object.entries(profList).map(([professor, priceData], idx) => (
                        <tr
                          key={`${level}-${subject}-${professor}`}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-6 py-3 text-sm font-semibold text-blue-700">{level}</td>
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
                              onClick={() => handleEditPrice(level, subject, professor)}
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-bold"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeletePrice(level, subject, professor)}
                              className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="text-xs font-bold">Supprimer</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )
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
