import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, AlertCircle, Eye, Edit2, X } from 'lucide-react';
import { getProfessors, saveProfessorSalary, getProfessorSalariesByMonth } from './OTPService';
import { db } from './firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

const AdminSalaryManager = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const SALARY_PASSWORD = 'Mdp123..s';

  const [professors, setProfessors] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [amount, setAmount] = useState('');
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingSalary, setEditingSalary] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');

  const handlePasswordSubmit = () => {
    if (!passwordInput) {
      setPasswordError('Veuillez entrer le mot de passe');
      return;
    }

    if (passwordInput === SALARY_PASSWORD) {
      setAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('❌ Mot de passe incorrect');
      setPasswordInput('');
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadProfessors();
      loadSalaries();
    }
  }, [selectedMonth, authenticated, showAllHistory]);

  const loadProfessors = async () => {
    try {
      const profs = await getProfessors();
      setProfessors(profs);
    } catch (e) {
      setError('Erreur de chargement des professeurs');
    }
  };

  const loadSalaries = async () => {
    setLoading(true);
    try {
      if (showAllHistory) {
        // Charger tous les salaires de tous les mois
        console.log('🔄 Chargement de l\'historique complet');
        const { getDocs, collection, query } = await import('firebase/firestore');
        const q = query(collection(db, 'professor_salaries'));
        const snap = await getDocs(q);
        const allSalaries = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })).sort((a, b) => (b.createdAt?.toDate?.() || new Date(0)) - (a.createdAt?.toDate?.() || new Date(0)));
        console.log('✅ Historique chargé:', allSalaries.length);
        setSalaries(allSalaries);
      } else {
        // Charger les salaires du mois courant
        console.log('🔄 Chargement des salaires pour le mois:', selectedMonth);
        const data = await getProfessorSalariesByMonth(selectedMonth);
        console.log('✅ Salaires chargés:', data);
        setSalaries(data);
      }
    } catch (e) {
      console.error('❌ Erreur lors du chargement des salaires:', e);
      setError('Erreur: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalary = async () => {
    if (!selectedProfessor || !amount || parseFloat(amount) <= 0) {
      setError('Veuillez remplir tous les champs correctement');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const prof = professors.find(p => p.id === selectedProfessor);
      console.log('💾 Sauvegarde du salaire:', {
        professorId: selectedProfessor,
        professorName: prof.name,
        month: selectedMonth,
        amount: parseFloat(amount)
      });

      const salaryId = await saveProfessorSalary(selectedProfessor, prof.name, selectedMonth, parseFloat(amount));
      console.log('✅ Salaire sauvegardé avec ID:', salaryId);

      setSuccess(`✅ Salaire de ${prof.name} ajouté pour ${selectedMonth}`);
      setSelectedProfessor('');
      setAmount('');

      console.log('🔄 Rechargement de la liste...');
      await loadSalaries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error('❌ Erreur lors de l\'ajout:', e);
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSalary = salary => {
    setEditingSalary(salary);
    setEditAmount(String(salary.amount));
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      setError('Montant invalide');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const salaryRef = doc(db, 'professor_salaries', editingSalary.id);
      await updateDoc(salaryRef, { amount: parseFloat(editAmount) });

      setSuccess(`✅ Salaire modifié: ${editAmount} DH`);
      setEditingSalary(null);
      setEditAmount('');
      await loadSalaries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSalary = async salaryId => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce salaire?')) {
      return;
    }

    setSaving(true);
    try {
      const salaryRef = doc(db, 'professor_salaries', salaryId);
      await updateDoc(salaryRef, { status: 'deleted' });

      setSuccess('✅ Salaire marqué comme supprimé');
      await loadSalaries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePermanentlyDelete = async salaryId => {
    if (!window.confirm('⚠️ ATTENTION: Suppression DÉFINITIVE! Cette action est irréversible!')) {
      return;
    }

    setSaving(true);
    try {
      const salaryRef = doc(db, 'professor_salaries', salaryId);
      await deleteDoc(salaryRef);

      setSuccess('✅ Salaire supprimé définitivement');
      await loadSalaries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePurgeAllDeleted = async () => {
    const deletedCount = salaries.filter(s => s.status === 'deleted').length;

    if (deletedCount === 0) {
      setError('Aucun salaire supprimé à nettoyer');
      return;
    }

    if (!window.confirm(`⚠️ Supprimer définitivement ${deletedCount} salaire(s) supprimé(s)? Irréversible!`)) {
      return;
    }

    setSaving(true);
    try {
      for (const salary of salaries.filter(s => s.status === 'deleted')) {
        const salaryRef = doc(db, 'professor_salaries', salary.id);
        await deleteDoc(salaryRef);
      }

      setSuccess(`✅ ${deletedCount} salaire(s) supprimé(s) définitivement`);
      await loadSalaries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const getTotalAmount = () => {
    return salaries.filter(s => s.status !== 'deleted').reduce((sum, s) => sum + (s.amount || 0), 0);
  };

  const getPendingCount = () => {
    return salaries.filter(s => s.status === 'pending').length;
  };

  const getCollectedCount = () => {
    return salaries.filter(s => s.status === 'collected').length;
  };

  // Password authentication screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <DollarSign className="w-12 h-12 text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold">🔒 Accès Sécurisé</h1>
              <p className="text-gray-400">Gestion des Salaires des Professeurs</p>
            </div>

            <form onSubmit={e => { e.preventDefault(); handlePasswordSubmit(); }} className="space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Entrez le mot de passe"
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-3 text-white"
                autoFocus
              />

              {passwordError && (
                <div className="bg-red-900/30 border border-red-500 rounded p-3 text-red-200 text-sm">
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg transition font-semibold"
              >
                Accéder
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-green-400" />
        <h2 className="text-2xl font-bold">Gestion des Salaires des Professeurs</h2>
      </div>

      {/* Filter Options */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
        <h3 className="font-semibold mb-3">🔍 Filtres</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2">Filtrer par mois (optionnel)</label>
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white w-full"
            />
          </div>

          <button
            onClick={() => setFilterMonth('')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-semibold text-sm"
          >
            Tous les mois
          </button>
        </div>
      </div>

      {/* Add Salary Form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
        <h3 className="font-semibold">➕ Ajouter un salaire</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Professeur</label>
            <select
              value={selectedProfessor}
              onChange={e => setSelectedProfessor(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="">— Choisir un professeur —</option>
              {professors.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Montant (DH)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Montant à percevoir"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddSalary}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-6 py-2 rounded-lg transition font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded p-3 text-red-200 flex gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-500 rounded p-3 text-green-200 text-sm">
            {success}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-900/30 border border-blue-500 rounded p-4 text-center">
          <div className="text-2xl font-bold text-blue-300">{salaries.length}</div>
          <div className="text-sm text-blue-200">Entrées totales</div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-500 rounded p-4 text-center">
          <div className="text-2xl font-bold text-yellow-300">{getPendingCount()}</div>
          <div className="text-sm text-yellow-200">En attente de collecte</div>
        </div>
        <div className="bg-green-900/30 border border-green-500 rounded p-4 text-center">
          <div className="text-2xl font-bold text-green-300">{getCollectedCount()}</div>
          <div className="text-sm text-green-200">Collectées</div>
        </div>
      </div>

      {/* Salaries List */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            📋 Tous les Salaires {filterMonth && `- ${filterMonth}`}
          </h3>
          {salaries.some(s => s.status === 'deleted') && (
            <button
              onClick={handlePurgeAllDeleted}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 px-3 py-1 rounded text-sm transition flex items-center gap-1"
              title="Supprimer définitivement tous les salaires supprimés"
            >
              🗑️ Nettoyer
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Chargement...</div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Aucun salaire</div>
        ) : (
          <div className="space-y-3">
            {salaries
              .filter(s => !filterMonth || s.month === filterMonth)
              .map(salary => (
              <div
                key={salary.id}
                className={`p-4 rounded-lg border ${
                  salary.status === 'pending'
                    ? 'bg-yellow-900/20 border-yellow-500'
                    : salary.status === 'collected'
                    ? 'bg-green-900/20 border-green-500'
                    : 'bg-gray-900/20 border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-lg">{salary.professorName}</div>
                  <div className="font-bold text-lg">{salary.amount.toLocaleString('fr-FR')} DH</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-400 mb-3">
                  <div>
                    <span className="text-gray-500">Mois:</span> {salary.month}
                  </div>
                  <div>
                    <span className="text-gray-500">Statut:</span> {' '}
                    <span className={
                      salary.status === 'pending' ? 'text-yellow-400' :
                      salary.status === 'collected' ? 'text-green-400' :
                      'text-red-400'
                    }>
                      {salary.status === 'pending' ? '⏳ En attente' : salary.status === 'collected' ? '✅ Collecté' : '❌ Supprimé'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Créé:</span> {' '}
                    {salary.createdAt?.toDate?.()
                      ? new Date(salary.createdAt.toDate()).toLocaleString('fr-FR')
                      : '—'}
                  </div>
                </div>

                {salary.collectedAt && (
                  <div className="bg-green-900/30 rounded p-3 mb-3 text-green-200 text-sm space-y-2">
                    <div>
                      <span className="font-semibold">📅 Collecté le:</span> {' '}
                      {new Date(salary.collectedAt.toDate()).toLocaleString('fr-FR')}
                      {salary.collectedBy && <span> - Par: {salary.collectedBy}</span>}
                    </div>
                    {salary.comment && (
                      <div className="bg-yellow-900/30 rounded p-2 mt-2 border-l-4 border-yellow-500">
                        <span className="font-semibold">💬 Commentaire:</span> {' '}
                        <span className="text-yellow-100">{salary.comment}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end flex-wrap">
                  {salary.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleEditSalary(salary)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition flex items-center gap-1"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteSalary(salary.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition flex items-center gap-1"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </>
                  )}

                  {salary.status === 'deleted' && (
                    <button
                      onClick={() => handlePermanentlyDelete(salary.id)}
                      disabled={saving}
                      className="bg-red-700 hover:bg-red-800 disabled:bg-red-900 px-3 py-1 rounded text-sm transition flex items-center gap-1"
                      title="Supprimer définitivement"
                    >
                      🗑️ Supprimer définitivement
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-6 pt-4 border-t border-gray-700 font-bold flex justify-between">
              <span>Montant total:</span>
              <span className="text-green-400">{getTotalAmount().toLocaleString('fr-FR')} DH</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSalary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Modifier le salaire</h3>
              <button
                onClick={() => setEditingSalary(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Professeur: <span className="font-semibold text-white">{editingSalary.professorName}</span></p>
              <p className="text-sm text-gray-400 mb-4">Mois: <span className="font-semibold text-white">{editingSalary.month}</span></p>

              <label className="block text-sm font-semibold mb-2">Nouveau montant (DH)</label>
              <input
                type="number"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                step="0.01"
                min="0"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded p-3 text-red-200 flex gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-2 rounded-lg transition font-semibold"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                onClick={() => setEditingSalary(null)}
                disabled={saving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 px-6 py-2 rounded-lg transition font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSalaryManager;
