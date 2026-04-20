import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';

const SimpleRoomViewer = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches?.[0] || 'Hay Salam');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedRoom, setSelectedRoom] = useState('Salle 1');
  const [showSlots, setShowSlots] = useState(false);

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Récupérer les salles du centre
  const getBranchRooms = () => {
    const branch = branchesData?.find(b => b.name === selectedBranch);
    const count = branch?.rooms || 0;
    const rooms = [];
    for (let i = 1; i <= count; i++) {
      rooms.push(`Salle ${i}`);
    }
    return rooms;
  };

  const branchRooms = getBranchRooms();

  // Récupérer les sessions du jour pour cette salle
  const getDaySessionsForRoom = () => {
    const branchSessions = sessions?.[selectedBranch] || [];
    return branchSessions.filter(s => {
      if (s.dayOfWeek !== selectedDay) return false;
      // Normaliser le nom de salle
      const roomNum = s.room?.match(/\d+/)?.[0];
      const selectedNum = selectedRoom.match(/\d+/)?.[0];
      return roomNum === selectedNum;
    });
  };

  const daySessions = getDaySessionsForRoom();

  // Créneaux simples
  const slots = [
    { time: '08:00-09:30', status: 'libre' },
    { time: '09:30-11:00', status: 'occupée' },
    { time: '11:00-13:00', status: 'libre' },
    { time: '14:00-15:30', status: 'libre' },
    { time: '15:30-17:00', status: 'occupée' },
    { time: '17:00-19:00', status: 'libre' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-8 h-8" />
                Vérifier Disponibilité Salles
              </h2>
              <p className="text-blue-200 text-sm mt-1">Sélectionnez un centre, jour et salle</p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-600 p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Filtres */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">🔍 Filtres</h3>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Centre</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {branches?.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jour</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {daysOfWeek.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Salle</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {branchRooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bouton */}
            <button
              onClick={() => setShowSlots(!showSlots)}
              className={`w-full p-3 rounded font-bold text-white transition-all ${
                showSlots
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {showSlots ? '✗ Masquer les créneaux' : '✓ Afficher les créneaux possibles'}
            </button>
          </div>

          {/* Afficher info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Centre:</strong> {selectedBranch} |
              <strong> Jour:</strong> {daysOfWeek[selectedDay]} |
              <strong> Salle:</strong> {selectedRoom}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Sessions ce jour:</strong> {daySessions.length}
            </p>
          </div>

          {/* Créneaux */}
          {showSlots && (
            <div>
              <h3 className="font-bold text-gray-800 mb-4">📅 Créneaux disponibles</h3>
              <div className="space-y-2">
                {slots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border-l-4 ${
                      slot.status === 'libre'
                        ? 'bg-green-50 border-l-green-500'
                        : 'bg-red-50 border-l-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-gray-800">⏰ {slot.time}</div>
                      <div className={`font-bold ${
                        slot.status === 'libre'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        {slot.status === 'libre' ? '✅ LIBRE' : '❌ OCCUPÉE'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bouton fermer */}
        <div className="p-4 border-t bg-gray-50 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleRoomViewer;
