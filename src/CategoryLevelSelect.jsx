import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const CategoryLevelSelect = ({ availableLevels, selectedLevel, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [levelCategories, setLevelCategories] = useState({});
  const dropdownRef = useRef(null);

  // Charger les catégories depuis Firebase
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const docRef = doc(db, 'settings', 'levelCategories');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const categories = docSnap.data().categories || getDefaultCategories();
        setLevelCategories(categories);
        // Auto-expand all categories
        const expanded = {};
        Object.keys(categories).forEach(cat => {
          expanded[cat] = true;
        });
        setExpandedCategories(expanded);
      } else {
        const defaults = getDefaultCategories();
        setLevelCategories(defaults);
        const expanded = {};
        Object.keys(defaults).forEach(cat => {
          expanded[cat] = true;
        });
        setExpandedCategories(expanded);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      const defaults = getDefaultCategories();
      setLevelCategories(defaults);
      const expanded = {};
      Object.keys(defaults).forEach(cat => {
        expanded[cat] = true;
      });
      setExpandedCategories(expanded);
    }
  };

  const getDefaultCategories = () => ({
    '🏫 Primaire': ['6 PRIMAIRE'],
    '🎓 Collège': ['1AC', '2AC', '3AC'],
    '📚 Lycée': ['TRONC COMMUN', '1 BAC SC ECO', '1 BAC SEXP', '1 BAC SM', '2 BAC S.EXP & TECH', '2 BAC ECO', '2 BAC SM A & B'],
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategoryExpand = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getSelectedLevelLabel = () => {
    if (!selectedLevel) return '🎓 Tous les niveaux';

    for (const [category, levels] of Object.entries(levelCategories)) {
      if (levels.includes(selectedLevel)) {
        return selectedLevel;
      }
    }

    return selectedLevel;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm bg-white border-2 border-green-300 text-gray-800 px-3 py-2 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold flex items-center gap-2 whitespace-nowrap"
      >
        <span>🎓 {getSelectedLevelLabel()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto min-w-72">
          {/* Option "Tous les niveaux" */}
          <div
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`px-4 py-2 cursor-pointer hover:bg-green-50 flex items-center gap-2 font-semibold border-b border-gray-200 ${
              !selectedLevel ? 'bg-green-100 text-green-700' : ''
            }`}
          >
            🎓 Tous les niveaux
          </div>

          {/* Catégories avec niveaux */}
          {Object.entries(levelCategories).map(([category, categoryLevels]) => {
            // Filtrer les niveaux disponibles pour cette catégorie
            const availableCategoryLevels = categoryLevels.filter(level =>
              availableLevels.includes(level)
            );

            if (availableCategoryLevels.length === 0) return null;

            return (
              <div key={category}>
                {/* En-tête de catégorie */}
                <div
                  onClick={() => toggleCategoryExpand(category)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 font-semibold border-b border-gray-100 ${
                    expandedCategories[category] ? 'bg-gray-50' : ''
                  }`}
                >
                  <ChevronRight
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${expandedCategories[category] ? 'rotate-90' : ''}`}
                  />
                  <span className="flex-1">{category}</span>
                  <span className="text-xs text-gray-500">({availableCategoryLevels.length})</span>
                </div>

                {/* Niveaux de la catégorie */}
                {expandedCategories[category] && (
                  <div className="bg-gray-50">
                    {availableCategoryLevels.map(level => (
                      <div
                        key={level}
                        onClick={() => {
                          onChange(level);
                          setIsOpen(false);
                        }}
                        className={`px-8 py-2 cursor-pointer hover:bg-green-100 flex items-center gap-2 text-sm border-b border-gray-100 last:border-b-0 ${
                          selectedLevel === level ? 'bg-green-100 text-green-700 font-semibold' : ''
                        }`}
                      >
                        <span>{selectedLevel === level ? '✓' : '·'}</span>
                        <span>{level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryLevelSelect;
