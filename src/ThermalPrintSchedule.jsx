import React, { useState, useEffect } from 'react';
import { getAllPeriods, filterSessionsByPeriod, getPeriodIcon } from './periodUtils';
import { Printer, X } from 'lucide-react';

const ThermalPrintSchedule = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [availableLevels, setAvailableLevels] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  console.log('🖨️ ThermalPrintSchedule chargé, branchesData:', branchesData);

  const daysOfWeek = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' }
  ];

  // Charger les périodes disponibles
  useEffect(() => {
    console.log('📋 useEffect périodes - branchesData:', branchesData);
    if (branchesData && Array.isArray(branchesData) && branchesData.length > 0) {
      try {
        const periods = getAllPeriods(branchesData);
        console.log('✅ Périodes chargées:', periods);
        setAvailablePeriods(periods);
      } catch (error) {
        console.error('❌ Erreur getAllPeriods:', error);
      }
    } else {
      console.warn('⚠️ branchesData invalide');
    }
  }, [branchesData]);

  // Extraire les niveaux disponibles
  useEffect(() => {
    if (selectedBranch) {
      const branchSessions = sessions[selectedBranch] || [];
      const levels = [...new Set(branchSessions.map(s => s.level))].sort();
      setAvailableLevels(levels);
      setSelectedLevel('ALL');
    } else {
      setAvailableLevels([]);
    }
  }, [selectedBranch, sessions]);

  // Générer l'emploi du temps
  const generateSchedule = (branch, level = 'ALL', period = 'normal') => {
    let branchSessions = sessions[branch] || [];
    
    // Filtrer par période
    if (period === 'normal') {
      branchSessions = branchSessions.filter(s => !s.period || s.period === null);
    } else {
      branchSessions = branchSessions.filter(s => s.period === period);
    }
    
    // Filtrer par niveau
    const filteredSessions = level === 'ALL' 
      ? branchSessions 
      : branchSessions.filter(s => s.level === level);
    
    let schedule = {};
    daysOfWeek.forEach(day => {
      const daySessions = filteredSessions
        .filter(s => s.dayOfWeek === day.value && s.status !== 'cancelled')
        .sort((a, b) => {
          const timeA = a.startTime.split(':').map(Number);
          const timeB = b.startTime.split(':').map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });
      
      schedule[day.value] = {
        label: day.label,
        sessions: daySessions
      };
    });

    return schedule;
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const handlePrint = () => {
    if (!selectedBranch) {
      alert('Veuillez sélectionner une filiale');
      return;
    }

    setIsPrinting(true);
    
    const schedule = generateSchedule(selectedBranch, selectedLevel, selectedPeriod);
    const printWindow = window.open('', '_blank');
    
    // Titre
    const periodName = selectedPeriod === 'normal' 
      ? 'Normal' 
      : availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Période';
    
    let title = `Emploi du temps - ${selectedBranch}`;
    if (selectedPeriod !== 'normal') {
      title += ` - ${periodName}`;
    }
    if (selectedLevel !== 'ALL') {
      title += ` - ${selectedLevel}`;
    } else {
      title += ' - Tous les niveaux';
    }
    
    // HTML d'impression
    let printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 5mm; }
      body { margin: 0; padding: 0; }
    }
    
    body {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      line-height: 1.3;
      max-width: 80mm;
      margin: 0 auto;
      padding: 5mm;
    }
    
    .header {
      text-align: center;
      font-weight: bold;
      margin-bottom: 5mm;
      border-bottom: 2px dashed #000;
      padding-bottom: 3mm;
    }
    
    .title { font-size: 14px; margin-bottom: 2mm; }
    .subtitle { font-size: 11px; }
    
    .day-section {
      margin-top: 4mm;
      page-break-inside: avoid;
    }
    
    .day-header {
      font-weight: bold;
      font-size: 11px;
      background: #000;
      color: #fff;
      padding: 2mm;
      margin-bottom: 2mm;
    }
    
    .session {
      margin-bottom: 3mm;
      padding: 2mm;
      border-left: 2px solid #000;
      padding-left: 2mm;
    }
    
    .time { font-weight: bold; font-size: 11px; }
    .details { margin-top: 1mm; }
    .detail-line { margin: 0.5mm 0; }
    
    .footer {
      margin-top: 5mm;
      padding-top: 3mm;
      border-top: 2px dashed #000;
      text-align: center;
      font-size: 9px;
    }
    
    .no-sessions {
      text-align: center;
      font-style: italic;
      color: #666;
      padding: 2mm;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${title}</div>
    <div class="subtitle">${new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}</div>
  </div>`;

    // Contenu
    daysOfWeek.forEach(day => {
      const dayData = schedule[day.value];
      
      printContent += `
  <div class="day-section">
    <div class="day-header">${dayData.label.toUpperCase()}</div>`;
      
      if (dayData.sessions.length === 0) {
        printContent += `<div class="no-sessions">Aucun cours</div>`;
      } else {
        dayData.sessions.forEach(session => {
          printContent += `
    <div class="session">
      <div class="time">${formatTime(session.startTime)} - ${formatTime(session.endTime)}</div>
      <div class="details">
        <div class="detail-line">📚 ${session.level} - ${session.subject || 'Matière'}</div>
        <div class="detail-line">👤 ${session.professor}</div>
        <div class="detail-line">🚪 Salle ${session.room}</div>
      </div>
    </div>`;
        });
      }
      
      printContent += `
  </div>`;
    });

    printContent += `
  <div class="footer">
    INTELLECTION - Emploi du temps<br>
    Imprimé le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      setIsPrinting(false);
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Impression Ticket Thermique</h2>
                <p className="text-blue-200 text-sm mt-1">Emploi du temps hebdomadaire</p>
              </div>
            </div>
            <button onClick={onClose} className="bg-blue-800 hover:bg-blue-600 p-2 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">📋 Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Format optimisé pour imprimantes thermiques 80mm</li>
              <li>• Affiche tous les cours du lundi au dimanche</li>
              <li>• Possibilité de filtrer par niveau (ou tous les niveaux)</li>
              <li>• Choisir entre emploi normal ou Ramadan/autres périodes</li>
              <li>• Classement chronologique par jour</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Sélectionner la filiale</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir une filiale --</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📅 Type d'emploi du temps</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">📅 Emploi Normal</option>
              {availablePeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {getPeriodIcon(period.type)} {period.name}
                </option>
              ))}
            </select>
            {availablePeriods.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ Aucune période configurée
              </p>
            )}
          </div>

          {selectedBranch && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Filtrer par niveau</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">📚 Tous les niveaux</option>
                {availableLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          )}

          {selectedBranch && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3">📊 Aperçu</h3>
              <div className="grid grid-cols-2 gap-4">
                {daysOfWeek.map(day => {
                  let branchSessions = sessions[selectedBranch] || [];
                  
                  if (selectedPeriod === 'normal') {
                    branchSessions = branchSessions.filter(s => !s.period || s.period === null);
                  } else {
                    branchSessions = branchSessions.filter(s => s.period === selectedPeriod);
                  }
                  
                  const filteredSessions = selectedLevel === 'ALL' 
                    ? branchSessions 
                    : branchSessions.filter(s => s.level === selectedLevel);
                    
                  const daySessionsCount = filteredSessions.filter(
                    s => s.dayOfWeek === day.value && s.status !== 'cancelled'
                  ).length;
                  
                  return (
                    <div key={day.value} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-700">{day.label}:</span>
                      <span className={`font-bold ${daySessionsCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {daySessionsCount} cours
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={handlePrint}
            disabled={!selectedBranch || isPrinting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? 'Impression...' : 'Imprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrintSchedule;