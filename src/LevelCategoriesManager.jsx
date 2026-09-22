import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Edit2 } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LevelCategoriesManager = ({ allLevels, onClose }) => {
  const [categories, setCategories] = useState({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📚');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const commonIcons = ['🏫', '🎓', '📚', '📖', '✏️', '🎒', '👨‍🎓', '👩‍🎓', '📝', '🔬', '🧮', '🌍'];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const docRef = doc(db, 'settings', 'levelCategories');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCategories(docSnap.data().categories || {});
      } else {
        // Catégories par défaut
        setCategories({
          '🏫 Primaire': ['6 PRIMAIRE'],
          '🎓 Collège': ['1AC', '2AC', '3AC'],
          '📚 Lycée': ['TRONC COMMUN', '1 BAC SC ECO', '1 BAC SEXP', '1 BAC SM', '2 BAC S.EXP & TECH', '2 BAC ECO', '2 BAC SM A & B'],
        });
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const saveCategories = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'levelCategories'), {
        categories: categories
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Veuillez entrer un nom de catégorie');
      return;
    }

    const categoryKey = `${newCategoryIcon} ${newCategoryName}`;

    if (categories[categoryKey]) {
      alert('Cette catégorie existe déjà');
      return;
    }

    setCategories({
      ...categories,
      [categoryKey]: []
    });

    setNewCategoryName('');
    setNewCategoryIcon('📚');
  };

  const deleteCategory = (categoryKey) => {
    if (window.confirm(`Supprimer la catégorie "${categoryKey}" ?`)) {
      const newCategories = { ...categories };
      delete newCategories[categoryKey];
      setCategories(newCategories);
    }
  };

  const updateCategory = (oldKey, newKey) => {
    if (newKey !== oldKey && categories[newKey]) {
      alert('Cette catégorie existe déjà');
      return;
    }

    const newCategories = { ...categories };
    newCategories[newKey] = newCategories[oldKey];
    delete newCategories[oldKey];
    setCategories(newCategories);
    setEditingCategory(null);
  };

  const addLevelToCategory = (categoryKey, level) => {
    if (categories[categoryKey].includes(level)) {
      alert(`${level} est déjà dans cette catégorie`);
      return;
    }

    setCategories({
      ...categories,
      [categoryKey]: [...categories[categoryKey], level]
    });
  };

  const removeLevelFromCategory = (categoryKey, level) => {
    setCategories({
      ...categories,
      [categoryKey]: categories[categoryKey].filter(l => l !== level)
    });
  };

  const getAvailableLevels = () => {
    const usedLevels = new Set();
    Object.values(categories).forEach(levels => {
      levels.forEach(level => usedLevels.add(level));
    });
    return allLevels.filter(level => !usedLevels.has(level));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">⚙️ Gérer les catégories de niveaux</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Ajouter une nouvelle catégorie */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Ajouter une nouvelle catégorie</h3>
            <div className="flex gap-2 flex-wrap">
              <select
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-lg w-14"
              >
                {commonIcons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la catégorie (ex: Lycée)"
                className="border border-gray-300 rounded px-3 py-1 flex-1 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>

          {/* Catégories existantes */}
          <div className="space-y-3">
            {Object.entries(categories).map(([categoryKey, levels]) => (
              <div key={categoryKey} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                {editingCategory === categoryKey ? (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 flex-1 text-sm"
                    />
                    <button
                      onClick={() => updateCategory(categoryKey, editName)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800">{categoryKey}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(categoryKey);
                          setEditName(categoryKey);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCategory(categoryKey)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Niveaux dans la catégorie */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {levels.length === 0 ? (
                    <span className="text-xs text-gray-500 italic">Aucun niveau</span>
                  ) : (
                    levels.map(level => (
                      <span
                        key={level}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        {level}
                        <button
                          onClick={() => removeLevelFromCategory(categoryKey, level)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Ajouter des niveaux */}
                {getAvailableLevels().length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addLevelToCategory(categoryKey, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="">+ Ajouter un niveau...</option>
                    {getAvailableLevels().map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            {saved && (
              <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                ✓ Sauvegardé !
              </span>
            )}
            <button
              onClick={onClose}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Fermer
            </button>
            <button
              onClick={saveCategories}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelCategoriesManager;
