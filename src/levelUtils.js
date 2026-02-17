// Utilitaires pour gérer les niveaux multiples (ex: "1BAC + 2BAC")

/**
 * Vérifie si une session contient un niveau spécifique
 * Gère à la fois les anciens formats (string simple) et nouveaux (multi-niveaux)
 */
export const sessionIncludesLevel = (session, targetLevel) => {
  if (!session || !session.level || !targetLevel) return false;
  
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
  if (!session || !session.level) return [];
  
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
