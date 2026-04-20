import React, { useState } from 'react';
import { X } from 'lucide-react';

const RoomAvailabilityViewerTest = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches?.[0] || 'Hay Salam');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Récupérer le nombre de salles pour le centre sélectionné
  const getBranchRooms = () => {
    const branch = branchesData?.find(b => b.name === selectedBranch);
    return branch?.rooms || 0;
  };

  // Récupérer les sessions du centre et jour sélectionnés
  const getDaySessions = () => {
    const branchSessions = sessions?.[selectedBranch] || [];
    return branchSessions.filter(s => s.dayOfWeek === selectedDay);
  };

  const rooms = getBranchRooms();
  const daySessions = getDaySessions();
  const availableSlots = Math.max(0, (rooms * 11) - (daySessions.length * 1.5)); // Estimation

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🏛️ Disponibilité des Salles</h2>
              <p className="text-blue-200 text-sm mt-1">TEST - Visualisez la disponibilité</p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-600 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-green-800 mb-4">✅ TEST MODE ACTIF</h3>
            <p className="text-green-700">Le composant RoomAvailabilityViewer.jsx s'affiche correctement!</p>
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Centre</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {branches?.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📆 Jour</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {daysOfWeek.map((day, idx) => (
                  <option key={idx} value={idx}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{rooms}</div>
              <div className="text-sm text-gray-600">Salles totales</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{daySessions.length}</div>
              <div className="text-sm text-gray-600">Sessions ce jour</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{Math.round(availableSlots)}h</div>
              <div className="text-sm text-gray-600">Temps disponible</div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-gray-800 mb-2">📊 Informations chargées:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Centre sélectionné: <strong>{selectedBranch}</strong></li>
              <li>✓ Jour: <strong>{daysOfWeek[selectedDay]}</strong></li>
              <li>✓ Nombre de salles: <strong>{rooms}</strong></li>
              <li>✓ Sessions du jour: <strong>{daySessions.length}</strong></li>
            </ul>
          </div>

          {/* Bouton pour fermer */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                console.log('Sessions:', sessions);
                console.log('Branches:', branches);
                console.log('BranchesData:', branchesData);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
            >
              Log Données (F12)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityViewerTest;
