// Utilitaire pour vérifier la disponibilité des examens
export const isExamAvailable = (exam) => {
  if (!exam) return false;

  const now = new Date();

  // Parser les dates en format YYYY-MM-DD
  const [startYear, startMonth, startDay] = exam.dateDebut.split('-').map(Number);
  const [endYear, endMonth, endDay] = (exam.dateFin || exam.dateDebut).split('-').map(Number);

  const [startHour, startMin] = (exam.heureDebut || '00:00').split(':').map(Number);
  const [endHour, endMin] = (exam.heureFin || '23:59').split(':').map(Number);

  // Créer les dates en heure locale (pas UTC)
  const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMin, 0);
  const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMin, 59);

  return now >= startDateTime && now <= endDateTime;
};

export const getExamStatus = (exam) => {
  if (!exam) return { status: 'unknown', message: 'Examen introuvable' };

  const now = new Date();

  // Parser les dates en format YYYY-MM-DD
  const [startYear, startMonth, startDay] = exam.dateDebut.split('-').map(Number);
  const [endYear, endMonth, endDay] = (exam.dateFin || exam.dateDebut).split('-').map(Number);

  const [startHour, startMin] = (exam.heureDebut || '00:00').split(':').map(Number);
  const [endHour, endMin] = (exam.heureFin || '23:59').split(':').map(Number);

  // Créer les dates en heure locale (pas UTC)
  const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMin, 0);
  const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMin, 59);

  if (now < startDateTime) {
    const daysUntil = Math.ceil((startDateTime - now) / (1000 * 60 * 60 * 24));
    return {
      status: 'not_started',
      message: `L'examen commence le ${startDateTime.toLocaleDateString('fr-FR')} à ${exam.heureDebut}`,
      daysUntil
    };
  }

  if (now > endDateTime) {
    const daysSince = Math.ceil((now - endDateTime) / (1000 * 60 * 60 * 24));
    return {
      status: 'closed',
      message: `L'examen s'est terminé le ${endDateTime.toLocaleDateString('fr-FR')} à ${exam.heureFin}`,
      daysSince
    };
  }

  return {
    status: 'available',
    message: `L'examen est disponible jusqu'au ${endDateTime.toLocaleDateString('fr-FR')} à ${exam.heureFin}`,
    endsAt: endDateTime
  };
};

// Formatter une date YYYY-MM-DD en format local fr-FR
export const formatDateLocal = (dateStr) => {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('fr-FR');
};

export const formatExamPeriod = (exam) => {
  if (!exam) return '';

  const startDate = formatDateLocal(exam.dateDebut);
  const endDate = formatDateLocal(exam.dateFin || exam.dateDebut);

  if (exam.dateDebut === exam.dateFin) {
    return `${startDate} de ${exam.heureDebut} à ${exam.heureFin}`;
  }

  return `Du ${startDate} à ${exam.heureDebut} au ${endDate} à ${exam.heureFin}`;
};
