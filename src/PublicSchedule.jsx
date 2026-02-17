import React, { useState, useEffect } from 'react';
import { getAllPeriods, getPeriodIcon } from './periodUtils';
import { sessionIncludesLevel, getSessionLevels } from './levelUtils';
import { Calendar, Clock, MapPin, BookOpen, User, Home, Moon } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const PublicSchedule = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ branch: null, level: null });
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [branchesData, setBranchesData] = useState([]);
  const [showWizard, setShowWizard] = useState(true);
  const [wizardStep, setWizardStep] = useState(1);
  const [tempBranch, setTempBranch] = useState(null);
  const [tempLevel, setTempLevel] = useState(null);
  const [allLevels, setAllLevels] = useState([]);

  const daysOfWeek = [
    { value: 0, label: 'Dimanche', short: 'Dim' },
    { value: 1, label: 'Lundi', short: 'Lun' },
    { value: 2, label: 'Mardi', short: 'Mar' },
    { value: 3, label: 'Mercredi', short: 'Mer' },
    { value: 4, label: 'Jeudi', short: 'Jeu' },
    { value: 5, label: 'Vendredi', short: 'Ven' },
    { value: 6, label: 'Samedi', short: 'Sam' }
  ];

  const branches = ['Hay Salam', 'Doukkali', 'Saada'];

  useEffect(() => {
    const loadBranchesData = async () => {
      try {
        const branchesRef = doc(db, 'settings', 'branches');
        const branchesSnap = await getDoc(branchesRef);
        
        if (branchesSnap.exists()) {
          const data = branchesSnap.data();
          const branchesArray = data.branches || [];
          setBranchesData(branchesArray);
          
          const periods = getAllPeriods(branchesArray);
          setAvailablePeriods(periods);
        }
      } catch (error) {
        console.error('Erreur chargement branches:', error);
      }
    };
    
    loadBranchesData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branch');
    const levelParam = params.get('level');
    const periodParam = params.get('period');

    if (branchParam && levelParam) {
      setTempBranch(branchParam);
      setTempLevel(levelParam);
      setFilters({ branch: branchParam, level: levelParam });
      setSelectedPeriod(periodParam || 'normal');
      setShowWizard(false);
      loadScheduleData(branchParam, levelParam, periodParam || 'normal');
    }
  }, []);

  const loadLevelsForBranch = async (branchName) => {
    try {
      const docRef = doc(db, 'branches', branchName);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const branchSessions = docSnap.data().sessions || [];
        // Extraire tous les niveaux en gérant multi-niveaux
        const levelsSet = new Set();
        branchSessions.forEach(s => {
          const sessionLevels = getSessionLevels(s);
          sessionLevels.forEach(level => levelsSet.add(level));
        });
        const levels = [...levelsSet].sort();
        setAllLevels(levels);
      }
    } catch (error) {
      console.error('Erreur chargement niveaux:', error);
    }
  };

  const loadScheduleData = async (branch, level, period = 'normal') => {
    setLoading(true);
    console.log('📊 loadScheduleData appelée avec:', { branch, level, period });
    
    try {
      const allSessions = [];

      if (branch) {
        const docRef = doc(db, 'branches', branch);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const branchSessions = docSnap.data().sessions || [];
          console.log(`📚 ${branchSessions.length} sessions trouvées pour ${branch}`);
          branchSessions.forEach(session => {
            allSessions.push({ ...session, branch });
          });
        }
      }

      console.log(`🔍 Filtrage période: ${period}`);
      let filteredSessions = allSessions;
      if (period === 'normal') {
        filteredSessions = filteredSessions.filter(s => !s.period || s.period === null);
        console.log(`✅ Sessions normales: ${filteredSessions.length}/${allSessions.length}`);
      } else {
        filteredSessions = filteredSessions.filter(s => s.period === period);
        console.log(`🌙 Sessions période ${period}: ${filteredSessions.length}/${allSessions.length}`);
      }
      
      if (level) {
        const beforeLevel = filteredSessions.length;
        filteredSessions = filteredSessions.filter(s => sessionIncludesLevel(s, level));
        console.log(`🎓 Filtrage niveau ${level}: ${filteredSessions.length}/${beforeLevel}`);
      }

      filteredSessions.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });

      console.log(`✅ Sessions finales affichées: ${filteredSessions.length}`);
      setSessions(filteredSessions);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWizardComplete = (periodToUse) => {
    const finalPeriod = periodToUse || selectedPeriod;
    console.log('🎯 handleWizardComplete appelée avec période:', finalPeriod);
    setFilters({ branch: tempBranch, level: tempLevel });
    setSelectedPeriod(finalPeriod);
    setShowWizard(false);
    loadScheduleData(tempBranch, tempLevel, finalPeriod);
  };

  const handleReset = () => {
    setShowWizard(true);
    setWizardStep(1);
    setTempBranch(null);
    setTempLevel(null);
    setSelectedPeriod('normal');
  };

  if (showWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            📚 Consulter mon emploi du temps
          </h1>
          
          {wizardStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🏫</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Choisissez votre centre</h2>
                <p className="text-gray-600">Étape 1 sur 3</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {branches.map(branch => (
                  <button
                    key={branch}
                    onClick={() => {
                      setTempBranch(branch);
                      setWizardStep(2);
                      loadLevelsForBranch(branch);
                    }}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all transform hover:scale-105 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">🏢</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{branch}</h3>
                        <p className="text-sm text-gray-500">Centre INTELLECTION</p>
                      </div>
                      <div className="text-blue-500">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Choisissez votre niveau</h2>
                <p className="text-gray-600">Étape 2 sur 3</p>
                <p className="text-sm text-blue-600 mt-2">Centre : {tempBranch}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {allLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => {
                      setTempLevel(level);
                      setWizardStep(3);
                    }}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all transform hover:scale-105"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎓</div>
                      <div className="font-bold text-gray-800">{level}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => { setWizardStep(1); setTempBranch(null); }}
                className="w-full py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
              >
                ← Retour
              </button>
            </div>
          )}
          
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">📅</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Choisissez la période</h2>
                <p className="text-gray-600">Étape 3 sur 3</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-blue-600">Centre : {tempBranch}</p>
                  <p className="text-sm text-green-600">Niveau : {tempLevel}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleWizardComplete('normal')}
                  className="w-full p-6 border-2 border-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all transform hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">📅</div>
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-gray-800">Emploi Normal</h3>
                      <p className="text-sm text-gray-600">Horaires habituels de l'année</p>
                    </div>
                  </div>
                </button>
                
                {availablePeriods.map(period => (
                  <button
                    key={period.id}
                    onClick={() => handleWizardComplete(period.id)}
                    className="w-full p-6 border-2 border-purple-500 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all transform hover:scale-105"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{getPeriodIcon(period.type)}</div>
                      <div className="flex-1 text-left">
                        <h3 className="text-xl font-bold text-gray-800">{period.name}</h3>
                        <p className="text-sm text-gray-600">
                          Du {new Date(period.startDate).toLocaleDateString('fr-FR')} au {new Date(period.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => { setWizardStep(2); setTempLevel(null); }}
                className="w-full py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
              >
                ← Retour
              </button>
            </div>
          )}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Emploi du Temps</h1>
          <div className="mt-3 space-y-2">
            <p className="text-lg text-blue-600 font-semibold">{filters.branch} - {filters.level}</p>
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
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">Aucun cours programmé</p>
            </div>
          ) : (
            <div className="space-y-8">
              {daysOfWeek.map(day => {
                const daySessions = sessions.filter(s => s.dayOfWeek === day.value);
                if (daySessions.length === 0) return null;

                return (
                  <div key={day.value} className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{day.label}</h3>
                    <div className="space-y-3">
                      {daySessions.map((session, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-blue-600" />
                              <span className="font-semibold">{session.startTime} - {session.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-green-600" />
                              <span>{session.level} - {session.subject}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-5 h-5 text-purple-600" />
                              <span>{session.professor}</span>
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

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
          >
            🔄 Modifier ma sélection
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-400 transition-all"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicSchedule;