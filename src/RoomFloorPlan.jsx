import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Building2, MapPin } from 'lucide-react';

const RoomFloorPlan = ({ sessions, branches, branchesData, initialBranch, onSwap, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(initialBranch || '');
  const [draggedSession, setDraggedSession] = useState(null);
  const [swapResult, setSwapResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSwap, setPendingSwap] = useState(null);

  // Synchroniser le centre sélectionné avec la prop initialBranch
  useEffect(() => {
    if (initialBranch) {
      setSelectedBranch(initialBranch);
    }
  }, [initialBranch]);

  // Récupérer le nombre de salles du centre
  const getRoomCount = () => {
    const branch = branchesData.find(b => b.name === selectedBranch);
    return branch?.rooms || 0;
  };

  // Disposition des salles (2 rangées)
  const getRoomPositions = () => {
    const count = getRoomCount();
    const positions = [];
    const cols = Math.ceil(count / 2);
    const spacing = 100; // pixels entre les salles

    let roomNum = 1;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < cols; col++) {
        if (roomNum > count) break;
        positions.push({
          room: `Salle ${roomNum}`,
          x: 50 + col * spacing,
          y: 100 + row * 200,
          roomNum
        });
        roomNum++;
      }
    }
    return positions;
  };

  const today = new Date();
  const todayDay = today.getDay();
  const currentTime = new Date();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Vérifier si une séance est en cours
  const isSessionOngoing = (session) => {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  // Récupérer les séances en cours pour une salle
  const getSessionsForRoom = (room) => {
    if (!selectedBranch) return [];

    const branchSessions = sessions[selectedBranch] || [];

    return branchSessions.filter(session => {
      const isCorrectDay = session.dayOfWeek === todayDay;
      if (!isCorrectDay) return false;

      // Afficher uniquement les séances en cours
      if (!isSessionOngoing(session)) return false;

      const normalizeRoomName = (r) => {
        if (!r) return null;
        const match = r.match(/\d+/);
        return match ? `Salle ${match[0]}` : r;
      };

      const normalizedRoom = normalizeRoomName(session.room);
      return normalizedRoom === room;
    });
  };

  const canSwap = (session1, session2) => {
    if (session1.startTime !== session2.startTime || session1.endTime !== session2.endTime) {
      return { valid: false, reason: 'Créneaux horaires différents' };
    }
    if (session1.dayOfWeek !== session2.dayOfWeek) {
      return { valid: false, reason: 'Jours différents' };
    }
    return { valid: true };
  };

  const handleDrop = (targetRoom) => {
    if (!draggedSession) return;

    const { session: draggedSess, room: draggedRoom } = draggedSession;

    if (draggedRoom === targetRoom) {
      setSwapResult({ success: false, message: 'Sélectionnez une salle différente' });
      setTimeout(() => setSwapResult(null), 2000);
      setDraggedSession(null);
      return;
    }

    // Récupérer les séances de la salle cible
    const targetRoomSessions = getSessionsForRoom(targetRoom);

    // Si la salle cible est libre, on peut juste déplacer
    if (targetRoomSessions.length === 0) {
      console.log('🚀 Simple déplacement vers salle libre:', { draggedSess, targetRoom });

      setPendingSwap({
        session1: draggedSess,
        session2: null,
        room1: draggedRoom,
        room2: targetRoom,
        isSimpleMove: true
      });
      setShowConfirm(true);
      return;
    }

    // Si la salle cible a des séances, faire une permutation
    const targetSession = targetRoomSessions[0];

    const validation = canSwap(draggedSess, targetSession);
    if (!validation.valid) {
      setSwapResult({ success: false, message: validation.reason });
      setTimeout(() => setSwapResult(null), 2000);
      setDraggedSession(null);
      return;
    }

    setPendingSwap({
      session1: draggedSess,
      session2: targetSession,
      room1: draggedRoom,
      room2: targetRoom,
      isSimpleMove: false
    });
    setShowConfirm(true);
  };

  const confirmSwap = async () => {
    if (!pendingSwap) return;

    const { session1, session2, room1, room2, isSimpleMove } = pendingSwap;

    if (isSimpleMove) {
      // Simple déplacement vers une salle libre
      const movedSession = { ...session1, room: room2 };
      console.log('✅ Envoi du déplacement:', { movedSession, session2: null, selectedBranch });
      const result = await onSwap(movedSession, null, selectedBranch);
      console.log('📍 Résultat du déplacement:', result);

      setSwapResult({
        success: true,
        message: `✅ Séance déplacée: ${room1} → ${room2}`
      });
    } else {
      // Permutation de deux séances
      const swappedSession1 = { ...session1, room: room2 };
      const swappedSession2 = { ...session2, room: room1 };

      await onSwap(swappedSession1, swappedSession2, selectedBranch);

      setSwapResult({
        success: true,
        message: `✅ Permutation réussie: ${room1} ↔ ${room2}`
      });
    }

    setShowConfirm(false);
    setPendingSwap(null);
    setDraggedSession(null);

    setTimeout(() => setSwapResult(null), 2000);
  };

  const formatTime = (time) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const roomPositions = getRoomPositions();
  const planWidth = Math.max(800, Math.ceil(getRoomCount() / 2) * 100 + 100);
  const planHeight = 400;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Plan du Centre - Séances en Cours</h2>
              <p className="text-blue-100 text-sm">{selectedBranch ? selectedBranch : 'Sélectionnez un centre'} • {daysOfWeek[todayDay]} • 🔴 En cours maintenant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-blue-700 hover:bg-blue-800 p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-6 flex flex-col">
          {/* Sélecteur de centre */}
          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Sélectionnez un centre <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-semibold"
            >
              <option value="">-- Choisir un centre --</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          {/* Message de résultat */}
          {swapResult && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              swapResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {swapResult.success ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{swapResult.message}</span>
            </div>
          )}

          {/* Plan du centre */}
          {!selectedBranch ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">Sélectionnez un centre pour afficher le plan</p>
              </div>
            </div>
          ) : roomPositions.every(pos => getSessionsForRoom(pos.room).length === 0) ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">Aucune séance en cours à cette heure</p>
                <p className="text-sm text-gray-400 mt-2">Les séances en cours apparaîtront ici</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <svg
                width={planWidth}
                height={planHeight}
                className="border-2 border-gray-300 rounded-lg bg-gray-50"
                style={{ userSelect: 'none' }}
              >
                {/* Grille */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width={planWidth} height={planHeight} fill="url(#grid)" />

                {/* Titre */}
                <text x={planWidth / 2} y="25" textAnchor="middle" className="text-sm font-bold fill-gray-700">
                  {selectedBranch}
                </text>

                {/* Salles */}
                {roomPositions.map((pos) => {
                  const roomSessions = getSessionsForRoom(pos.room);
                  const isSelected = draggedSession?.room === pos.room;
                  const isDropTarget = draggedSession && draggedSession.room !== pos.room;

                  return (
                    <g
                      key={pos.room}
                    >
                      {/* Carré de la salle */}
                      <rect
                        x={pos.x}
                        y={pos.y}
                        width="80"
                        height="160"
                        fill={isSelected ? '#dbeafe' : isDropTarget ? '#fef3c7' : '#f3f4f6'}
                        stroke={isSelected ? '#3b82f6' : isDropTarget ? '#fbbf24' : '#d1d5db'}
                        strokeWidth={isDropTarget ? '3' : '2'}
                        rx="4"
                        className="cursor-pointer hover:fill-white transition-all"
                        style={{ pointerEvents: 'auto' }}
                        onClick={() => {
                          console.log('🖱️ Clic sur salle:', pos.room, 'draggedSession:', draggedSession);
                          if (draggedSession && draggedSession.room !== pos.room) {
                            console.log('📍 Appel de handleDrop');
                            handleDrop(pos.room);
                          }
                        }}
                      />

                      {/* Titre de la salle */}
                      <text
                        x={pos.x + 40}
                        y={pos.y + 25}
                        textAnchor="middle"
                        className="text-xs font-bold fill-gray-800"
                      >
                        {pos.room}
                      </text>

                      {/* Séances */}
                      {roomSessions.length === 0 ? (
                        <text
                          x={pos.x + 40}
                          y={pos.y + 100}
                          textAnchor="middle"
                          className="text-xs fill-gray-400"
                        >
                          Libre
                        </text>
                      ) : (
                        roomSessions.map((session, idx) => (
                          <g
                            key={session.id}
                            onClick={() => {
                              if (draggedSession && draggedSession.room !== pos.room) {
                                handleDrop(pos.room);
                              } else if (!draggedSession) {
                                setDraggedSession({ session, room: pos.room });
                              } else {
                                setDraggedSession(null);
                              }
                            }}
                            style={{ pointerEvents: 'auto' }}
                            className="cursor-pointer"
                          >
                            {/* Boîte de séance */}
                            <rect
                              x={pos.x + 5}
                              y={pos.y + 35 + idx * 50}
                              width="70"
                              height="45"
                              fill={draggedSession?.session.id === session.id ? '#bfdbfe' : '#e0e7ff'}
                              stroke={draggedSession?.session.id === session.id ? '#2563eb' : '#818cf8'}
                              strokeWidth="1"
                              rx="2"
                              className="hover:opacity-80"
                            />

                            {/* Horaire */}
                            <text
                              x={pos.x + 40}
                              y={pos.y + 48 + idx * 50}
                              textAnchor="middle"
                              className="text-xs font-bold fill-gray-800"
                            >
                              {formatTime(session.startTime)}
                            </text>

                            {/* Prof court */}
                            <text
                              x={pos.x + 40}
                              y={pos.y + 60 + idx * 50}
                              textAnchor="middle"
                              className="text-xs fill-gray-700"
                            >
                              {session.professor.split(' ')[0]}
                            </text>

                            {/* Matière court */}
                            <text
                              x={pos.x + 40}
                              y={pos.y + 72 + idx * 50}
                              textAnchor="middle"
                              className="text-xs fill-blue-600 font-semibold"
                            >
                              {session.subject.substring(0, 6)}
                            </text>
                          </g>
                        ))
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Instructions */}
          {selectedBranch && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              <span className="font-bold">💡 Instructions:</span> Cliquez sur une séance pour la sélectionner (elle devient bleue), puis cliquez sur une autre salle pour la déplacer ou la permuter.
            </div>
          )}
        </div>

        {/* Modal de confirmation */}
        {showConfirm && pendingSwap && (
          <>
            {console.log('📋 Modal affiché:', { showConfirm, pendingSwap })}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-800">
                  {pendingSwap.isSimpleMove ? 'Déplacer la séance?' : 'Permuter les séances?'}
                </h3>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold text-gray-800">{pendingSwap.room1}</p>
                    <p className="text-xs text-gray-600">{pendingSwap.session1.professor}</p>
                    <p className="text-xs text-gray-500 mt-1">{pendingSwap.session1.subject}</p>
                  </div>
                  <span className="text-2xl text-blue-600">
                    {pendingSwap.isSimpleMove ? '→' : '↔'}
                  </span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{pendingSwap.room2}</p>
                    {pendingSwap.session2 ? (
                      <>
                        <p className="text-xs text-gray-600">{pendingSwap.session2.professor}</p>
                        <p className="text-xs text-gray-500 mt-1">{pendingSwap.session2.subject}</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">Salle libre</p>
                    )}
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
                  onClick={() => {
                    console.log('✅ Bouton Confirmer cliqué');
                    confirmSwap();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
            </>
        )}
      </div>
    </div>
  );
};

export default RoomFloorPlan;
