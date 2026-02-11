/**
 * Utilitaire pour gérer les horaires et périodes exceptionnelles des filiales
 */

/**
 * Vérifie si une date est dans une période exceptionnelle
 */
export const isDateInPeriod = (date, period) => {
  const checkDate = new Date(date);
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);
  
  // Reset time to compare only dates
  checkDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Récupère la période exceptionnelle active pour une date donnée
 */
export const getActivePeriodForDate = (branch, date) => {
  if (!branch.exceptionalPeriods || branch.exceptionalPeriods.length === 0) {
    return null;
  }
  
  return branch.exceptionalPeriods.find(period => isDateInPeriod(date, period)) || null;
};

/**
 * Récupère les horaires effectifs pour une filiale à une date donnée
 * Prend en compte les périodes exceptionnelles
 */
export const getEffectiveSchedule = (branch, date) => {
  // Si la filiale est désactivée, retourner null
  if (!branch.active) {
    return null;
  }
  
  // Vérifier s'il y a une période exceptionnelle active
  const activePeriod = getActivePeriodForDate(branch, date);
  
  // Si période exceptionnelle, retourner ses horaires
  if (activePeriod) {
    return {
      schedule: activePeriod.schedule,
      isPeriod: true,
      periodName: activePeriod.name,
      periodType: activePeriod.type
    };
  }
  
  // Sinon, retourner les horaires normaux
  return {
    schedule: branch.schedule,
    isPeriod: false
  };
};

/**
 * Récupère les horaires pour un jour spécifique
 */
export const getDaySchedule = (branch, date) => {
  const effectiveSchedule = getEffectiveSchedule(branch, date);
  
  if (!effectiveSchedule) {
    return null;
  }
  
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const daySchedule = effectiveSchedule.schedule[dayOfWeek];
  
  return {
    ...daySchedule,
    isPeriod: effectiveSchedule.isPeriod,
    periodName: effectiveSchedule.periodName,
    periodType: effectiveSchedule.periodType
  };
};

/**
 * Vérifie si une filiale est disponible à une date et heure données
 */
export const isBranchAvailable = (branch, date, time) => {
  const daySchedule = getDaySchedule(branch, date);
  
  if (!daySchedule || !daySchedule.open) {
    return false;
  }
  
  // Convertir les heures en minutes pour faciliter la comparaison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const checkTime = timeToMinutes(time);
  const startTime = timeToMinutes(daySchedule.start);
  const endTime = timeToMinutes(daySchedule.end);
  
  return checkTime >= startTime && checkTime <= endTime;
};

/**
 * Filtre les filiales actives
 */
export const getActiveBranches = (branches) => {
  return branches.filter(branch => branch.active);
};

/**
 * Récupère toutes les périodes actives pour toutes les filiales à une date donnée
 */
export const getAllActivePeriodsForDate = (branches, date) => {
  return branches
    .map(branch => {
      const period = getActivePeriodForDate(branch, date);
      return period ? { branch: branch.name, ...period } : null;
    })
    .filter(Boolean);
};

/**
 * Génère un message d'information sur l'état de la filiale
 */
export const getBranchStatusMessage = (branch, date) => {
  if (!branch.active) {
    return {
      type: 'inactive',
      message: `La filiale ${branch.name} est actuellement désactivée`,
      icon: '🔴'
    };
  }
  
  const activePeriod = getActivePeriodForDate(branch, date);
  
  if (activePeriod) {
    const periodTypeEmoji = {
      ramadan: '🌙',
      vacances: '🏖️',
      examens: '📚',
      autre: '📅'
    };
    
    return {
      type: 'period',
      message: `Horaires ${activePeriod.name} en cours`,
      icon: periodTypeEmoji[activePeriod.type] || '📅',
      periodName: activePeriod.name,
      periodType: activePeriod.type
    };
  }
  
  return {
    type: 'normal',
    message: 'Horaires normaux',
    icon: '✅'
  };
};

/**
 * Formate les horaires pour l'affichage
 */
export const formatScheduleForDisplay = (branch, date) => {
  const daySchedule = getDaySchedule(branch, date);
  
  if (!daySchedule) {
    return 'Filiale désactivée';
  }
  
  if (!daySchedule.open) {
    return 'Fermé';
  }
  
  const baseFormat = `${daySchedule.start} - ${daySchedule.end}`;
  
  if (daySchedule.isPeriod) {
    return `${baseFormat} (${daySchedule.periodName})`;
  }
  
  return baseFormat;
};

/**
 * Vérifie les conflits potentiels entre périodes exceptionnelles
 */
export const checkPeriodConflicts = (branch, newPeriod) => {
  if (!branch.exceptionalPeriods || branch.exceptionalPeriods.length === 0) {
    return [];
  }
  
  const conflicts = [];
  
  for (const existingPeriod of branch.exceptionalPeriods) {
    const newStart = new Date(newPeriod.startDate);
    const newEnd = new Date(newPeriod.endDate);
    const existingStart = new Date(existingPeriod.startDate);
    const existingEnd = new Date(existingPeriod.endDate);
    
    // Vérifier si les périodes se chevauchent
    if (
      (newStart >= existingStart && newStart <= existingEnd) ||
      (newEnd >= existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    ) {
      conflicts.push(existingPeriod);
    }
  }
  
  return conflicts;
};

export default {
  isDateInPeriod,
  getActivePeriodForDate,
  getEffectiveSchedule,
  getDaySchedule,
  isBranchAvailable,
  getActiveBranches,
  getAllActivePeriodsForDate,
  getBranchStatusMessage,
  formatScheduleForDisplay,
  checkPeriodConflicts
};
