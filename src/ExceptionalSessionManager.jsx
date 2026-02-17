import React, { useState } from 'react';
import { Plus, Calendar, AlertCircle, X, Save } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const ExceptionalSessionManager = ({ 
  selectedBranch, 
  professors, 
  levels, 
  onAddSession,
  onClose 
}) => {
  const [sessionType, setSessionType] = useState('oneTime'); // 'oneTime' ou 'makeup'
  
  const [formData, setFormData] = useState({
    date: '', // Date spécifique pour la séance exceptionnelle
    startTime: '19:00',
    endTime: '20:30',
    level: '',
    subject: '',
    professor: '',
    room: '',
    reason: '', // Raison de la séance (rattrapage, supplémentaire, etc.)
    linkedToSession: null, // ID de la séance annulée (pour les rattrapages)
    isExceptional: true, // Marqueur pour différencier des séances récurrentes
    expiresAfter: '' // Date après laquelle ne plus afficher
  });

  const reasonOptions = [
    { value: 'makeup', label: '🔄 Rattrapage (prof absent)' },
    { value: 'extra', label: '➕ Séance supplémentaire' },
    { value: 'exam', label: '📝 Examen' },
    { value: 'makeup_student', label: '👥 Rattrapage étudiants' },
    { value: 'other', label: '📌 Autre' }
  ];

  // Obtenir la semaine actuelle (lundi)
  const getCurrentWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Obtenir la date limite (fin de semaine prochaine)
  const getMaxDate = () => {
    const weekStart = getCurrentWeekStart();
    const maxDate = new Date(weekStart);
    maxDate.setDate(maxDate.getDate() + 13); // 2 semaines à partir de lundi
    return maxDate.toISOString().split('T')[0];
  };

  // Date minimum (aujourd'hui)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSubmit = () => {
    if (!selectedBranch) {
      alert('Veuillez sélectionner une filiale');
      return;
    }

    if (!formData.date) {
      alert('Veuillez sélectionner une date');
      return;
    }

    if (!formData.level || !formData.professor) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Calculer dayOfWeek depuis la date
    const selectedDate = new Date(formData.date + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();

    // Créer la séance exceptionnelle
    const exceptionalSession = {
      ...formData,
      dayOfWeek: dayOfWeek,
      id: `exceptional_${Date.now()}`,
      isExceptional: true,
      specificDate: formData.date,
      status: 'normal',
      // Expiration automatique après la date si rattrapage
      expiresAfter: formData.reason === 'makeup' ? formData.date : null
    };

    onAddSession(exceptionalSession);
    
    // Reset form
    setFormData({
      date: '',
      startTime: '19:00',
      endTime: '20:30',
      level: '',
      subject: '',
      professor: '',
      room: '',
      reason: '',
      linkedToSession: null,
      isExceptional: true,
      expiresAfter: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-7 h-7" />
              Séance Exceptionnelle
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Ajouter une séance ponctuelle (cette semaine uniquement)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">📅 Séance à titre exceptionnel</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>S'affiche uniquement pour la date sélectionnée</li>
                <li>Ne se répète pas chaque semaine</li>
                <li>Parfait pour les rattrapages et séances supplémentaires</li>
              </ul>
            </div>
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            {/* Type de séance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de séance *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Choisir --</option>
                {reasonOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de la séance *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum : {new Date(getMaxDate()).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* Horaires */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure début *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure fin *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Niveau */}
            <div>
              <SearchableSelect
                label="Filière/Niveau *"
                options={levels}
                value={formData.level}
                onChange={(value) => setFormData({ ...formData, level: value })}
                placeholder={levels.length > 0 ? "Sélectionner un niveau" : "Aucun niveau configuré"}
                required
              />
            </div>

            {/* Matière */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matière *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: Mathématiques"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Professeur */}
            <div>
              <SearchableSelect
                label="Professeur *"
                options={professors}
                value={formData.professor}
                onChange={(value) => setFormData({ ...formData, professor: value })}
                placeholder={professors.length > 0 ? "Sélectionner un professeur" : "Aucun professeur configuré"}
                required
              />
            </div>

            {/* Salle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salle
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Ex: A101"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Info rattrapage */}
          {formData.reason === 'makeup' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>🔄 Rattrapage :</strong> Cette séance s'affichera uniquement jusqu'à sa date.
                Après cette date, elle disparaîtra automatiquement des affichages publics.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            Ajouter la séance
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExceptionalSessionManager;
