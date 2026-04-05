import React, { useState } from 'react';
import { X, Download, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AvailableRoomSlots = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || 'Hay Salam');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // Jour actuel

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
    0: { start: 9, end: 22 },
    1: { start: 16, end: 22 },
    2: { start: 16, end: 22 },
    3: { start: 16, end: 22 },
    4: { start: 16, end: 22 },
    5: { start: 16, end: 22 },
    6: { start: 14, end: 22 }
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

  const normalizeRoomName = (room) => {
    if (!room) return null;
    const match = room.match(/\d+/);
    if (match) {
      const num = match[0];
      return `Salle ${num}`;
    }
    return room;
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
    let currentTime = hours.start * 60;
    const endTime = hours.end * 60;

    roomSessions.forEach(session => {
      const sessionStart = timeToMinutes(session.startTime);
      const sessionEnd = timeToMinutes(session.endTime);

      if (currentTime < sessionStart) {
        slots.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(sessionStart)
        });
      }

      currentTime = Math.max(currentTime, sessionEnd);
    });

    if (currentTime < endTime) {
      slots.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(endTime)
      });
    }

    return slots;
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // En-tête
    pdf.setFontSize(16);
    pdf.text(`CRÉNEAUX DISPONIBLES - ${selectedBranch}`, 15, yPosition);
    pdf.setFontSize(10);
    pdf.text(`${daysOfWeek[selectedDay].label}`, 15, yPosition + 8);

    yPosition += 20;

    const rooms = getAllRooms();

    rooms.forEach((room, roomIndex) => {
      const slots = getAvailableSlots(room);

      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 15;
      }

      // Titre de la salle
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text(room, 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      if (slots.length === 0) {
        pdf.setTextColor(220, 0, 0);
        pdf.text('Aucun créneau disponible', 20, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 6;
      } else {
        slots.forEach(slot => {
          pdf.text(`  • ${slot.start} à ${slot.end}`, 20, yPosition);
          yPosition += 6;

          // Nouvelle page si nécessaire
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 15;
          }
        });
      }

      yPosition += 4;
    });

    // Pied de page
    pdf.setFontSize(8);
    pdf.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      15,
      pageHeight - 10
    );

    pdf.save(`crenaux-disponibles-${selectedBranch}-${daysOfWeek[selectedDay].label}.pdf`);
  };

  const rooms = getAllRooms();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Créneaux Disponibles</h2>
              <p className="text-purple-100 text-sm">Par salle avec horaires</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-purple-700 hover:bg-purple-800 p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Filtres */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filiale
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              >
                {branches.map(branch => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jour
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Affichage des créneaux */}
          <div className="space-y-4">
            {rooms.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Aucune salle configurée pour cette filiale</p>
              </div>
            ) : (
              rooms.map((room, index) => {
                const slots = getAvailableSlots(room);

                return (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-purple-300">
                      {room}
                    </h3>

                    {slots.length === 0 ? (
                      <div className="text-red-600 font-semibold text-sm p-3 bg-red-50 rounded">
                        ❌ Aucun créneau disponible
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {slots.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div className="text-green-600 text-xl">✓</div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {slot.start} à {slot.end}
                              </p>
                              <p className="text-sm text-gray-600">
                                {(() => {
                                  const startMin = timeToMinutes(slot.start);
                                  const endMin = timeToMinutes(slot.end);
                                  const duration = (endMin - startMin) / 60;
                                  return `Durée: ${duration.toFixed(1)}h`;
                                })()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer avec bouton export */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            Fermer
          </button>
          <button
            onClick={generatePDF}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailableRoomSlots;
