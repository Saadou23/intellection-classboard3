import React, { useState, useEffect } from 'react';
import { ProfessorAbsenceService } from './ProfessorAbsenceService';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from 'firebase/firestore';

export default function ProfessorAbsenceManager() {
  const [activeTab, setActiveTab] = useState('report');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // États pour la saisie d'absence
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [makeupDate, setMakeupDate] = useState('');
  const [absenceNotes, setAbsenceNotes] = useState('');

  // États pour l'historique
  const [absenceHistory, setAbsenceHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Charger les séances du jour sélectionné
  useEffect(() => {
    if (activeTab === 'report') {
      loadSessionsForDate(selectedDate);
    }
  }, [selectedDate, activeTab]);

  // Charger l'historique
  useEffect(() => {
    if (activeTab === 'history') {
      loadAbsenceHistory();
    }
  }, [filterStatus, activeTab]);

  const loadSessionsForDate = async (date) => {
    try {
      setLoading(true);

      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'schedules'),
        where('startTime', '>=', Timestamp.fromDate(startOfDay)),
        where('startTime', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(q);
      setSessions(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate(),
          endTime: doc.data().endTime?.toDate(),
        }))
      );
      setSelectedSession(null);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
      setMessage('Erreur lors du chargement des séances');
    } finally {
      setLoading(false);
    }
  };

  const loadAbsenceHistory = async () => {
    try {
      setLoading(true);

      const filters = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }

      const history = await ProfessorAbsenceService.getAbsenceHistory(filters);
      setAbsenceHistory(history);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setMessage('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAbsence = async () => {
    if (!selectedSession) {
      setMessage('Veuillez sélectionner une séance');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const absenceData = {
        sessionId: selectedSession.id,
        professorId: selectedSession.professorId || 'unknown',
        professorName: selectedSession.professorName || 'Professeur',
        date: Timestamp.fromDate(selectedSession.startTime),
        center: selectedSession.center || '',
        niveau: selectedSession.niveau || selectedSession.level || '',
        matiere: selectedSession.matiere || selectedSession.subject || '',
        groupe: selectedSession.groupe || selectedSession.group || '',
        makeupDate: makeupDate ? Timestamp.fromDate(new Date(makeupDate)) : null,
        notes: absenceNotes,
      };

      const absenceId = await ProfessorAbsenceService.recordAbsence(absenceData);

      setMessage(`✅ Absence enregistrée avec succès (ID: ${absenceId.slice(0, 8)}...)`);
      setSelectedSession(null);
      setMakeupDate('');
      setAbsenceNotes('');

      // Recharger les séances
      setTimeout(() => {
        loadSessionsForDate(selectedDate);
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setMessage('❌ Erreur lors de l\'enregistrement de l\'absence');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMakeup = async (absenceId, newMakeupDate) => {
    try {
      setLoading(true);

      if (newMakeupDate) {
        await ProfessorAbsenceService.scheduleMakeup(absenceId, newMakeupDate);
        setMessage('✅ Rattrapage planifié');
      } else {
        // Si pas de date, marquer comme complété
        await ProfessorAbsenceService.completeMakeup(absenceId);
        setMessage('✅ Rattrapage marqué comme complété');
      }

      loadAbsenceHistory();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage('❌ Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) {
      return;
    }

    try {
      setLoading(true);

      await ProfessorAbsenceService.deleteAbsence(absenceId);
      setMessage('✅ Absence supprimée');

      loadAbsenceHistory();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setMessage('❌ Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = status => {
    const statusMap = {
      absent: { label: '❌ Absent', color: 'bg-red-500' },
      scheduled_makeup: { label: '📅 Rattrapage planifié', color: 'bg-blue-500' },
      completed: { label: '✅ Complété', color: 'bg-green-500' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-500' };

    return (
      <span className={`${statusInfo.color} text-white px-3 py-1 rounded-full text-sm`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = date => {
    if (!date) return '-';
    if (date instanceof Date) {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (date.toDate) {
      return date.toDate().toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <h1 className="text-3xl font-bold">📋 Gestion des Absences Professeurs</h1>
            <p className="text-blue-100 mt-2">
              Suivez les absences et planifiez les rattrapages
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'report'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📝 Signaler une Absence
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 font-semibold transition-all ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Historique
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 m-6 rounded-lg ${
                message.startsWith('✅')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message}
            </div>
          )}

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'report' && (
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Date de la séance
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Sessions List */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin text-blue-600">⏳</div>
                    <p className="text-gray-600 mt-2">Chargement des séances...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Aucune séance trouvée pour cette date</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      🎓 Sélectionnez la séance
                    </label>
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                      {sessions.map(session => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedSession?.id === session.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {session.matiere || session.subject} ({session.groupe || session.group})
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                👨‍🏫 {session.professorName || 'Professeur'}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                📍 {session.center || 'Centre'} • {session.niveau || session.level}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                🕐 {formatDate(session.startTime)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Makeup Date */}
                {selectedSession && (
                  <div className="bg-blue-50 p-6 rounded-lg space-y-4 border-l-4 border-blue-600">
                    <h3 className="font-semibold text-blue-900">📅 Planifier un Rattrapage</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date et heure du rattrapage (optionnel)
                      </label>
                      <input
                        type="datetime-local"
                        value={makeupDate}
                        onChange={e => setMakeupDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Notes (optionnel)
                      </label>
                      <textarea
                        value={absenceNotes}
                        onChange={e => setAbsenceNotes(e.target.value)}
                        placeholder="Raison de l'absence, remarques..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="3"
                      />
                    </div>

                    <button
                      onClick={handleReportAbsence}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                      {loading ? 'En cours...' : '❌ Signaler cette Absence'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  {['all', 'absent', 'scheduled_makeup', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        filterStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {status === 'all'
                        ? '📋 Tous'
                        : status === 'absent'
                        ? '❌ Absent'
                        : status === 'scheduled_makeup'
                        ? '📅 Rattrapages planifiés'
                        : '✅ Complétés'}
                    </button>
                  ))}
                </div>

                {/* Absence List */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin text-blue-600">⏳</div>
                    <p className="text-gray-600 mt-2">Chargement...</p>
                  </div>
                ) : absenceHistory.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Aucun enregistrement trouvé</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Professeur
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Matière
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Statut
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Rattrapage
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {absenceHistory.map(absence => (
                          <tr
                            key={absence.id}
                            className="border-b hover:bg-gray-50 transition-all"
                          >
                            <td className="px-4 py-3">{absence.professorName}</td>
                            <td className="px-4 py-3">{absence.matiere}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {formatDate(absence.date)}
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(absence.status)}</td>
                            <td className="px-4 py-3 text-xs">
                              {absence.makeupDate ? formatDate(absence.makeupDate) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {absence.status === 'absent' && (
                                <button
                                  onClick={() => {
                                    const newDate = prompt(
                                      'Date du rattrapage (YYYY-MM-DDTHH:mm):'
                                    );
                                    if (newDate) {
                                      handleUpdateMakeup(absence.id, newDate);
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                >
                                  📅
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAbsence(absence.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
