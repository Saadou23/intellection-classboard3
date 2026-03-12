import React, { useState, useEffect } from 'react';
import { X, Save, Users, BookOpen, Search } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';

const StudentIndividualLessonsManager = ({ onClose }) => {
  const [students, setStudents] = useState([]);
  const [studentSettings, setStudentSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestCounts, setRequestCounts] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger tous les utilisateurs (étudiants)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const studentsList = usersSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.userType === 'student' || !data.userType;
        })
        .map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().fullName || 'Étudiant',
          matricule: doc.data().matricule || doc.data().userId || doc.id,
          ...doc.data()
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // Charger les paramètres d'adhésion des étudiants
      const settingsSnapshot = await getDoc(doc(db, 'settings', 'studentIndividualLessons'));
      let settingsData = {};
      if (settingsSnapshot.exists()) {
        settingsData = settingsSnapshot.data();
      }

      // Compter les demandes par étudiant
      const requestsSnapshot = await getDocs(
        collection(db, 'individual_lesson_requests')
      );
      const counts = {};
      requestsSnapshot.docs.forEach(doc => {
        const studentId = doc.data().studentId;
        counts[studentId] = (counts[studentId] || 0) + 1;
      });

      setStudents(studentsList);
      setStudentSettings(settingsData);
      setRequestCounts(counts);
      setLoading(false);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setMessage('❌ Erreur de chargement');
      setLoading(false);
    }
  };

  const toggleStudentAccess = (studentId) => {
    setStudentSettings(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        enabled: !((prev[studentId]?.enabled) || false)
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(
        doc(db, 'settings', 'studentIndividualLessons'),
        studentSettings,
        { merge: true }
      );
      setMessage('✅ Paramètres sauvegardés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      setMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.matricule || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = Object.values(studentSettings).filter(s => s.enabled).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Gestion de l'Accès aux Cours Individuels</h2>
              <p className="text-blue-100 text-sm mt-1">Autorisez les étudiants à demander des cours individuels</p>
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
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6 rounded">
            <p className="text-blue-900 font-semibold">
              {enabledCount} sur {students.length} étudiant(s) avec accès aux cours individuels
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Chercher un étudiant par nom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun étudiant trouvé</p>
            ) : (
              filteredStudents.map((student) => {
                const settings = studentSettings[student.id] || { enabled: false };
                const requestCount = requestCounts[student.id] || 0;
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Users className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{student.name}</p>
                        <div className="flex gap-3 text-sm text-gray-500">
                          <span>ID: {student.matricule}</span>
                          {requestCount > 0 && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              {requestCount} demande{requestCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {settings.enabled && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              ✅ Accès activé
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleStudentAccess(student.id)}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        settings.enabled
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {settings.enabled ? 'Activé' : 'Désactivé'}
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
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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

export default StudentIndividualLessonsManager;
