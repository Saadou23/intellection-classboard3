import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Users, BookOpen, AlertCircle } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const SettingsManager = ({ onClose }) => {
  const [professors, setProfessors] = useState([]);
  const [levels, setLevels] = useState([]);
  const [newProfessor, setNewProfessor] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [editingLevel, setEditingLevel] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfessors(data.professors || []);
        setLevels(data.levels || []);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        professors: professors.sort(),
        levels: levels.sort(),
        lastUpdated: new Date().toISOString()
      });
      alert('✅ Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addProfessor = () => {
    if (newProfessor.trim()) {
      if (professors.includes(newProfessor.trim())) {
        alert('Ce professeur existe déjà');
        return;
      }
      setProfessors([...professors, newProfessor.trim()]);
      setNewProfessor('');
    }
  };

  const addLevel = () => {
    if (newLevel.trim()) {
      if (levels.includes(newLevel.trim())) {
        alert('Ce niveau existe déjà');
        return;
      }
      setLevels([...levels, newLevel.trim()]);
      setNewLevel('');
    }
  };

  const deleteProfessor = (prof) => {
    if (confirm(`Supprimer "${prof}" ?\n\nAttention : Cela n'affectera pas les séances déjà créées.`)) {
      setProfessors(professors.filter(p => p !== prof));
    }
  };

  const deleteLevel = (level) => {
    if (confirm(`Supprimer "${level}" ?\n\nAttention : Cela n'affectera pas les séances déjà créées.`)) {
      setLevels(levels.filter(l => l !== level));
    }
  };

  const updateProfessor = (oldProf, newProf) => {
    if (newProf.trim() && newProf !== oldProf) {
      if (professors.includes(newProf.trim())) {
        alert('Ce professeur existe déjà');
        return;
      }
      setProfessors(professors.map(p => p === oldProf ? newProf.trim() : p));
      setEditingProfessor(null);
    }
  };

  const updateLevel = (oldLevel, newLevel) => {
    if (newLevel.trim() && newLevel !== oldLevel) {
      if (levels.includes(newLevel.trim())) {
        alert('Ce niveau existe déjà');
        return;
      }
      setLevels(levels.map(l => l === oldLevel ? newLevel.trim() : l));
      setEditingLevel(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestion des Professeurs & Niveaux</h2>
            <p className="text-blue-100 text-sm mt-1">Configurez les listes déroulantes pour les emplois du temps</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Professeurs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Professeurs</h3>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                  {professors.length}
                </span>
              </div>

              {/* Ajouter nouveau */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ajouter un professeur
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProfessor}
                    onChange={(e) => setNewProfessor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addProfessor()}
                    placeholder="Ex: Mr. Ahmed Bennani"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addProfessor}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Liste */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {professors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun professeur ajouté</p>
                  </div>
                ) : (
                  professors.sort().map((prof, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-all"
                    >
                      {editingProfessor === prof ? (
                        <input
                          type="text"
                          defaultValue={prof}
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateProfessor(prof, e.target.value);
                            }
                          }}
                          onBlur={(e) => updateProfessor(prof, e.target.value)}
                          className="flex-1 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-gray-800">{prof}</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProfessor(prof)}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProfessor(prof)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Niveaux */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-800">Niveaux</h3>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                  {levels.length}
                </span>
              </div>

              {/* Ajouter nouveau */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ajouter un niveau
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLevel()}
                    placeholder="Ex: 1ère année"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={addLevel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Liste */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {levels.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun niveau ajouté</p>
                  </div>
                ) : (
                  levels.sort().map((level, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-all"
                    >
                      {editingLevel === level ? (
                        <input
                          type="text"
                          defaultValue={level}
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateLevel(level, e.target.value);
                            }
                          }}
                          onBlur={(e) => updateLevel(level, e.target.value)}
                          className="flex-1 border border-green-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      ) : (
                        <span className="text-gray-800">{level}</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingLevel(level)}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLevel(level)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Avertissement */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ces listes seront utilisées dans les formulaires d'ajout de séances</li>
                <li>La modification ou suppression n'affecte pas les séances déjà créées</li>
                <li>Pour un meilleur filtrage, utilisez des noms cohérents (ex: "1ère année" au lieu de "1ere année")</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {professors.length} professeur{professors.length > 1 ? 's' : ''} • {levels.length} niveau{levels.length > 1 ? 'x' : ''}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition-all"
            >
              Annuler
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
