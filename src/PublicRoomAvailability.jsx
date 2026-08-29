import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Clock, MapPin, Users, BookOpen, Building2 } from 'lucide-react';

const PublicRoomAvailability = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [branches, setBranches] = useState([]);
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [branchesData, setBranchesData] = useState([]);

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  // Charger les branches et les sessions
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Charger les branches
        const branchesRef = doc(db, 'settings', 'branches');
        const branchesSnap = await getDoc(branchesRef);

        if (branchesSnap.exists()) {
          const branchesArray = branchesSnap.data().branches || [];
          setBranchesData(branchesArray);
          const branchNames = branchesArray.map(b => b.name);
          setBranches(branchNames);
          if (branchNames.length > 0) {
            setSelectedBranch(branchNames[0]);
          }
        }

        // Charger les sessions de toutes les branches
        const allSessions = {};
        for (const branch of branches) {
          const docRef = doc(db, 'branches', branch);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            allSessions[branch] = docSnap.data().sessions || [];
          }
        }
        setSessions(allSessions);
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

    return (s1 < e2 && e1 > s2);
  };

  const getOccupyingSessions = (room) => {
    const branchSessions = sessions[selectedBranch] || [];
    return branchSessions.filter(session => {
      if (session.dayOfWeek !== selectedDay) return false;
      const normalizedRoom = normalizeRoomName(session.room);
      if (normalizedRoom !== room) return false;
      if (session.period) return false;
      return timesOverlap(startTime, endTime, session.startTime, session.endTime);
    });
  };

  const isRoomAvailable = (room) => {
    return getOccupyingSessions(room).length === 0;
  };

  const allRooms = getAllRooms();
  const availableRooms = allRooms.filter(room => isRoomAvailable(room));
  const occupiedRooms = allRooms.filter(room => !isRoomAvailable(room));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🏢 Disponibilité des Salles</h1>
            <p className="text-gray-600">Vérifiez les salles libres et occupées</p>
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sélection branche */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏛️ Branche / Centre
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {branches.map(branch => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection jour */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Jour de la semaine
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Heure début */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⏰ Début du créneau
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Heure fin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⏰ Fin du créneau
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Résumé */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">{availableRooms.length}</div>
                <div className="text-sm text-green-700 font-semibold">Salles disponibles</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center border-2 border-red-200">
                <div className="text-3xl font-bold text-red-600">{occupiedRooms.length}</div>
                <div className="text-sm text-red-700 font-semibold">Salles occupées</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{allRooms.length}</div>
                <div className="text-sm text-blue-700 font-semibold">Total de salles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Affichage des salles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Salles disponibles */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              Salles Disponibles ({availableRooms.length})
            </h2>
            {availableRooms.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableRooms.map(room => (
                  <div
                    key={room}
                    className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                  >
                    <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="font-bold text-gray-800">{room}</div>
                    <div className="text-xs text-green-600 font-semibold mt-2">✓ Libre</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucune salle disponible pour ce créneau</p>
              </div>
            )}
          </div>

          {/* Salles occupées */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              Salles Occupées ({occupiedRooms.length})
            </h2>
            {occupiedRooms.length > 0 ? (
              <div className="space-y-3">
                {occupiedRooms.map(room => (
                  <div
                    key={room}
                    className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-4"
                  >
                    <div className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      {room}
                    </div>
                    <div className="space-y-2">
                      {getOccupyingSessions(room).map((session, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 text-sm border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-800">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">{session.subject}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-700">{session.level}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-orange-600" />
                            <span className="text-gray-700">{session.professor}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Aucune salle occupée pour ce créneau</p>
              </div>
            )}
          </div>
        </div>

        {/* Info complémentaire */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6 text-center">
          <p className="text-blue-800 font-semibold">
            💡 <strong>{daysOfWeek.find(d => d.value === selectedDay)?.label}</strong> de <strong>{startTime}</strong> à <strong>{endTime}</strong>
            <br />
            <span className="text-sm text-blue-700">Rafraîchissez la page pour mettre à jour les données</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicRoomAvailability;
