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

  // Déterminer l'étape actuelle (sur 4)
  let currentStep = 1;
  if (selectedBranch && !selectedCategory) currentStep = 2;
  if (selectedBranch && selectedCategory && !selectedLevel) currentStep = 3;
  if (selectedBranch && selectedCategory && selectedLevel) currentStep = 4;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
      <div className="space-y-4">
        {/* STEP 1: Branch Selection */}
        {currentStep === 1 && (
          <div>
            <div className="mb-3 text-sm text-gray-600">Étape 1 / 4 · الخطوة 1 من 4</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📍 Sélectionnez votre centre
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {branches.map(branch => (
                <button
                  key={branch}
                  onClick={() => {
                    onBranchChange(branch);
                    onCategoryChange(null);
                    onLevelChange('');
                  }}
                  className="px-6 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 bg-white text-gray-700 border-3 border-blue-300 hover:border-blue-600 hover:bg-blue-50 shadow-sm hover:shadow-lg active:scale-95"
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Category Selection */}
        {currentStep === 2 && (
          <div>
            <div className="mb-3 text-sm text-gray-600">Étape 2 / 4 · الخطوة 2 من 4</div>
            <button
              onClick={() => {
                onBranchChange('');
                onCategoryChange(null);
                onLevelChange('');
              }}
              className="mb-4 text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1"
            >
              ← Retour · رجوع
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              📚 Sélectionnez une catégorie
            </h2>
            <p className="text-sm text-gray-600 mb-4">{selectedBranch}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(availableCategories).length > 0 ? (
                <>
                  {Object.entries(availableCategories).map(([category, levels]) => (
                    <button
                      key={category}
                      onClick={() => {
                        onCategoryChange(category);
                        onLevelChange('');
                      }}
                      className="px-6 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 bg-white text-gray-700 border-3 border-green-300 hover:border-green-600 hover:bg-green-50 shadow-sm hover:shadow-lg active:scale-95"
                    >
                      <div>{category}</div>
                      <div className="text-xs text-gray-500 mt-1">({levels.length} niveau{levels.length > 1 ? 'x' : ''})</div>
                    </button>
                  ))}
                </>
              ) : (
                <p className="text-gray-500">Aucune catégorie disponible</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Level Selection */}
        {currentStep === 3 && (
          <div>
            <div className="mb-3 text-sm text-gray-600">Étape 3 / 4 · الخطوة 3 من 4</div>
            <button
              onClick={() => {
                onCategoryChange(null);
                onLevelChange('');
              }}
              className="mb-4 text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1"
            >
              ← Retour · رجوع
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🎓 Choisissez votre niveau
            </h2>
            <p className="text-xs text-gray-500 mb-4 text-right" dir="rtl">
              اختر مستواك الدراسي
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {selectedBranch}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => onLevelChange('')}
                className="px-6 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 bg-white text-gray-700 border-3 border-purple-300 hover:border-purple-600 hover:bg-purple-50 shadow-sm hover:shadow-lg active:scale-95"
              >
                Tous les niveaux
              </button>
              {levelsInSelectedCategory.map(level => (
                <button
                  key={level}
                  onClick={() => onLevelChange(level)}
                  className="px-6 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 bg-white text-gray-700 border-3 border-purple-300 hover:border-purple-600 hover:bg-purple-50 shadow-sm hover:shadow-lg active:scale-95"
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CascadeLevelSelector;
