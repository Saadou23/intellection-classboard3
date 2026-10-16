import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Building2, Clock, Users, MapPin } from 'lucide-react';

const RoomSwapManager = ({ sessions, selectedBranch: initialBranch, branchesData, onSwap, onClose }) => {
  const [draggedSession, setDraggedSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [swapResult, setSwapResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSwap, setPendingSwap] = useState(null);
  const [branches, setBranches] = useState([]);

  // Charger les branches disponibles
  useEffect(() => {
    if (branchesData && branchesData.length > 0) {
      setBranches(branchesData.map(b => b.name));
    }
  }, [branchesData]);

  // Charger les salles du centre sélectionné
  useEffect(() => {
    if (!selectedBranch) {
      setRooms([]);
      return;
    }

    const branch = branchesData.find(b => b.name === selectedBranch);
    if (branch?.rooms && typeof branch.rooms === 'number') {
      const roomList = [];
      for (let i = 1; i <= branch.rooms; i++) {
        roomList.push(`Salle ${i}`);
      }
      setRooms(roomList);
    }
  }, [selectedBranch, branchesData]);

  // Récupérer les séances pour une salle (uniquement du centre sélectionné et d'aujourd'hui)
  const getSessionsForRoom = (room) => {
    if (!selectedBranch) return [];

    const branchSessions = sessions[selectedBranch] || [];
    const today = new Date();
    const todayDay = today.getDay();

    return branchSessions.filter(session => {
      // Afficher uniquement les séances d'aujourd'hui (même jour de la semaine)
      const isCorrectDay = session.dayOfWeek === todayDay;

      if (!isCorrectDay) return false;

      const normalizeRoomName = (r) => {
        if (!r) return null;
        const match = r.match(/\d+/);
        return match ? `Salle ${match[0]}` : r;
      };

      const normalizedRoom = normalizeRoomName(session.room);
      return normalizedRoom === room;
    });
  };

  // Valider si une permutation est possible
  const canSwap = (session1, session2) => {
    // Les créneaux doivent être identiques
    if (session1.startTime !== session2.startTime || session1.endTime !== session2.endTime) {
      return { valid: false, reason: 'Les créneaux horaires ne sont pas identiques' };
    }

    // Les jours doivent être identiques
    if (session1.dayOfWeek !== session2.dayOfWeek) {
      return { valid: false, reason: 'Les jours ne sont pas identiques' };
    }

    // Vérifier s'il y aurait un chevauchement après la permutation
    const branchSessions = sessions[selectedBranch] || [];

    // Sessions de session1 qui seraient en salle 2 après permutation
    const session1OtherSessions = branchSessions.filter(s =>
      s.id !== session1.id &&
      s.room === session2.room &&
      s.dayOfWeek === session1.dayOfWeek
    );

    // Vérifier les chevauchements
    for (let s of session1OtherSessions) {
      if (!(session1.endTime <= s.startTime || session1.startTime >= s.endTime)) {
        return { valid: false, reason: 'Chevauchement détecté après permutation' };
      }
    }

    // Sessions de session2 qui seraient en salle 1 après permutation
    const session2OtherSessions = branchSessions.filter(s =>
      s.id !== session2.id &&
      s.room === session1.room &&
      s.dayOfWeek === session2.dayOfWeek
    );

    for (let s of session2OtherSessions) {
      if (!(session2.endTime <= s.startTime || session2.startTime >= s.endTime)) {
        return { valid: false, reason: 'Chevauchement détecté après permutation' };
      }
    }

    return { valid: true };
  };

  // Gérer le drop (permutation)
  const handleDrop = (targetRoom, targetSession) => {
    if (!draggedSession) return;

    const { session: draggedSess, room: draggedRoom } = draggedSession;

    if (draggedRoom === targetRoom) {
      setSwapResult({ success: false, message: 'Sélectionnez une salle différente' });
      setTimeout(() => setSwapResult(null), 3000);
      return;
    }

    if (!targetSession) {
      setSwapResult({ success: false, message: 'Sélectionnez une séance à permuter' });
      setTimeout(() => setSwapResult(null), 3000);
      return;
    }

    const validation = canSwap(draggedSess, targetSession);
    if (!validation.valid) {
      setSwapResult({ success: false, message: validation.reason });
      setTimeout(() => setSwapResult(null), 3000);
      return;
    }

    // Demander une confirmation
    setPendingSwap({
      session1: draggedSess,
      session2: targetSession,
      room1: draggedRoom,
      room2: targetRoom
    });
    setShowConfirm(true);
  };

  // Confirmer la permutation
  const confirmSwap = async () => {
    if (!pendingSwap) return;

    const { session1, session2, room1, room2 } = pendingSwap;

    // Créer les séances permutées
    const swappedSession1 = { ...session1, room: room2 };
    const swappedSession2 = { ...session2, room: room1 };

    // Appeler la fonction callback
    await onSwap(swappedSession1, swappedSession2);

    setSwapResult({
      success: true,
      message: `✅ Permutation réussie: ${room1} ↔ ${room2}`
    });

    setShowConfirm(false);
    setPendingSwap(null);
    setDraggedSession(null);

    setTimeout(() => setSwapResult(null), 3000);
  };

  const formatTime = (time) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-bold">Permutation des Salles</h2>
              <p className="text-blue-100 text-xs">{selectedBranch || 'Centre'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-blue-700 hover:bg-blue-800 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Sélecteur de centre */}
          <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              Sélectionnez un centre <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-sm"
            >
              <option value="">-- Choisir un centre --</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              📅 {daysOfWeek[new Date().getDay()].label}
            </p>
          </div>

          {/* Avertissement si aucun centre sélectionné */}
          {!selectedBranch && (
            <div className="mb-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Sélectionnez un centre pour afficher les salles.
              </p>
            </div>
          )}

          {/* Message de résultat */}
          {swapResult && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              swapResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {swapResult.success ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {swapResult.message}
            </div>
          )}

          {/* Grille des salles */}
          {!selectedBranch ? (
            <div className="text-center py-8 text-gray-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sélectionnez un centre</p>
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {rooms.map((room) => {
              const roomSessions = getSessionsForRoom(room);
              const isSelected = draggedSession?.room === room;

              return (
                <div
                  key={room}
                  className={`border-2 rounded-lg p-2 min-h-[200px] transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {/* Titre de la salle */}
                  <div className="flex items-center gap-1 mb-2 pb-1 border-b border-gray-200">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <h3 className="text-xs font-bold text-gray-800">{room}</h3>
                  </div>

                  {/* Séances */}
                  {roomSessions.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      <Clock className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">Libre</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {roomSessions.map((session) => (
                        <div
                          key={session.id}
                          draggable
                          onDragStart={() => setDraggedSession({ session, room })}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(room, session)}
                          onClick={() => {
                            if (draggedSession && draggedSession.room !== room) {
                              handleDrop(room, session);
                            }
                          }}
                          title={`${session.professor} - ${session.subject}`}
                          className={`p-1.5 rounded border cursor-move transition-all text-xs ${
                            draggedSession?.session.id === session.id
                              ? 'border-blue-500 bg-blue-100 opacity-70'
                              : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-400'
                          }`}
                        >
                          {/* Horaire */}
                          <div className="font-bold text-xs text-gray-800">
                            {formatTime(session.startTime)}
                          </div>

                          {/* Niveau + Matière */}
                          <div className="text-xs text-gray-600 truncate">
                            {session.level} - {session.subject}
                          </div>

                          {/* Professeur court */}
                          <div className="text-xs text-gray-700 font-semibold truncate">
                            {session.professor.split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Instructions */}
          {selectedBranch && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <span className="font-bold">💡</span> Glissez ou cliquez pour permuter. Créneaux identiques requis.
            </div>
          )}
        </div>


        {/* Modal de confirmation */}
        {showConfirm && pendingSwap && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Confirmer la permutation?</h3>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold text-gray-800">{pendingSwap.room1}</p>
                    <p className="text-xs text-gray-600">{pendingSwap.session1.professor}</p>
                  </div>
                  <span className="text-2xl text-blue-600">↔</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{pendingSwap.room2}</p>
                    <p className="text-xs text-gray-600">{pendingSwap.session2.professor}</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded text-blue-800">
                  <p className="text-xs">
                    <span className="font-bold">Créneau:</span> {formatTime(pendingSwap.session1.startTime)} - {formatTime(pendingSwap.session1.endTime)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmSwap}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSwapManager;
