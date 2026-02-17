import React from 'react';
import { AlertTriangle, Users, MapPin, Clock } from 'lucide-react';

// Système de détection intelligente des conflits
const ConflictDetector = ({ sessions, currentSession, currentBranch }) => {
  
  const detectConflicts = () => {
    const conflicts = [];
    
    if (!currentSession.dayOfWeek || !currentSession.startTime || !currentSession.endTime) {
      return conflicts;
    }

    const currentStart = timeToMinutes(currentSession.startTime);
    const currentEnd = timeToMinutes(currentSession.endTime);

    // Parcourir toutes les sessions de toutes les branches
    Object.entries(sessions).forEach(([branch, branchSessions]) => {
      if (!Array.isArray(branchSessions)) return;

      branchSessions.forEach((session, index) => {
        // Ne pas comparer avec la session elle-même si en mode édition
        if (branch === currentBranch && currentSession.id && session.id === currentSession.id) {
          return;
        }

        // NOUVEAU: Ignorer les conflits entre périodes différentes
        // Une session normale (period: null) ne conflit PAS avec une session Ramadan (period: "ramadan-2025")
        const currentPeriod = currentSession.period || null;
        const sessionPeriod = session.period || null;
        if (currentPeriod !== sessionPeriod) {
          return; // Pas de conflit entre périodes différentes
        }

        // Vérifier si même jour
        if (session.dayOfWeek !== currentSession.dayOfWeek) {
          return;
        }

        const sessionStart = timeToMinutes(session.startTime);
        const sessionEnd = timeToMinutes(session.endTime);

        // Vérifier chevauchement horaire
        const hasTimeOverlap = (currentStart < sessionEnd) && (currentEnd > sessionStart);

        if (hasTimeOverlap) {
          // CONFLIT 1: Même professeur, même horaire, centres différents
          if (currentSession.professor && 
              session.professor === currentSession.professor && 
              branch !== currentBranch) {
            conflicts.push({
              type: 'professor_double_booking',
              severity: 'critical',
              session: session,
              branch: branch,
              message: `${session.professor} est déjà programmé(e) à ${session.startTime}-${session.endTime} à ${branch}`,
              details: `Niveau: ${session.level}, Matière: ${session.subject}`,
              icon: Users
            });
          }

          // CONFLIT 2: Même salle, même horaire, même centre
          if (branch === currentBranch && 
              currentSession.room && 
              session.room === currentSession.room) {
            conflicts.push({
              type: 'room_conflict',
              severity: 'critical',
              session: session,
              branch: branch,
              message: `Salle ${session.room} déjà occupée de ${session.startTime} à ${session.endTime}`,
              details: `Prof: ${session.professor}, Niveau: ${session.level}`,
              icon: MapPin
            });
          }
        }
      });
    });

    return conflicts;
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const conflicts = detectConflicts();

  if (conflicts.length === 0) {
    return null;
  }

  // Tous les conflits sont critiques maintenant
  return (
    <div className="space-y-3 mb-4">
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
              ⛔ Conflits détectés - Enregistrement impossible
              <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                {conflicts.length}
              </span>
            </h4>
            <div className="space-y-2">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="bg-white rounded p-3 border border-red-200">
                  <div className="flex items-start gap-2">
                    <conflict.icon className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-800">{conflict.message}</p>
                      <p className="text-sm text-red-600 mt-1">{conflict.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction utilitaire exportée pour vérifier s'il y a des conflits critiques
export const hasConflicts = (sessions, currentSession, currentBranch) => {
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  if (!currentSession.dayOfWeek || !currentSession.startTime || !currentSession.endTime) {
    return false;
  }

  const currentStart = timeToMinutes(currentSession.startTime);
  const currentEnd = timeToMinutes(currentSession.endTime);

  console.log('🔍 hasConflicts - Vérification pour:', {
    professor: currentSession.professor,
    room: currentSession.room,
    day: currentSession.dayOfWeek,
    time: `${currentSession.startTime}-${currentSession.endTime}`,
    period: currentSession.period || 'normal',
    branch: currentBranch
  });

  let hasCriticalConflict = false;

  Object.entries(sessions).forEach(([branch, branchSessions]) => {
    if (!Array.isArray(branchSessions)) return;

    branchSessions.forEach((session) => {
      // Ne pas comparer avec soi-même
      if (branch === currentBranch && currentSession.id && session.id === currentSession.id) {
        return;
      }

      // NOUVEAU: Ignorer les conflits entre périodes différentes
      const currentPeriod = currentSession.period || null;
      const sessionPeriod = session.period || null;
      
      console.log('  📊 Comparaison:', {
        currentPeriod,
        sessionPeriod,
        match: currentPeriod === sessionPeriod,
        session: `${session.professor} - ${session.startTime}`
      });
      
      if (currentPeriod !== sessionPeriod) {
        console.log('  ✅ SKIP - Périodes différentes');
        return; // Pas de conflit entre périodes différentes
      }

      if (session.dayOfWeek !== currentSession.dayOfWeek) {
        return;
      }

      const sessionStart = timeToMinutes(session.startTime);
      const sessionEnd = timeToMinutes(session.endTime);

      const hasTimeOverlap = (currentStart < sessionEnd) && (currentEnd > sessionStart);

      if (hasTimeOverlap) {
        // Conflit professeur entre centres
        if (currentSession.professor && 
            session.professor === currentSession.professor && 
            branch !== currentBranch) {
          console.log('  ❌ CONFLIT PROF détecté:', session.professor, branch);
          hasCriticalConflict = true;
        }

        // Conflit salle même centre
        if (branch === currentBranch && 
            currentSession.room && 
            session.room === currentSession.room) {
          console.log('  ❌ CONFLIT SALLE détecté:', session.room);
          hasCriticalConflict = true;
        }
      }
    });
  });

  console.log('🎯 Résultat hasConflicts:', hasCriticalConflict);
  return hasCriticalConflict;
};

export default ConflictDetector;