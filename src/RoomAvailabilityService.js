/**
 * Service de gestion de la disponibilité des salles
 * Fournit des fonctions pour analyser et visualiser les crénaux disponibles
 */

// Convertir une heure HH:MM en minutes
const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Convertir des minutes en HH:MM
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Vérifier si deux crénaux se chevauchent
const timesOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};

// Normaliser le nom d'une salle
const normalizeRoomName = (room) => {
  if (!room) return null;
  const match = room.match(/\d+/);
  if (match) {
    const num = match[0];
    return `Salle ${num}`;
  }
  return room;
};

/**
 * Obtenir toutes les salles d'un centre
 * @param {Object} branchData - Les données du centre
 * @returns {Array} Liste des salles
 */
export const getAllRoomsForBranch = (branchData) => {
  if (!branchData || !branchData.rooms || typeof branchData.rooms !== 'number') {
    return [];
  }
  const rooms = [];
  for (let i = 1; i <= branchData.rooms; i++) {
    rooms.push(`Salle ${i}`);
  }
  return rooms;
};

/**
 * Obtenir les sessions qui occupent une salle à un créneau donné
 * @param {Array} sessions - Les sessions du centre
 * @param {String} room - Nom de la salle
 * @param {Number} dayOfWeek - Jour de la semaine (0-6)
 * @param {String} startTime - Heure de début du créneau (HH:MM)
 * @param {String} endTime - Heure de fin du créneau (HH:MM)
 * @param {String} period - Période spécifique ou 'normal' pour l'emploi normal
 * @returns {Array} Sessions trouvées
 */
export const getOccupyingSessions = (sessions, room, dayOfWeek, startTime, endTime, period = 'normal') => {
  return sessions.filter(session => {
    if (session.dayOfWeek !== dayOfWeek) return false;

    const normalizedRoom = normalizeRoomName(session.room);
    if (normalizedRoom !== room) return false;

    // Filtrer par période
    if (period === 'normal') {
      if (session.period) return false;
    } else {
      if (session.period !== period) return false;
    }

    return timesOverlap(startTime, endTime, session.startTime, session.endTime);
  });
};

/**
 * Vérifier si une salle est disponible à un créneau donné
 * @param {Array} sessions - Les sessions du centre
 * @param {String} room - Nom de la salle
 * @param {Number} dayOfWeek - Jour de la semaine (0-6)
 * @param {String} startTime - Heure de début
 * @param {String} endTime - Heure de fin
 * @param {String} period - Période spécifique ou 'normal'
 * @returns {Boolean} true si disponible, false sinon
 */
export const isRoomAvailable = (sessions, room, dayOfWeek, startTime, endTime, period = 'normal') => {
  const occupying = getOccupyingSessions(sessions, room, dayOfWeek, startTime, endTime, period);
  return occupying.length === 0;
};

/**
 * Trouver tous les crénaux disponibles dans une journée pour une salle
 * @param {Array} sessions - Les sessions du centre
 * @param {String} room - Nom de la salle
 * @param {Number} dayOfWeek - Jour de la semaine (0-6)
 * @param {String} period - Période spécifique ou 'normal'
 * @param {Number} slotDuration - Durée du créneau en minutes (par défaut 90)
 * @returns {Array} Liste des créneaux disponibles {start, end, duration}
 */
export const getAvailableSlots = (sessions, room, dayOfWeek, period = 'normal', slotDuration = 90) => {
  const dayStartMinutes = 8 * 60; // 08:00
  const dayEndMinutes = 19 * 60; // 19:00
  const availableSlots = [];

  // Obtenir toutes les sessions occupant cette salle ce jour-là
  const daySessions = sessions
    .filter(s => {
      if (s.dayOfWeek !== dayOfWeek) return false;
      const normalizedRoom = normalizeRoomName(s.room);
      if (normalizedRoom !== room) return false;
      if (period === 'normal') {
        return !s.period;
      } else {
        return s.period === period;
      }
    })
    .map(s => ({
      start: timeToMinutes(s.startTime),
      end: timeToMinutes(s.endTime)
    }))
    .sort((a, b) => a.start - b.start);

  let currentTime = dayStartMinutes;

  for (const session of daySessions) {
    // Ajouter un créneau si la salle est libre avant cette session
    if (currentTime + slotDuration <= session.start) {
      availableSlots.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(Math.min(session.start, currentTime + slotDuration)),
        duration: Math.min(slotDuration, session.start - currentTime),
        available: true
      });
      if (currentTime + slotDuration <= session.start) {
        currentTime = currentTime + slotDuration;
        // Continuer à chercher d'autres créneaux
        while (currentTime + slotDuration <= session.start) {
          availableSlots.push({
            start: minutesToTime(currentTime),
            end: minutesToTime(Math.min(session.start, currentTime + slotDuration)),
            duration: Math.min(slotDuration, session.start - currentTime),
            available: true
          });
          currentTime += slotDuration;
        }
      }
    }
    currentTime = Math.max(currentTime, session.end);
  }

  // Ajouter un dernier créneau si l'espace reste disponible après la dernière session
  if (currentTime + slotDuration <= dayEndMinutes) {
    while (currentTime + slotDuration <= dayEndMinutes) {
      availableSlots.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(currentTime + slotDuration),
        duration: slotDuration,
        available: true
      });
      currentTime += slotDuration;
    }
    // Ajouter les dernières minutes restantes
    if (currentTime < dayEndMinutes) {
      availableSlots.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(dayEndMinutes),
        duration: dayEndMinutes - currentTime,
        available: true
      });
    }
  }

  return availableSlots;
};

