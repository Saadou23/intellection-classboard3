import React, { useState } from 'react';
import { X } from 'lucide-react';

const RoomSlots = ({ sessions, branches, branchesData, onClose }) => {
  const [showSlots, setShowSlots] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branches?.[0] || 'Hay Salam');
  const [selectedDay, setSelectedDay] = useState(1); // Lundi
  const [selectedRoom, setSelectedRoom] = useState('Salle 1');

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const getRooms = () => {
    const branch = branchesData?.find(b => b.name === selectedBranch);
    const count = branch?.rooms || 0;
    const rooms = [];
    for (let i = 1; i <= count; i++) {
      rooms.push(`Salle ${i}`);
    }
    return rooms;
  };

  const rooms = getRooms();

  // Les créneaux de test
  const slots = [
    { time: '08:00 - 09:30', status: 'libre', duration: '1h 30m' },
    { time: '09:30 - 11:00', status: 'occupée', duration: '1h 30m' },
    { time: '11:00 - 13:00', status: 'libre', duration: '2h' },
    { time: '14:00 - 15:30', status: 'libre', duration: '1h 30m' },
    { time: '15:30 - 17:00', status: 'occupée', duration: '1h 30m' },
    { time: '17:00 - 19:00', status: 'libre', duration: '2h' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🏢 Vérifier Disponibilité des Salles</h2>
              <p className="text-blue-200 text-sm mt-1">Affiche tous les créneaux possibles</p>
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
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">🔍 Sélectionnez un créneau:</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Centre</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded"
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
                  className="w-full p-2 border-2 border-gray-300 rounded"
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
                  className="w-full p-2 border-2 border-gray-300 rounded"
                >
                  {rooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bouton afficher créneaux - PRINCIPAL */}
          <button
            onClick={() => setShowSlots(!showSlots)}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white text-lg transition-all mb-6 ${
              showSlots
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {showSlots ? '✗ Masquer les créneaux' : '✓ Afficher les créneaux possibles'}
          </button>

          {/* Affichage des créneaux */}
          {showSlots && (
            <div>
              <h3 className="font-bold text-gray-800 mb-4">
                📅 {selectedRoom} - {daysOfWeek[selectedDay]}
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {slots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 transition-all ${
                      slot.status === 'libre'
                        ? 'bg-green-50 border-l-green-500'
                        : 'bg-red-50 border-l-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-gray-800">⏰ {slot.time}</div>
                        <div className="text-xs text-gray-600">Durée: {slot.duration}</div>
                      </div>
                      <div className={`text-sm font-bold ${
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

          {/* Info */}
          {!showSlots && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-gray-700">
                Cliquez sur le bouton vert ci-dessus pour voir les créneaux disponibles
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
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

export default RoomSlots;
