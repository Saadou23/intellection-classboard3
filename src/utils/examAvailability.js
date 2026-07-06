// Utilitaire pour vérifier la disponibilité des examens
export const isExamAvailable = (exam) => {
  if (!exam) return false;

  const now = new Date();
  const startDateTime = new Date(`${exam.dateDebut}T${exam.heureDebut || '00:00'}`);
  const endDateTime = new Date(`${exam.dateFin || exam.dateDebut}T${exam.heureFin || '23:59'}`);

  return now >= startDateTime && now <= endDateTime;
};

export const getExamStatus = (exam) => {
  if (!exam) return { status: 'unknown', message: 'Examen introuvable' };

  const now = new Date();
  const startDateTime = new Date(`${exam.dateDebut}T${exam.heureDebut || '00:00'}`);
  const endDateTime = new Date(`${exam.dateFin || exam.dateDebut}T${exam.heureFin || '23:59'}`);

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

export const formatExamPeriod = (exam) => {
  if (!exam) return '';

  const startDate = new Date(exam.dateDebut).toLocaleDateString('fr-FR');
  const endDate = new Date(exam.dateFin || exam.dateDebut).toLocaleDateString('fr-FR');

  if (exam.dateDebut === exam.dateFin) {
    return `${startDate} de ${exam.heureDebut} à ${exam.heureFin}`;
  }

  return `Du ${startDate} à ${exam.heureDebut} au ${endDate} à ${exam.heureFin}`;
};
