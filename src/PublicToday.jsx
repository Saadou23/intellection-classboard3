import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BookOpen, User, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { formatLevelDisplay } from './levelUtils';

const PublicToday = () => {
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('auto');
  const [debugInfo, setDebugInfo] = useState('');

  const branches = ['Hay Salam', 'Doukkali', 'Saada'];
  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  const getActivePeriodForBranch = (branchData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const exceptionalPeriods = branchData.exceptionalPeriods || [];
    
    const activePeriod = exceptionalPeriods.find(period => {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return today >= startDate && today <= endDate;
    });
    
    return activePeriod;
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (allSessions.length === 0) return;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    const filtered = allSessions.filter(session => {
      if (session.status && ['cancelled', 'delayed', 'absent'].includes(session.status)) return true;
      const [endH, endM] = session.endTime.split(':').map(Number);
      return currentMinutes < (endH * 60 + endM);
    });

    const finalFiltered = selectedLevel ? filtered.filter(s => s.level === selectedLevel) : filtered;
    setSessions(finalFiltered);
  }, [currentTime, allSessions, selectedLevel]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branch');
    if (branchParam) setSelectedBranch(branchParam);
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;
    setLoading(true);

    const docRef = doc(db, 'branches', selectedBranch);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const branchData = docSnap.data();
        const branchSessions = branchData.sessions || [];
        const today = currentTime.getDay();
        
        let debug = `📋 BRANCHE: ${selectedBranch}\n`;
        debug += `📚 Total sessions: ${branchSessions.length}\n`;
        
        const exceptionalPeriods = branchData.exceptionalPeriods || [];
        setAvailablePeriods(exceptionalPeriods);
        debug += `🔍 Périodes disponibles: ${exceptionalPeriods.length}\n`;
        
        const detectedPeriod = getActivePeriodForBranch(branchData);
        
        let periodToUse;
        if (selectedPeriod === 'auto') {
          periodToUse = detectedPeriod ? detectedPeriod.id : 'normal';
          debug += `🤖 Mode AUTO → ${periodToUse}\n`;
        } else {
          periodToUse = selectedPeriod;
          debug += `👆 Mode MANUEL → ${periodToUse}\n`;
        }
        
        let periodFilteredSessions;
        if (periodToUse === 'normal') {
          periodFilteredSessions = branchSessions.filter(s => !s.period || s.period === null || s.period === '');
          debug += `📅 Sessions normales: ${periodFilteredSessions.length}\n`;
        } else {
          periodFilteredSessions = branchSessions.filter(s => s.period === periodToUse);
          debug += `🌙 Sessions période "${periodToUse}": ${periodFilteredSessions.length}\n`;
        }
        
        const todaySessions = periodFilteredSessions
          .filter(s => {
            if (s.isExceptional && s.specificDate) {
              return s.specificDate === currentTime.toISOString().split('T')[0];
            }
            return s.dayOfWeek === today;
          })
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        debug += `✅ Sessions aujourd'hui: ${todaySessions.length}`;
        
        console.log('\n' + debug + '\n');
        setDebugInfo(debug);
        setAllSessions(todaySessions);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [selectedBranch, currentTime, selectedPeriod]);

  const isSessionOngoing = (session) => {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currentMinutes >= (startH * 60 + startM) && currentMinutes < (endH * 60 + endM);
  };

  const getSessionStatus = (session) => {
    if (session.status === 'cancelled') return { text: 'ANNULÉ', color: 'bg-red-600' };
    if (session.status === 'delayed') return { text: 'RETARDÉ', color: 'bg-orange-600' };
    if (session.status === 'absent') return { text: 'ABSENT', color: 'bg-gray-600' };
    if (isSessionOngoing(session)) return { text: 'EN COURS', color: 'bg-green-600' };
    return { text: 'À VENIR', color: 'bg-blue-600' };
  };

  const getUniqueLevels = () => [...new Set(allSessions.map(s => s.level))].sort();
  const today = daysOfWeek.find(d => d.value === currentTime.getDay());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-white mx-auto mb-4 animate-spin" />
          <p className="text-white text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <Calendar className="w-20 h-20 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Emploi du Temps</h1>
          <p className="text-gray-600 mb-4">
            Ajoutez <code className="bg-gray-100 px-2 py-1 rounded">?branch=</code> dans l'URL
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-lg">
            <p className="font-bold text-gray-700 mb-2">Exemples :</p>
            <code className="block text-sm text-blue-600 mb-1">?branch=Hay+Salam</code>
            <code className="block text-sm text-blue-600 mb-1">?branch=Doukkali</code>
            <code className="block text-sm text-blue-600">?branch=Saada</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* HEADER AVEC SÉLECTEURS */}
        <div className="bg-white rounded-2xl shadow-2xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <h1 className="text-4xl font-bold mb-3">{selectedBranch}</h1>
                <div className="flex items-center gap-4 flex-wrap text-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    <span className="font-medium">{today?.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-2xl">
                    <Clock className="w-7 h-7" />
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* SÉLECTEURS */}
              <div className="flex gap-3 flex-wrap">
                {/* Période */}
                {availablePeriods.length > 0 && (
                  <div className="min-w-[200px]">
                    <label className="block text-sm font-bold mb-2 text-white/90">📅 Période :</label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 border-2 border-white/30 font-medium text-base shadow-lg"
                    >
                      <option value="auto">🤖 Automatique</option>
                      <option value="normal">📅 Horaires normaux</option>
                      {availablePeriods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.type === 'ramadan' ? '🌙' : '📅'} {period.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Niveau */}
                {getUniqueLevels().length > 1 && (
                  <div className="min-w-[150px]">
                    <label className="block text-sm font-bold mb-2 text-white/90">🎓 Niveau :</label>
                    <select
                      value={selectedLevel || ''}
                      onChange={(e) => setSelectedLevel(e.target.value || null)}
                      className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 border-2 border-white/30 font-medium text-base shadow-lg"
                    >
                      <option value="">Tous</option>
                      {getUniqueLevels().map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* INFO DEBUG */}
            <div className="mt-4 bg-white/10 rounded-lg p-3">
              <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap">
                {debugInfo}
              </pre>
            </div>
          </div>
        </div>

        {/* SESSIONS */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <Calendar className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Aucun cours</h2>
            <p className="text-gray-600 text-lg mb-4">
              {allSessions.length > 0 ? 'Tous les cours sont terminés' : `Pas de cours le ${today?.label}`}
            </p>
            {availablePeriods.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 inline-block">
                <p className="text-blue-800 font-medium">
                  💡 Essayez de changer la période ci-dessus
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => {
              const status = getSessionStatus(session);
              const isOngoing = isSessionOngoing(session);

              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition-all ${
                    isOngoing ? 'scale-105 ring-4 ring-green-400' : 'hover:shadow-xl'
                  }`}
                >
                  <div className={`p-6 ${isOngoing ? 'bg-gradient-to-r from-green-50 to-green-100' : ''}`}>
                    <div className="flex items-start gap-6">
                      <div className={`${status.color} text-white rounded-xl p-4 text-center min-w-[110px] shadow-lg`}>
                        <Clock className="w-7 h-7 mx-auto mb-2" />
                        <div className="text-xl font-bold">{session.startTime}</div>
                        <div className="text-sm opacity-90">{session.endTime}</div>
                        <div className="mt-2 text-xs bg-white/30 rounded px-2 py-1">{status.text}</div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <BookOpen className={`w-8 h-8 ${isOngoing ? 'text-green-600' : 'text-blue-600'}`} />
                            <h3 className="text-3xl font-bold text-gray-800">{session.subject}</h3>
                          </div>
                          <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-bold">
                            {formatLevelDisplay(session.level)}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-gray-700">
                          {session.professor && (
                            <div className="flex items-center gap-2">
                              <User className="w-5 h-5 text-gray-400" />
                              <span className="text-lg">{session.professor}</span>
                            </div>
                          )}
                          {session.room && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-gray-400" />
                              <span className="text-lg">{session.room}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicToday;