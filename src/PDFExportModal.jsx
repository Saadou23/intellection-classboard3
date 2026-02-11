import React, { useState, useEffect } from 'react';
import { X, FileDown, Building2, User } from 'lucide-react';

const PDFExportModal = ({ sessions, branches, branchesData, onClose }) => {
  console.log('🎯 PDFExportModal OUVERT !', { sessions, branches, branchesData });
  
  const [exportType, setExportType] = useState('branch'); // 'branch' ou 'professor'
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Charger les périodes
  useEffect(() => {
    console.log('🔍 PDFExportModal - branchesData:', branchesData);
    if (branchesData && branchesData.length > 0) {
      const periods = [];
      branchesData.forEach(branch => {
        console.log('  Branch:', branch.name, 'exceptionalPeriods:', branch.exceptionalPeriods);
        if (branch.exceptionalPeriods && branch.exceptionalPeriods.length > 0) {
          branch.exceptionalPeriods.forEach(period => {
            if (!periods.find(p => p.id === period.id)) {
              periods.push(period);
            }
          });
        }
      });
      console.log('✅ Périodes chargées:', periods);
      setAvailablePeriods(periods);
    } else {
      console.warn('⚠️ branchesData vide ou inexistant');
    }
  }, [branchesData]);

  // Charger les professeurs
  useEffect(() => {
    const allProfs = new Set();
    Object.values(sessions).forEach(branchSessions => {
      branchSessions.forEach(session => {
        if (session.professor) {
          allProfs.add(session.professor);
        }
      });
    });
    setProfessors(Array.from(allProfs).sort());
  }, [sessions]);

  const generatePDF = async () => {
    if (exportType === 'branch' && !selectedBranch) {
      alert('Veuillez sélectionner un centre');
      return;
    }
    if (exportType === 'professor' && !selectedProfessor) {
      alert('Veuillez sélectionner un professeur');
      return;
    }

    setIsGenerating(true);

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      // Filtrer les sessions
      let filteredSessions = [];

      if (exportType === 'branch') {
        filteredSessions = sessions[selectedBranch] || [];
      } else {
        // Par professeur : toutes les branches
        Object.entries(sessions).forEach(([branch, branchSessions]) => {
          branchSessions.forEach(session => {
            if (session.professor === selectedProfessor) {
              filteredSessions.push({ ...session, branch });
            }
          });
        });
      }

      // Filtrer par période
      if (selectedPeriod === 'normal') {
        filteredSessions = filteredSessions.filter(s => !s.period || s.period === null);
      } else {
        filteredSessions = filteredSessions.filter(s => s.period === selectedPeriod);
      }

      if (filteredSessions.length === 0) {
        alert('Aucune session trouvée avec ces critères');
        setIsGenerating(false);
        return;
      }

      // Créer le PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Titre
      const periodName = selectedPeriod === 'normal' 
        ? 'Normal' 
        : availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Période';

      let title = exportType === 'branch'
        ? `Emploi du Temps - ${selectedBranch}`
        : `Emploi du Temps - ${selectedProfessor}`;

      if (periodName !== 'Normal') {
        title += ` - ${periodName}`;
      }

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(title, 148, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 148, 22, { align: 'center' });

      const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      let yPosition = 30;

      daysOfWeek.forEach((dayName, dayIndex) => {
        const daySessions = filteredSessions
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

        const tableData = daySessions.map(session => {
          const row = [
            `${session.startTime} - ${session.endTime}`,
            session.level || '-',
            session.subject || '-',
          ];

          if (exportType === 'branch') {
            row.push(session.professor || '-');
            row.push(`Salle ${session.room}`);
          } else {
            row.push(session.branch || '-');
            row.push(`Salle ${session.room}`);
          }

          return row;
        });

        const headers = exportType === 'branch'
          ? ['Horaire', 'Niveau', 'Matière', 'Professeur', 'Salle']
          : ['Horaire', 'Niveau', 'Matière', 'Centre', 'Salle'];

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
      const filterName = exportType === 'branch' 
        ? selectedBranch.replace(/ /g, '_')
        : selectedProfessor.replace(/ /g, '_');
      const filename = `Emploi_${filterName}_${periodName.replace(/ /g, '_')}.pdf`;
      
      doc.save(filename);
      alert(`✅ PDF généré : ${filename}`);
      onClose();

    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileDown className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Export PDF</h2>
                <p className="text-red-200 text-sm mt-1">Emploi du temps par centre ou professeur</p>
              </div>
            </div>
            <button onClick={onClose} className="bg-red-800 hover:bg-red-600 p-2 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">📋 Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choisissez le type d'export (par centre ou par professeur)</li>
              <li>• Sélectionnez la période (Normal ou Ramadan)</li>
              <li>• Le PDF sera généré automatiquement</li>
            </ul>
          </div>

          {/* Type d'export */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Type d'export</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportType('branch')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  exportType === 'branch'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="font-semibold">Par Centre</div>
              </button>
              <button
                onClick={() => setExportType('professor')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  exportType === 'professor'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                <User className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="font-semibold">Par Professeur</div>
              </button>
            </div>
          </div>

          {/* Période */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📅 Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">📅 Emploi Normal</option>
              {availablePeriods.map(period => (
                <option key={period.id} value={period.id}>
                  🌙 {period.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection centre */}
          {exportType === 'branch' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Centre</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sélectionner un centre --</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sélection professeur */}
          {exportType === 'professor' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">👤 Professeur</label>
              <select
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Sélectionner un professeur --</option>
                {professors.map(prof => (
                  <option key={prof} value={prof}>{prof}</option>
                ))}
              </select>
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
            onClick={generatePDF}
            disabled={isGenerating || (exportType === 'branch' ? !selectedBranch : !selectedProfessor)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            {isGenerating ? 'Génération...' : 'Générer PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;