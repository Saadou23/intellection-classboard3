// ... [Garder tout le début du fichier jusqu'à handlePrint - lignes 1-110] ...
// Je modifie seulement la section CSS et HTML

import React, { useState, useEffect } from 'react';
import { filterSessionsByPeriod, getPeriodIcon } from './periodUtils';
import { sessionIncludesLevel, getSessionLevels } from './levelUtils';
import { Printer, X } from 'lucide-react';

const ThermalPrintSchedule = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [availableLevels, setAvailableLevels] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  const daysOfWeek = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' }
  ];

  // Charger les périodes
  useEffect(() => {
    console.log('🔍 Chargement périodes...');
    if (branchesData && branchesData.length > 0) {
      const periods = [];
      branchesData.forEach(branch => {
        if (branch.exceptionalPeriods && branch.exceptionalPeriods.length > 0) {
          branch.exceptionalPeriods.forEach(period => {
            if (!periods.find(p => p.id === period.id)) {
              periods.push(period);
            }
          });
        }
      });
      console.log('✅ Périodes extraites:', periods);
      setAvailablePeriods(periods);
    }
  }, [branchesData]);

  useEffect(() => {
    if (selectedBranch) {
      const branchSessions = sessions[selectedBranch] || [];
      // Extraire tous les niveaux en gérant les multi-niveaux
      const levelsSet = new Set();
      branchSessions.forEach(s => {
        const sessionLevels = getSessionLevels(s);
        sessionLevels.forEach(level => levelsSet.add(level));
      });
      const levels = [...levelsSet].sort();
      setAvailableLevels(levels);
      setSelectedLevel('ALL');
    } else {
      setAvailableLevels([]);
    }
  }, [selectedBranch, sessions]);

  const generateSchedule = (branch, level = 'ALL', period = 'normal') => {
    let branchSessions = sessions[branch] || [];
    
    if (period === 'normal') {
      branchSessions = branchSessions.filter(s => !s.period || s.period === null);
    } else {
      branchSessions = branchSessions.filter(s => s.period === period);
    }
    
    const filteredSessions = level === 'ALL' 
      ? branchSessions 
      : branchSessions.filter(s => sessionIncludesLevel(s, level));
    
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
    
    const periodName = selectedPeriod === 'normal' 
      ? 'Normal' 
      : availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Période';
    
    let title = `${selectedBranch}`;
    if (selectedPeriod !== 'normal') {
      title += ` - ${periodName}`;
    }
    if (selectedLevel !== 'ALL') {
      title += ` - ${selectedLevel}`;
    }
    
    // HTML OPTIMISÉ avec Bebas Neue
    let printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
  
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 3mm;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Bebas Neue', 'Arial Black', sans-serif;
      font-size: 16px;
      line-height: 1.2;
      width: 80mm;
      margin: 0 auto;
      padding: 3mm;
      background: white;
      color: #000;
    }

    .header {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 2mm;
      margin-bottom: 3mm;
    }

    .header h1 {
      font-size: 28px;
      letter-spacing: 1px;
      margin-bottom: 1mm;
    }

    .header h2 {
      font-size: 22px;
      margin-bottom: 1mm;
    }

    .header .info {
      font-size: 14px;
      margin: 0.5mm 0;
    }

    .day-section {
      margin-bottom: 3mm;
      page-break-inside: avoid;
    }

    .day-header {
      background: #000;
      color: #fff;
      padding: 1.5mm 2mm;
      font-size: 18px;
      text-align: center;
      letter-spacing: 0.5px;
    }

    .session {
      border-left: 3px solid #000;
      padding-left: 2mm;
      margin: 1.5mm 0;
      page-break-inside: avoid;
    }

    .time {
      font-size: 20px;
      letter-spacing: 0.3px;
      margin-bottom: 0.5mm;
    }

    .details {
      font-size: 15px;
      line-height: 1.3;
    }

    .details div {
      margin: 0.3mm 0;
    }

    .no-session {
      text-align: center;
      padding: 2mm;
      font-size: 14px;
      color: #666;
    }

    .footer {
      margin-top: 4mm;
      border-top: 3px double #000;
      padding-top: 2mm;
      text-align: center;
      font-size: 13px;
    }

    .footer-date {
      font-size: 11px;
      margin-top: 1mm;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>INTELLECTION</h1>
    <h2>${selectedBranch}</h2>
    ${selectedLevel !== 'ALL' ? `<div class="info">NIVEAU: ${selectedLevel}</div>` : ''}
    ${selectedPeriod !== 'normal' ? `<div class="info">${periodName.toUpperCase()}</div>` : ''}
  </div>
`;

    let totalSessions = 0;

    daysOfWeek.forEach(day => {
      const dayData = schedule[day.value];
      if (dayData && dayData.sessions.length > 0) {
        totalSessions += dayData.sessions.length;
        
        printContent += `
  <div class="day-section">
    <div class="day-header">${dayData.label.toUpperCase()}</div>
`;
        
        dayData.sessions.forEach(session => {
          printContent += `
    <div class="session">
      <div class="time">${formatTime(session.startTime)} - ${formatTime(session.endTime)}</div>
      <div class="details">
        <div>${session.subject || '-'}</div>
        <div>${session.professor || '-'}</div>
      </div>
    </div>
`;
        });
        
        printContent += `  </div>`;
      }
    });

    if (totalSessions === 0) {
      printContent += `
  <div class="no-session">
    AUCUN COURS PROGRAMME
  </div>
`;
    }

    printContent += `
  <div class="footer">
    <div>TOTAL: ${totalSessions} COURS</div>
    <div class="footer-date">${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
  </div>
</body>
</html>
`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Impression Thermique</h2>
                <p className="text-purple-200 text-sm mt-1">Format ticket 80mm optimisé</p>
              </div>
            </div>
            <button onClick={onClose} className="bg-purple-800 hover:bg-purple-600 p-2 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">✨ Optimisations appliquées</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Police Bebas Neue (grande et grasse)</li>
              <li>• Format compact pour ticket court</li>
              <li>• Espacement réduit entre les éléments</li>
              <li>• Lecture optimale sur ticket 80mm</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Centre</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Sélectionner un centre --</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          {selectedBranch && availableLevels.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🎓 Niveau</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">Tous les niveaux</option>
                {availableLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📅 Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="normal">📅 Emploi Normal</option>
              {availablePeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {getPeriodIcon(period.type)} {period.name}
                </option>
              ))}
            </select>
          </div>
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
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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