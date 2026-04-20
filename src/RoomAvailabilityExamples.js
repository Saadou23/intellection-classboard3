/**
 * Exemples pratiques d'utilisation du service de disponibilité des salles
 * Ces exemples montrent comment utiliser les fonctions pour différents cas d'usage
 */

import {
  getAllRoomsForBranch,
  getAvailableSlots,
  isRoomAvailable,
  getRoomsByAvailability,
  getWeeklyAvailability,
  generateAvailabilityReport,
  calculateAvailabilityStats,
  getOccupyingSessions
} from './RoomAvailabilityService';

// ============================================================================
// EXEMPLE 1: Trouver la meilleure salle disponible pour un crénal
// ============================================================================
export const findBestRoomForTimeSlot = (sessions, rooms, day, startTime, endTime) => {
  console.log(`\n📌 Exemple 1: Trouver la meilleure salle pour ${startTime}-${endTime}`);

  const availableRooms = rooms.filter(room =>
    isRoomAvailable(sessions, room, day, startTime, endTime)
  );

  console.log(`Salles disponibles: ${availableRooms.join(', ')}`);

  if (availableRooms.length > 0) {
    const roomsWithStats = availableRooms.map(room => {
      const slots = getAvailableSlots(sessions, room, day);
      const stats = calculateAvailabilityStats(slots);
      return {
        room,
        totalAvailableTime: stats.totalMinutes,
        slots: stats.totalSlots
      };
    });

    roomsWithStats.sort((a, b) => b.totalAvailableTime - a.totalAvailableTime);
    const bestRoom = roomsWithStats[0];

    console.log(`✅ Meilleure salle: ${bestRoom.room} (${bestRoom.totalAvailableTime}min disponibles)`);
    return bestRoom.room;
  }

  console.log('❌ Aucune salle disponible pour ce créneau');
  return null;
};

// ============================================================================
// EXEMPLE 2: Afficher tous les créneaux d'une salle pendant une journée
// ============================================================================
export const showRoomScheduleForDay = (sessions, room, day) => {
  console.log(`\n📌 Exemple 2: Emploi du temps pour ${room}`);

  const slots = getAvailableSlots(sessions, room, day, 'normal');
  const stats = calculateAvailabilityStats(slots);

  console.log(`
${room} - Lundi
───────────────────────────
Temps libre: ${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m
Nombre de crénaux: ${stats.totalSlots}
Durée moyenne: ${stats.averageSlotDuration}min

Crénaux disponibles:
  `);

  slots.forEach((slot, i) => {
    console.log(`  ${i + 1}. ${slot.start} - ${slot.end} (${slot.duration}min)`);
  });

  return slots;
};

// ============================================================================
// EXEMPLE 3: Comparer les salles par disponibilité (Ranking)
// ============================================================================
export const rankRoomsByAvailability = (sessions, rooms, day) => {
  console.log(`\n📌 Exemple 3: Classement des salles par disponibilité`);

  const ranked = getRoomsByAvailability(sessions, rooms, day);

  console.log(`
Classement pour ${['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][day]}
──────────────────────────────────────────────────
  `);

  ranked.forEach((room, idx) => {
    const percentage = Math.round((room.availableMinutes / 660) * 100);
    const bar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    console.log(`${idx + 1}. ${room.room.padEnd(10)} ${bar} ${room.availableMinutes}min (${percentage}%)`);
  });

  return ranked;
};

// ============================================================================
// EXEMPLE 4: Générer un rapport de disponibilité pour un centre
// ============================================================================
export const generateBranchReport = (sessions, rooms, day, branchName) => {
  console.log(`\n📌 Exemple 4: Rapport de disponibilité - ${branchName}`);

  const report = generateAvailabilityReport(sessions, rooms, day, branchName);

  console.log(`
═════════════════════════════════════════
  RAPPORT - ${report.branch}
  ${report.date}
═════════════════════════════════════════

📊 Résumé:
  ✅ ${report.summary.fullyAvailable} salles entièrement libres
  ⚠️  ${report.summary.partiallyAvailable} salles partiellement libres
  ❌ ${report.summary.unavailable} salles occupées
  📦 Total: ${report.totalRooms} salles

🏆 Top 3 salles les plus disponibles:
  `);

  report.roomsByAvailability.slice(0, 3).forEach((room, i) => {
    console.log(`  ${i + 1}. ${room.room.padEnd(10)} - ${room.availableMinutes}min`);
  });

  return report;
};

