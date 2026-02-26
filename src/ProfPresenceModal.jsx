import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { markProfPresent, markProfDeparture, markProfAbsent } from './disciplineService';

const ProfPresenceModal = ({ record, onClose, onSuccess }) => {
  const [mode, setMode] = useState('arrival'); // 'arrival' or 'departure'
  const [inputTime, setInputTime] = useState('');
  const [calculatedRetard, setCalculatedRetard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill current time on mount
  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setInputTime(`${hours}:${minutes}`);

    // Determine mode based on record status
    if (record.status === 'PLANNED') {
      setMode('arrival');
    } else if (record.status === 'PRESENT') {
      setMode('departure');
    }
  }, [record]);

  // Calculate retard when time changes
  useEffect(() => {
    if (mode === 'arrival' && inputTime) {
      try {
        const [plannedH, plannedM] = record.startTime_planned.split(':').map(Number);
        const [actualH, actualM] = inputTime.split(':').map(Number);

        const plannedMinutes = plannedH * 60 + plannedM;
        const actualMinutes = actualH * 60 + actualM;
        const retard = actualMinutes - plannedMinutes;

        setCalculatedRetard(retard);
      } catch (err) {
        setCalculatedRetard(null);
      }
    } else {
      setCalculatedRetard(null);
    }
  }, [inputTime, mode, record.startTime_planned]);

  // Validate time format
  const isValidTime = (time) => {
    const regex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  // Handle arrival confirmation
  const handleConfirmArrival = async () => {
    if (!isValidTime(inputTime)) {
      setError('Format d\'heure invalide. Utilisez HH:MM');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await markProfPresent(record.id, inputTime);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle departure confirmation
  const handleConfirmDeparture = async () => {
    if (!isValidTime(inputTime)) {
      setError('Format d\'heure invalide. Utilisez HH:MM');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await markProfDeparture(record.id, inputTime);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle absent
  const handleMarkAbsent = async () => {
    if (!window.confirm(`Marquer ${record.professorName} comme absent pour cette séance?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await markProfAbsent(record.id);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get retard color and badge
  const getRetardBadge = () => {
    if (calculatedRetard === null) return null;

    if (calculatedRetard <= 0) {
      return (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">À l'heure</span>
        </div>
      );
    } else if (calculatedRetard <= 5) {
      return (
        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">🟢 {calculatedRetard} min</span>
        </div>
      );
    } else if (calculatedRetard <= 15) {
      return (
        <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">🟡 {calculatedRetard} min</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">🔴 {calculatedRetard} min</span>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{record.professorName}</h2>
            <p className="text-blue-100 text-sm">
              {record.subject} • {record.level}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Session info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{record.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Horaire prévu:</span>
              <span className="font-medium">
                {record.startTime_planned} - {record.endTime_planned}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Durée prévue:</span>
              <span className="font-medium">{record.volumePlanned} min</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Mode selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Mode de pointage
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('arrival')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  mode === 'arrival'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={loading || (record.status !== 'PLANNED' && record.status !== 'PRESENT')}
              >
                📍 Arrivée
              </button>
              <button
                onClick={() => setMode('departure')}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  mode === 'departure'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={loading || record.status !== 'PRESENT'}
              >
                🚪 Départ
              </button>
            </div>
          </div>

          {/* Time input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Heure ({mode === 'arrival' ? 'd\'arrivée' : 'de départ'})
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <input
                type="time"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Retard badge */}
          {mode === 'arrival' && getRetardBadge()}

          {/* Buttons */}
          <div className="space-y-2 pt-4">
            {mode === 'arrival' && (
              <button
                onClick={handleConfirmArrival}
                disabled={loading || !isValidTime(inputTime)}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-all"
              >
                {loading ? 'Enregistrement...' : '✅ Confirmer arrivée'}
              </button>
            )}

            {mode === 'departure' && (
              <button
                onClick={handleConfirmDeparture}
                disabled={loading || !isValidTime(inputTime)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-all"
              >
                {loading ? 'Enregistrement...' : '✅ Confirmer départ'}
              </button>
            )}

            <button
              onClick={handleMarkAbsent}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-all"
            >
              🚫 Marquer absent
            </button>

            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-300 hover:bg-gray-400 disabled:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfPresenceModal;
