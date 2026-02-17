import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';

const AvailableRoomsViewer = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || '');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [availablePeriods, setAvailablePeriods] = useState([]);

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

  const normalizeRoomName = (room) => {
    if (!room) return null;
    const match = room.match(/\d+/);
    if (match) {
      const num = match[0];
      return `Salle ${num}`;
    }
    return room;
  };

  const getAllRooms = () => {
    if (branchesData && Array.isArray(branchesData)) {
      const branch = branchesData.find(b => b.name === selectedBranch);
      if (branch?.rooms && typeof branch.rooms === 'number') {
        const roomsList = [];
        for (let i = 1; i <= branch.rooms; i++) {
          roomsList.push(`Salle ${i}`);
        }
        return roomsList;
      }
    }
    return [];
  };

  const timesOverlap = (start1, end1, start2, end2) => {
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    // Chevauchement si : début1 < fin2 ET fin1 > début2
    return (s1 < e2 && e1 > s2);
  };

  const getOccupyingSessions = (room) => {
    const branchSessions = sessions[selectedBranch] || [];
    
    return branchSessions.filter(session => {
      if (session.dayOfWeek !== selectedDay) return false;
      
      const normalizedRoom = normalizeRoomName(session.room);
      if (normalizedRoom !== room) return false;
      
      // Filtrer par période
      if (selectedPeriod === 'normal') {
        // Emploi normal : sessions sans period
        if (session.period) return false;
      } else {
        // Période spécifique : sessions avec ce period
        if (session.period !== selectedPeriod) return false;
      }
      
      return timesOverlap(startTime, endTime, session.startTime, session.endTime);
    });
  };

  const rooms = getAllRooms();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🏢 Disponibilité des Salles</h2>
              <p className="text-indigo-200 text-sm mt-1">Visualisez les salles disponibles par créneau</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-indigo-800 hover:bg-indigo-700 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Centre</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📅 Période</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              <label className="block text-sm font-bold text-gray-700 mb-2">📆 Jour</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🕐 Début</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🕐 Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 text-center bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-indigo-900 font-semibold">
              🔍 Recherche : {selectedPeriod === 'normal' ? 'Normal' : availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Période'} - {daysOfWeek.find(d => d.value === selectedDay)?.label} de {startTime} à {endTime}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {rooms.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Aucune salle configurée pour ce centre</p>
              <p className="text-sm mt-2">Configurez les salles dans "Gérer les filiales"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rooms.map(room => {
                const occupying = getOccupyingSessions(room);
                const isOccupied = occupying.length > 0;

                return (
                  <div
                    key={room}
                    className={`rounded-lg border-2 overflow-hidden transition-all transform hover:scale-105 ${
                      isOccupied 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className={`p-4 text-center font-bold text-lg ${
                      isOccupied 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {room}
                    </div>

                    <div className={`p-3 text-center font-semibold ${
                      isOccupied ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {isOccupied ? '❌ OCCUPÉE' : '✅ LIBRE'}
                    </div>

                    {isOccupied && (
                      <div className="p-3 border-t border-red-200">
                        {occupying.map((session, idx) => (
                          <div 
                            key={idx}
                            className="bg-white rounded-lg p-2 mb-2 last:mb-0 border border-red-200"
                          >
                            <div className="font-bold text-gray-800 text-sm mb-1">
                              ⏰ {session.startTime} - {session.endTime}
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              📚 {session.level}
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              📖 {session.subject}
                            </div>
                            <div className="text-xs text-gray-600">
                              👤 {session.professor}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isOccupied && (
                      <div className="p-3 text-center text-green-600 text-sm">
                        Disponible pour ce créneau
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-800">{rooms.length}</div>
              <div className="text-sm text-gray-600">Salles totales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {rooms.filter(room => getOccupyingSessions(room).length === 0).length}
              </div>
              <div className="text-sm text-gray-600">Salles libres</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {rooms.filter(room => getOccupyingSessions(room).length > 0).length}
              </div>
              <div className="text-sm text-gray-600">Salles occupées</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailableRoomsViewer;