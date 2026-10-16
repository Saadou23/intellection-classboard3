import React, { useState, useEffect } from 'react';
import { ProfessorAbsenceService } from './ProfessorAbsenceService';

export default function StudentAbsenceNotifications({ userLevel, userCenter, userGroup }) {
  const [cancelledSessions, setCancelledSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCancelledSessions();

    // Recharger toutes les heures pour vérifier l'expiration des statuts
    const interval = setInterval(() => {
      loadCancelledSessions();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadCancelledSessions = async () => {
    try {
      setLoading(true);

      // Charger les absences d'aujourd'hui
      const absences = await ProfessorAbsenceService.getCancelledSessionsForDate(new Date());

      // Filtrer pour ce que l'étudiant peut voir
      const filtered = absences.filter(
        absence =>
          (userLevel === 'all' || absence.niveau === userLevel) &&
          (userCenter === 'all' || absence.center === userCenter) &&
          (userGroup === 'all' || absence.groupe === userGroup)
      );

      setCancelledSessions(filtered);
    } catch (error) {
      console.error('Erreur lors du chargement des sessions annulées:', error);
      setCancelledSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = absence => {
    if (absence.status === 'scheduled_makeup') {
      const makeupDate = absence.makeupDate?.toDate?.() || absence.makeupDate;
      const dateStr = new Date(makeupDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="font-semibold text-blue-900">📅 Rattrapage Planifié</p>
          <p className="text-sm text-blue-800 mt-1">
            La séance aura lieu le: <strong>{dateStr}</strong>
          </p>
        </div>
      );
    }

    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="font-semibold text-red-900">❌ Séance Annulée</p>
        <p className="text-sm text-red-800 mt-1">
          La date de rattrapage sera communiquée prochainement
        </p>
      </div>
    );
  };

  const formatTime = time => {
    if (!time) return '-';
    const date = time instanceof Date ? time : time?.toDate?.() || new Date(time);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">⏳ Chargement...</p>
      </div>
    );
  }

  if (cancelledSessions.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">⚠️ Séances Affectées</h2>

      {cancelledSessions.map(absence => (
        <div
          key={absence.id}
          className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-6 shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                {absence.matiere}
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({absence.groupe})
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-4 my-3 text-sm">
                <div>
                  <p className="text-gray-600">👨‍🏫 Professeur</p>
                  <p className="font-semibold text-gray-900">{absence.professorName}</p>
                </div>
                <div>
                  <p className="text-gray-600">🕐 Horaire initial</p>
                  <p className="font-semibold text-gray-900">{formatTime(absence.date)}</p>
                </div>
                <div>
                  <p className="text-gray-600">📍 Centre</p>
                  <p className="font-semibold text-gray-900">{absence.center}</p>
                </div>
                <div>
                  <p className="text-gray-600">📚 Niveau</p>
                  <p className="font-semibold text-gray-900">{absence.niveau}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-orange-200">
                {getStatusMessage(absence)}
              </div>

              {absence.notes && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📝 Note</p>
                  <p className="text-sm text-gray-700">{absence.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Auto-refresh notice */}
      <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 text-center">
        💡 Cette page se met à jour automatiquement. Les séances annulées disparaîtront après
        24h.
      </div>
    </div>
  );
}