// ============================================================================
// EXEMPLE 5: Afficher la disponibilité pour une semaine complète
// ============================================================================
export const showWeeklyAvailability = (sessions, rooms) => {
  console.log(`\n📌 Exemple 5: Disponibilité hebdomadaire`);

  const weekly = getWeeklyAvailability(sessions, rooms);
  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  console.log(`
Semaine complète:
──────────────────────────────────────────
  `);

  daysOfWeek.forEach((day, dayIndex) => {
    const dayData = weekly[day];
    let totalFree = 0;

    Object.values(dayData).forEach(slots => {
      const stats = calculateAvailabilityStats(slots);
      totalFree += stats.totalMinutes;
    });

    const avgPerRoom = Math.round(totalFree / rooms.length);
    console.log(`${day.padEnd(12)} - Moyenne: ${avgPerRoom}min par salle`);
  });

  return weekly;
};

// ============================================================================
// EXEMPLE 6: Trouver les heures de pointe (salles les plus chargées)
// ============================================================================
export const findPeakHours = (sessions, rooms, day) => {
  console.log(`\n📌 Exemple 6: Heures de pointe`);

  const occupancyByHour = {};

  // Initialiser pour chaque heure
  for (let h = 8; h < 19; h++) {
    occupancyByHour[h] = 0;
  }

  // Compter les sessions par heure
  sessions
    .filter(s => s.dayOfWeek === day && !s.period)
    .forEach(session => {
      const startHour = parseInt(session.startTime.split(':')[0]);
      const endHour = parseInt(session.endTime.split(':')[0]);

      for (let h = startHour; h < endHour; h++) {
        occupancyByHour[h]++;
      }
    });

  // Afficher
  console.log(`
Occupation par heure:
──────────────────────────────
  `);

  Object.entries(occupancyByHour).forEach(([hour, count]) => {
    const occupied = count;
    const available = rooms.length - count;
    const bar = '▓'.repeat(occupied) + '░'.repeat(available);
    console.log(`${hour}:00  ${bar.padEnd(10)} ${occupied}/${rooms.length} salles`);
  });

  return occupancyByHour;
};

// ============================================================================
// EXEMPLE 7: Suggérer les meilleurs créneaux pour une session
// ============================================================================
export const suggestBestTimeSlotsForSession = (sessions, rooms, day, duration = 90) => {
  console.log(`\n📌 Exemple 7: Suggérer les meilleurs créneaux`);

  const allSlots = {};
  let slotScores = {};

  // Analyser tous les créneaux disponibles
  rooms.forEach(room => {
    const slots = getAvailableSlots(sessions, room, day, 'normal', duration);
    slots.forEach(slot => {
      const key = `${slot.start}-${slot.end}`;
      if (!slotScores[key]) {
        slotScores[key] = {
          time: key,
          start: slot.start,
          end: slot.end,
          availableRooms: 0
        };
      }
      slotScores[key].availableRooms++;
    });
  });

  // Trier par nombre de salles disponibles
  const sorted = Object.values(slotScores)
    .sort((a, b) => b.availableRooms - a.availableRooms)
    .slice(0, 5);

  console.log(`
Top 5 meilleurs créneaux pour une session de ${duration}min:
──────────────────────────────────────────────────
  `);

  sorted.forEach((slot, i) => {
    console.log(`${i + 1}. ${slot.start} - ${slot.end} (${slot.availableRooms} salles disponibles)`);
  });

  return sorted;
};

