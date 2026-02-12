import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BookOpen, FileDown, User, Home, Moon, RefreshCw } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAllPeriods, getPeriodIcon } from './periodUtils';
import { formatLevelDisplay } from './levelUtils';

const ProfessorSchedule = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [branchesData, setBranchesData] = useState([]);
  const [allProfessors, setAllProfessors] = useState([]);
  const [showWizard, setShowWizard] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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

  // Charger les périodes et professeurs
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger branchesData pour les périodes
        const branchesRef = doc(db, 'settings', 'branches');
        const branchesSnap = await getDoc(branchesRef);
        
        if (branchesSnap.exists()) {
          const data = branchesSnap.data();
          const branchesArray = data.branches || [];
          setBranchesData(branchesArray);
          
          const periods = getAllPeriods(branchesArray);
          setAvailablePeriods(periods);
        }

        // Charger tous les professeurs
        const professorsSet = new Set();
        for (const branch of branches) {
          const docRef = doc(db, 'branches', branch);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const branchSessions = docSnap.data().sessions || [];
            branchSessions.forEach(session => {
              if (session.professor) {
                professorsSet.add(session.professor);
              }
            });
          }
        }
        
        setAllProfessors(Array.from(professorsSet).sort());
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Gérer les paramètres URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const profParam = params.get('professor');
    const periodParam = params.get('period');

    if (profParam) {
      setSelectedProfessor(profParam);
      setSelectedPeriod(periodParam || 'normal');
      setShowWizard(false);
      loadScheduleData(profParam, periodParam || 'normal');
    }
  }, []);

  const loadScheduleData = async (professor, period = 'normal') => {
    setLoading(true);
    console.log('📊 Chargement emploi pour:', { professor, period });
    
    try {
      const allSessions = [];

      // Charger toutes les branches
      for (const branch of branches) {
        const docRef = doc(db, 'branches', branch);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const branchSessions = docSnap.data().sessions || [];
          branchSessions.forEach(session => {
            if (session.professor === professor) {
              allSessions.push({ ...session, branch });
            }
          });
        }
      }

      console.log(`📚 ${allSessions.length} sessions trouvées pour ${professor}`);

      // Filtrer par période
      let filteredSessions = allSessions;
      if (period === 'normal') {
        filteredSessions = filteredSessions.filter(s => !s.period || s.period === null);
        console.log(`✅ Sessions normales: ${filteredSessions.length}`);
      } else {
        filteredSessions = filteredSessions.filter(s => s.period === period);
        console.log(`🌙 Sessions période: ${filteredSessions.length}`);
      }

      filteredSessions.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });

      setSessions(filteredSessions);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfessor = (professor, period) => {
    console.log('👤 Professeur sélectionné:', professor, 'Période:', period);
    setSelectedProfessor(professor);
    setSelectedPeriod(period);
    setShowWizard(false);
    loadScheduleData(professor, period);
  };

  const handleReset = () => {
    setShowWizard(true);
    setSelectedProfessor(null);
    setSessions([]);
    setSearchTerm('');
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Titre
      const periodName = selectedPeriod === 'normal' 
        ? 'Normal' 
        : availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Période';

      let title = `Emploi du Temps - ${selectedProfessor}`;
      if (periodName !== 'Normal') {
        title += ` - ${periodName}`;
      }

      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(title, 148, 15, { align: 'center' });

      const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      let yPosition = 30;

      daysOfWeek.forEach((dayName, dayIndex) => {
        const daySessions = sessions
          .filter(s => s.dayOfWeek === dayIndex)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (daySessions.length === 0) return;

        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(dayName, 15, yPosition);
        yPosition += 7;

        const tableData = daySessions.map(session => [
          `${session.startTime} - ${session.endTime}`,
          formatLevelDisplay(session.level),
          session.subject || '-',
          session.branch || '-',
          `Salle ${session.room}`
        ]);

        const headers = ['Horaire', 'Niveau', 'Matière', 'Centre', 'Salle'];

        doc.autoTable({
          startY: yPosition,
          head: [headers],
          body: tableData,
          margin: { left: 15, right: 15 },
          styles: { 
            fontSize: 9,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250]
          }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      });

      // Sauvegarder
      const filename = `Emploi_${selectedProfessor.replace(/ /g, '_')}_${periodName.replace(/ /g, '_')}.pdf`;
      doc.save(filename);
      
      alert(`✅ PDF généré : ${filename}`);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrer les professeurs selon la recherche
  const filteredProfessors = allProfessors.filter(prof =>
    prof.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && showWizard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (showWizard) {
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
                <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun professeur trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProfessors.map(prof => (
                  <button
                    key={prof}
                    onClick={() => handleSelectProfessor(prof, selectedPeriod)}
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

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              💡 Astuce : Vous pouvez sauvegarder cette page dans vos favoris
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre emploi...</p>
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
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
            onClick={exportToPDF}
            disabled={isExporting || sessions.length === 0}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-5 h-5" />
            {isExporting ? 'Génération...' : 'Télécharger PDF'}
          </button>
          
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Changer de période
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-purple-400 transition-all"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessorSchedule;
