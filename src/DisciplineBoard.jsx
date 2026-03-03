import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  Users
} from 'lucide-react';
import {
  loadTodayRecords,
  loadBranchRecords,
  loadProfessorStats,
  calculateDisciplineScore,
  getDateRange,
  getUniqueProfessors,
  getSummaryStats,
  createDisciplineRecord,
  formatPenalties,
  getSeverityColor
} from './disciplineService';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ProfPresenceModal from './ProfPresenceModal';
import { getActivePeriodId } from './periodUtils';

const DisciplineBoard = ({ sessions, branches, selectedBranch, onBack }) => {
  const [activeTab, setActiveTab] = useState('today');
  const [todayRecords, setTodayRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load today's records
  useEffect(() => {
    if (selectedBranch) {
      loadTodayData();
    }
  }, [selectedBranch, lastUpdate]);

  // Load statistics when period or professor changes
  useEffect(() => {
    if ((activeTab === 'statistics' || activeTab === 'details') && selectedBranch) {
      loadStatisticsData();
    }
  }, [activeTab, selectedPeriod, selectedBranch]);

  const loadTodayData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayDayOfWeek = new Date().getDay();

      // Load existing records for today
      const records = await loadTodayRecords(selectedBranch);

      // Check if we're in an exceptional period (like Ramadan)
      console.log('DEBUG - Branches data:', branches);
      console.log('DEBUG - Branch structure check:', branches.map(b => ({
        name: b.name,
        hasExceptionalPeriods: !!b.exceptionalPeriods,
        periodsCount: b.exceptionalPeriods?.length || 0,
        periods: b.exceptionalPeriods?.map(p => ({
          id: p.id,
          name: p.name,
          startDate: p.startDate,
          endDate: p.endDate,
          type: p.type
        }))
      })));

      const activePeriodId = getActivePeriodId(branches);
      const isInExceptionalPeriod = activePeriodId !== null;
      console.log('DEBUG - Active period ID:', activePeriodId);
      console.log('DEBUG - Is in exceptional period:', isInExceptionalPeriod);

      // Get sessions that should have records today
      const branchSessions = sessions[selectedBranch] || [];

      console.log('DEBUG - Today:', today, '| Branch:', selectedBranch, '| DayOfWeek:', todayDayOfWeek);
      console.log('DEBUG - Active period:', activePeriodId);
      console.log('DEBUG - Is in exceptional period:', isInExceptionalPeriod);
      console.log('DEBUG - Total branch sessions:', branchSessions.length);

      // Log some sample sessions to see their structure
      if (branchSessions.length > 0) {
        console.log('DEBUG - Sample sessions structure:', branchSessions.slice(0, 3).map(s => ({
          professor: s.professor,
          subject: s.subject,
          isExceptional: s.isExceptional,
          period: s.period,
          specificDate: s.specificDate,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime
        })));
      }

      // Filter sessions based on period (same logic as PublicToday)
      let periodFilteredSessions;
      if (isInExceptionalPeriod) {
        // In exceptional period: show sessions for this period OR normal sessions (for other branches)
        periodFilteredSessions = branchSessions.filter(s => s.period === activePeriodId || !s.period || s.period === null || s.period === '');
        console.log('DEBUG - Filtering for period:', activePeriodId, '| Found:', periodFilteredSessions.length);
      } else {
        // Not in exceptional period: show ONLY normal sessions
        periodFilteredSessions = branchSessions.filter(s => !s.period || s.period === null || s.period === '');
        console.log('DEBUG - Filtering for normal sessions | Found:', periodFilteredSessions.length);
      }

      // Then filter by day/date
      let sessionsForToday = periodFilteredSessions.filter(s => {
        if (s.isExceptional && s.specificDate) {
          return s.specificDate === today;
        }
        return s.dayOfWeek === todayDayOfWeek;
      });
      console.log('DEBUG - Sessions today after time filter:', sessionsForToday.length);

      // Remove duplicates (same sessionId)
      const seenIds = new Set();
      sessionsForToday = sessionsForToday.filter(s => {
        if (seenIds.has(s.id)) {
          return false;
        }
        seenIds.add(s.id);
        return true;
      });

      console.log('DEBUG - Sessions that should exist for today (after dedup):', sessionsForToday.length);
      console.log('DEBUG - Session IDs from filtering:', sessionsForToday.map(s => ({ id: s.id, professor: s.professor })));

      // Create missing records
      for (const session of sessionsForToday) {
        const recordExists = records.some(r => r.sessionId === session.id && r.date === today);
        if (!recordExists && session.id) {
          try {
            console.log('DEBUG - About to create record for session with ID:', session.id);
            await createDisciplineRecord(session, selectedBranch, today);
            console.log('DEBUG - Created record for session:', session.id);
          } catch (err) {
            console.error('DEBUG - Error creating record:', err);
          }
        }
      }

      // Reload records (should be fresh)
      const freshRecords = await loadTodayRecords(selectedBranch);

      // Deduplicate records by sessionId (some may have been created multiple times)
      const seenRecordIds = new Set();
      const deduplicatedRecords = freshRecords.filter(r => {
        if (seenRecordIds.has(r.sessionId)) {
          return false;
        }
        seenRecordIds.add(r.sessionId);
        return true;
      });

      // Create a set of session "keys" for matching
      // Use sessionId if available, otherwise use professor + startTime as fallback
      const sessionKeys = new Set(
        sessionsForToday.map(s =>
          s.id ? s.id : `${s.professor}|${s.startTime}`
        )
      );

      console.log('DEBUG - Expected session keys:', Array.from(sessionKeys));
      console.log('DEBUG - Records from Firebase - first 3:', deduplicatedRecords.slice(0, 3).map(r => `${r.professorName} @ ${r.startTime_planned} (ID: ${r.sessionId})`));

      // Filter records by sessionId OR by professor + startTime combo
      const filteredRecords = deduplicatedRecords.filter(r => {
        const bySessionId = sessionKeys.has(r.sessionId);
        const byCombo = sessionKeys.has(`${r.professorName}|${r.startTime_planned}`);
        return bySessionId || byCombo;
      });

      console.log(`DEBUG - Record filtering: ${freshRecords.length} total (${deduplicatedRecords.length} unique) → ${filteredRecords.length} matched (${sessionsForToday.length} expected sessions)`);
      setTodayRecords(filteredRecords);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatisticsData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(selectedPeriod);
      console.log('DEBUG Stats - Date range:', startDate, 'to', endDate);

      const records = await loadBranchRecords(selectedBranch, startDate, endDate);
      console.log('DEBUG Stats - Records loaded:', records.length);
      console.log('DEBUG Stats - Sample records:', records.slice(0, 3).map(r => ({
        professor: r.professorName,
        status: r.status,
        date: r.date
      })));

      setAllRecords(records);

      const profs = getUniqueProfessors(records);
      console.log('DEBUG Stats - Unique professors:', profs);
      setProfessors(profs);

      if (profs.length > 0 && !selectedProfessor) {
        setSelectedProfessor(profs[0]);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecord(null);
  };

  const handleSuccess = () => {
    setLastUpdate(new Date());
  };

  // Get retard badge color and label
  const getRetardBadge = (minutes) => {
    if (minutes === null || minutes === undefined) {
      return { icon: '⚫', label: 'Non confirmé', color: 'bg-gray-100 text-gray-700' };
    }
    if (minutes <= 5) {
      return { icon: '🟢', label: `${minutes}min`, color: 'bg-green-100 text-green-700' };
    }
    if (minutes <= 15) {
      return { icon: '🟡', label: `${minutes}min`, color: 'bg-yellow-100 text-yellow-700' };
    }
    return { icon: '🔴', label: `${minutes}min`, color: 'bg-red-100 text-red-700' };
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      PLANNED: { icon: '⏳', label: 'Planifié', color: 'bg-blue-100 text-blue-700' },
      PRESENT: { icon: '✅', label: 'Présent', color: 'bg-green-100 text-green-700' },
      COMPLETED: { icon: '✅', label: 'Terminé', color: 'bg-green-100 text-green-700' },
      ABSENT: { icon: '🚫', label: 'Absent', color: 'bg-red-100 text-red-700' }
    };
    return badges[status] || badges.PLANNED;
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render TODAY tab
  const renderTodayTab = () => {
    return (
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8 text-gray-600">
            Chargement en cours...
          </div>
        )}

        {!loading && todayRecords.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            Aucune séance prévue aujourd'hui pour {selectedBranch}
          </div>
        )}

        {!loading && todayRecords.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Heure</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Professeur</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Matière</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Arrivée</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Retard</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Volume</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Statut</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((record, idx) => {
                  const retardBadge = getRetardBadge(record.retardMinutes);
                  const statusBadge = getStatusBadge(record.status);

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        {record.startTime_planned} - {record.endTime_planned}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {record.professorName}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {record.subject} ({record.level})
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {record.startTime_actual || '—'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${retardBadge.color}`}>
                          {retardBadge.icon} {retardBadge.label}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {record.volumePercentage !== null ? `${record.volumePercentage}%` : '—'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${statusBadge.color}`}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => openModal(record)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                        >
                          📍
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Render DETAILS tab
  const renderDetailsTab = () => {
    if (loading) {
      return (
        <div className="text-center py-8 text-gray-600">
          Chargement en cours...
        </div>
      );
    }

    const profRecords = selectedProfessor
      ? allRecords.filter(r => r.professorName === selectedProfessor)
      : [];

    if (profRecords.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professeur
              </label>
              <select
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              >
                <option>Aucun enregistrement trouvé</option>
              </select>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-800">
              ⚠️ Aucun enregistrement de discipline trouvé pour la période sélectionnée.
            </p>
          </div>
        </div>
      );
    }

    // Sort records by date (newest first)
    const sortedRecords = [...profRecords].sort((a, b) => {
      return (b.date || '').localeCompare(a.date || '');
    });

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professeur
              </label>
              <select
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {professors.map(prof => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="semester">Semestre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detailed hours table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
            <h3 className="font-bold text-lg">📅 Détail des Horaires - {selectedProfessor}</h3>
            <p className="text-sm text-gray-600">({sortedRecords.length} séances)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Matière</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Heure Prévue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Heure Entrée</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Retard</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Heure Sortie</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Volume</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((record, idx) => {
                  const statusBadge = getStatusBadge(record.status);
                  const retardBadge = getRetardBadge(record.retardMinutes);

                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.subject} ({record.level})
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {record.startTime_planned} - {record.endTime_planned}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.startTime_actual ? (
                          <span className="font-medium text-blue-600">{record.startTime_actual}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${retardBadge.color}`}>
                          {retardBadge.icon} {retardBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.endTime_actual ? (
                          <span className="font-medium text-blue-600">{record.endTime_actual}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {record.volumePercentage !== null ? (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            record.volumePercentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {record.volumePercentage}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Penalties breakdown */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
            <h3 className="font-bold text-lg">⚖️ Détail des Pénalités</h3>
          </div>
          <div className="p-6 space-y-4">
            {sortedRecords.length === 0 ? (
              <p className="text-gray-600">Aucune pénalité à afficher</p>
            ) : (
              sortedRecords.map((record, idx) => {
                const penalties = formatPenalties(record);

                if (penalties.length === 0 && record.status === 'COMPLETED') {
                  return (
                    <div key={idx} className="bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">
                            {new Date(record.date).toLocaleDateString('fr-FR')} - {record.subject} ({record.level})
                          </p>
                          <p className="text-sm text-green-700">✅ Aucune pénalité</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return penalties.map((penalty, pidx) => (
                  <div key={`${idx}-${pidx}`} className={`border-l-4 p-4 rounded-r ${getSeverityColor(penalty.severity)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {new Date(record.date).toLocaleDateString('fr-FR')} - {record.subject} ({record.level})
                          </p>
                        </div>
                        <p className="font-semibold text-base mt-1">{penalty.label}</p>
                        <p className="text-sm mt-1 opacity-90">{penalty.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg">{penalty.points}</p>
                        <p className="text-xs font-medium mt-1">{penalty.severity}</p>
                      </div>
                    </div>
                  </div>
                ));
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render STATISTICS tab
  const renderStatisticsTab = () => {
    if (loading) {
      return (
        <div className="text-center py-8 text-gray-600">
          Chargement en cours...
        </div>
      );
    }

    const profRecords = selectedProfessor
      ? allRecords.filter(r => r.professorName === selectedProfessor)
      : [];

    console.log('DEBUG Render Stats - Selected prof:', selectedProfessor);
    console.log('DEBUG Render Stats - Prof records found:', profRecords.length, 'out of', allRecords.length);
    if (profRecords.length === 0 && allRecords.length > 0) {
      console.log('DEBUG Render Stats - All professor names in records:', [...new Set(allRecords.map(r => r.professorName))]);
    }

    const summaryStats = getSummaryStats(profRecords);
    const score = calculateDisciplineScore(profRecords);

    // Calculate ranking
    const ranking = professors.map(prof => ({
      name: prof,
      score: calculateDisciplineScore(allRecords.filter(r => r.professorName === prof)),
      records: allRecords.filter(r => r.professorName === prof).length
    })).sort((a, b) => a.score - b.score);

    if (allRecords.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professeur
                </label>
                <select
                  value={selectedProfessor}
                  onChange={(e) => setSelectedProfessor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                >
                  <option>Aucun enregistrement trouvé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Semaine</option>
                  <option value="month">Mois</option>
                  <option value="semester">Semestre</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-800">
              ⚠️ Aucun enregistrement de discipline trouvé pour la période sélectionnée.
              Avez-vous renseigné les horaires d'arrivée/départ dans l'onglet "Aujourd'hui"?
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professeur
              </label>
              <select
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {professors.map(prof => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Semaine</option>
                <option value="month">Mois</option>
                <option value="semester">Semestre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary cards for selected professor */}
        {selectedProfessor && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Score card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Score Discipline</p>
                  <p className={`text-3xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </p>
                </div>
                <div className={`text-5xl ${getScoreColor(score)}`}>
                  {score >= 90 ? '🏆' : score >= 70 ? '✅' : score >= 50 ? '⚠️' : '🚨'}
                </div>
              </div>
            </div>

            {/* Sessions card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Séances</p>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {summaryStats.sessionsCompleted} / {summaryStats.sessionsPlanned}
                    </p>
                    <p className="text-xs text-red-600">
                      {summaryStats.sessionsAbsent} absence(s)
                    </p>
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Volume card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Volume</p>
                  <p className="text-lg font-semibold">{summaryStats.volumePercentage}%</p>
                  <p className="text-xs text-gray-500">
                    {summaryStats.volumeActual}h / {summaryStats.volumePlanned}h
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            {/* Retard card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Retard moyen</p>
                  <p className="text-lg font-semibold">{summaryStats.averageRetard} min</p>
                </div>
                <Clock className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Ranking table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
            <h3 className="font-bold text-lg">Classement des Professeurs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rang</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Professeur</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Séances</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((prof, idx) => {
                  let statusIcon = '';
                  let statusLabel = '';

                  if (prof.score >= 90) {
                    statusIcon = '🏆';
                    statusLabel = 'Excellent';
                  } else if (prof.score >= 70) {
                    statusIcon = '✅';
                    statusLabel = 'Bon';
                  } else if (prof.score >= 50) {
                    statusIcon = '⚠️';
                    statusLabel = 'Moyen';
                  } else {
                    statusIcon = '🚨';
                    statusLabel = 'Problématique';
                  }

                  return (
                    <tr
                      key={prof.name}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        selectedProfessor === prof.name ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedProfessor(prof.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="px-6 py-3 text-sm font-semibold text-gray-700">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {prof.name}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-lg font-bold ${getScoreColor(prof.score)}`}>
                          {prof.score}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {prof.records}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="inline-block">{statusIcon} {statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-white hover:text-blue-200 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>
          <div>
            <h1 className="text-2xl font-bold">📊 Tableau de Discipline</h1>
            <p className="text-blue-200 text-sm">Suivi des présences des professeurs</p>
          </div>
          <div className="text-sm text-blue-200">
            Filiale: <span className="font-bold text-white">{selectedBranch}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 bg-white border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-4 px-2 font-medium border-b-2 transition-all ${
              activeTab === 'today'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Aujourd'hui
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-2 font-medium border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⏰ Détails Horaires
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-4 px-2 font-medium border-b-2 transition-all ${
              activeTab === 'statistics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📈 Statistiques
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'today' && renderTodayTab()}
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'statistics' && renderStatisticsTab()}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedRecord && (
        <ProfPresenceModal
          record={selectedRecord}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default DisciplineBoard;
