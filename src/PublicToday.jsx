import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BookOpen, User, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PublicToday = () => {
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]); // Stocker toutes les séances
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null); // Filtre par niveau
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.5); // Vitesse de défilement par défaut
  const [scrollEnabled, setScrollEnabled] = useState(true); // Défilement activé par défaut

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

  useEffect(() => {
    // Timer pour l'heure actuelle
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // Re-filtrer les sessions toutes les minutes pour masquer les cours terminés
  useEffect(() => {
    if (allSessions.length === 0) return;
    
    const filterSessions = (sessions) => {
      return sessions.filter(session => {
        // Garder les cours annulés/retardés/absent
        if (['cancelled', 'delayed', 'absent'].includes(session.status)) {
          return true;
        }
        // Masquer les cours terminés
        const [endH, endM] = session.endTime.split(':').map(Number);
        const currentH = currentTime.getHours();
        const currentM = currentTime.getMinutes();
        const currentMinutes = currentH * 60 + currentM;
        const endMinutes = endH * 60 + endM;
        return currentMinutes < endMinutes;
      });
    };
    
    let filteredSessions = filterSessions(allSessions);
    
    if (selectedLevel) {
      filteredSessions = filteredSessions.filter(s => s.level === selectedLevel);
    }
    
    setSessions(filteredSessions);
  }, [currentTime, allSessions, selectedLevel]); // Se déclenche chaque seconde

  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branch');
    const speedParam = params.get('speed'); // Vitesse de défilement (0.1 à 5)
    const scrollParam = params.get('scroll'); // "true" ou "false"
    
    console.log('🔍 Paramètre branch reçu:', branchParam);
    console.log('📋 Branches disponibles:', branches);
    
    if (branchParam) {
      // Vérifier si la branche existe (avec ou sans correspondance exacte)
      const matchedBranch = branches.find(b => 
        b.toLowerCase() === branchParam.toLowerCase()
      );
      
      if (matchedBranch) {
        console.log('✅ Branche trouvée:', matchedBranch);
        setSelectedBranch(matchedBranch);
      } else {
        console.error('❌ Branche non trouvée:', branchParam);
        console.log('💡 Essayez avec une de ces branches:', branches);
      }
    } else {
      console.warn('⚠️ Aucun paramètre branch dans l\'URL');
    }

    // Configuration de la vitesse de défilement
    if (speedParam) {
      const speed = parseFloat(speedParam);
      if (!isNaN(speed) && speed >= 0.1 && speed <= 5) {
        setScrollSpeed(speed);
      }
    }

    // Configuration de l'activation du défilement
    if (scrollParam === 'false') {
      setScrollEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;

    setLoading(true);

    // Écouter les changements en temps réel
    const docRef = doc(db, 'branches', selectedBranch);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const branchSessions = docSnap.data().sessions || [];
        const today = currentTime.getDay();
        const todayDate = currentTime.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        console.log('📅 Aujourd\'hui:', today, '(', daysOfWeek[today].label, ')', todayDate);
        console.log('📚 Total sessions dans la branche:', branchSessions.length);
        
        // Filtrer les séances d'aujourd'hui
        const todaySessions = branchSessions.filter(s => {
          // Séances exceptionnelles: vérifier la date spécifique
          if (s.isExceptional && s.specificDate) {
            const match = s.specificDate === todayDate;
            if (match) console.log('✨ Séance exceptionnelle trouvée:', s.subject, s.level);
            return match;
          }
          // Séances régulières: vérifier le jour de la semaine
          const match = s.dayOfWeek === today;
          if (match) console.log('📖 Séance régulière trouvée:', s.subject, s.level, s.startTime);
          return match;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));

        console.log('✅ Séances trouvées pour aujourd\'hui:', todaySessions.length);

        setAllSessions(todaySessions); // Stocker toutes les séances
        
        // NOUVEAU: Filtrer pour masquer les cours terminés
        const filterSessions = (sessions) => {
          return sessions.filter(session => {
            // Garder les cours annulés/retardés/absent pour info
            if (['cancelled', 'delayed', 'absent'].includes(session.status)) {
              return true;
            }
            // Masquer les cours terminés
            const [endH, endM] = session.endTime.split(':').map(Number);
            const currentH = currentTime.getHours();
            const currentM = currentTime.getMinutes();
            const currentMinutes = currentH * 60 + currentM;
            const endMinutes = endH * 60 + endM;
            return currentMinutes < endMinutes; // Garder seulement si pas encore terminé
          });
        };
        
        // Appliquer le filtre de niveau ET le filtre des cours terminés
        let filteredSessions = filterSessions(todaySessions);
        
        if (selectedLevel) {
          filteredSessions = filteredSessions.filter(s => s.level === selectedLevel);
          console.log('🎯 Filtré par niveau', selectedLevel, ':', filteredSessions.length, 'séances');
        } else {
          console.log('📋 Cours actifs (non terminés):', filteredSessions.length);
        }
        
        setSessions(filteredSessions);
      } else {
        console.error('❌ Document de branche non trouvé:', selectedBranch);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedBranch, selectedLevel]);

  const isSessionOngoing = (session) => {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();

    const currentMinutes = currentH * 60 + currentM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // EN COURS si : (début <= maintenant) ET (maintenant < fin)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const isSessionPast = (session) => {
    const [endH, endM] = session.endTime.split(':').map(Number);
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();

    const currentMinutes = currentH * 60 + currentM;
    const endMinutes = endH * 60 + endM;

    // TERMINÉE si : maintenant >= fin
    return currentMinutes >= endMinutes;
  };

  const getSessionStatus = (session) => {
    if (session.status === 'cancelled') return { label: 'ANNULÉE', color: 'bg-red-100 text-red-700' };
    if (session.status === 'delayed') return { label: 'RETARDÉE', color: 'bg-orange-100 text-orange-700' };
    if (session.status === 'absent') return { label: 'PROF ABSENT', color: 'bg-red-100 text-red-700' };
    
    if (isSessionOngoing(session)) {
      return { label: 'EN COURS', color: 'bg-green-100 text-green-700' };
    }
    
    if (isSessionPast(session)) {
      return { label: 'TERMINÉ', color: 'bg-gray-100 text-gray-600' };
    }

    return { label: 'PRÉVU', color: 'bg-blue-100 text-blue-700' };
  };

  const handlePrint = () => {
    window.print();
  };

  // Obtenir tous les niveaux disponibles
  const getUniqueLevels = () => {
    const levels = new Set(allSessions.map(s => s.level));
    return Array.from(levels).sort();
  };

  // Défilement automatique
  useEffect(() => {
    // Ne pas défiler si désactivé
    if (!scrollEnabled) {
      setShouldAutoScroll(false);
      return;
    }

    const scrollContainer = document.getElementById('sessions-container');
    if (!scrollContainer || sessions.length === 0) return;

    // Vérifier si le contenu dépasse le conteneur
    const checkNeedsScroll = () => {
      const contentHeight = scrollContainer.scrollHeight;
      const viewportHeight = window.innerHeight;
      return contentHeight > viewportHeight;
    };

    const needsScroll = checkNeedsScroll();
    setShouldAutoScroll(needsScroll);

    if (!needsScroll) {
      // Si pas besoin de scroll, remonter en haut
      window.scrollTo(0, 0);
      return;
    }

    let scrollDirection = 1; // 1 = vers le bas, -1 = vers le haut
    let currentScrollSpeed = scrollSpeed; // Utiliser la vitesse configurée
    let pauseTime = 3000; // pause en millisecondes en haut/bas (3 secondes)
    let isPaused = false;
    let pauseTimeout = null;

    const autoScroll = () => {
      if (isPaused) return;

      const currentScroll = window.scrollY;
      const maxScroll = scrollContainer.scrollHeight - window.innerHeight;

      // Atteint le bas
      if (currentScroll >= maxScroll - 5 && scrollDirection === 1) {
        isPaused = true;
        pauseTimeout = setTimeout(() => {
          scrollDirection = -1;
          isPaused = false;
        }, pauseTime);
        return;
      }

      // Atteint le haut
      if (currentScroll <= 5 && scrollDirection === -1) {
        isPaused = true;
        pauseTimeout = setTimeout(() => {
          scrollDirection = 1;
          isPaused = false;
        }, pauseTime);
        return;
      }

      // Défiler progressivement
      window.scrollBy({
        top: currentScrollSpeed * scrollDirection,
        behavior: 'auto'
      });
    };

    const intervalId = setInterval(autoScroll, 16); // ~60fps pour un défilement fluide

    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [sessions, scrollSpeed, scrollEnabled]);

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
          <div className="text-center mb-8">
            <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Séances du jour
            </h1>
            <p className="text-gray-600">Sélectionnez votre filiale</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {branches.map(branch => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl font-semibold text-xl transition-all transform hover:scale-105 shadow-lg"
              >
                {branch}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des séances...</p>
        </div>
      </div>
    );
  }

  const today = daysOfWeek.find(d => d.value === currentTime.getDay());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-lg print:shadow-none">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-800">
                  SÉANCES DU JOUR
                </h1>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="font-semibold text-blue-600 text-xl">{selectedBranch}</span>
                <span>•</span>
                <span className="font-semibold">{today?.label}</span>
                <span>•</span>
                <span>{currentTime.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</span>
              </div>
            </div>
            
            <div className="flex gap-3 print:hidden">
              <button
                onClick={() => setSelectedBranch(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <MapPin className="w-4 h-4" />
                Changer
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Calendar className="w-4 h-4" />
                Imprimer
              </button>
            </div>
          </div>

          {/* Horloge */}
          <div className="text-center py-4 bg-blue-50 rounded-lg print:hidden">
            <div className="text-5xl font-bold text-blue-600 font-mono">
              {currentTime.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>

          {/* Filtres par niveau */}
          {getUniqueLevels().length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 print:hidden">
              <div className="flex items-center gap-4 mb-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Filtrer par niveau:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                    !selectedLevel 
                      ? 'bg-blue-600 text-white shadow-blue-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📚 Tous les niveaux
                </button>
                {getUniqueLevels().map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      selectedLevel === level 
                        ? 'bg-blue-600 text-white shadow-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {selectedLevel && (
                <div className="mt-3 text-sm text-blue-600 font-medium">
                  ✓ Affichage des cours de : {selectedLevel}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* En-tête pour impression */}
      <div className="hidden print:block bg-white p-6 border-b-2 border-gray-300">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">INTELLECTION CLASSBOARD</h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-2">{selectedBranch}</h2>
          <p className="text-xl text-gray-600">
            Séances du {today?.label} {currentTime.toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Liste des séances */}
      <div id="sessions-container" className="max-w-7xl mx-auto px-6 py-6">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Aucune séance aujourd'hui
            </h2>
            <p className="text-gray-600">
              Profitez de votre journée libre ! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, idx) => {
              const status = getSessionStatus(session);
              const ongoing = isSessionOngoing(session);
              const past = isSessionPast(session);

              return (
                <div 
                  key={session.id || idx}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all print:break-inside-avoid print:shadow-none print:border print:border-gray-300 ${
                    ongoing ? 'ring-4 ring-green-400 scale-105' : ''
                  } ${past ? 'opacity-60' : ''}`}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Horaire */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-bold text-lg text-gray-800">
                              {session.startTime}
                            </div>
                            <div className="text-sm text-gray-500">
                              à {session.endTime}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Niveau */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold text-gray-800 text-lg">
                            {session.level}
                          </span>
                        </div>
                      </div>

                      {/* Matière */}
                      <div className="md:col-span-3">
                        <div className="text-gray-700 font-medium">
                          {session.subject}
                        </div>
                      </div>

                      {/* Professeur */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-700">{session.professor}</span>
                        </div>
                      </div>

                      {/* Salle */}
                      <div className="md:col-span-1">
                        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-center font-bold text-xl">
                          {session.room}
                        </div>
                      </div>

                      {/* Statut */}
                      <div className="md:col-span-2">
                        <div className={`${status.color} px-4 py-2 rounded-lg text-center font-bold text-sm`}>
                          {status.label}
                        </div>
                      </div>
                    </div>

                    {/* Informations supplémentaires */}
                    {session.status === 'absent' && session.makeupDate && (
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-sm text-blue-700">
                          <span className="font-semibold">📅 Rattrapage prévu:</span> {' '}
                          {new Date(session.makeupDate).toLocaleDateString('fr-FR')} à {session.makeupTime}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Barre de progression pour séance en cours */}
                  {ongoing && (
                    <div className="bg-green-100 px-6 py-2 print:hidden">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                        <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                        Séance en cours
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="fixed bottom-4 right-4 print:hidden">
        <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
          <span className="text-sm text-gray-600">Mise à jour en temps réel</span>
        </div>
      </div>

      {/* Footer pour impression */}
      <div className="hidden print:block mt-8 border-t-2 border-gray-300 pt-4 text-center text-sm text-gray-500">
        <p className="font-semibold">INTELLECTION CLASSBOARD</p>
        <p className="mt-1">Pour toute question, contactez l'administration</p>
      </div>

      {/* Panneau de debug (à retirer après diagnostic) */}
      <div className="fixed top-20 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-md z-50 print:hidden">
        <div className="font-bold mb-2">🔍 DEBUG INFO</div>
        <div>Branche sélectionnée: <span className="text-yellow-300">{selectedBranch || 'Aucune'}</span></div>
        <div>Jour actuel: <span className="text-yellow-300">{currentTime.getDay()} ({daysOfWeek[currentTime.getDay()].label})</span></div>
        <div>Date: <span className="text-yellow-300">{currentTime.toLocaleDateString('fr-FR')}</span></div>
        <div>Heure: <span className="text-yellow-300">{currentTime.toLocaleTimeString('fr-FR')}</span></div>
        <div>Total sessions: <span className="text-yellow-300">{allSessions.length}</span></div>
        <div>Sessions affichées: <span className="text-yellow-300">{sessions.length}</span></div>
        <div>Niveau filtré: <span className="text-yellow-300">{selectedLevel || 'Tous'}</span></div>
        <div className="mt-2 text-gray-400">Ouvrez la console (F12) pour plus de détails</div>
      </div>

      {/* Indicateur de défilement amélioré */}
      {shouldAutoScroll && scrollEnabled && (
        <div className="fixed bottom-8 right-8 print:hidden z-50">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-blue-400/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Défilement Automatique</span>
                <span className="text-xs text-blue-200">↕️ Haut ⇄ Bas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur quand défilement désactivé */}
      {!scrollEnabled && (
        <div className="fixed bottom-8 right-8 print:hidden z-50">
          <div className="bg-gray-700 text-white px-5 py-3 rounded-2xl shadow-lg border-2 border-gray-500">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="font-medium text-sm">Défilement désactivé</span>
            </div>
          </div>
        </div>
      )}

      {/* Styles d'impression */}
      <style jsx>{`
        @media print {
          body {
            background: white !important;
          }
          
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicToday;