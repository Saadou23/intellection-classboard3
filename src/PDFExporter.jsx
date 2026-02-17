import React from 'react';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Composant pour générer des PDFs côté client
const PDFExporter = ({ sessions, filterValue, filterType = 'branch', periodName = null }) => {
  
  const generatePDF = () => {
    try {
      // Vérifier que jsPDF est disponible
      if (typeof jsPDF === 'undefined') {
        console.error('jsPDF non disponible');
        alert('Erreur: jsPDF n\'est pas chargé. Veuillez rafraîchir la page.');
        return;
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Vérifier que autoTable est disponible
      if (typeof doc.autoTable !== 'function') {
        console.error('autoTable non disponible sur doc');
        console.log('Type de autoTable:', typeof autoTable);
        // Essayer d'attacher manuellement
        if (typeof autoTable === 'function') {
          doc.autoTable = autoTable;
        } else {
          alert('Erreur: Plugin autoTable non chargé. Veuillez rafraîchir la page.');
          return;
        }
      }

      // Titre
      let title = filterType === 'branch' 
        ? `Emploi du Temps - ${filterValue}`
        : `Emploi du Temps - ${filterValue}`;
      
      // Ajouter la période au titre
      if (periodName && periodName !== 'Normal') {
        title += ` - ${periodName}`;
      }
        
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(title, 148, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 148, 22, { align: 'center' });

      // Sessions déjà filtrées en amont
      const filteredSessions = Array.isArray(sessions) ? sessions : [];

      if (filteredSessions.length === 0) {
        alert('Aucune séance trouvée pour ce filtre');
        return;
      }

      // Préparer les données
      const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      // Grouper par jour
      const sessionsByDay = {};
      daysOfWeek.forEach(day => {
        sessionsByDay[day] = [];
      });

      filteredSessions.forEach(session => {
        const dayName = daysOfWeek[session.dayOfWeek];
        if (dayName) {
          sessionsByDay[dayName].push(session);
        }
      });

      // Générer le tableau pour chaque jour
      let yPosition = 30;
      
      Object.entries(sessionsByDay).forEach(([day, daySessions]) => {
        if (daySessions.length === 0) return;

        // Trier par heure de début
        daySessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }

        // Titre du jour
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(day, 15, yPosition);
        yPosition += 7;

        // Préparer les lignes du tableau
        const tableData = daySessions.map(session => [
          session.startTime + ' - ' + session.endTime,
          session.level || '-',
          session.subject || '-',
          session.professor || '-',
          session.room || '-',
          session.branch || '-',
          getStatusText(session.status)
        ]);

        // Générer le tableau
        doc.autoTable({
          startY: yPosition,
          head: [['Horaire', 'Niveau', 'Matière', 'Professeur', 'Salle', 'Centre', 'Statut']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: {
            fontSize: 9
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 28 },
            2: { cellWidth: 45 },
            3: { cellWidth: 45 },
            4: { cellWidth: 20 },
            5: { cellWidth: 30 },
            6: { cellWidth: 25 }
          },
          margin: { left: 15, right: 15 },
          didDrawPage: (data) => {
            // Pied de page
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(
              'INTELLECTION CLASSBOARD - Généré le ' + new Date().toLocaleString('fr-FR'),
              148,
              200,
              { align: 'center' }
            );
          }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      });

      // Sauvegarder le PDF
      const fileName = `emploi_${filterValue.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Erreur génération PDF:', error);
      console.error('Stack:', error.stack);
      alert(`Erreur lors de la génération du PDF.\n\nDétails: ${error.message}\n\nVérifiez la console (F12) pour plus d'informations.`);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'Programmé',
      'normal': 'Normal',
      'ongoing': 'En cours',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'delayed': 'Retardé',
      'absent': 'Absent'
    };
    return statusMap[status] || status || 'Normal';
  };

  return (
    <button
      onClick={generatePDF}
      className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded flex items-center gap-2 text-gray-700 text-sm transition-all"
    >
      <FileDown className="w-4 h-4 text-red-600" />
      {filterValue}
    </button>
  );
};

export default PDFExporter;