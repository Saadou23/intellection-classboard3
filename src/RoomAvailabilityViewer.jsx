import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import {
  getAvailableSlots,
  getRoomsByAvailability,
  generateAvailabilityReport,
  getAllRoomsForBranch,
  calculateAvailabilityStats,
  isRoomAvailable
} from './RoomAvailabilityService';

const RoomAvailabilityViewer = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || '');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [viewMode, setViewMode] = useState('rooms'); // 'rooms' ou 'timeline'
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [report, setReport] = useState(null);

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  // Charger les périodes disponibles
  useEffect(() => {
    if (branchesData && branchesData.length > 0) {
      const periods = [];
      branchesData.forEach(branch => {
        if (branch.exceptionalPeriods && branch.exceptionalPeriods.length > 0) {
          branch.exceptionalPeriods.forEach(period => {
            if (!periods.find(p => p.id === period.id)) {
              periods.push(period);
            }
          });
        }
      });
      setAvailablePeriods(periods);
    }
  }, [branchesData]);

  // Charger les salles et générer le rapport
  useEffect(() => {
    if (branchesData && branchesData.length > 0) {
      const branch = branchesData.find(b => b.name === selectedBranch);
      if (branch) {
        const branchRooms = getAllRoomsForBranch(branch);
        setRooms(branchRooms);

        // Générer le rapport
        const branchSessions = sessions[selectedBranch] || [];
        const newReport = generateAvailabilityReport(
          branchSessions,
          branchRooms,
          selectedDay,
          selectedBranch
        );
        setReport(newReport);
      }
    }
  }, [selectedBranch, selectedDay, selectedPeriod, sessions, branchesData]);

  if (!report) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  const dayName = daysOfWeek.find(d => d.value === selectedDay)?.label || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">🏛️ Disponibilité des Salles par Centre</h2>
              <p className="text-blue-200 text-sm mt-1">Visualisez tous les crénaux disponibles</p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-600 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Centre</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📆 Jour</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📅 Période</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">📅 Emploi Normal</option>
                {availablePeriods.map(period => (
                  <option key={period.id} value={period.id}>
                    🌙 {period.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">👁️ Vue</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('rooms')}
                  className={`flex-1 p-2 rounded-lg transition-all font-semibold ${
                    viewMode === 'rooms'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Salles
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex-1 p-2 rounded-lg transition-all font-semibold ${
                    viewMode === 'timeline'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Crénaux
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{report.summary.fullyAvailable}</div>
              <div className="text-xs text-gray-600">Salles libres</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{report.summary.partiallyAvailable}</div>
              <div className="text-xs text-gray-600">Partiellement libres</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{report.summary.unavailable}</div>
              <div className="text-xs text-gray-600">Occupées</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-gray-800">{report.totalRooms}</div>
              <div className="text-xs text-gray-600">Salles totales</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'rooms' ? (
            <RoomsByAvailabilityView
              report={report}
              sessions={sessions[selectedBranch] || []}
              selectedDay={selectedDay}
              selectedPeriod={selectedPeriod}
            />
          ) : (
            <TimelineView
              report={report}
              sessions={sessions[selectedBranch] || []}
              selectedDay={selectedDay}
              selectedPeriod={selectedPeriod}
              daysOfWeek={daysOfWeek}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Vue par salles triées par disponibilité
 */
const RoomsByAvailabilityView = ({ report, sessions, selectedDay, selectedPeriod }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        🎯 Salles triées par disponibilité
      </h3>

      {report.roomsByAvailability.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Aucune salle configurée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.roomsByAvailability.map((roomData, idx) => {
            const slots = getAvailableSlots(sessions, roomData.room, selectedDay, selectedPeriod);
            const stats = calculateAvailabilityStats(slots);
            const utilizationPercent = Math.round((1 - (stats.totalMinutes / 660)) * 100); // 660 = 11h per day

            return (
              <div
                key={roomData.room}
                className="border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg text-gray-800">
                      {idx + 1}. {roomData.room}
                    </h4>
                    <span className="text-sm font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Utilization bar */}
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {utilizationPercent}% occupée
                  </p>
                </div>

                {/* Stats */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps disponible</span>
                    <span className="font-bold text-blue-600">
                      {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Crénaux libres</span>
                    <span className="font-bold text-green-600">{stats.totalSlots}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Durée moyenne</span>
                    <span className="font-bold text-gray-800">
                      {Math.floor(stats.averageSlotDuration / 60)}h {stats.averageSlotDuration % 60}m
                    </span>
                  </div>
                </div>

                {/* Slots preview */}
                <div className="p-4 bg-gray-50 border-t">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Crénaux disponibles:</p>
                  <div className="space-y-1">
                    {slots.slice(0, 3).map((slot, i) => (
                      <div key={i} className="text-xs bg-green-50 text-green-700 p-1 rounded">
                        ✓ {slot.start} - {slot.end}
                      </div>
                    ))}
                    {slots.length > 3 && (
                      <div className="text-xs text-gray-500 p-1">
                        +{slots.length - 3} créneau(x) supplémentaire(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Vue timeline avec tous les créneaux horaires
 */
const TimelineView = ({ report, sessions, selectedDay, selectedPeriod, daysOfWeek }) => {
  const dayName = daysOfWeek.find(d => d.value === selectedDay)?.label || '';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        ⏰ Crénaux horaires - {dayName}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2 text-left font-bold text-sm">Salle</th>
              <th className="border border-gray-300 p-2 text-left font-bold text-sm">Disponibilité (h)</th>
              <th className="border border-gray-300 p-2 text-left font-bold text-sm">Crénaux</th>
            </tr>
          </thead>
          <tbody>
            {report.roomsByAvailability.map(roomData => {
              const slots = getAvailableSlots(sessions, roomData.room, selectedDay, selectedPeriod);
              const stats = calculateAvailabilityStats(slots);

              return (
                <tr key={roomData.room} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3 font-semibold text-gray-800">
                    {roomData.room}
                  </td>
                  <td className="border border-gray-300 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min((stats.totalMinutes / 660) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-16">
                        {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
                      </span>
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3">
                    <div className="flex flex-wrap gap-1">
                      {slots.map((slot, i) => (
                        <span
                          key={i}
                          className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          title={`${slot.duration}m`}
                        >
                          {slot.start}-{slot.end}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomAvailabilityViewer;
