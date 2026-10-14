import React, { useState, useEffect } from 'react';
import { ProfessorAbsenceService } from './ProfessorAbsenceService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ProfessorAbsenceHistory() {
  const [absenceHistory, setAbsenceHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Filtres
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [professors, setProfessors] = useState([]);
  const [centers, setCenters] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAbsenceHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterStatus, filterProfessor, filterCenter, dateRange, absenceHistory]);

  const loadAbsenceHistory = async () => {
    try {
      setLoading(true);
      setMessage('');

      const history = await ProfessorAbsenceService.getAbsenceHistory();

      // Extraire les professeurs et centres uniques
      const uniqueProfessors = [...new Set(history.map(a => a.professorName))].sort();
      const uniqueCenters = [...new Set(history.map(a => a.center))].sort();

      setProfessors(uniqueProfessors);
      setCenters(uniqueCenters);
      setAbsenceHistory(history);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setMessage('❌ Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = absenceHistory;

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    // Filtre par professeur
    if (filterProfessor) {
      filtered = filtered.filter(a => a.professorName === filterProfessor);
    }

    // Filtre par centre
    if (filterCenter) {
      filtered = filtered.filter(a => a.center === filterCenter);
    }

    // Filtre par date
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    filtered = filtered.filter(a => {
      const absenceDate = a.date?.toDate?.() || new Date(a.date);
      return absenceDate >= startDate && absenceDate <= endDate;
    });

    setFilteredHistory(filtered);
  };

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterProfessor('');
    setFilterCenter('');
    setDateRange({
      start: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      end: new Date().toISOString().split('T')[0],
    });
  };

  const handleDeleteAbsence = async (absenceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) {
      return;
    }

    try {
      setLoading(true);
      await ProfessorAbsenceService.deleteAbsence(absenceId);
      setMessage('✅ Enregistrement supprimé');
      loadAbsenceHistory();
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMakeup = async (absenceId) => {
    try {
      setLoading(true);
      await ProfessorAbsenceService.completeMakeup(absenceId);
      setMessage('✅ Rattrapage marqué comme complété');
      loadAbsenceHistory();
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      doc.setFontSize(16);
      doc.text('📊 Historique des Absences Professeurs', pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 10;

      // Date range
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Période: ${new Date(dateRange.start).toLocaleDateString('fr-FR')} au ${new Date(dateRange.end).toLocaleDateString('fr-FR')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 10;

      // Table
      const tableData = filteredHistory.map(absence => [
        absence.professorName,
        absence.matiere,
        new Date(absence.date?.toDate?.() || absence.date).toLocaleDateString('fr-FR'),
        absence.status === 'absent'
          ? '❌ Absent'
          : absence.status === 'scheduled_makeup'
          ? '📅 Planifié'
          : '✅ Complété',
        absence.makeupDate
          ? new Date(absence.makeupDate?.toDate?.() || absence.makeupDate).toLocaleDateString(
              'fr-FR'
            )
          : '-',
        absence.center,
      ]);

      doc.autoTable({
        head: [['Professeur', 'Matière', 'Date Absence', 'Statut', 'Date Rattrapage', 'Centre']],
        body: tableData,
        startY: yPosition,
        margin: 10,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 245, 255],
        },
        columnStyles: {
          3: { halign: 'center' },
        },
      });

      // Footer
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Généré le: ${new Date().toLocaleString('fr-FR')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      doc.save(`absences-professeurs-${new Date().getTime()}.pdf`);
      setMessage('✅ PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setMessage('❌ Erreur lors de l\'export PDF');
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'scheduled_makeup':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = status => {
    const labels = {
      absent: '❌ Absent',
      scheduled_makeup: '📅 Rattrapage planifié',
      completed: '✅ Complété',
    };
    return labels[status] || status;
  };

  const formatDate = date => {
    if (!date) return '-';
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: filteredHistory.length,
    absent: filteredHistory.filter(a => a.status === 'absent').length,
    scheduled: filteredHistory.filter(a => a.status === 'scheduled_makeup').length,
    completed: filteredHistory.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 to-blue-700 text-white p-8">
            <h1 className="text-3xl font-bold">📊 Historique des Absences</h1>
            <p className="text-blue-100 mt-2">Suivi complet des absences et rattrapages</p>
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

          <div className="p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm">Total d'absences</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                <p className="text-gray-600 text-sm">Non planifiés</p>
                <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                <p className="text-gray-600 text-sm">Rattrapages planifiés</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.scheduled}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <p className="text-gray-600 text-sm">Complétés</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">🔍 Filtres</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Du
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Au
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="all">Tous</option>
                    <option value="absent">Absent</option>
                    <option value="scheduled_makeup">Planifié</option>
                    <option value="completed">Complété</option>
                  </select>
                </div>

                {/* Professor Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professeur
                  </label>
                  <select
                    value={filterProfessor}
                    onChange={e => setFilterProfessor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">Tous</option>
                    {professors.map(prof => (
                      <option key={prof} value={prof}>
                        {prof}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Center Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centre
                  </label>
                  <select
                    value={filterCenter}
                    onChange={e => setFilterCenter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">Tous</option>
                    {centers.map(center => (
                      <option key={center} value={center}>
                        {center}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-all"
                >
                  🔄 Réinitialiser
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
                >
                  📄 Exporter PDF
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin text-blue-600 text-2xl">⏳</div>
                <p className="text-gray-600 mt-3">Chargement...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 text-lg">Aucun enregistrement trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Professeur
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Matière
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Date Absence
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Groupe
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Rattrapage
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((absence, idx) => (
                      <tr
                        key={absence.id}
                        className={`border-b hover:bg-blue-50 transition-all ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {absence.professorName}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{absence.matiere}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(absence.date)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{absence.groupe}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              absence.status
                            )}`}
                          >
                            {getStatusLabel(absence.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {absence.makeupDate
                            ? formatDate(absence.makeupDate)
                            : absence.status === 'absent'
                            ? '⏳ En attente'
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          {absence.status === 'scheduled_makeup' && (
                            <button
                              onClick={() => handleCompleteMakeup(absence.id)}
                              className="text-green-600 hover:text-green-800 font-medium"
                              title="Marquer comme complété"
                            >
                              ✅
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAbsence(absence.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                            title="Supprimer"
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
        </div>
      </div>
    </div>
  );
}
