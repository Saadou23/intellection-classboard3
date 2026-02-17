/**
 * Utilitaires pour gérer les périodes exceptionnelles (Ramadan, vacances, examens...)
 */

/**
 * Récupère toutes les périodes depuis toutes les filiales
 */
export const getAllPeriods = (branchesData) => {
  if (!branchesData || branchesData.length === 0) return [];
  
  const allPeriods = [];
  
  for (const branch of branchesData) {
    if (branch.exceptionalPeriods && branch.exceptionalPeriods.length > 0) {
      branch.exceptionalPeriods.forEach(period => {
        // Éviter les doublons (même période dans plusieurs filiales)
        if (!allPeriods.find(p => p.id === period.id)) {
          allPeriods.push({
            ...period,
            branchName: branch.name
          });
        }
      });
    }
  }
  
  return allPeriods;
};

/**
 * Vérifie si une date est dans une période
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
 * Récupère la période active pour une date donnée
 * Retourne null si aucune période active
 */
export const getActivePeriod = (branchesData, date = new Date()) => {
  const allPeriods = getAllPeriods(branchesData);
  
  for (const period of allPeriods) {
    if (isDateInPeriod(date, period)) {
      return period;
    }
  }
  
  return null;
};

/**
 * Récupère l'ID de la période active
 * Utilisé pour filtrer les sessions
 */
export const getActivePeriodId = (branchesData, date = new Date()) => {
  const activePeriod = getActivePeriod(branchesData, date);
  return activePeriod ? activePeriod.id : null;
};

/**
 * Filtre les sessions selon la période active
 * @param {Array} sessions - Toutes les sessions
 * @param {String|null} activePeriodId - ID de la période active (null = période normale)
 * @param {Boolean} forceNormal - Forcer l'affichage des sessions normales même si période active
 * @returns {Array} Sessions filtrées
 */
export const filterSessionsByPeriod = (sessions, activePeriodId, forceNormal = false) => {
  if (!sessions || sessions.length === 0) return [];
  
  // Si force normal, montrer uniquement les sessions normales
  if (forceNormal) {
    return sessions.filter(s => !s.period || s.period === null);
  }
  
  // Si période active, montrer uniquement les sessions de cette période
  if (activePeriodId) {
    return sessions.filter(s => s.period === activePeriodId);
  }
  
  // Sinon, montrer uniquement les sessions normales (sans période)
  return sessions.filter(s => !s.period || s.period === null);
};

/**
 * Récupère le nom d'une période par son ID
 */
export const getPeriodName = (branchesData, periodId) => {
  if (!periodId) return 'Normal';
  
  const allPeriods = getAllPeriods(branchesData);
  const period = allPeriods.find(p => p.id === periodId);
  
  return period ? period.name : 'Période inconnue';
};

/**
 * Récupère les icônes selon le type de période
 */
export const getPeriodIcon = (periodType) => {
  const icons = {
    ramadan: '🌙',
    vacances: '🏖️',
    examens: '📚',
    autre: '📅'
  };
  
  return icons[periodType] || '📅';
};

/**
 * Récupère les couleurs selon le type de période
 */
