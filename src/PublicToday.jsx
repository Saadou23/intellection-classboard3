import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BookOpen, User, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PublicToday = () => {
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  const branches = ['Hay Salam', 'Doukkali', 'Saada'];

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // FILTRAGE AUTOMATIQUE - Se déclenche chaque seconde
  useEffect(() => {
    if (allSessions.length === 0) return;

    console.log('🔄 FILTRAGE - Heure:', currentTime.toLocaleTimeString());
    
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();
    const currentMinutes = currentH * 60 + currentM;

    const filtered = allSessions.filter(session => {
      // Garder les cours avec status spéciaux (annulé, retardé, etc.)
      if (session.status && ['cancelled', 'delayed', 'absent'].includes(session.status)) {
        return true;
      }

      // Masquer les cours terminés
      const [endH, endM] = session.endTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;
      
      const isNotFinished = currentMinutes < endMinutes;
      
      if (!isNotFinished) {
        console.log(`  ❌ MASQUÉ: ${session.startTime}-${session.endTime} ${session.level} ${session.subject}`);
      }
      
      return isNotFinished;
    });

    // Filtrer par niveau si sélectionné
    const finalFiltered = selectedLevel 
      ? filtered.filter(s => s.level === selectedLevel)
      : filtered;

    console.log(`  ✅ Affichage: ${finalFiltered.length}/${allSessions.length} sessions`);
    setSessions(finalFiltered);

  }, [currentTime, allSessions, selectedLevel]);

  // Charger les sessions de Firebase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branch');
    
    if (branchParam) {
      setSelectedBranch(branchParam);
    }
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;

    setLoading(true);

    const docRef = doc(db, 'branches', selectedBranch);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const branchSessions = docSnap.data().sessions || [];
        const today = currentTime.getDay();
        
        const todaySessions = branchSessions
          .filter(s => {
            if (s.isExceptional && s.specificDate) {
              return s.specificDate === currentTime.toISOString().split('T')[0];
            }
            return s.dayOfWeek === today;
          })
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        console.log('📚 Sessions chargées:', todaySessions.length);
        setAllSessions(todaySessions);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [selectedBranch]);

  const isSessionOngoing = (session) => {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();
    const currentMinutes = currentH * 60 + currentM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const getSessionStatus = (session) => {
    if (session.status === 'cancelled') return { text: 'ANNULÉ', color: 'bg-red-600' };
    if (session.status === 'delayed') return { text: 'RETARDÉ', color: 'bg-orange-600' };
    if (session.status === 'absent') return { text: 'ABSENT', color: 'bg-gray-600' };
    
    if (isSessionOngoing(session)) {
      return { text: 'EN COURS', color: 'bg-green-600' };
    }
    
    return { text: 'À VENIR', color: 'bg-blue-600' };
  };

  const getUniqueLevels = () => {
    const levels = [...new Set(allSessions.map(s => s.level))];
    return levels.sort();
  };

  const today = daysOfWeek.find(d => d.value === currentTime.getDay());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-6">Sélectionnez une filiale</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map(branch => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-xl hover:bg-blue-50 transition-all transform hover:scale-105"
              >
                {branch}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
      {/* En-tête */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 py-6 print:bg-white print:border-gray-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white print:text-gray-800">
                INTELLECTION CLASSBOARD
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mt-2 print:text-gray-600 font-semibold">
                {selectedBranch}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl md:text-6xl font-bold text-white print:text-gray-800">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-lg md:text-xl text-white/90 print:text-gray-600 mt-1">
                {today?.label} {currentTime.toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sous-titre */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 py-4 print:bg-gray-50 print:border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white print:text-gray-800">
            SÉANCES DU {today?.label.toUpperCase()}
          </h2>
          
          {/* Filtre par niveau */}
          {getUniqueLevels().length > 1 && (
            <div className="mt-4 print:hidden">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !selectedLevel 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  📚 Tous les niveaux
                </button>
                {getUniqueLevels().map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedLevel === level 
                        ? 'bg-white text-blue-600 shadow-lg' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste des séances */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Aucune séance en cours ou à venir
            </h2>
            <p className="text-gray-600">
              Les cours terminés ont été masqués automatiquement
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, idx) => {
              const status = getSessionStatus(session);
              const ongoing = isSessionOngoing(session);

              return (
                <div 
                  key={session.id || idx}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
                    ongoing ? 'ring-4 ring-green-400 scale-105' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Horaire */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-bold text-2xl text-gray-800">
                              {session.startTime}
                            </div>
                            <div className="text-sm text-gray-500">
                              → {session.endTime}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Niveau */}
                      <div className="md:col-span-2">
                        <div className="font-bold text-xl text-gray-800">
                          {session.level}
                        </div>
                      </div>

                      {/* Matière */}
                      <div className="md:col-span-3">
                        <div className="text-gray-700 font-semibold text-lg">
                          {session.subject}
                        </div>
                      </div>

                      {/* Professeur */}
                      <div className="md:col-span-3">
                        <div className="text-gray-600">
                          {session.professor}
                        </div>
                      </div>

                      {/* Salle + Statut */}
                      <div className="md:col-span-2 text-right">
                        <div className="text-yellow-600 font-bold text-xl mb-2">
                          {session.room}
                        </div>
                        <div className={`inline-block px-4 py-2 rounded-lg text-white font-bold text-sm ${status.color}`}>
                          {status.text}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicToday;