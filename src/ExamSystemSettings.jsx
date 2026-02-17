import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Plus, Trash2, Save, GraduationCap, BookOpen, Award, Settings, X } from 'lucide-react';

const ExamSystemSettings = ({ onClose }) => {
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [newLevel, setNewLevel] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newExamType, setNewExamType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = doc(db, 'exam-settings', 'config');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setLevels(data.levels || ['TC', '1BAC', '2BAC', 'Universitaire']);
        setSubjects(data.subjects || ['MATHS', 'PHYSIQUE', 'SVT', 'FRANÇAIS', 'ANGLAIS']);
        setExamTypes(data.examTypes || ['Test de niveau', 'Contrôle continu', 'Examen blanc', 'Évaluation']);
      } else {
        // Valeurs par défaut
        setLevels(['TC', '1BAC', '2BAC', 'Universitaire']);
        setSubjects(['MATHS', 'PHYSIQUE', 'SVT', 'PC', 'FRANÇAIS', 'ANGLAIS']);
        setExamTypes(['Test de niveau', 'Contrôle continu', 'Examen blanc', 'Évaluation']);
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'exam-settings', 'config');
      await setDoc(settingsRef, {
        levels,
        subjects,
        examTypes,
        updatedAt: new Date()
      });
      alert('✅ Paramètres sauvegardés');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLevel = () => {
    if (!newLevel.trim()) return;
    if (levels.includes(newLevel.trim())) {
      alert('Ce niveau existe déjà');
      return;
    }
    setLevels([...levels, newLevel.trim()]);
    setNewLevel('');
  };

  const handleRemoveLevel = (level) => {
    if (!confirm(`Supprimer le niveau "${level}" ?`)) return;
    setLevels(levels.filter(l => l !== level));
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    if (subjects.includes(newSubject.trim().toUpperCase())) {
      alert('Cette matière existe déjà');
      return;
    }
    setSubjects([...subjects, newSubject.trim().toUpperCase()]);
    setNewSubject('');
  };

  const handleRemoveSubject = (subject) => {
    if (!confirm(`Supprimer la matière "${subject}" ?`)) return;
    setSubjects(subjects.filter(s => s !== subject));
  };

  const handleAddExamType = () => {
    if (!newExamType.trim()) return;
    if (examTypes.includes(newExamType.trim())) {
      alert('Ce type existe déjà');
      return;
    }
    setExamTypes([...examTypes, newExamType.trim()]);
    setNewExamType('');
  };

  const handleRemoveExamType = (type) => {
    if (!confirm(`Supprimer le type "${type}" ?`)) return;
    setExamTypes(examTypes.filter(t => t !== type));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Paramètres Système</h2>
                <p className="text-red-100 text-sm">Gestion des niveaux, matières et types d'examens</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-red-800 hover:bg-red-900 p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Niveaux */}
          <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-800">Niveaux Scolaires</h3>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLevel()}
                placeholder="Ex: 3ème Collège, Prépa..."
                className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-600"
              />
              <button
                onClick={handleAddLevel}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {levels.map(level => (
                <div
                  key={level}
                  className="bg-white px-4 py-2 rounded-lg border-2 border-purple-300 flex items-center gap-2 group hover:border-red-400 transition-all"
                >
                  <span className="font-medium text-gray-800">{level}</span>
                  <button
                    onClick={() => handleRemoveLevel(level)}
                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Matières */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Matières</h3>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                placeholder="Ex: INFORMATIQUE, ÉCONOMIE..."
                className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-600"
              />
              <button
                onClick={handleAddSubject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {subjects.map(subject => (
                <div
                  key={subject}
                  className="bg-white px-4 py-2 rounded-lg border-2 border-blue-300 flex items-center gap-2 group hover:border-red-400 transition-all"
                >
                  <span className="font-medium text-gray-800">{subject}</span>
                  <button
                    onClick={() => handleRemoveSubject(subject)}
                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Types d'examens */}
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-800">Types d'Examens</h3>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newExamType}
                onChange={(e) => setNewExamType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddExamType()}
                placeholder="Ex: Devoir surveillé, Quiz..."
                className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:border-green-600"
              />
              <button
                onClick={handleAddExamType}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {examTypes.map(type => (
                <div
                  key={type}
                  className="bg-white px-4 py-2 rounded-lg border-2 border-green-300 flex items-center gap-2 group hover:border-red-400 transition-all"
                >
                  <span className="font-medium text-gray-800">{type}</span>
                  <button
                    onClick={() => handleRemoveExamType(type)}
                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 sticky bottom-0 bg-white pt-4 border-t-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold"
            >
              Annuler
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Sauvegarde...' : 'Sauvegarder les Paramètres'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSystemSettings;