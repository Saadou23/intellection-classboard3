import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Calendar, Filter, Building2, AlertCircle } from 'lucide-react';

const AvailableRoomsViewer = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || '');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  // Obtenir les créneaux uniques des séances de la filiale
  const getUniqueTimeSlots = () => {
    const branchSessions = sessions[selectedBranch] || [];
    const slots = new Set();
    
    branchSessions.forEach(session => {
      const slot = `${session.startTime}-${session.endTime}`;
      slots.add(slot);
    });
    
    return Array.from(slots).sort();
  };

  const timeSlots = getUniqueTimeSlots();

 // Obtenir les salles de la filiale sélectionnée
const getRoomsForBranch = () => {
  // D'abord essayer de prendre depuis la config
  if (branchesData && Array.isArray(branchesData)) {
    const branch = branchesData.find(b => b.name === selectedBranch);
    if (branch?.rooms && Array.isArray(branch.rooms) && branch.rooms.length > 0) {
      return branch.rooms;
    }
  }
  
  // Sinon, extraire les salles des séances existantes
  const branchSessions = sessions[selectedBranch] || [];
  const roomsSet = new Set();
  branchSessions.forEach(session => {
    if (session.room) {
      roomsSet.add(session.room);
    }
  });
  
  return Array.from(roomsSet).sort();
};

  const rooms = getRoomsForBranch();

  // Obtenir les séances pour le créneau sélectionné
  const getOccupiedRooms = (timeSlot) => {
    const branchSessions = sessions[selectedBranch] || [];
    const [startTime, endTime] = timeSlot.split('-');

    return branchSessions
      .filter(session => 
        session.dayOfWeek === selectedDay &&
        session.startTime === startTime &&
        session.endTime === endTime
      )
      .map(session => session.room);
  };

 // Obtenir les salles disponibles pour un créneau
const getAvailableRooms = (timeSlot) => {
  const occupied = getOccupiedRooms(timeSlot);
  if (!Array.isArray(rooms)) {
    return [];
  }
  return rooms.filter(room => !occupied.includes(room));
};

  // Calculer les statistiques
  const getStatistics = () => {
    let totalSlots = 0;
    let occupiedSlots = 0;
    let availableSlots = 0;

    timeSlots.forEach(slot => {
      const available = getAvailableRooms(slot);
      totalSlots += rooms.length;
      occupiedSlots += (rooms.length - available.length);
      availableSlots += available.length;
    });

    const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : 0;

    return {
      totalSlots,
      occupiedSlots,
      availableSlots,
      occupancyRate
    };
  };

  const stats = getStatistics();

  if (rooms.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune salle configurée</h3>
            <p className="text-gray-600 mb-4">
              Veuillez configurer les salles pour la filiale <strong>{selectedBranch}</strong> dans le menu "Gérer Filiales".
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune séance programmée</h3>
            <p className="text-gray-600 mb-4">
              Aucune séance n'est programmée pour <strong>{selectedBranch}</strong>.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2 mb-2">
                <MapPin className="w-8 h-8" />
                Salles Disponibles
              </h2>
              <p className="text-green-100 text-sm">
                Visualisation des créneaux libres par filiale et horaire
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filiale */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Filiale
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            {/* Jour */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Jour
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            {/* Créneau */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Créneau
              </label>
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tous les créneaux</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-bold mb-1">TOTAL CRÉNEAUX</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalSlots}</div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <div className="text-xs text-red-600 font-bold mb-1">OCCUPÉS</div>
              <div className="text-2xl font-bold text-red-900">{stats.occupiedSlots}</div>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
              <div className="text-xs text-green-600 font-bold mb-1">DISPONIBLES</div>
              <div className="text-2xl font-bold text-green-900">{stats.availableSlots}</div>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
              <div className="text-xs text-purple-600 font-bold mb-1">OCCUPATION</div>
              <div className="text-2xl font-bold text-purple-900">{stats.occupancyRate}%</div>
            </div>
          </div>
        </div>

        {/* Grille des disponibilités */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTimeSlot === 'all' ? (
            // Vue tous les créneaux
            <div className="space-y-6">
              {timeSlots.map(slot => {
                const available = getAvailableRooms(slot);
                const occupied = rooms.length - available.length;

                return (
                  <div key={slot} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="font-bold text-lg text-gray-800">{slot}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 font-bold">
                          ✅ {available.length} disponible{available.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-red-600 font-bold">
                          ❌ {occupied} occupée{occupied > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {available.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucune salle disponible pour ce créneau
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          {available.map(room => (
                            <div
                              key={room}
                              className="bg-green-50 border-2 border-green-500 rounded-lg p-3 text-center hover:bg-green-100 transition-all"
                            >
                              <MapPin className="w-6 h-6 text-green-600 mx-auto mb-1" />
                              <div className="font-bold text-green-900">{room}</div>
                              <div className="text-xs text-green-700 mt-1">Libre</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Vue créneau spécifique
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100 px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-6 h-6 text-gray-600" />
                  <span className="font-bold text-2xl text-gray-800">{selectedTimeSlot}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {daysOfWeek.find(d => d.value === selectedDay)?.label} • {selectedBranch}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {rooms.map(room => {
                    const isAvailable = getAvailableRooms(selectedTimeSlot).includes(room);
                    
                    return (
                      <div
                        key={room}
                        className={`rounded-xl p-6 text-center border-4 transition-all ${
                          isAvailable
                            ? 'bg-green-50 border-green-500 hover:bg-green-100'
                            : 'bg-red-50 border-red-500 opacity-60'
                        }`}
                      >
                        <MapPin className={`w-12 h-12 mx-auto mb-3 ${
                          isAvailable ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <div className="font-bold text-xl mb-1">{room}</div>
                        <div className={`text-sm font-bold ${
                          isAvailable ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {isAvailable ? '✅ LIBRE' : '❌ OCCUPÉE'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Résumé */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-900 mb-2">
                      {getAvailableRooms(selectedTimeSlot).length} / {rooms.length}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">
                      salles disponibles pour ce créneau
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableRoomsViewer;
