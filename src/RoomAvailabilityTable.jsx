import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RoomAvailabilityTable = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || 'Hay Salam');
  const [selectedDay, setSelectedDay] = useState(1); // Lundi par défaut

  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];

  // Horaires d'ouverture par jour
  const openingHours = {
    0: { start: 9, end: 22 },   // Dimanche
    1: { start: 16, end: 22 },  // Lundi
    2: { start: 16, end: 22 },  // Mardi
    3: { start: 16, end: 22 },  // Mercredi
    4: { start: 16, end: 22 },  // Jeudi
    5: { start: 16, end: 22 },  // Vendredi
    6: { start: 14, end: 22 }   // Samedi
  };

  const normalizeRoomName = (room) => {
    if (!room) return null;
    const match = room.match(/\d+/);
    if (match) {
      const num = match[0];
      return `Salle ${num}`;
    }
    return room;
  };

  const getAllRooms = () => {
    const branch = branchesData.find(b => b.name === selectedBranch);
    if (branch?.rooms && typeof branch.rooms === 'number') {
      const rooms = [];
      for (let i = 1; i <= branch.rooms; i++) {
        rooms.push(`Salle ${i}`);
      }
      return rooms;
    }
    return [];
  };

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getAvailableSlots = (room) => {
    const branchSessions = sessions[selectedBranch] || [];
    const hours = openingHours[selectedDay];

    // Sessions occupant cette salle ce jour
    const roomSessions = branchSessions
      .filter(s => {
        if (s.dayOfWeek !== selectedDay) return false;
        const normalizedRoom = normalizeRoomName(s.room);
        return normalizedRoom === room;
      })
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // Créer les créneaux disponibles
    const slots = [];
    let currentTime = hours.start * 60; // en minutes
    const endTime = hours.end * 60;

    roomSessions.forEach(session => {
      const sessionStart = timeToMinutes(session.startTime);
      const sessionEnd = timeToMinutes(session.endTime);

      // S'il y a un créneau libre avant la session
      if (currentTime < sessionStart) {
        slots.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(sessionStart),
          status: 'available'
        });
      }

      // Avancer après la session
      currentTime = Math.max(currentTime, sessionEnd);
    });

    // Créneau libre après la dernière session
    if (currentTime < endTime) {
      slots.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(endTime),
        status: 'available'
      });
    }

    return slots.length > 0 ? slots : [
      {
        start: minutesToTime(hours.start * 60),
        end: minutesToTime(hours.end * 60),
        status: 'available'
      }
    ];
  };

  const rooms = getAllRooms();

  // Générer PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // En-tête
    doc.setFillColor(59, 130, 246); // Bleu
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('📅 DISPONIBILITÉ DES SALLES', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    const dayName = daysOfWeek.find(d => d.value === selectedDay)?.label;
    doc.text(`${selectedBranch} - ${dayName}`, pageWidth / 2, 23, { align: 'center' });

    // Contenu du tableau
    const tableData = rooms.map(room => {
      const slots = getAvailableSlots(room);
      const slotTexts = slots.map(s => `${s.start} - ${s.end}`).join('\n');
      return [room, slotTexts];
    });

    doc.autoTable({
      head: [['Salle', 'Créneaux Disponibles']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 11,
        cellPadding: 5,
        valign: 'top'
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: pageWidth - 40 }
      }
    });

    // Pied de page
    const now = new Date().toLocaleString('fr-FR');
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Généré le: ${now}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Télécharger
    doc.save(`disponibilite-salles-${selectedBranch}-${dayName}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">📅 Créneaux Disponibles par Salle</h2>
              <p className="text-blue-200 text-sm mt-1">Vue détaillée des salles libres</p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-800 hover:bg-blue-700 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Centre</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📆 Jour</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="flex-1 overflow-y-auto p-6">
          {rooms.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Aucune salle configurée pour ce centre</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">
                      Salle
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">
                      Créneaux Disponibles
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room, idx) => {
                    const slots = getAvailableSlots(room);
                    return (
                      <tr
                        key={room}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}
                      >
                        <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                          {room}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="space-y-2">
                            {slots.map((slot, slotIdx) => (
                              <div
                                key={slotIdx}
                                className="bg-green-50 border border-green-300 rounded px-3 py-2 text-green-800 font-semibold"
                              >
                                ✅ {slot.start} - {slot.end}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer avec bouton PDF */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold transition-all"
          >
            Fermer
          </button>
          <button
            onClick={generatePDF}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomAvailabilityTable;
