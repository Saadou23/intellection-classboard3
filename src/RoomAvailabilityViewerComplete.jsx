import React, { useState, useMemo } from 'react';
import { X, Clock, Calendar, Building2, ChevronRight } from 'lucide-react';

const RoomAvailabilityViewerComplete = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches?.[0] || 'Hay Salam');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedRoom, setSelectedRoom] = useState('');
  const [showSlots, setShowSlots] = useState(false);

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Récupérer les salles du centre
  const branchRooms = useMemo(() => {
    const branch = branchesData?.find(b => b.name === selectedBranch);
    const roomCount = branch?.rooms || 0;
    return Array.from({ length: roomCount }, (_, i) => `Salle ${i + 1}`);
  }, [selectedBranch, branchesData]);

  // Initialiser selectedRoom au premier changement de centre
  React.useEffect(() => {
    if (branchRooms.length > 0 && !branchRooms.includes(selectedRoom)) {
      setSelectedRoom(branchRooms[0]);
    }
  }, [selectedBranch, branchRooms]);

  // Convertir heure en minutes
  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Convertir minutes en heure
  const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Vérifier chevauchement
  const timesOverlap = (start1, end1, start2, end2) => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && e1 > s2;
  };

  // Normaliser nom salle
  const normalizeRoomName = (room) => {
    if (!room) return null;
    const match = room.match(/\d+/);
    if (match) {
      const num = match[0];
      return `Salle ${num}`;
    }
    return room;
  };

  // Obtenir les sessions pour une salle à un jour
  const getSessionsForRoom = useMemo(() => {
    const branchSessions = sessions?.[selectedBranch] || [];
    return branchSessions.filter(s => {
      if (s.dayOfWeek !== selectedDay) return false;
      const normalizedRoom = normalizeRoomName(s.room);
      return normalizedRoom === selectedRoom;
    });
  }, [sessions, selectedBranch, selectedDay, selectedRoom]);

  // Calculer les créneaux libres
  const getAvailableSlots = useMemo(() => {
    const dayStartMinutes = 8 * 60; // 08:00
    const dayEndMinutes = 19 * 60; // 19:00
    const slotDuration = 90; // 90 minutes par défaut

    const occupiedSessions = getSessionsForRoom
      .map(s => ({
        start: timeToMinutes(s.startTime),
        end: timeToMinutes(s.endTime),
        professor: s.professor,
        subject: s.subject,
        level: s.level
      }))
      .sort((a, b) => a.start - b.start);

    const availableSlots = [];
    let currentTime = dayStartMinutes;

    for (const session of occupiedSessions) {
      // Ajouter créneau avant cette session
      if (currentTime + slotDuration <= session.start) {
        while (currentTime + slotDuration <= session.start) {
          availableSlots.push({
            start: minutesToTime(currentTime),
            end: minutesToTime(currentTime + slotDuration),
            duration: slotDuration,
            occupied: false
          });
          currentTime += slotDuration;
        }
        // Ajouter les minutes restantes
        if (currentTime < session.start) {
          availableSlots.push({
            start: minutesToTime(currentTime),
            end: minutesToTime(session.start),
            duration: session.start - currentTime,
            occupied: false
          });
        }
      }

      // Ajouter session occupée
      availableSlots.push({
        start: minutesToTime(session.start),
        end: minutesToTime(session.end),
        duration: session.end - session.start,
        occupied: true,
        professor: session.professor,
        subject: session.subject,
        level: session.level
      });

      currentTime = Math.max(currentTime, session.end);
    }

    // Ajouter créneaux après dernière session
    if (currentTime + slotDuration <= dayEndMinutes) {
      while (currentTime + slotDuration <= dayEndMinutes) {
        availableSlots.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(currentTime + slotDuration),
          duration: slotDuration,
          occupied: false
        });
        currentTime += slotDuration;
      }
      // Ajouter les minutes restantes
      if (currentTime < dayEndMinutes) {
        availableSlots.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(dayEndMinutes),
          duration: dayEndMinutes - currentTime,
          occupied: false
        });
      }
    }

    return availableSlots;
  }, [getSessionsForRoom]);

  // Compter les stats
  const stats = useMemo(() => {
    const available = getAvailableSlots.filter(s => !s.occupied);
    const occupied = getAvailableSlots.filter(s => s.occupied);
    const totalMinutes = available.reduce((sum, s) => sum + s.duration, 0);

    return {
      totalSlots: available.length,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      totalMins: totalMinutes % 60,
      occupiedSlots: occupied.length
    };
  }, [getAvailableSlots]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-8 h-8" />
                Vérifier Disponibilité des Salles
              </h2>
              <p className="text-blue-200 text-sm mt-1">Visualisez les créneaux possibles</p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-600 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="p-6 border-b bg-gradient-to-b from-blue-50 to-white">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Filtres de recherche
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre Centre */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🏢 Centre
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-800"
              >
                {branches?.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            {/* Filtre Jour */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📆 Jour de la semaine
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-800"
              >
                {daysOfWeek.map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
            </div>

            {/* Filtre Salle */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🚪 Salle
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-800"
              >
                {branchRooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bouton afficher créneaux */}
          <button
            onClick={() => setShowSlots(!showSlots)}
            className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            {showSlots ? '✓ Masquer les créneaux' : '→ Afficher les créneaux possibles'}
            <ChevronRight className={`w-5 h-5 transition-transform ${showSlots ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Résumé Stats */}
        {showSlots && (
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{stats.totalSlots}</div>
                <div className="text-xs text-gray-600 mt-1">Créneaux libres</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{stats.totalHours}h {stats.totalMins}m</div>
                <div className="text-xs text-gray-600 mt-1">Temps disponible</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{stats.occupiedSlots}</div>
                <div className="text-xs text-gray-600 mt-1">Sessions occupées</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round((stats.totalSlots / (stats.totalSlots + stats.occupiedSlots + 1)) * 100)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">Taux de liberté</div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des créneaux */}
        {showSlots && (
          <div className="p-6">
            <h3 className="font-bold text-gray-800 mb-4">
              📅 {selectedRoom} - {daysOfWeek[selectedDay]}
            </h3>

            {getAvailableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">Aucun créneau disponible</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getAvailableSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 transition-all ${
                      slot.occupied
                        ? 'bg-red-50 border-l-red-500 cursor-not-allowed'
                        : 'bg-green-50 border-l-green-500 hover:bg-green-100 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="font-bold text-lg text-gray-800 min-w-fit">
                          ⏰ {slot.start} - {slot.end}
                        </div>
                        <div className="text-sm text-gray-600">
                          ({Math.round(slot.duration / 60)}h {slot.duration % 60}m)
                        </div>
                      </div>

                      {slot.occupied ? (
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-700">❌ OCCUPÉE</div>
                          <div className="text-xs text-gray-600">
                            👤 {slot.professor}
                          </div>
                          <div className="text-xs text-gray-600">
                            📚 {slot.subject}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-700">✅ DISPONIBLE</div>
                          <button
                            onClick={() => {
                              alert(`Créneau sélectionné: ${slot.start} - ${slot.end}`);
                            }}
                            className="text-xs mt-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          >
                            Réserver
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityViewerComplete;
