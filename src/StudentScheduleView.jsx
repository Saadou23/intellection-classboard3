import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, BookOpen, MapPin, ArrowLeft, AlertCircle } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const StudentScheduleView = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [branches, setBranches] = useState([]);
  const [levels, setLevels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Charger les filiales
  useEffect(() => {
    loadBranches();
  }, []);

  // Charger les niveaux
  useEffect(() => {
    loadLevels();
  }, []);

  const loadBranches = async () => {
    try {
      const branchesRef = doc(db, 'settings', 'branches');
      const branchesSnap = await getDoc(branchesRef);
      
      if (branchesSnap.exists()) {
        const branchesData = branchesSnap.data();
        const branchNames = branchesData.branches?.map(b => b.name) || [];
        setBranches(branchNames.length > 0 ? branchNames : ['Hay Salam', 'Doukkali', 'Saada']);
      } else {
        setBranches(['Hay Salam', 'Doukkali', 'Saada']);
      }
    } catch (error) {
      console.error('Erreur chargement filiales:', error);
      setBranches(['Hay Salam', 'Doukkali', 'Saada']);
    }
  };

  const loadLevels = async () => {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLevels(data.levels || []);
      }
    } catch (error) {
      console.error('Erreur chargement niveaux:', error);
    }
  };

  const loadSchedule = async () => {
    if (!selectedBranch || !selectedLevel) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'branches', selectedBranch);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const allSessions = data.sessions || [];
        
        // Filtrer par niveau
        const filteredSessions = allSessions.filter(s => s.level === selectedLevel);
        setSessions(filteredSessions);
      }
    } catch (error) {
      console.error('Erreur chargement emploi du temps:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedBranch && selectedLevel) {
      loadSchedule();
    }
  }, [selectedBranch, selectedLevel]);

  const daysOfWeek = [
    { value: 0, label: 'Dimanche', short: 'Dim' },
    { value: 1, label: 'Lundi', short: 'Lun' },
    { value: 2, label: 'Mardi', short: 'Mar' },
    { value: 3, label: 'Mercredi', short: 'Mer' },
    { value: 4, label: 'Jeudi', short: 'Jeu' },
    { value: 5, label: 'Vendredi', short: 'Ven' },
    { value: 6, label: 'Samedi', short: 'Sam' }
  ];

  // Générer le calendrier du mois
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    return days;
  };

  // Obtenir les séances pour une date donnée
  const getSessionsForDate = (date) => {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // Séances récurrentes
    const recurringSessions = sessions.filter(s => 
      !s.isExceptional && s.dayOfWeek === dayOfWeek
    );

    // Séances exceptionnelles
    const exceptionalSessions = sessions.filter(s => 
      s.isExceptional && s.specificDate === dateStr
    );

    return [...recurringSessions, ...exceptionalSessions].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Sélection initiale
  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <Calendar className="w-20 h-20 text-blue-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Mon Emploi du Temps
              </h1>
              <p className="text-gray-600 text-lg">
                Consultez votre emploi du temps du mois
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Sélectionnez votre filiale
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branches.map(branch => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-8 rounded-xl font-semibold text-xl transition-all transform hover:scale-105"
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => setSelectedBranch('')}
              className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>

            <div className="text-center mb-8">
              <div className="text-2xl font-bold text-blue-600 mb-4">{selectedBranch}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Sélectionnez votre niveau
              </h2>
            </div>

            {levels.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600">Aucun niveau configuré</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levels.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Affichage du calendrier
  const daysInMonth = getDaysInMonth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedLevel('')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Changer de niveau
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Emploi du Temps
            </h1>
            <div className="text-xl text-blue-600 font-semibold">
              {selectedBranch} • {selectedLevel}
            </div>
          </div>
        </div>

        {/* Navigation mois */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => changeMonth(-1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              ← Mois précédent
            </button>
            <div className="text-2xl font-bold text-gray-800">
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Mois suivant →
            </button>
          </div>
        </div>

        {/* Calendrier */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Chargement...</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {daysOfWeek.map(day => (
                <div key={day.value} className="text-center font-bold text-gray-700 py-2">
                  {day.short}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Jours vides avant le 1er du mois */}
              {Array(daysInMonth[0].getDay()).fill(null).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square" />
              ))}

              {/* Jours du mois */}
              {daysInMonth.map(date => {
                const daySessions = getSessionsForDate(date);
                const today = isToday(date);
                const past = isPast(date);

                return (
                  <div
                    key={date.toISOString()}
                    className={`border rounded-lg p-2 aspect-square overflow-hidden ${
                      today ? 'border-4 border-blue-600 bg-blue-50' : 'border-gray-200'
                    } ${past ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                  >
                    <div className={`text-sm font-bold mb-1 ${today ? 'text-blue-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </div>
                    
                    {daySessions.length > 0 && (
                      <div className="text-xs space-y-1">
                        {daySessions.slice(0, 2).map((session, idx) => (
                          <div
                            key={idx}
                            className={`p-1 rounded text-white truncate ${
                              session.isExceptional ? 'bg-purple-600' : 'bg-blue-600'
                            }`}
                            title={`${session.startTime} ${session.subject}`}
                          >
                            {session.startTime} {session.subject.substring(0, 8)}
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-xs text-gray-500 font-semibold text-center">
                            +{daySessions.length - 2} autre{daySessions.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div className="mt-6 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Séance normale</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span>Séance exceptionnelle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-4 border-blue-600 rounded"></div>
                <span>Aujourd'hui</span>
              </div>
            </div>

            {/* Liste détaillée */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-bold mb-4">
                Détail des séances du mois
              </h3>
              {daysInMonth.filter(d => getSessionsForDate(d).length > 0).map(date => {
                const daySessions = getSessionsForDate(date);
                return (
                  <div key={date.toISOString()} className="mb-6">
                    <div className="text-lg font-bold text-gray-800 mb-2">
                      {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="space-y-2">
                      {daySessions.map((session, idx) => (
                        <div
                          key={idx}
                          className={`border-l-4 p-4 rounded ${
                            session.isExceptional
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-blue-600 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 font-bold">
                              <Clock className="w-4 h-4" />
                              {session.startTime} - {session.endTime}
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {session.subject}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {session.professor}
                            </div>
                            <div className="flex items-center gap-2 font-bold text-blue-600">
                              <MapPin className="w-4 h-4" />
                              {session.room}
                            </div>
                            {session.isExceptional && (
                              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold">
                                {session.reason === 'makeup' && '🔄 RATTRAPAGE'}
                                {session.reason === 'exam' && '📝 EXAMEN'}
                                {session.reason === 'extra' && '➕ EXTRA'}
                                {!session.reason && 'EXCEPTIONNEL'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentScheduleView;
