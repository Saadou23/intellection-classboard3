// Utilitaires pour gérer les niveaux multiples (ex: "1BAC + 2BAC")

/**
 * Vérifie si une session contient un niveau spécifique
 * Gère à la fois les anciens formats (string simple) et nouveaux (multi-niveaux)
 */
export const sessionIncludesLevel = (session, targetLevel) => {
  if (!session || !targetLevel) return false;

  // Si la session a un champ 'levels' (array), vérifier dedans
  if (session.levels && Array.isArray(session.levels)) {
    return session.levels.includes(targetLevel);
  }

  // Si la session n'a pas de level, retourner false
  if (!session.level) return false;

  // Si le niveau contient " + ", c'est un cours multi-niveaux
  if (session.level.includes(' + ')) {
    const levels = session.level.split(' + ');
    return levels.includes(targetLevel);
  }

  // Sinon, comparaison directe
  return session.level === targetLevel;
};

/**
 * Extrait tous les niveaux d'une session (retourne un tableau)
 */
export const getSessionLevels = (session) => {
  if (!session) return [];

  // Si la session a un champ 'levels' (array), retourner directement
  if (session.levels && Array.isArray(session.levels)) {
    return session.levels;
  }

  // Si pas de level, retourner tableau vide
  if (!session.level) return [];

  // Si le niveau contient " + ", c'est un cours multi-niveaux
  if (session.level.includes(' + ')) {
    return session.level.split(' + ');
  }

  return [session.level];
};

/**
 * Formate l'affichage d'un niveau pour l'interface
 */
export const formatLevelDisplay = (level) => {
  if (!level) return '-';
  
  // Si multi-niveaux, on peut choisir d'afficher différemment
  if (level.includes(' + ')) {
    return level; // Afficher tel quel
  }
  
  return level;
};