// ============================================================================
// EXEMPLE 8: Afficher les sessions occupant une salle à un moment donné
// ============================================================================
export const showOccupyingSessions = (sessions, room, day, startTime, endTime) => {
  console.log(`\n📌 Exemple 8: Sessions occupant ${room}`);

  const occupying = getOccupyingSessions(
    sessions,
    room,
    day,
    startTime,
    endTime,
    'normal'
  );

  if (occupying.length === 0) {
    console.log(`✅ Aucune session - Créneau disponible`);
    return [];
  }

  console.log(`
Créneau demandé: ${startTime} - ${endTime}
Sessions en conflit:
──────────────────────────────────────────
  `);

  occupying.forEach(session => {
    console.log(`  ⏰ ${session.startTime} - ${session.endTime}`);
    console.log(`     📚 ${session.level} / ${session.subject}`);
    console.log(`     👤 Prof: ${session.professor}`);
    console.log('');
  });

  return occupying;
};

// ============================================================================
// EXEMPLE 9: Export CSV pour un rapport administrateur
// ============================================================================
export const exportAvailabilityAsCSV = (sessions, rooms, day, branchName) => {
  console.log(`\n📌 Exemple 9: Export CSV`);

  const report = generateAvailabilityReport(sessions, rooms, day, branchName);

  let csv = 'Salle,Minutes Disponibles,Crénaux,Durée Moyenne\n';

  report.roomsByAvailability.forEach(room => {
    csv += `"${room.room}",${room.availableMinutes},${room.availableSlots},${room.averageSlotDuration}\n`;
  });

  console.log('CSV généré:\n' + csv);
  return csv;
};

// ============================================================================
// EXEMPLE 10: Cas d'usage complet - Dashboard administrateur
// ============================================================================
export const generateAdminDashboard = (sessionsByBranch, branchesData, day) => {
  console.log(`\n📌 Exemple 10: Dashboard complet`);

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayName = daysOfWeek[day];

  console.log(`
╔════════════════════════════════════════════════════════╗
║        TABLEAU DE BORD - DISPONIBILITÉ DES SALLES      ║
║        ${dayName.padEnd(50)}║
╚════════════════════════════════════════════════════════╝
  `);

  branchesData.forEach(branch => {
    const rooms = [];
    for (let i = 1; i <= branch.rooms; i++) {
      rooms.push(`Salle ${i}`);
    }

    const sessions = sessionsByBranch[branch.name] || [];
    const report = generateAvailabilityReport(sessions, rooms, day, branch.name);

    console.log(`\n🏢 ${branch.name}`);
    console.log('───────────────────────────────────────────────');
    console.log(`  ✅ Libres: ${report.summary.fullyAvailable}   |   ⚠️  Partielles: ${report.summary.partiallyAvailable}   |   ❌ Occupées: ${report.summary.unavailable}`);

    const top3 = report.roomsByAvailability.slice(0, 3);
    console.log(`  🏆 Top: ${top3.map(r => r.room).join(', ')}`);
  });

  return branchesData.map(branch => {
    const rooms = [];
    for (let i = 1; i <= branch.rooms; i++) {
      rooms.push(`Salle ${i}`);
    }
    const sessions = sessionsByBranch[branch.name] || [];
    return generateAvailabilityReport(sessions, rooms, day, branch.name);
  });
};

// ============================================================================
// Exemple d'utilisation global
// ============================================================================
export const runAllExamples = (mockSessions, mockRooms) => {
  console.log('🚀 Exécution de tous les exemples...\n');

  // Données de test
  const day = 1; // Lundi
  const sessions = mockSessions;
  const rooms = mockRooms;

  // Lancer les exemples
  findBestRoomForTimeSlot(sessions, rooms, day, '14:00', '15:30');
  showRoomScheduleForDay(sessions, 'Salle 1', day);
  rankRoomsByAvailability(sessions, rooms, day);
  generateBranchReport(sessions, rooms, day, 'Centre Casablanca');
  showWeeklyAvailability(sessions, rooms);
  findPeakHours(sessions, rooms, day);
  suggestBestTimeSlotsForSession(sessions, rooms, day, 90);
  showOccupyingSessions(sessions, 'Salle 1', day, '14:00', '15:30');
  exportAvailabilityAsCSV(sessions, rooms, day, 'Centre Casablanca');

  console.log('\n✅ Tous les exemples exécutés');
};
