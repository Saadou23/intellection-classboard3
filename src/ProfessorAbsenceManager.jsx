import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProfessorAbsenceService } from './ProfessorAbsenceService';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
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
  const [selectedCenter, setSelectedCenter] = useState('all');
  const visibleSessions = selectedCenter === 'all'
    ? sessions
    : sessions.filter(s => s.center === selectedCenter);
  const [selectedSession, setSelectedSession] = useState(null);
  const [makeupDate, setMakeupDate] = useState('');
  const [absenceNotes, setAbsenceNotes] = useState('');

  // États pour l'historique
  const [absenceHistory, setAbsenceHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCenter, setFilterCenter] = useState('all');
  // Rattrapage en cours de saisie dans l'historique (date + heure)
  const [makeupEdit, setMakeupEdit] = useState({ id: null, value: '' });
  // Période de visualisation de l'historique (dates au format YYYY-MM-DD)
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Absences de l'historique comprises dans la période choisie
  const visibleHistory = absenceHistory.filter(absence => {
    if (!periodStart && !periodEnd) return true;
    if (!absence.date) return false;
    const absenceDate = absence.date.toDate ? absence.date.toDate() : new Date(absence.date);
    if (periodStart && absenceDate < new Date(`${periodStart}T00:00:00`)) return false;
    if (periodEnd && absenceDate > new Date(`${periodEnd}T23:59:59.999`)) return false;
    return true;
  });
  const [centers, setCenters] = useState([]);

  // Liste des centres (= documents de la collection branches)
  useEffect(() => {
    getDocs(collection(db, 'branches'))
      .then(snapshot => setCenters(snapshot.docs.map(d => d.id).sort()))
      .catch(error => console.error('Erreur lors du chargement des centres:', error));
  }, []);

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
  }, [filterStatus, filterCenter, activeTab]);

  const loadSessionsForDate = async (date) => {
    try {
      setLoading(true);

      // Les séances sont stockées dans branches/{centre}.sessions[]
      // (heures au format "HH:MM", jour de la semaine dans dayOfWeek)
      const [year, month, day] = date.split('-').map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();

      const snapshot = await getDocs(collection(db, 'branches'));
      const found = [];

      snapshot.docs.forEach(branchDoc => {
        const branch = branchDoc.id;
        (branchDoc.data().sessions || []).forEach((s, index) => {
          const matchesDay = s.isExceptional && s.specificDate
            ? s.specificDate === date
            : s.dayOfWeek === dayOfWeek;
          if (!matchesDay || !s.startTime || !s.endTime) return;

          const [startH, startM] = s.startTime.split(':').map(Number);
          const [endH, endM] = s.endTime.split(':').map(Number);

          found.push({
            ...s,
            id: s.id || `${branch}-${index}`,
            center: s.filiale || branch,
            matiere: s.subject || '',
            niveau: s.level || '',
            groupe: Array.isArray(s.groupes) ? s.groupes.join(', ') : (s.groupe || ''),
            professorName: s.professor || s.professorName || '',
            startTime: new Date(year, month - 1, day, startH, startM),
            endTime: new Date(year, month - 1, day, endH, endM),
          });
        });
      });

      // Retirer les séances déjà marquées absentes ce jour-là
      const absenceSnapshot = await getDocs(
        query(
          collection(db, 'professor_absences'),
          where('date', '>=', Timestamp.fromDate(new Date(year, month - 1, day, 0, 0, 0, 0))),
          where('date', '<=', Timestamp.fromDate(new Date(year, month - 1, day, 23, 59, 59, 999)))
        )
      );
      const recordedSessionIds = new Set(absenceSnapshot.docs.map(d => d.data().sessionId));

      found.sort((a, b) => a.startTime - b.startTime);
      setSessions(found.filter(s => !recordedSessionIds.has(s.id)));
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
      if (filterCenter !== 'all') {
        filters.center = filterCenter;
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

  const handleClearMakeup = async (absenceId) => {
    if (!window.confirm('Supprimer la date de rattrapage ? La séance repassera en « Absent ».')) {
      return;
    }
    try {
      setLoading(true);
      await ProfessorAbsenceService.clearMakeup(absenceId);
      setMessage('✅ Rattrapage supprimé');
      loadAbsenceHistory();
    } catch (error) {
      console.error('Erreur lors de la suppression du rattrapage:', error);
      setMessage('❌ Erreur lors de la suppression du rattrapage');
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

  // Export PDF de l'historique affiché (respecte les filtres statut et centre)
  const exportHistoryPdf = () => {
    if (visibleHistory.length === 0) {
      setMessage('Aucune absence à exporter');
      return;
    }

    const statusLabels = {
      absent: 'Absent',
      scheduled_makeup: 'Rattrapage planifié',
      completed: 'Complété',
    };

    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.setFontSize(14);
    pdf.text('Historique des absences des professeurs', 14, 15);

    pdf.setFontSize(9);
    pdf.text(
      `Statut : ${filterStatus === 'all' ? 'Tous' : statusLabels[filterStatus]}  |  ` +
      `Centre : ${filterCenter === 'all' ? 'Tous' : filterCenter}  |  ` +
      `Période : ${periodStart || periodEnd ? `${periodStart || 'début'} au ${periodEnd || 'fin'}` : 'Toutes les dates'}  |  ` +
      `Généré le ${new Date().toLocaleString('fr-FR')}`,
      14,
      22
    );

    autoTable(pdf, {
      startY: 27,
      head: [['Professeur', 'Niveau', 'Matière', 'Groupe', 'Date séance', 'Statut', 'Rattrapage']],
      body: visibleHistory.map(absence => [
        absence.professorName || '-',
        absence.niveau || '-',
        absence.matiere || '-',
        absence.groupe || '-',
        formatDate(absence.date),
        statusLabels[absence.status] || absence.status || '-',
        formatDate(absence.makeupDate),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    pdf.save(`absences_${new Date().toISOString().split('T')[0]}.pdf`);
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
                {/* Centre Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🏫 Centre
                  </label>
                  <select
                    value={selectedCenter}
                    onChange={e => setSelectedCenter(e.target.value)}
                    className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">Tous les centres</option>
                    {centers.map(center => (
                      <option key={center} value={center}>{center}</option>
                    ))}
                  </select>
                </div>

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
                ) : visibleSessions.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Aucune séance trouvée pour cette date</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      🎓 Sélectionnez la séance
                    </label>
                    <div className="grid grid-cols-1 gap-5 max-h-96 overflow-y-auto">
                      {Object.entries(
                        visibleSessions.reduce((groups, session) => {
                          const center = session.center || 'Centre';
                          (groups[center] = groups[center] || []).push(session);
                          return groups;
                        }, {})
                      ).map(([center, centerSessions]) => (
                        <div key={center}>
                          <h4 className="font-bold text-gray-800 mb-2">
                            🏫 {center} ({centerSessions.length})
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {centerSessions.map(session => (
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
                                      📍 {session.niveau || session.level}
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
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Du</label>
                    <input
                      type="date"
                      value={periodStart}
                      max={periodEnd || undefined}
                      onChange={e => setPeriodStart(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Au</label>
                    <input
                      type="date"
                      value={periodEnd}
                      min={periodStart || undefined}
                      onChange={e => setPeriodEnd(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  {(periodStart || periodEnd) && (
                    <button
                      onClick={() => { setPeriodStart(''); setPeriodEnd(''); }}
                      className="px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Effacer la période
                    </button>
                  )}
                  <select
                    value={filterCenter}
                    onChange={(e) => setFilterCenter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="all">🏫 Tous les centres</option>
                    {centers.map(center => (
                      <option key={center} value={center}>{center}</option>
                    ))}
                  </select>
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
                  <button
                    onClick={exportHistoryPdf}
                    className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all"
                  >
                    📄 Exporter PDF
                  </button>
                </div>

                {/* Absence List */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin text-blue-600">⏳</div>
                    <p className="text-gray-600 mt-2">Chargement...</p>
                  </div>
                ) : visibleHistory.length === 0 ? (
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
                            Niveau
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
                        {visibleHistory.map(absence => (
                          <tr
                            key={absence.id}
                            className="border-b hover:bg-gray-50 transition-all"
                          >
                            <td className="px-4 py-3">{absence.professorName}</td>
                            <td className="px-4 py-3">{absence.niveau || '-'}</td>
                            <td className="px-4 py-3">{absence.matiere}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {formatDate(absence.date)}
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(absence.status)}</td>
                            <td className="px-4 py-3 text-xs">
                              {absence.makeupDate ? formatDate(absence.makeupDate) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {['absent', 'scheduled_makeup'].includes(absence.status) && makeupEdit.id !== absence.id && (
                                <button
                                  onClick={() => setMakeupEdit({ id: absence.id, value: '' })}
                                  title={absence.makeupDate ? 'Modifier le rattrapage' : 'Planifier le rattrapage'}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                >
                                  📅
                                </button>
                              )}
                              {absence.makeupDate && makeupEdit.id !== absence.id && (
                                <button
                                  onClick={() => handleClearMakeup(absence.id)}
                                  title="Supprimer la date du rattrapage"
                                  className="text-orange-600 hover:text-orange-800 mr-2"
                                >
                                  ↩️
                                </button>
                              )}
                              {makeupEdit.id === absence.id && (
                                <div className="flex flex-col gap-2 items-center">
                                  <input
                                    type="datetime-local"
                                    value={makeupEdit.value}
                                    onChange={e => setMakeupEdit({ ...makeupEdit, value: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      disabled={!makeupEdit.value}
                                      onClick={() => {
                                        handleUpdateMakeup(absence.id, makeupEdit.value);
                                        setMakeupEdit({ id: null, value: '' });
                                      }}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50"
                                    >
                                      Valider
                                    </button>
                                    <button
                                      onClick={() => setMakeupEdit({ id: null, value: '' })}
                                      className="px-2 py-1 bg-gray-200 rounded text-xs"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
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
