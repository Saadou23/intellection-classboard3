import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Calendar, Edit2, Save, X, AlertCircle, Trash2, Plus } from 'lucide-react';

const PeriodEditor = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    type: 'ramadan'
  });

  const branches = ['Hay Salam', 'Doukkali', 'Saada'];

  useEffect(() => {
    loadPeriods();
  }, []);

  // Source unique : settings/branches (lue par ClassBoard et BranchManager)
  const readSettingsBranches = async () => {
    const snap = await getDoc(doc(db, 'settings', 'branches'));
    return snap.exists() ? (snap.data().branches || []) : [];
  };

  // Les périodes sont communes à toutes les filiales : on écrit la même liste partout
  const writeBranchPeriods = async (updatedPeriods) => {
    const branchList = await readSettingsBranches();
    const newBranches = branchList.map(b => ({ ...b, exceptionalPeriods: updatedPeriods }));
    await setDoc(doc(db, 'settings', 'branches'), {
      branches: newBranches,
      lastUpdated: new Date().toISOString()
    });
  };

  // Liste commune : union des périodes (dédoublonnées par ID) de toutes les filiales
  const loadPeriods = async () => {
    setLoading(true);
    try {
      const branchList = await readSettingsBranches();
      const merged = new Map();
      branchList.forEach(b => (b.exceptionalPeriods || []).forEach(p => {
        if (!merged.has(p.id)) merged.set(p.id, p);
      }));
      setPeriods([...merged.values()]);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      alert('Erreur lors du chargement des périodes');
      setPeriods([]);
    }
    setLoading(false);
  };

  const startEdit = (period) => {
    console.log('✏️ Édition de:', period);
    setEditForm(period);
    setEditingId(period.id);
  };

  const cancelEdit = () => {
    setEditForm({ id: '', name: '', startDate: '', endDate: '', type: 'ramadan' });
    setEditingId(null);
  };

  const saveEdit = async (periodId) => {
    if (!editForm.name || !editForm.startDate || !editForm.endDate) {
      alert('⚠️ Tous les champs sont obligatoires');
      return;
    }

    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      alert('⚠️ La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);
    try {
      const updatedPeriods = periods.map(p => 
        p.id === periodId ? editForm : p
      );

      await writeBranchPeriods(updatedPeriods);

      setPeriods(updatedPeriods);
      setEditingId(null);
      alert('✅ Période modifiée avec succès !');
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setLoading(false);
  };

  const deletePeriod = async (periodId) => {
    if (!confirm('⚠️ Supprimer cette période ?\n\nATTENTION : Les sessions avec cette période ne seront plus affichées !')) {
      return;
    }

    setLoading(true);
    try {
      const updatedPeriods = periods.filter(p => p.id !== periodId);

      await writeBranchPeriods(updatedPeriods);

      setPeriods(updatedPeriods);
      alert('✅ Période supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
    setLoading(false);
  };

  const addNewPeriod = async () => {
    if (!editForm.name || !editForm.startDate || !editForm.endDate) {
      alert('⚠️ Tous les champs sont obligatoires');
      return;
    }

    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      alert('⚠️ La date de fin doit être après la date de début');
      return;
    }

    setLoading(true);
    try {
      // ID unique : évite que deux périodes du même type s'écrasent
      const newPeriod = {
        ...editForm,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedPeriods = [...periods, newPeriod];

      await writeBranchPeriods(updatedPeriods);
      
      setPeriods(updatedPeriods);
      setShowAddModal(false);
      setEditForm({ id: '', name: '', startDate: '', endDate: '', type: 'ramadan' });
      alert('✅ Période ajoutée avec succès !');
    } catch (error) {
      console.error('❌ Erreur ajout:', error);
      alert('❌ Erreur lors de l\'ajout');
    }
    setLoading(false);
  };

  // Récupère les périodes enregistrées par l'ancien éditeur dans branches/{filiale}
  const importLegacyPeriods = async () => {
    setLoading(true);
    try {
      const legacyPeriods = [];
      for (const name of branches) {
        const legacySnap = await getDoc(doc(db, 'branches', name));
        if (legacySnap.exists()) legacyPeriods.push(...(legacySnap.data().exceptionalPeriods || []));
      }
      const existingIds = new Set(periods.map(p => p.id));
      const toAdd = [];
      legacyPeriods.forEach(p => {
        if (!existingIds.has(p.id)) {
          existingIds.add(p.id);
          toAdd.push(p);
        }
      });

      if (toAdd.length === 0) {
        alert('Aucune ancienne période à récupérer');
      } else {
        const updatedPeriods = [...periods, ...toAdd];
        await writeBranchPeriods(updatedPeriods);
        setPeriods(updatedPeriods);
        alert(`✅ ${toAdd.length} période(s) récupérée(s)`);
      }
    } catch (error) {
      console.error('❌ Erreur import:', error);
      alert('❌ Erreur lors de la récupération');
    }
    setLoading(false);
  };

  const isPeriodActive = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  };

  const isPeriodFuture = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(period.startDate);
    start.setHours(0, 0, 0, 0);
    return today < start;
  };

  const isPeriodPast = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(period.endDate);
    end.setHours(0, 0, 0, 0);
    return today > end;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <Calendar className="w-12 h-12" />
          <div>
            <h2 className="text-2xl font-bold">Éditeur de Périodes Exceptionnelles</h2>
            <p className="text-purple-100 text-sm">Modifiez les dates de début et fin des périodes (Ramadan, Vacances...)</p>
          </div>
        </div>
      </div>

      <>
          {/* Bouton Ajouter */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              Périodes communes (toutes les filiales : {branches.join(', ')})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={importLegacyPeriods}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50"
              >
                Récupérer les anciennes périodes
              </button>
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setEditForm({ id: '', name: '', startDate: '', endDate: '', type: 'ramadan' });
                }}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                Ajouter une période
              </button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>🔍 Debug:</strong> {periods.length} période(s) chargée(s)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Ouvrez la console (F12) pour voir les logs détaillés
            </p>
          </div>

          {/* Liste des périodes */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4">Chargement...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune période exceptionnelle</h3>
              <p className="text-gray-600 mb-4">Cliquez sur "Ajouter une période" pour commencer</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Note :</strong> Si vous avez déjà créé des périodes via "Gestion des Filiales", 
                  elles devraient apparaître ici. Si ce n'est pas le cas, vérifiez la console (F12) pour voir 
                  où elles sont stockées dans Firebase.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {periods.map(period => {
                const isActive = isPeriodActive(period);
                const isFuture = isPeriodFuture(period);
                const isPast = isPeriodPast(period);
                const isEditing = editingId === period.id;

                return (
                  <div
                    key={period.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                      isActive ? 'border-green-500' : 
                      isFuture ? 'border-blue-500' : 
                      'border-gray-300'
                    }`}
                  >
                    {isEditing ? (
                      // Mode ÉDITION
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-800">
                            ✏️ Modification : {period.name}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(period.id)}
                              disabled={loading}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            >
                              <Save className="w-4 h-4" />
                              Sauvegarder
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                            >
                              <X className="w-4 h-4" />
                              Annuler
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Nom</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              📅 Date de début
                            </label>
                            <input
                              type="date"
                              value={editForm.startDate}
                              onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              📅 Date de fin
                            </label>
                            <input
                              type="date"
                              value={editForm.endDate}
                              onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                            />
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Important :</strong> Le système basculera automatiquement à minuit le premier et dernier jour.
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Mode AFFICHAGE
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-gray-800">{period.name}</h4>
                            {isActive && (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                                ● EN COURS
                              </span>
                            )}
                            {isFuture && (
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                                ⏱ À VENIR
                              </span>
                            )}
                            {isPast && (
                              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                                ✓ TERMINÉE
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(period)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePeriod(period.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              Du <strong>{formatDate(period.startDate)}</strong> au{' '}
                              <strong>{formatDate(period.endDate)}</strong>
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 mt-2">
                            ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{period.id}</code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </>

      {/* Modal Ajouter */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-2xl font-bold">Nouvelle Période</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Nom *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                  placeholder="Ex: Ramadan 2026"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Date début *</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Date fin *</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                >
                  <option value="ramadan">🌙 Ramadan</option>
                  <option value="vacances">🏖️ Vacances</option>
                  <option value="examens">📚 Examens</option>
                  <option value="autre">📅 Autre</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Cette période sera ajoutée à toutes les filiales ({branches.join(', ')})
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={addNewPeriod}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodEditor;