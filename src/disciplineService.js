import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc
} from 'firebase/firestore';

/**
 * Create a discipline record when a session starts
 * @param {Object} session - The session object
 * @param {string} branch - The branch name
 * @param {string} date - YYYY-MM-DD format
 * @returns {Object} The created discipline record
 */
export async function createDisciplineRecord(session, branch, date) {
  try {
    const recordId = `disc_${Date.now()}`;
    const dayOfWeek = new Date(date).getDay();

    // Parse times
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const volumePlanned = (endH * 60 + endM) - (startH * 60 + startM);

    const record = {
      id: recordId,
      sessionId: session.id || '',
      professorName: session.professor || '',
      branch: branch,
      subject: session.subject || '',
      level: session.level || '',
      date: date,
      dayOfWeek: dayOfWeek,

      // Planned times
      startTime_planned: session.startTime,
      endTime_planned: session.endTime,
      volumePlanned: volumePlanned,

      // Actual times (null until marked)
      startTime_actual: null,
      endTime_actual: null,
      volumeActual: null,

      // Calculated fields
      retardMinutes: null,
      earlyEndMinutes: null,
      volumePercentage: null,

      // Status
      status: 'PLANNED',

      // Anomalies
      anomalies: [],

      // Timestamps
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, 'discipline_records', recordId), record);
    return record;
  } catch (error) {
    console.error('Erreur création record discipline:', error);
    throw error;
  }
}

/**
 * Mark professor as present (arrival time)
 * @param {string} recordId - The discipline record ID
 * @param {string} actualStartTime - HH:MM format
 */
export async function markProfPresent(recordId, actualStartTime) {
  try {
    const recordRef = doc(db, 'discipline_records', recordId);
    const recordSnap = await getDoc(recordRef);

    if (!recordSnap.exists()) {
      throw new Error('Record not found');
    }

    const record = recordSnap.data();

    // Calculate retard
    const [plannedH, plannedM] = record.startTime_planned.split(':').map(Number);
    const [actualH, actualM] = actualStartTime.split(':').map(Number);

    const plannedMinutes = plannedH * 60 + plannedM;
    const actualMinutes = actualH * 60 + actualM;
    const retardMinutes = actualMinutes - plannedMinutes;

    // Detect anomalies
    const anomalies = detectAnomalies({
      ...record,
      startTime_actual: actualStartTime,
      retardMinutes: retardMinutes > 0 ? retardMinutes : 0
    });

    await updateDoc(recordRef, {
      startTime_actual: actualStartTime,
      retardMinutes: Math.max(0, retardMinutes),
      status: 'PRESENT',
      anomalies: anomalies,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur marquage présence:', error);
    throw error;
  }
}

/**
 * Mark professor departure (end time)
 * @param {string} recordId - The discipline record ID
 * @param {string} actualEndTime - HH:MM format
 */
export async function markProfDeparture(recordId, actualEndTime) {
  try {
    const recordRef = doc(db, 'discipline_records', recordId);
    const recordSnap = await getDoc(recordRef);

    if (!recordSnap.exists()) {
      throw new Error('Record not found');
    }

    const record = recordSnap.data();

    // Calculate volume
    let volumeActual = null;
    if (record.startTime_actual) {
      const [startH, startM] = record.startTime_actual.split(':').map(Number);
      const [endH, endM] = actualEndTime.split(':').map(Number);
      volumeActual = (endH * 60 + endM) - (startH * 60 + startM);
    }

    // Calculate early end
    const [plannedH, plannedM] = record.endTime_planned.split(':').map(Number);
    const [actualH, actualM] = actualEndTime.split(':').map(Number);
    const plannedMinutes = plannedH * 60 + plannedM;
    const actualMinutes = actualH * 60 + actualM;
    const earlyEndMinutes = plannedMinutes - actualMinutes;

    // Calculate volume percentage
    let volumePercentage = null;
    if (volumeActual !== null && record.volumePlanned > 0) {
      volumePercentage = Math.round((volumeActual / record.volumePlanned) * 100);
    }

    // Detect anomalies
    const anomalies = detectAnomalies({
      ...record,
      endTime_actual: actualEndTime,
      volumeActual: volumeActual,
      volumePercentage: volumePercentage,
      earlyEndMinutes: earlyEndMinutes > 0 ? earlyEndMinutes : 0
    });

    await updateDoc(recordRef, {
      endTime_actual: actualEndTime,
      volumeActual: volumeActual,
      volumePercentage: volumePercentage,
      earlyEndMinutes: Math.max(0, earlyEndMinutes),
      status: 'COMPLETED',
      anomalies: anomalies,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur marquage départ:', error);
    throw error;
  }
}

/**
 * Mark professor as absent
 * @param {string} recordId - The discipline record ID
 */
export async function markProfAbsent(recordId) {
  try {
    const recordRef = doc(db, 'discipline_records', recordId);

    const anomalies = [{
      type: 'ABSENCE',
      value: 'non justifiée',
      severity: 'ÉLEVÉ'
    }];

    await updateDoc(recordRef, {
      status: 'ABSENT',
      anomalies: anomalies,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur marquage absent:', error);
    throw error;
  }
}

/**
 * Load today's records for a specific branch
 * @param {string} branch - The branch name
 * @returns {Array} Array of discipline records
 */
export async function loadTodayRecords(branch) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Simple query with just branch and date - no orderBy to avoid complex index
    const q = query(
      collection(db, 'discipline_records'),
      where('branch', '==', branch),
      where('date', '==', today)
    );

    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => doc.data());

    // Sort client-side by startTime_planned
    return records.sort((a, b) => {
      const timeA = a.startTime_planned || '';
      const timeB = b.startTime_planned || '';
      return timeA.localeCompare(timeB);
    });
  } catch (error) {
    console.error('Erreur chargement records aujourd\'hui:', error);
    return [];
  }
}

/**
 * Load professor statistics for a date range
 * @param {string} profName - Professor name
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Array} Array of discipline records
 */
export async function loadProfessorStats(profName, startDate, endDate) {
  try {
    const q = query(
      collection(db, 'discipline_records'),
      where('professorName', '==', profName),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
      // Removed orderBy to avoid complex index requirement - will sort client-side
    );

    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => doc.data());

    // Sort client-side by date descending
    return records.sort((a, b) => {
      return (b.date || '').localeCompare(a.date || '');
    });
  } catch (error) {
    console.error('Erreur chargement stats prof:', error);
    return [];
  }
}

/**
 * Load all professors' records for a period (for ranking)
 * @param {string} branch - The branch name
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Array} Array of discipline records
 */
export async function loadBranchRecords(branch, startDate, endDate) {
  try {
    // Query only by branch - no composite index needed
    const q = query(
      collection(db, 'discipline_records'),
      where('branch', '==', branch)
    );

    const querySnapshot = await getDocs(q);
    let records = querySnapshot.docs.map(doc => doc.data());

    // Filter by date range client-side to avoid needing a composite index
    records = records.filter(r => {
      const recordDate = r.date || '';
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Sort client-side by date descending
    return records.sort((a, b) => {
      return (b.date || '').localeCompare(a.date || '');
    });
  } catch (error) {
    console.error('Erreur chargement records filiale:', error);
    return [];
  }
}

/**
 * Detect anomalies in a discipline record
 * @param {Object} record - The discipline record
 * @returns {Array} Array of anomalies
 */
export function detectAnomalies(record) {
  const anomalies = [];

  // Retard detection
  if (record.retardMinutes !== null) {
    if (record.retardMinutes > 30) {
      anomalies.push({
        type: 'RETARD_GRAVE',
        value: `${record.retardMinutes} min`,
        severity: 'ÉLEVÉ'
      });
    } else if (record.retardMinutes > 15) {
      anomalies.push({
        type: 'RETARD_MOYEN',
        value: `${record.retardMinutes} min`,
        severity: 'MOYEN'
      });
    } else if (record.retardMinutes > 5) {
      anomalies.push({
        type: 'RETARD_LEGER',
        value: `${record.retardMinutes} min`,
        severity: 'FAIBLE'
      });
    }
  }

  // Fin anticipée detection
  if (record.earlyEndMinutes !== null && record.earlyEndMinutes > 10) {
    anomalies.push({
      type: 'FIN_ANTICIPÉE',
      value: `${record.earlyEndMinutes} min avant la fin`,
      severity: 'MOYEN'
    });
  }

  // Volume insuffisant detection
  if (record.volumePercentage !== null && record.volumePercentage < 80) {
    anomalies.push({
      type: 'VOLUME_INSUFFISANT',
      value: `${record.volumePercentage}% du volume prévu`,
      severity: 'ÉLEVÉ'
    });
  }

  return anomalies;
}

/**
 * Calculate discipline score for a list of records
 * @param {Array} records - Array of discipline records
 * @returns {number} Score from 0 to 100
 */
export function calculateDisciplineScore(records) {
  if (records.length === 0) return 100;

  let score = 100;
  let countedRecords = 0;

  records.forEach(record => {
    // Only count completed or absent records
    if (record.status === 'COMPLETED' || record.status === 'ABSENT') {
      countedRecords++;

      // Absence penalty
      if (record.status === 'ABSENT') {
        score -= 15;
      } else {
        // Retard penalties
        if (record.retardMinutes !== null) {
          if (record.retardMinutes > 30) {
            score -= 7; // Grave
          } else if (record.retardMinutes > 15) {
            score -= 5; // Moyen
          } else if (record.retardMinutes > 5) {
            score -= 3; // Léger
          }
        }

        // Early end penalty
        if (record.earlyEndMinutes !== null && record.earlyEndMinutes > 10) {
          score -= 10;
        }

        // Volume insuffisant penalty
        if (record.volumePercentage !== null && record.volumePercentage < 80) {
          score -= 8;
        }
      }
    }
  });

  return Math.max(0, Math.min(100, score));
}

/**
 * Get date range for a period
 * @param {string} period - 'week' | 'month' | 'semester'
 * @returns {Object} {startDate, endDate} in YYYY-MM-DD format
 */
export function getDateRange(period) {
  const today = new Date();
  let startDate, endDate;

  endDate = today.toISOString().split('T')[0];

  switch (period) {
    case 'week':
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      break;
    case 'month':
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      break;
    case 'semester':
      // Assume semester started 6 months ago
      startDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      break;
    default:
      // Week by default
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
  }

  return { startDate, endDate };
}

/**
 * Get all unique professors from records
 * @param {Array} records - Array of discipline records
 * @returns {Array} Array of unique professor names
 */
export function getUniqueProfessors(records) {
  const profs = [...new Set(records.map(r => r.professorName))];
  return profs.sort();
}

/**
 * Get summary statistics for a list of records
 * @param {Array} records - Array of discipline records
 * @returns {Object} Summary statistics
 */
export function getSummaryStats(records) {
  const completed = records.filter(r => r.status === 'COMPLETED');
  const absent = records.filter(r => r.status === 'ABSENT');
  const planned = records.filter(r => r.status === 'PLANNED');

  let totalVolumePlanned = 0;
  let totalVolumeActual = 0;
  let totalRetard = 0;
  let countRetards = 0;

  records.forEach(r => {
    totalVolumePlanned += r.volumePlanned || 0;
    if (r.volumeActual !== null) {
      totalVolumeActual += r.volumeActual;
    }
    if (r.retardMinutes !== null && r.retardMinutes > 0) {
      totalRetard += r.retardMinutes;
      countRetards++;
    }
  });

  const volumePercentage = totalVolumePlanned > 0
    ? Math.round((totalVolumeActual / totalVolumePlanned) * 100)
    : 0;

  const averageRetard = countRetards > 0
    ? Math.round(totalRetard / countRetards)
    : 0;

  return {
    sessionsPlanned: planned.length,
    sessionsCompleted: completed.length,
    sessionsAbsent: absent.length,
    volumePlanned: Math.round(totalVolumePlanned / 60),
    volumeActual: Math.round(totalVolumeActual / 60),
    volumePercentage: volumePercentage,
    averageRetard: averageRetard
  };
}

/**
 * Format penalties with points and severity
 * @param {Object} record - The discipline record
 * @returns {Array} Array of formatted penalties
 */
export function formatPenalties(record) {
  const penalties = [];

  if (record.status === 'ABSENT') {
    penalties.push({
      type: 'ABSENCE',
      label: 'Absence non justifiée',
      points: -15,
      severity: 'ÉLEVÉ',
      description: 'Absence complète'
    });
  } else if (record.status === 'COMPLETED') {
    // Retard penalties
    if (record.retardMinutes !== null && record.retardMinutes > 0) {
      let points = 0;
      let type = '';
      let label = '';

      if (record.retardMinutes > 30) {
        points = -7;
        type = 'RETARD_GRAVE';
        label = `Retard grave (${record.retardMinutes} min)`;
      } else if (record.retardMinutes > 15) {
        points = -5;
        type = 'RETARD_MOYEN';
        label = `Retard moyen (${record.retardMinutes} min)`;
      } else if (record.retardMinutes > 5) {
        points = -3;
        type = 'RETARD_LEGER';
        label = `Retard léger (${record.retardMinutes} min)`;
      }

      if (points !== 0) {
        penalties.push({
          type,
          label,
          points,
          severity: record.retardMinutes > 30 ? 'ÉLEVÉ' : record.retardMinutes > 15 ? 'MOYEN' : 'FAIBLE',
          description: `Arrivée à ${record.startTime_actual} (prévu: ${record.startTime_planned})`
        });
      }
    }

    // Early end penalty
    if (record.earlyEndMinutes !== null && record.earlyEndMinutes > 10) {
      penalties.push({
        type: 'FIN_ANTICIPÉE',
        label: `Fin anticipée (${record.earlyEndMinutes} min)`,
        points: -10,
        severity: 'MOYEN',
        description: `Départ à ${record.endTime_actual} (prévu: ${record.endTime_planned})`
      });
    }

    // Insufficient volume penalty
    if (record.volumePercentage !== null && record.volumePercentage < 80) {
      penalties.push({
        type: 'VOLUME_INSUFFISANT',
        label: `Volume insuffisant (${record.volumePercentage}%)`,
        points: -8,
        severity: 'ÉLEVÉ',
        description: `${record.volumeActual} min / ${record.volumePlanned} min prévus`
      });
    }
  }

  return penalties;
}

/**
 * Get severity color for display
 * @param {string} severity - 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ'
 * @returns {Object} Color classes
 */
export function getSeverityColor(severity) {
  const colors = {
    'FAIBLE': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    'MOYEN': 'bg-orange-50 border-orange-200 text-orange-800',
    'ÉLEVÉ': 'bg-red-50 border-red-200 text-red-800'
  };
  return colors[severity] || colors['FAIBLE'];
}
