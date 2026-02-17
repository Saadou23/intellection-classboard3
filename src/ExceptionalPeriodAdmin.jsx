import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Calendar, Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';

const ExceptionalPeriodAdmin = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  
  const [form, setForm] = useState({
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    type: 'ramadan'
  });

  const branches = ['Hay Salam', 'Doukkali', 'Saada'];

  useEffect(() => {
    if (selectedBranch) loadPeriods();
  }, [selectedBranch]);

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'branches', selectedBranch);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPeriods(docSnap.data().exceptionalPeriods || []);
      } else {
        setPeriods([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur chargement');
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setForm({ id: '', name: '', startDate: '', endDate: '', type: 'ramadan' });
    setEditingPeriod(null);
    setShowModal(true);
  };

  const openEditModal = (period) => {
    setForm(period);
    setEditingPeriod(period.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedBranch || !form.name || !form.startDate || !form.endDate) {
      alert('Remplissez tous les champs');
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      alert('Date de fin doit être après date de début');
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'branches', selectedBranch);
      
      let updatedPeriods;
      if (editingPeriod) {
        updatedPeriods = periods.map(p => p.id === editingPeriod ? form : p);
      } else {
        const newPeriod = { ...form, id: `${form.type}_${selectedBranch.toLowerCase().replace(/ /g, '_')}` };
        updatedPeriods = [...periods, newPeriod];
      }

      await setDoc(docRef, { exceptionalPeriods: updatedPeriods }, { merge: true });
      setPeriods(updatedPeriods);
      setShowModal(false);
      alert(editingPeriod ? 'Modifié ✅' : 'Ajouté ✅');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur sauvegarde');
    }
    setLoading(false);
  };

  const handleDelete = async (periodId) => {
    if (!confirm('Supprimer cette période ?')) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'branches', selectedBranch);
      const updatedPeriods = periods.filter(p => p.id !== periodId);
      await setDoc(docRef, { exceptionalPeriods: updatedPeriods }, { merge: true });
      setPeriods(updatedPeriods);
      alert('Supprimé ✅');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur suppression');
    }
    setLoading(false);
  };

  const isPeriodActive = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <Calendar className="w-12 h-12" />
          <div>
            <h2 className="text-2xl font-bold">Gestion Périodes Exceptionnelles</h2>
            <p className="text-purple-100">Gérez les périodes Ramadan, Vacances, Examens...</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">Sélectionner une filiale *</label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600"
        >
          <option value="">-- Choisir --</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {selectedBranch && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Périodes de {selectedBranch}</h3>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
              Ajouter une période
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : periods.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune période</h3>
              <p className="text-gray-600">Créez votre première période exceptionnelle</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {periods.map(period => {
                const active = isPeriodActive(period);
                return (
                  <div key={period.id} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${active ? 'border-green-500' : 'border-gray-300'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-bold">{period.name}</h4>
                          {active && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">● Active</span>}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>Du <strong>{new Date(period.startDate).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(period.endDate).toLocaleDateString('fr-FR')}</strong></span>
                        </div>
                        <div className="mt-2">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">ID: {period.id}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(period)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(period.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-2xl font-bold">{editingPeriod ? 'Modifier' : 'Nouvelle'} Période</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                  placeholder="Ex: Ramadan 2026"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Date début *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Date fin *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
                >
                  <option value="ramadan">🌙 Ramadan</option>
                  <option value="vacances">🏖️ Vacances</option>
                  <option value="examens">📚 Examens</option>
                  <option value="autre">📅 Autre</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">ℹ️ Important</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>L'ID est généré automatiquement : {form.type}_{selectedBranch.toLowerCase().replace(/ /g, '_')}</li>
                      <li>Les sessions doivent avoir le champ "period" égal à cet ID</li>
                      <li>Pendant la période, seules les sessions avec cet ID s'affichent</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Sauvegarde...' : editingPeriod ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionalPeriodAdmin;
