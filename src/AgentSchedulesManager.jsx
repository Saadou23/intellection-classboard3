import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, AlertCircle, Download } from 'lucide-react';
import { getAgents, saveAgentSchedule, getAgentSchedule } from './OTPService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS = {
  Monday: 'Lundi',
  Tuesday: 'Mardi',
  Wednesday: 'Mercredi',
  Thursday: 'Jeudi',
  Friday: 'Vendredi',
  Saturday: 'Samedi',
  Sunday: 'Dimanche'
};

const AgentSchedulesManager = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const agentsList = await getAgents();
      setAgents(agentsList);
    } catch (e) {
      setError('Erreur de chargement des agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = async agentId => {
    const agent = agents.find(a => a.id === agentId) || null;
    setSelectedAgent(agent);
    setError('');
    setSuccess('');
    if (agent) {
      try {
        const agentSchedule = await getAgentSchedule(agentId);
        setSchedule(agentSchedule);
      } catch (e) {
        console.error('Error loading schedule:', e);
        setSchedule({
          Monday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
          Tuesday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
          Wednesday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
          Thursday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
          Friday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
          Saturday: { start: '09:00', end: '17:00', enabled: false, centre: 'Hay Salam' },
          Sunday: { start: '09:00', end: '17:00', enabled: false, centre: 'Hay Salam' }
        });
      }
    }
  };

  const updateScheduleDay = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedAgent) {
      setError('Veuillez sélectionner un agent');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveAgentSchedule(selectedAgent.id, schedule);
      setSuccess(`✅ Horaires et centres de ${selectedAgent.name} sauvegardés avec succès`);
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSet = (startTime, endTime) => {
    const newSchedule = {};
    DAYS.forEach(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      newSchedule[day] = {
        start: startTime,
        end: endTime,
        enabled: !isWeekend
      };
    });
    setSchedule(newSchedule);
  };

  const handleExportPDF = async () => {
    try {
      setError('');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 15;

      // Title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('📋 Horaires des Agents', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Date
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const today = new Date().toLocaleDateString('fr-FR');
      doc.text(`Généré le: ${today}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      doc.setDrawColor(52, 152, 219);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 5;

      // For each agent
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        const agentSchedule = await getAgentSchedule(agent.id);

        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 15;
        }

        // Agent name
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`👤 ${agent.name}`, 15, yPosition);
        yPosition += 8;

        // Schedule table
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');

        const tableData = [];
        DAYS.forEach(day => {
          const daySchedule = agentSchedule[day];
          if (daySchedule?.enabled) {
            tableData.push([
              DAY_LABELS[day],
              `${daySchedule.start} - ${daySchedule.end}`,
              daySchedule.centre || 'Hay Salam'
            ]);
          } else {
            tableData.push([DAY_LABELS[day], 'Repos', '—']);
          }
        });

        doc.autoTable({
          head: [['Jour', 'Horaires', 'Centre']],
          body: tableData,
          startY: yPosition,
          theme: 'grid',
          headerStyles: {
            fillColor: [52, 152, 219],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 8,
            textColor: 50
          },
          alternateRowStyles: {
            fillColor: [240, 248, 255]
          },
          margin: { left: 15, right: 15 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 50 },
            2: { cellWidth: 50 }
          }
        });

        yPosition = doc.lastAutoTable.finalY + 8;

        // Separator
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 5;
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Document confidentiel - À transmettre aux agents pour validation', pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Save PDF
      doc.save(`Horaires_Agents_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('✅ PDF exporté avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Erreur lors de l\'export PDF: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-400">Chargement des agents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-teal-400" />
          <h2 className="text-2xl font-bold">Horaires des Agents</h2>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition font-semibold"
        >
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      {/* Quick Settings */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="font-semibold mb-4">⚡ Paramètres rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickSet('08:00', '16:00')}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition"
          >
            08h-16h
          </button>
          <button
            onClick={() => handleQuickSet('09:00', '17:00')}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition"
          >
            09h-17h
          </button>
          <button
            onClick={() => handleQuickSet('09:30', '17:30')}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition"
          >
            09h30-17h30
          </button>
          <button
            onClick={() => handleQuickSet('10:00', '18:00')}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition"
          >
            10h-18h
          </button>
        </div>
      </div>

      {/* Agent Selection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <label className="block text-sm font-semibold mb-3">Sélectionner un agent</label>
        <select
          value={selectedAgent?.id || ''}
          onChange={e => handleSelectAgent(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="">— Choisir un agent —</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Editor */}
      {selectedAgent && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
          <h3 className="font-semibold">Horaires pour {selectedAgent.name}</h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3 bg-gray-700/50 p-4 rounded flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={schedule[day]?.enabled || false}
                    onChange={e => updateScheduleDay(day, 'enabled', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="font-semibold w-20">{DAY_LABELS[day]}</span>
                </label>

                {schedule[day]?.enabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Début:</label>
                      <input
                        type="time"
                        value={schedule[day]?.start || '09:00'}
                        onChange={e => updateScheduleDay(day, 'start', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Fin:</label>
                      <input
                        type="time"
                        value={schedule[day]?.end || '17:00'}
                        onChange={e => updateScheduleDay(day, 'end', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <label className="text-xs text-gray-400">📍 Centre:</label>
                      <select
                        value={schedule[day]?.centre || 'Hay Salam'}
                        onChange={e => updateScheduleDay(day, 'centre', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="Hay Salam">Hay Salam</option>
                        <option value="Doukkali">Doukkali</option>
                        <option value="Saada">Saada</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded p-3 text-red-200 flex gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-500 rounded p-3 text-green-200 text-sm">
              ✅ {success}
            </div>
          )}

          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 px-6 py-2 rounded-lg transition font-semibold"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder les horaires'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentSchedulesManager;