/**
 * Obtenir la disponibilité complète par salle pour un centre et une journée
 * @param {Array} sessions - Les sessions du centre
 * @param {Array} rooms - Liste des salles
 * @param {Number} dayOfWeek - Jour de la semaine (0-6)
 * @param {String} period - Période spécifique ou 'normal'
 * @returns {Object} Disponibilité par salle {room: availableSlots[]}
 */
export const getRoomAvailabilityByDay = (sessions, rooms, dayOfWeek, period = 'normal') => {
  const availability = {};

  rooms.forEach(room => {
    availability[room] = getAvailableSlots(sessions, room, dayOfWeek, period);
  });

  return availability;
};

/**
 * Obtenir la disponibilité complète pour une semaine
 * @param {Array} sessions - Les sessions du centre
 * @param {Array} rooms - Liste des salles
 * @param {String} period - Période spécifique ou 'normal'
 * @returns {Object} Disponibilité par jour et par salle
 */
export const getWeeklyAvailability = (sessions, rooms, period = 'normal') => {
  const weekAvailability = {};
  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  daysOfWeek.forEach((day, dayIndex) => {
    weekAvailability[day] = getRoomAvailabilityByDay(sessions, rooms, dayIndex, period);
  });

  return weekAvailability;
};

/**
 * Calculer les statistiques de disponibilité pour une salle et une journée
 * @param {Array} availableSlots - Les créneaux disponibles
 * @returns {Object} Statistiques {totalMinutes, totalSlots, averageSlotDuration}
 */
export const calculateAvailabilityStats = (availableSlots) => {
  if (availableSlots.length === 0) {
    return {
      totalMinutes: 0,
      totalSlots: 0,
      averageSlotDuration: 0,
      peakAvailability: null
    };
  }

  const totalMinutes = availableSlots.reduce((sum, slot) => sum + slot.duration, 0);
  const totalSlots = availableSlots.length;
  const averageSlotDuration = Math.round(totalMinutes / totalSlots);

  return {
    totalMinutes,
    totalSlots,
    averageSlotDuration,
    peakAvailability: Math.max(...availableSlots.map(s => s.duration))
  };
};

/**
 * Trouver les salles les plus disponibles pour un jour et une période donnés
 * @param {Array} sessions - Les sessions du centre
 * @param {Array} rooms - Liste des salles
 * @param {Number} dayOfWeek - Jour de la semaine (0-6)
 * @param {String} period - Période spécifique ou 'normal'
 * @returns {Array} Salles triées par disponibilité décroissante
 */
export const getRoomsByAvailability = (sessions, rooms, dayOfWeek, period = 'normal') => {
  const roomsWithAvailability = rooms.map(room => {
    const slots = getAvailableSlots(sessions, room, dayOfWeek, period);
    const stats = calculateAvailabilityStats(slots);
    return {
      room,
      availableMinutes: stats.totalMinutes,
      availableSlots: stats.totalSlots,
      averageSlotDuration: stats.averageSlotDuration
    };
  });

  return roomsWithAvailability.sort((a, b) => b.availableMinutes - a.availableMinutes);
};

/**
 * Exporter les données de disponibilité au format rapportage
 * @param {Array} sessions - Les sessions du centre
 * @param {Array} rooms - Liste des salles
 * @param {Number} dayOfWeek - Jour de la semaine (0-6)
 * @param {String} branchName - Nom du centre
 * @returns {Object} Rapport de disponibilité
 */
export const generateAvailabilityReport = (sessions, rooms, dayOfWeek, branchName = '') => {
  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayName = daysOfWeek[dayOfWeek];

  const availability = getRoomAvailabilityByDay(sessions, rooms, dayOfWeek);
  const roomsByAvailability = getRoomsByAvailability(sessions, rooms, dayOfWeek);

  const report = {
    branch: branchName,
    date: dayName,
    dayOfWeek,
    timestamp: new Date().toISOString(),
    totalRooms: rooms.length,
    roomsByAvailability,
    detailledAvailability: availability,
    summary: {
      fullyAvailable: roomsByAvailability.filter(r => r.availableMinutes > 600).length,
      partiallyAvailable: roomsByAvailability.filter(r => r.availableMinutes > 0 && r.availableMinutes <= 600).length,
      unavailable: roomsByAvailability.filter(r => r.availableMinutes === 0).length
    }
  };

  return report;
};
