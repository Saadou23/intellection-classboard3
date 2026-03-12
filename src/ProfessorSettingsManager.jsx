import React, { useState, useEffect } from 'react';
import { X, Save, Users, BookOpen } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

const ProfessorSettingsManager = ({ onClose }) => {
  const [professorsList, setProfessorsList] = useState([]);
  const [professorSettings, setProfessorSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfessorsFromDB();
  }, []);

  const loadProfessorsFromDB = async () => {
    try {
      // Charger les profs DIRECTEMENT de la collection professors avec leurs vrais doc.id
      const profsSnapshot = await getDocs(collection(db, 'professors'));
      const profsList = profsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().username || doc.id,
        ...doc.data()
      }));
      setProfessorsList(profsList);
      await loadProfessorSettings(profsList);
    } catch (error) {
      console.error('Erreur chargement profs:', error);
      setMessage('❌ Erreur de chargement');
    }
  };

  const loadProfessorSettings = async (profsList) => {
    try {
      // Charger depuis professor_preferences collection
      const prefsSnapshot = await getDocs(collection(db, 'professor_preferences'));
      const settingsData = {};

      prefsSnapshot.docs.forEach(doc => {
        const docId = doc.id;
        const pref = doc.data();
        settingsData[docId] = {
          id: docId,
          name: pref.name || pref.professorId || docId,
          adhereIndividualLessons: pref.adhereIndividualLessons || false
        };
      });

      // Ajouter les profs de la collection professors qui n'ont pas d'entrée
      profsList.forEach(prof => {
        if (!settingsData[prof.id]) {
          settingsData[prof.id] = {
            id: prof.id,
            name: prof.name,
            adhereIndividualLessons: false
          };
        }
      });

      setProfessorSettings(settingsData);
    } catch (error) {
      console.error('Erreur de chargement settings:', error);
      setMessage('❌ Erreur de chargement');
    }
  };

  const toggleIndividualLessons = (profId) => {
    setProfessorSettings(prev => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        adhereIndividualLessons: !((prev[profId]?.adhereIndividualLessons) || false)
      }
    }));
  };

  const saveProfessorSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      // Sauvegarder dans professor_preferences collection ET dans professors collection
      for (const [profId, settings] of Object.entries(professorSettings)) {
        // 1. Sauvegarder dans professor_preferences
        const prefsDocRef = doc(db, 'professor_preferences', profId);
        await setDoc(prefsDocRef, {
          professorId: profId,
          name: settings.name,
          adhereIndividualLessons: settings.adhereIndividualLessons || false
        }, { merge: true });

        // 2. AUSSI ajouter le champ directement dans professors collection
        const profDocRef = doc(db, 'professors', profId);
        await setDoc(profDocRef, {
          individualCoursesEnabled: settings.adhereIndividualLessons || false
        }, { merge: true });
      }
      setMessage('✅ Paramètres sauvegardés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(professorSettings).filter(s => s.adhereIndividualLessons).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Gestion des Cours Individuels</h2>
              <p className="text-purple-100 text-sm mt-1">Activez les cours individuels pour chaque professeur</p>
            </div>
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
          {/* Stats */}
          <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-6 rounded">
            <p className="text-purple-900 font-semibold">
              {enabledCount} sur {professorsList.length} professeur(s) avec cours individuels activés
            </p>
          </div>

          {/* Professors List */}
          <div className="space-y-3">
            {professorsList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun professeur trouvé</p>
            ) : (
              professorsList.map((professor) => {
                const settings = professorSettings[professor.id] || { adhereIndividualLessons: false };
                return (
                  <div
                    key={professor.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Users className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-800">{professor.name}</p>
                        <p className="text-sm text-gray-500">
                          ID: {professor.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {settings.adhereIndividualLessons
                            ? '✅ Cours individuels activés'
                            : '❌ Cours individuels désactivés'}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleIndividualLessons(professor.id)}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        settings.adhereIndividualLessons
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {settings.adhereIndividualLessons ? 'Activé' : 'Désactivé'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-6 flex justify-between items-center">
          {message && (
            <p className={`text-sm font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={saveProfessorSettings}
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorSettingsManager;
