// Helper pour filtrer les séances selon les règles d'affichage

/**
 * Filtre les séances pour une date donnée en appliquant les règles :
 * - Séances exceptionnelles : uniquement pour leur date spécifique
 * - Rattrapages : uniquement jusqu'à leur date
 * - Séances récurrentes : affichées normalement
 */
export const filterSessionsForDate = (allSessions, targetDate) => {
  if (!Array.isArray(allSessions)) return [];
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const targetDayOfWeek = target.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return allSessions.filter(session => {
    // Vérifier que c'est le bon jour de la semaine
    if (session.dayOfWeek !== targetDayOfWeek) {
      return false;
    }

    // CAS 1 : Séance exceptionnelle avec date spécifique
    if (session.isExceptional && session.specificDate) {
      const specificDate = new Date(session.specificDate + 'T00:00:00');
      specificDate.setHours(0, 0, 0, 0);
      
      // Afficher seulement si c'est exactement cette date
      return specificDate.getTime() === target.getTime();
    }

    // CAS 2 : Rattrapage (séance avec makeupDate)
    if (session.makeupDate) {
      const makeupDate = new Date(session.makeupDate + 'T00:00:00');
      makeupDate.setHours(0, 0, 0, 0);
      
      // Afficher le rattrapage uniquement :
      // - Le jour de la séance normale (status = absent)
      // - Jusqu'au jour du rattrapage (inclus)
      if (session.status === 'absent' && target.getTime() < makeupDate.getTime()) {
        // Afficher "ABSENT - Rattrapage le XX"
        return true;
      }
      
      // Le jour du rattrapage exact
      if (target.getTime() === makeupDate.getTime()) {
        return true;
      }
      
      // Après la date de rattrapage, ne plus afficher
      if (target.getTime() > makeupDate.getTime()) {
        return false;
      }
    }

    // CAS 3 : Séance récurrente normale (s'affiche toujours)
    if (!session.isExceptional && !session.makeupDate) {
      return true;
    }

    // CAS 4 : Séance récurrente avec expiration
    if (session.expiresAfter) {
      const expirationDate = new Date(session.expiresAfter + 'T00:00:00');
      expirationDate.setHours(0, 0, 0, 0);
      
      // Ne plus afficher après la date d'expiration
      return target.getTime() <= expirationDate.getTime();
    }

    // Par défaut, afficher la séance
    return true;
  });
};

/**
 * Obtient les séances pour aujourd'hui
 */
export const getTodaySessions = (allSessions, currentTime = new Date()) => {
  const today = new Date(currentTime);
  today.setHours(0, 0, 0, 0);
  
  return filterSessionsForDate(allSessions, today.toISOString().split('T')[0]);
};

/**
 * Obtient les séances pour une semaine donnée
 */
export const getWeekSessions = (allSessions, weekStartDate) => {
  const weekSessions = {};
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    weekSessions[dateStr] = filterSessionsForDate(allSessions, dateStr);
  }
  
  return weekSessions;
};

/**
 * Vérifie si une séance doit s'afficher aujourd'hui
 */
export const shouldDisplayToday = (session, currentDate = new Date()) => {
  const sessions = [session];
  const filtered = filterSessionsForDate(sessions, currentDate.toISOString().split('T')[0]);
  return filtered.length > 0;
};

/**
 * Obtient le label approprié pour le statut d'une séance
 */
export const getSessionDisplayStatus = (session, targetDate) => {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  // Séance exceptionnelle
  if (session.isExceptional && session.specificDate) {
    const labels = {
      'makeup': '🔄 RATTRAPAGE',
      'extra': '➕ SUPPLÉMENTAIRE',
      'exam': '📝 EXAMEN',
      'makeup_student': '👥 RATTRAPAGE',
      'other': '📌 EXCEPTIONNEL'
    };
    return labels[session.reason] || '📌 EXCEPTIONNEL';
  }

  // Séance avec rattrapage
  if (session.makeupDate) {
    const makeupDate = new Date(session.makeupDate + 'T00:00:00');
    makeupDate.setHours(0, 0, 0, 0);
    
    if (session.status === 'absent' && target.getTime() < makeupDate.getTime()) {
      return `⚠️ ABSENT - Rattrapage le ${makeupDate.toLocaleDateString('fr-FR')}`;
    }
    
    if (target.getTime() === makeupDate.getTime()) {
      return '🔄 RATTRAPAGE';
    }
  }

  // Statuts normaux
  const statusLabels = {
    'normal': 'PRÉVU',
    'cancelled': 'ANNULÉE',
    'delayed': 'RETARDÉE',
    'absent': 'PROF ABSENT',
    'ongoing': 'EN COURS',
    'finished': 'TERMINÉ'
  };

  return statusLabels[session.status] || 'PRÉVU';
};

/**
 * Trie les séances par ordre chronologique
 */
export const sortSessionsByTime = (sessions) => {
  return [...sessions].sort((a, b) => {
    const timeA = a.startTime.replace(':', '');
    const timeB = b.startTime.replace(':', '');
    return timeA.localeCompare(timeB);
  });
};
