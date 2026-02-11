import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, BookOpen, MapPin, X } from 'lucide-react';

const UpcomingSessionsPreview = ({ sessions, branch, currentTime, onClose }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  // Obtenir les cours à venir de la journée (tous les cours après l'heure actuelle)
  const getUpcomingSessions = () => {
    const branchSessions = sessions[branch] || [];
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;
    const currentDay = currentTime.getDay();

    // Filtrer les cours du jour qui sont après l'heure actuelle
    return branchSessions
      .filter(session => {
        const [startHour, startMin] = session.startTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        return session.dayOfWeek === currentDay && startMinutes > currentMinutes;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const upcomingSessions = getUpcomingSessions();

  // Alterner entre affichage normal et aperçu toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (upcomingSessions.length > 0) {
        setShowPreview(true);
        
        // Afficher l'aperçu pendant 10 secondes
        setTimeout(() => {
          setShowPreview(false);
        }, 10000);
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [upcomingSessions.length]);

  // Faire défiler les cours à venir pendant l'aperçu
  useEffect(() => {
    if (showPreview && upcomingSessions.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % upcomingSessions.length);
      }, 2000); // Changer toutes les 2 secondes

      return () => clearInterval(interval);
    }
  }, [showPreview, upcomingSessions.length]);

  if (!showPreview || upcomingSessions.length === 0) {
    return null;
  }

  const currentSession = upcomingSessions[currentIndex];

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-2xl shadow-2xl border-4 border-blue-400 overflow-hidden min-w-[600px]">
        {/* Header */}
        <div className="bg-blue-700 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold text-sm">COURS À VENIR</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-blue-600 px-3 py-1 rounded-full">
              {currentIndex + 1} / {upcomingSessions.length}
            </span>
            <button
              onClick={() => setShowPreview(false)}
              className="hover:bg-blue-600 p-1 rounded transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Colonne gauche */}
            <div className="space-y-3">
              <div className="bg-blue-800/50 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1">HORAIRE</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  {currentSession.startTime} - {currentSession.endTime}
                </div>
              </div>

              <div className="bg-blue-800/50 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1">PROFESSEUR</div>
                <div className="text-lg font-bold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {currentSession.professor}
                </div>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-3">
              <div className="bg-blue-800/50 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1">SALLE</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  {currentSession.room}
                </div>
              </div>

              <div className="bg-blue-800/50 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1">MATIÈRE</div>
                <div className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {currentSession.subject}
                </div>
              </div>
            </div>
          </div>

          {/* Niveau */}
          <div className="mt-4 bg-yellow-500 text-yellow-900 rounded-lg p-3 text-center">
            <div className="font-bold text-xl">{currentSession.level}</div>
          </div>

          {/* Temps avant début */}
          {(() => {
            const [startHour, startMin] = currentSession.startTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const currentHour = currentTime.getHours();
            const currentMin = currentTime.getMinutes();
            const currentMinutes = currentHour * 60 + currentMin;
            const minutesUntil = startMinutes - currentMinutes;
            const hours = Math.floor(minutesUntil / 60);
            const mins = minutesUntil % 60;

            return (
              <div className="mt-3 text-center">
                <div className="text-xs text-blue-300 mb-1">DANS</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {hours > 0 && `${hours}h `}{mins}min
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="bg-blue-700 px-6 py-2 text-center text-xs text-blue-200">
          Aperçu automatique • Disparaît dans 10 secondes
        </div>
      </div>
    </div>
  );
};

export default UpcomingSessionsPreview;