export const getPeriodColors = (periodType) => {
  const colors = {
    ramadan: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200' },
    vacances: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' },
    examens: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
    autre: { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50', border: 'border-gray-200' }
  };
  
  return colors[periodType] || colors.autre;
};

/**
 * Vérifie si une période est active maintenant
 */
export const isPeriodActive = (period) => {
  return isDateInPeriod(new Date(), period);
};

/**
 * Vérifie si une période est à venir
 */
export const isPeriodFuture = (period) => {
  const now = new Date();
  const start = new Date(period.startDate);
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return now < start;
};

/**
 * Vérifie si une période est passée
 */
export const isPeriodPast = (period) => {
  const now = new Date();
  const end = new Date(period.endDate);
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return now > end;
};

/**
 * Formate les dates de période pour affichage
 */
export const formatPeriodDates = (period) => {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  return `${formatDate(start)} → ${formatDate(end)}`;
};

/**
 * Récupère le statut d'une période
 * @returns {Object} { status: 'active'|'future'|'past', label: string, color: string }
 */
export const getPeriodStatus = (period) => {
  if (isPeriodActive(period)) {
    return { 
      status: 'active', 
      label: 'En cours', 
      color: 'green',
      icon: '●'
    };
  }
  
  if (isPeriodFuture(period)) {
    return { 
      status: 'future', 
      label: 'À venir', 
      color: 'blue',
      icon: '⏱'
    };
  }
  
  return { 
    status: 'past', 
    label: 'Terminée', 
    color: 'gray',
    icon: '✓'
  };
};

/**
 * Compte le nombre de jours restants dans une période active
 */
export const getDaysRemaining = (period) => {
  if (!isPeriodActive(period)) return null;
  
  const now = new Date();
  const end = new Date(period.endDate);
  
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Compte le nombre de jours jusqu'au début d'une période future
 */
export const getDaysUntilStart = (period) => {
  if (!isPeriodFuture(period)) return null;
  
  const now = new Date();
  const start = new Date(period.startDate);
  
  const diffTime = start - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Génère un message d'information sur une période
 */
export const getPeriodInfoMessage = (period) => {
  const status = getPeriodStatus(period);
  const icon = getPeriodIcon(period.type);
  
  if (status.status === 'active') {
    const daysRemaining = getDaysRemaining(period);
    return `${icon} ${period.name} - En cours (${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''})`;
  }
  
  if (status.status === 'future') {
    const daysUntilStart = getDaysUntilStart(period);
    return `${icon} ${period.name} - Débute dans ${daysUntilStart} jour${daysUntilStart > 1 ? 's' : ''}`;
  }
  
  return `${icon} ${period.name} - Terminée`;
};

/**
 * Génère les classes CSS pour un badge de période
 * Utilisé dans les composants React pour créer des badges
 */
export const getPeriodBadgeClasses = (period) => {
  const status = getPeriodStatus(period);
  const colors = getPeriodColors(period.type);
  const icon = getPeriodIcon(period.type);
  
  const statusColors = {
    active: 'bg-green-500 text-white',
    future: 'bg-blue-500 text-white',
    past: 'bg-gray-400 text-white'
  };
  
  return {
    containerClass: 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
    statusClass: `px-2 py-0.5 rounded-full ${statusColors[status.status]}`,
    statusText: `${status.icon} ${status.label}`,
    periodText: `${icon} ${period.name}`
  };
};

/**
 * Valide les données d'une période avant création
 */
export const validatePeriod = (periodData) => {
  const errors = [];
  
  if (!periodData.name || periodData.name.trim() === '') {
    errors.push('Le nom de la période est requis');
  }
  
  if (!periodData.startDate) {
    errors.push('La date de début est requise');
  }
  
  if (!periodData.endDate) {
    errors.push('La date de fin est requise');
  }
  
  if (periodData.startDate && periodData.endDate) {
    const start = new Date(periodData.startDate);
    const end = new Date(periodData.endDate);
    
    if (start > end) {
      errors.push('La date de début doit être avant la date de fin');
    }
  }
  
  if (!periodData.type) {
    errors.push('Le type de période est requis');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Détecte les conflits entre périodes
 */
export const detectPeriodConflicts = (newPeriod, existingPeriods) => {
  const conflicts = [];
  
  for (const existing of existingPeriods) {
    const newStart = new Date(newPeriod.startDate);
    const newEnd = new Date(newPeriod.endDate);
    const existingStart = new Date(existing.startDate);
    const existingEnd = new Date(existing.endDate);
    
    // Vérifier si les périodes se chevauchent
    const overlaps = (
      (newStart >= existingStart && newStart <= existingEnd) ||
      (newEnd >= existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
    
    if (overlaps) {
      conflicts.push(existing);
    }
  }
  
  return conflicts;
};

/**
 * Génère un ID unique pour une période
 */
export const generatePeriodId = (periodData) => {
  const name = periodData.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const year = new Date(periodData.startDate).getFullYear();
  
  return `${name}-${year}`;
};

export default {
  getAllPeriods,
  isDateInPeriod,
  getActivePeriod,
  getActivePeriodId,
  filterSessionsByPeriod,
  getPeriodName,
  getPeriodIcon,
  getPeriodColors,
  isPeriodActive,
  isPeriodFuture,
  isPeriodPast,
  formatPeriodDates,
  getPeriodStatus,
  getDaysRemaining,
  getDaysUntilStart,
  getPeriodInfoMessage,
  getPeriodBadgeClasses,
  validatePeriod,
  detectPeriodConflicts,
  generatePeriodId
};
