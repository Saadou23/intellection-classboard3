import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronDown, Clock, BookOpen, Building2, MapPin, RefreshCw, Moon } from 'lucide-react';
import { getAllPeriods, getPeriodIcon } from './periodUtils';
import { formatLevelDisplay } from './levelUtils';

const ProfessorPublicSchedule = () => {
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [availablePeriods, setAvailablePeriods] = useState([]);
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


  // Charger les branches au démarrage
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        const branchesRef = doc(db, 'settings', 'branches');
        const branchesSnap = await getDoc(branchesRef);

        if (branchesSnap.exists()) {
          const branchesArray = branchesSnap.data().branches || [];
          setBranchesData(branchesArray);
          setBranches(branchesArray.map(b => b.name));

          // Charger les périodes
          const periods = getAllPeriods(branchesArray);
          setAvailablePeriods(periods);
        }
      } catch (error) {
        console.error('Erreur chargement branches:', error);
      }
    };

    loadBranches();
  }, []);

  // Charger les professeurs
  useEffect(() => {
    const loadProfessors = async () => {
      try {
        const allProfessors = new Set();

        // Charger depuis chaque branche
        for (const branch of branches) {
          try {
            const docRef = doc(db, 'branches', branch);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const branchSessions = docSnap.data().sessions || [];
              branchSessions.forEach(session => {
                if (session.professor) {
                  allProfessors.add(session.professor);
                }
              });
            }
          } catch (error) {
            console.error(`Erreur chargement professeurs pour ${branch}:`, error);
          }
        }

        const sortedProfessors = Array.from(allProfessors).sort();
        setProfessors(sortedProfessors);
        setLoading(false);
      } catch (error) {
        console.error('Erreur:', error);
        setLoading(false);
      }
    };

    if (branches.length > 0) {
      loadProfessors();
    }
  }, [branches]);

  // Charger les séances du professeur sélectionné
  useEffect(() => {
    if (!selectedProfessor) {
      setSessions([]);
      return;
    }

    const loadProfessorSessions = async () => {
      try {
        const allSessions = [];

        // Charger depuis chaque branche
        for (const branch of branches) {
          const docRef = doc(db, 'branches', branch);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const branchSessions = docSnap.data().sessions || [];
            branchSessions.forEach(session => {
              if (session.professor === selectedProfessor) {
                allSessions.push({ ...session, branch });
              }
            });
          }
        }

        // Filtrer par période
        let filteredSessions = allSessions;
        if (selectedPeriod === 'normal') {
          filteredSessions = filteredSessions.filter(s => !s.period || s.period === null);
        } else {
          filteredSessions = filteredSessions.filter(s => s.period === selectedPeriod);
        }

        // Trier par jour et heure
        filteredSessions.sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) {
            return a.dayOfWeek - b.dayOfWeek;
          }
          return a.startTime.localeCompare(b.startTime);
        });

        setSessions(filteredSessions);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    loadProfessorSessions();
  }, [selectedProfessor, selectedPeriod, branches]);

  const filteredProfessors = professors.filter(prof =>
    prof.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 font-semibold">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!selectedProfessor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Mon Emploi du Temps
            </h1>
            <p className="text-gray-600">Professeurs INTELLECTION</p>
          </div>

          {/* Sélection Période */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
              📅 Choisissez la période
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedPeriod('normal')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  selectedPeriod === 'normal'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📅</div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-gray-800">Emploi Normal</div>
                    <div className="text-sm text-gray-600">Horaires habituels</div>
                  </div>
                  {selectedPeriod === 'normal' && <div className="text-blue-500">✓</div>}
                </div>
              </button>

              {availablePeriods.map(period => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    selectedPeriod === period.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getPeriodIcon(period.type)}</div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-800">{period.name}</div>
                      <div className="text-sm text-gray-600">
                        Du {new Date(period.startDate).toLocaleDateString('fr-FR')} au {new Date(period.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    {selectedPeriod === period.id && <div className="text-purple-500">✓</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recherche */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🔍 Rechercher votre nom
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tapez votre nom..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Liste des professeurs */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredProfessors.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun professeur trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProfessors.map(prof => (
                  <button
                    key={prof}
                    onClick={() => {
                      setSelectedProfessor(prof);
                      setSearchTerm('');
                    }}
                    className="w-full p-4 hover:bg-purple-50 transition-all text-left flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-200">
                      {prof.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{prof}</div>
                      <div className="text-sm text-gray-500">
                        {selectedPeriod === 'normal' ? 'Emploi Normal' : availablePeriods.find(p => p.id === selectedPeriod)?.name}
                      </div>
                    </div>
                    <div className="text-purple-500 opacity-0 group-hover:opacity-100">→</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Mon Emploi du Temps</h1>
          <div className="mt-3 space-y-2">
            <p className="text-lg text-purple-600 font-semibold">👨‍🏫 {selectedProfessor}</p>
            {selectedPeriod !== 'normal' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
                <Moon className="w-5 h-5" />
                {availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Période spéciale'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">Aucun cours programmé pour cette période</p>
            </div>
          ) : (
            <div className="space-y-8">
              {daysOfWeek.map(day => {
                const daySessions = sessions.filter(s => s.dayOfWeek === day.value);
                if (daySessions.length === 0) return null;

                return (
                  <div key={day.value} className="border-l-4 border-purple-500 pl-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{day.label}</h3>
                    <div className="space-y-3">
                      {daySessions.map((session, idx) => (
                        <div key={idx} className="bg-purple-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-purple-100">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-purple-600" />
                              <span className="font-semibold">{session.startTime} - {session.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-green-600" />
                              <span>{formatLevelDisplay(session.level)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                              <span className="font-semibold">{session.subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-red-600" />
                              <span>{session.branch}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-orange-600" />
                              <span>Salle {session.room}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => {
              setSelectedProfessor('');
              setSearchTerm('');
              setSelectedPeriod('normal');
            }}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Changer de professeur
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessorPublicSchedule;
