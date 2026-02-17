import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const MultiLevelSelect = ({ levels, selectedLevels, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const removeLevel = (level, e) => {
    e.stopPropagation();
    onChange(selectedLevels.filter(l => l !== level));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Filière/Niveau <span className="text-blue-600">(Multi-sélection)</span>
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {levels.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm">Aucun niveau configuré</div>
          ) : (
            levels.map(level => (
              <div
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center gap-2 ${
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
            ))
          )}
          
          {selectedLevels.length > 0 && (
            <div className="border-t p-2 bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="w-full text-sm text-red-600 hover:text-red-700 font-medium"
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

export default MultiLevelSelect;