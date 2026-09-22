import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

const MultiLevelSelectCategorized = ({ levels, selectedLevels, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const dropdownRef = useRef(null);

  // Définir les catégories
  const levelCategories = {
    '🏫 Primaire': ['6 PRIMAIRE'],
    '🎓 Collège': ['1AC', '2AC', '3AC'],
    '📚 Lycée': ['TRONC COMMUN', '1 BAC SC ECO', '1 BAC SEXP', '1 BAC SM', '2 BAC S.EXP & TECH', '2 BAC ECO', '2 BAC SM A & B'],
  };

  // Auto-expand toutes les catégories au démarrage
  useEffect(() => {
    const allCategories = {};
    Object.keys(levelCategories).forEach(cat => {
      allCategories[cat] = true;
    });
    setExpandedCategories(allCategories);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLevel = (level) => {
    if (selectedLevels.includes(level)) {
      onChange(selectedLevels.filter(l => l !== level));
    } else {
      onChange([...selectedLevels, level]);
    }
  };

  const toggleCategory = (category) => {
    const categoryLevels = levelCategories[category];
    const allSelected = categoryLevels.every(level => selectedLevels.includes(level));

    if (allSelected) {
      // Désélectionner tous les niveaux de cette catégorie
      onChange(selectedLevels.filter(l => !categoryLevels.includes(l)));
    } else {
      // Sélectionner tous les niveaux de cette catégorie
      const newLevels = [...selectedLevels];
      categoryLevels.forEach(level => {
        if (!newLevels.includes(level)) {
          newLevels.push(level);
        }
      });
      onChange(newLevels);
    }
  };

  const removeLevel = (level, e) => {
    e.stopPropagation();
    onChange(selectedLevels.filter(l => l !== level));
  };

  const toggleCategoryExpand = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filtrer les niveaux disponibles et les grouper par catégorie
  const availableLevelsByCategory = {};
  Object.entries(levelCategories).forEach(([category, categoryLevels]) => {
    availableLevelsByCategory[category] = categoryLevels.filter(level =>
      levels.includes(level)
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Filière/Niveau <span className="text-blue-600">(Multi-sélection par catégorie)</span>
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white min-h-[42px] flex items-center justify-between"
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedLevels.length === 0 ? (
            <span className="text-gray-400">Sélectionner un ou plusieurs niveaux</span>
          ) : (
            selectedLevels.map(level => (
              <span
                key={level}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                {level}
                <button
                  onClick={(e) => removeLevel(level, e)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {Object.keys(levelCategories).length === 0 ? (
            <div className="p-3 text-gray-500 text-sm">Aucun niveau configuré</div>
          ) : (
            Object.entries(levelCategories).map(([category, categoryLevels]) => {
              const availableLevels = categoryLevels.filter(level => levels.includes(level));

              if (availableLevels.length === 0) return null;

              const allCategorySelected = availableLevels.every(level =>
                selectedLevels.includes(level)
              );
              const someCategorySelected = availableLevels.some(level =>
                selectedLevels.includes(level)
              );

              return (
                <div key={category}>
                  {/* En-tête de catégorie */}
                  <div
                    onClick={() => toggleCategoryExpand(category)}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 font-semibold border-b border-gray-200 ${
                      someCategorySelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`}
                    />
                    <input
                      type="checkbox"
                      checked={allCategorySelected}
                      indeterminate={someCategorySelected && !allCategorySelected}
                      onChange={() => toggleCategory(category)}
                      className="w-4 h-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="flex-1">{category}</span>
                    <span className="text-xs text-gray-500">
                      ({availableLevels.filter(l => selectedLevels.includes(l)).length}/{availableLevels.length})
                    </span>
                  </div>

                  {/* Niveaux de la catégorie */}
                  {expandedCategories[category] && (
                    <div className="bg-gray-50">
                      {availableLevels.map(level => (
                        <div
                          key={level}
                          onClick={() => toggleLevel(level)}
                          className={`px-8 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-2 text-sm ${
                            selectedLevels.includes(level) ? 'bg-blue-100' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLevels.includes(level)}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                          <span className={selectedLevels.includes(level) ? 'font-semibold text-blue-700' : ''}>
                            {level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {selectedLevels.length > 0 && (
            <div className="border-t p-2 bg-gray-50 sticky bottom-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-1"
              >
                ✕ Tout désélectionner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiLevelSelectCategorized;
