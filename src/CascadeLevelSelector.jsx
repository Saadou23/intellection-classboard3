import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const CascadeLevelSelector = ({ branches, selectedBranch, onBranchChange, onCategoryChange, onLevelChange, selectedCategory, selectedLevel, allSessions }) => {
  const [levelCategories, setLevelCategories] = useState({});
  const [availableLevels, setAvailableLevels] = useState([]);

  // Charger les catégories depuis Firebase
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const docRef = doc(db, 'settings', 'levelCategories');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setLevelCategories(docSnap.data().categories || getDefaultCategories());
      } else {
        setLevelCategories(getDefaultCategories());
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      setLevelCategories(getDefaultCategories());
    }
  };

  const getDefaultCategories = () => ({
    '🏫 Primaire': ['6 PRIMAIRE'],
    '🎓 Collège': ['1AC', '2AC', '3AC'],
    '📚 Lycée': ['TRONC COMMUN', '1 BAC SC ECO', '1 BAC SEXP', '1 BAC SM', '2 BAC S.EXP & TECH', '2 BAC ECO', '2 BAC SM A & B'],
  });

  // Obtenir les niveaux disponibles pour la branche sélectionnée
  useEffect(() => {
    if (selectedBranch) {
      const branchSessions = allSessions.filter(s => s.branch === selectedBranch);
      const levelsSet = new Set();
      branchSessions.forEach(s => {
        if (s.levels && Array.isArray(s.levels)) {
          s.levels.forEach(l => levelsSet.add(l));
        } else if (s.level) {
          levelsSet.add(s.level);
        }
      });
      setAvailableLevels([...levelsSet].sort());
    } else {
      setAvailableLevels([]);
    }
  }, [selectedBranch, allSessions]);

  // Obtenir les catégories disponibles avec les niveaux disponibles
  const getAvailableCategoriesWithLevels = () => {
    const available = {};
    Object.entries(levelCategories).forEach(([category, levels]) => {
      const availableLevelsInCategory = levels.filter(level => availableLevels.includes(level));
      if (availableLevelsInCategory.length > 0) {
        available[category] = availableLevelsInCategory;
      }
    });
    return available;
  };

  const availableCategories = getAvailableCategoriesWithLevels();
  const levelsInSelectedCategory = selectedCategory ? availableCategories[selectedCategory] || [] : [];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
      <div className="space-y-3">
        {/* STEP 1: Branch Selection */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            📍 Étape 1 : Sélectionnez un centre
          </label>
          <div className="flex flex-wrap gap-2">
            {branches.map(branch => (
              <button
                key={branch}
                onClick={() => {
                  onBranchChange(branch);
                  onCategoryChange(null);
                  onLevelChange('');
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  selectedBranch === branch
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                {selectedBranch === branch && <ChevronRight className="w-4 h-4" />}
                {branch}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: Category Selection */}
        {selectedBranch && (
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              📚 Étape 2 : Sélectionnez une catégorie
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  onCategoryChange(null);
                  onLevelChange('');
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  !selectedCategory
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-green-300 hover:border-green-500 hover:bg-green-50'
                }`}
              >
                {!selectedCategory && <ChevronRight className="w-4 h-4" />}
                Tous les niveaux
              </button>
              {Object.entries(availableCategories).map(([category, levels]) => (
                <button
                  key={category}
                  onClick={() => {
                    onCategoryChange(category);
                    onLevelChange('');
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-2 border-green-300 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  {selectedCategory === category && <ChevronRight className="w-4 h-4" />}
                  <span>{category}</span>
                  <span className="text-xs opacity-75">({levels.length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Level Selection */}
        {selectedBranch && selectedCategory && (
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              🎓 Étape 3 : Sélectionnez un niveau
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onLevelChange('')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  !selectedLevel
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                }`}
              >
                {!selectedLevel && <ChevronRight className="w-4 h-4" />}
                Tous les niveaux
              </button>
              {levelsInSelectedCategory.map(level => (
                <button
                  key={level}
                  onClick={() => onLevelChange(level)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    selectedLevel === level
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                  }`}
                >
                  {selectedLevel === level && <ChevronRight className="w-4 h-4" />}
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedBranch && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-sm font-medium text-gray-700">
            <span>📍 {selectedBranch}</span>
            {selectedCategory && <span> → 📚 {selectedCategory}</span>}
            {selectedLevel && <span> → 🎓 {selectedLevel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CascadeLevelSelector;
