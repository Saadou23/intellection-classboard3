import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, CheckCircle, Users, Edit2 } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const GroupConstitution = ({ onClose }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [matriculesInput, setMatriculesInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [groupsWithStudents, setGroupsWithStudents] = useState({});
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingMatricules, setEditingMatricules] = useState([]);

  // ===== FONCTIONS UTILITAIRES =====
  const parseMatricules = (text) => {
    return text
      .split('\n')
      .map(line => line.trim().toUpperCase())
      .filter(mat => mat.length > 0);
  };

  const loadGroups = async () => {
    try {
      const doc_ref = doc(db, 'settings', 'groups');
      const snapshot = await getDoc(doc_ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGroups(data.list || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
    }
  };

  const loadAllGroupStudents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'group_students'));
      const groupMap = {};

      for (const doc_item of snapshot.docs) {
        const { group, matricule } = doc_item.data();
        if (!groupMap[group]) {
          groupMap[group] = [];
        }
        groupMap[group].push(matricule);
      }

      setGroupsWithStudents(groupMap);
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error);
    }
  };

  const checkDuplicatesInGroup = async (matricules, targetGroup) => {
    const duplicates = [];

    for (const mat of matricules) {
      const matDoc = doc(db, 'group_students', `${targetGroup}_${mat}`);
      const snapshot = await getDoc(matDoc);
      if (snapshot.exists()) {
        duplicates.push(mat);
      }
    }

    return duplicates;
  };

  const saveMatricules = async (matricules, group) => {
    try {
      for (const mat of matricules) {
        const docId = `${group}_${mat}`;
        await setDoc(doc(db, 'group_students', docId), {
          group: group,
          matricule: mat,
          addedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  };

  // ===== HANDLERS =====
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      setMessage('Entrez le nom du groupe');
      return;
    }

    if (groups.includes(newGroupName)) {
      setMessage('Ce groupe existe déjà');
      return;
    }

    const updatedGroups = [...groups, newGroupName];
    try {
      await setDoc(doc(db, 'settings', 'groups'), { list: updatedGroups });
      setGroups(updatedGroups);
      setNewGroupName('');
      setShowNewGroupForm(false);
      setMessage('✅ Groupe créé avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Erreur lors de la création');
    }
  };

  const handleImportMatricules = async () => {
    if (!selectedGroup) {
      setMessage('Sélectionnez un groupe');
      return;
    }

    const matricules = parseMatricules(matriculesInput);
    if (matricules.length === 0) {
      setMessage('Aucun matricule détecté');
      return;
    }

    setLoading(true);
    try {
      const duplicates = await checkDuplicatesInGroup(matricules, selectedGroup);
      const newMatricules = matricules.filter(mat => !duplicates.includes(mat));

      if (newMatricules.length === 0) {
        setMessage('⚠️ Tous ces matricules sont déjà dans ce groupe');
        setLoading(false);
        return;
      }

      await saveMatricules(newMatricules, selectedGroup);

      if (duplicates.length > 0) {
        setMessage(`✅ ${newMatricules.length} matricules ajoutés (${duplicates.length} déjà présents ignorés)`);
      } else {
        setMessage(`✅ ${newMatricules.length} matricules importés dans ${selectedGroup}`);
      }

      setMatriculesInput('');
      await loadAllGroupStudents();
      setTimeout(() => setMessage(''), 4000);

    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupToDelete) => {
    if (window.confirm(`Supprimer le groupe "${groupToDelete}" ? Les matricules resteront dans d'autres groupes s'ils y sont assignés.`)) {
      try {
        const updatedGroups = groups.filter(g => g !== groupToDelete);
        await setDoc(doc(db, 'settings', 'groups'), { list: updatedGroups });

        const snapshot = await getDocs(collection(db, 'group_students'));
        for (const doc_item of snapshot.docs) {
          if (doc_item.data().group === groupToDelete) {
            await deleteDoc(doc_item.ref);
          }
        }

        setGroups(updatedGroups);
        if (selectedGroup === groupToDelete) {
          setSelectedGroup('');
        }
        setMessage('✅ Groupe supprimé');
        await loadAllGroupStudents();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('❌ Erreur lors de la suppression');
      }
    }
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setEditingMatricules([...(groupsWithStudents[group] || [])]);
  };

  const saveGroupEdits = async () => {
    try {
      const oldMatricules = groupsWithStudents[editingGroup] || [];
      const newMatricules = editingMatricules;

      const matriculesToAdd = newMatricules.filter(m => !oldMatricules.includes(m));
      for (const mat of matriculesToAdd) {
        const docId = `${editingGroup}_${mat}`;
        await setDoc(doc(db, 'group_students', docId), {
          group: editingGroup,
          matricule: mat,
          addedAt: new Date().toISOString()
        });
      }

      const matriculesToRemove = oldMatricules.filter(m => !newMatricules.includes(m));
      for (const mat of matriculesToRemove) {
        const docId = `${editingGroup}_${mat}`;
        await deleteDoc(doc(db, 'group_students', docId));
      }

      setGroupsWithStudents({
        ...groupsWithStudents,
        [editingGroup]: newMatricules
      });

      setMessage(`✅ ${editingGroup} mis à jour (${newMatricules.length} matricules)`);
      setEditingGroup(null);
      setEditingMatricules([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (groups.length > 0) {
      loadAllGroupStudents();
    }
  }, [groups]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users size={28} />
            <h2 className="text-2xl font-bold">Constitution des Groupes</h2>
          </div>
          <button onClick={onClose} className="hover:bg-blue-800 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
              message.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              {message.includes('✅') ? <CheckCircle size={20} /> : <span>⚠️</span>}
              {message}
            </div>
          )}

          {/* Section Créer un Groupe */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-blue-900">Créer un nouveau groupe</h3>
            {showNewGroupForm ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nom du groupe (ex: SM1, SE2...)"
                  className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                />
                <button
                  onClick={handleAddGroup}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                  <Save size={18} /> Créer
                </button>
                <button
                  onClick={() => {
                    setShowNewGroupForm(false);
                    setNewGroupName('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewGroupForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <Plus size={18} /> Créer un groupe
              </button>
            )}
          </div>

          {/* Section Importer Matricules */}
          <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-green-900">Importer des matricules</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sélectionner le groupe
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Choisir un groupe --</option>
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Coller les matricules (un par ligne)
              </label>
              <textarea
                value={matriculesInput}
                onChange={(e) => setMatriculesInput(e.target.value)}
                placeholder="MED00125&#10;MED00148&#10;MED00167&#10;MED00201"
                className="w-full h-32 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">
                {parseMatricules(matriculesInput).length} matricule(s) détecté(s)
              </p>
            </div>

            <button
              onClick={handleImportMatricules}
              disabled={loading || !selectedGroup || !matriculesInput.trim()}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition font-semibold flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Importation...' : 'Importer dans le groupe'}
            </button>
          </div>

          {/* Liste des groupes avec matricules */}
          {groups.length > 0 && (
            <div className="border-l-4 border-gray-400 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3 text-gray-900">Groupes existants</h3>
              <div className="space-y-2">
                {groups.map((group) => {
                  const count = groupsWithStudents[group]?.length || 0;
                  return (
                    <div
                      key={group}
                      className="flex justify-between items-center p-3 bg-white border border-gray-300 rounded-lg"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">{group}</span>
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {count} étudiant{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditGroup(group)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1 text-sm"
                        >
                          <Edit2 size={16} /> Gérer
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1 text-sm"
                        >
                          <Trash2 size={16} /> Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition du groupe */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gérer : {editingGroup}</h2>
              <button
                onClick={() => setEditingGroup(null)}
                className="hover:bg-blue-800 p-2 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Zone pour ajouter des matricules */}
              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-green-900">Ajouter des matricules</h3>
                <textarea
                  placeholder="MED00125&#10;MED00148&#10;MED00167"
                  className="w-full h-20 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                  onBlur={(e) => {
                    const newMats = parseMatricules(e.target.value);
                    const combined = [...new Set([...editingMatricules, ...newMats])];
                    setEditingMatricules(combined);
                    e.target.value = '';
                  }}
                />
                <p className="text-xs text-gray-600 mt-1">Collez les matricules et confirmez</p>
              </div>

              {/* Liste des matricules actuels */}
              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-blue-900">
                  Matricules dans {editingGroup} ({editingMatricules.length})
                </h3>

                {editingMatricules.length === 0 ? (
                  <p className="text-gray-600 italic">Aucun matricule dans ce groupe</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {editingMatricules.map((mat) => (
                      <div
                        key={mat}
                        className="flex justify-between items-center bg-white p-3 border border-blue-300 rounded-lg"
                      >
                        <span className="font-mono font-semibold text-blue-700">{mat}</span>
                        <button
                          onClick={() => setEditingMatricules(editingMatricules.filter(m => m !== mat))}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={saveGroupEdits}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Enregistrer les modifications
                </button>
                <button
                  onClick={() => setEditingGroup(null)}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupConstitution;
