import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, XCircle, Save, X, Users, Calendar, MapPin, Printer, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const GroupAttendanceControl = ({ onClose }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [matriculesInput, setMatriculesInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const printRef = useRef(null);

  useEffect(() => {
    loadGroups();
    loadHistory();
  }, []);

  const loadGroups = async () => {
    try {
      const doc_ref = doc(db, 'settings', 'groups');
      const snapshot = await getDoc(doc_ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGroups(data.list || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'attendance_records'));
      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(records.slice(0, 20));
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const parseMatricules = (text) => {
    return text
      .split('\n')
      .map(line => line.trim().toUpperCase())
      .filter(mat => mat.length > 0);
  };

  const toggleGroupSelection = (group) => {
    if (selectedGroups.includes(group)) {
      setSelectedGroups(selectedGroups.filter(g => g !== group));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const analyzeAttendance = async () => {
    if (selectedGroups.length === 0) {
      setMessage('Sélectionnez au moins un groupe');
      return;
    }

    const scannedMatricules = parseMatricules(matriculesInput);
    if (scannedMatricules.length === 0) {
      setMessage('Aucun matricule détecté');
      return;
    }

    setLoading(true);
    try {
      // Charger tous les étudiants de tous les groupes sélectionnés
      const groupStudentsSnapshot = await getDocs(collection(db, 'group_students'));
      const groupMap = {};
      const matriculesByGroup = {}; // Pour tracker dans quel groupe est chaque matricule

      for (const doc_item of groupStudentsSnapshot.docs) {
        const { group, matricule } = doc_item.data();
        if (!groupMap[group]) {
          groupMap[group] = [];
        }
        groupMap[group].push(matricule);

        // Tracker les groupes de chaque matricule
        if (!matriculesByGroup[matricule]) {
          matriculesByGroup[matricule] = [];
        }
        matriculesByGroup[matricule].push(group);
      }

      // Créer un mapping détaillé par matricule scané
      const matriculeAnalysis = {};

      for (const mat of scannedMatricules) {
        const groupsOfThisMatricule = matriculesByGroup[mat] || [];
        const selectedGroupsOfThisMatricule = selectedGroups.filter(g => groupsOfThisMatricule.includes(g));

        matriculeAnalysis[mat] = {
          groupsOfThisMatricule: selectedGroupsOfThisMatricule,
          isInscrit: selectedGroupsOfThisMatricule.length > 0,
          displayGroups: selectedGroupsOfThisMatricule.length > 0 ? selectedGroupsOfThisMatricule.join(', ') : 'Non inscrit'
        };
      }

      // Analyser pour chaque groupe sélectionné
      const analysisByGroup = {};

      for (const selectedGroup of selectedGroups) {
        const groupStudents = groupMap[selectedGroup] || [];

        // Matricules scannés ET inscrits dans CE groupe
        const conformeInGroup = scannedMatricules.filter(mat =>
          matriculeAnalysis[mat].groupsOfThisMatricule.includes(selectedGroup)
        );

        // Matricules inscrits dans CE groupe mais non scannés
        const absents = groupStudents.filter(mat => !scannedMatricules.includes(mat));

        analysisByGroup[selectedGroup] = {
          conforme: conformeInGroup,
          absents: absents,
          effectifGroupe: groupStudents.length,
          scannes: scannedMatricules.length,
          nombreAbsents: absents.length
        };

        // Sauvegarder le contrôle pour ce groupe
        const recordId = `${selectedGroup}_${selectedDate}_${Date.now()}`;
        await setDoc(doc(db, 'attendance_records', recordId), {
          date: selectedDate,
          group: selectedGroup,
          room: selectedRoom || 'Non spécifiée',
          createdAt: new Date().toISOString(),
          analysis: analysisByGroup[selectedGroup],
          scannedMatricules,
          matriculeAnalysis,
          groupStudents
        });
      }

      // Ajouter l'analyse détaillée aux résultats
      for (const selectedGroup of selectedGroups) {
        analysisByGroup[selectedGroup].matriculeAnalysis = matriculeAnalysis;
      }

      setAnalysis(analysisByGroup);
      setMessage('✅ Analyse complétée et enregistrée');
      loadHistory();
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryRecord = async (recordId) => {
    if (window.confirm('Supprimer cet enregistrement ?')) {
      try {
        await deleteDoc(doc(db, 'attendance_records', recordId));
        setHistory(history.filter(h => h.id !== recordId));
        setMessage('✅ Enregistrement supprimé');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('❌ Erreur lors de la suppression');
      }
    }
  };

  const deleteAllHistory = async () => {
    if (window.confirm('Supprimer TOUT l\'historique ? Cette action est irréversible.')) {
      try {
        for (const record of history) {
          await deleteDoc(doc(db, 'attendance_records', record.id));
        }
        setHistory([]);
        setMessage('✅ Historique complètement supprimé');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('❌ Erreur lors de la suppression');
      }
    }
  };

  const handleExportXls = () => {
    if (!analysis) return;

    const firstGroupAnalysis = Object.values(analysis)[0];
    const matriculeAnalysisMap = firstGroupAnalysis.matriculeAnalysis || {};
    const allMatricules = Object.entries(matriculeAnalysisMap)
      .sort(([matA], [matB]) => matA.localeCompare(matB))
      .map(([mat]) => mat);

    // Préparer les données pour l'export
    const data = [];

    // En-tête
    data.push({
      'Matricule': '',
      'Groupe': '',
      'Statut': ''
    });

    data.push({
      'Matricule': 'RAPPORT DE CONTRÔLE DE PRÉSENCE',
      'Groupe': '',
      'Statut': ''
    });

    data.push({
      'Matricule': `Date: ${selectedDate}`,
      'Groupe': `Groupes: ${selectedGroups.join(', ')}`,
      'Statut': `Salle: ${selectedRoom || 'Non spécifiée'}`
    });

    data.push({
      'Matricule': '',
      'Groupe': '',
      'Statut': ''
    });

    // Statistiques
    const totalConforme = Object.values(analysis).reduce((sum, g) => sum + g.conforme.length, 0);
    const totalAbsents = Object.values(analysis).reduce((sum, g) => sum + g.nombreAbsents, 0);
    const totalNonInscrits = Object.values(matriculeAnalysisMap).filter(m => !m.isInscrit).length;

    data.push({
      'Matricule': 'STATISTIQUES',
      'Groupe': '',
      'Statut': ''
    });

    data.push({
      'Matricule': `Total scannés: ${allMatricules.length}`,
      'Groupe': `Inscrits: ${totalConforme}`,
      'Statut': `Absents: ${totalAbsents}`
    });

    data.push({
      'Matricule': `Non inscrits: ${totalNonInscrits}`,
      'Groupe': '',
      'Statut': ''
    });

    data.push({
      'Matricule': '',
      'Groupe': '',
      'Statut': ''
    });

    // Liste des matricules
    data.push({
      'Matricule': 'MATRICULE',
      'Groupe': 'GROUPE(S)',
      'Statut': 'STATUT'
    });

    allMatricules.forEach(mat => {
      const matInfo = matriculeAnalysisMap[mat];
      const isAbsent = Object.values(analysis).some(g => g.absents.includes(mat));
      const status = matInfo.isInscrit ? (isAbsent ? 'ABSENT' : 'PRÉSENT') : 'NON INSCRIT';

      data.push({
        'Matricule': mat,
        'Groupe': matInfo.displayGroups,
        'Statut': status
      });
    });

    // Créer le workbook
    const ws = XLSX.utils.json_to_sheet(data);

    // Formater les colonnes
    ws['!cols'] = [
      { wch: 15 }, // Matricule
      { wch: 25 }, // Groupe(s)
      { wch: 15 }  // Statut
    ];

    // Créer le classeur
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contrôle');

    // Télécharger
    const fileName = `controle_${selectedDate}_${selectedGroups.join('-')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    setMessage('✅ Fichier Excel exporté');
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePrintTicket = () => {
    const printWindow = window.open('', '', 'width=600,height=1000');
    printWindow.document.write(`
      <html>
      <head>
        <title>Ticket Contrôle</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 0; padding: 5px; background: white; }
          .ticket { width: 100%; max-width: 480px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 3px solid #000; padding-bottom: 8px; }
          .header h1 { margin: 3px 0; font-size: 16px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 10px; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .group-section { margin-bottom: 15px; page-break-inside: avoid; }
          .group-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; background: #000; color: #fff; padding: 3px; text-align: center; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-bottom: 8px; font-size: 9px; }
          .stat { border: 1px solid #000; padding: 4px; text-align: center; }
          .stat-label { font-size: 8px; font-weight: bold; }
          .stat-value { font-size: 14px; font-weight: bold; }
          .list-section { margin-bottom: 8px; }
          .matricule-list { font-size: 9px; line-height: 1.5; font-family: 'Courier New', monospace; }
          .matricule { margin: 2px 0; }
          .conforme { }
          .absent { }
          .non-inscrit { }
          .footer { text-align: center; margin-top: 10px; font-size: 8px; border-top: 2px solid #000; padding-top: 5px; }
          @media print {
            body { margin: 0; padding: 2px; }
            .group-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>╔═ CONTRÔLE PRÉSENCE ═╗</h1>
            <p>📅 ${selectedDate}</p>
            <p>🏛️  ${selectedRoom || 'Salle non spécifiée'}</p>
          </div>
    `);

    // Afficher une seule fois pour tous les groupes combinés (même logique que l'écran)
    const firstGroupAnalysis = Object.values(analysis)[0];
    const matriculeAnalysisMap = firstGroupAnalysis.matriculeAnalysis || {};
    const allMatricules = Object.entries(matriculeAnalysisMap)
      .sort(([matA], [matB]) => matA.localeCompare(matB))
      .map(([mat]) => mat);

    const totalConforme = Object.values(analysis).reduce((sum, g) => sum + g.conforme.length, 0);
    const totalAbsents = Object.values(analysis).reduce((sum, g) => sum + g.nombreAbsents, 0);
    const totalNonInscrits = Object.values(matriculeAnalysisMap).filter(m => !m.isInscrit).length;

    printWindow.document.write(`
      <div class="divider"></div>
      <div class="group-section">
        <div class="group-title">GROUPES: ${selectedGroups.join(', ')}</div>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">SCANNÉS</div>
            <div class="stat-value">${allMatricules.length}</div>
          </div>
          <div class="stat">
            <div class="stat-label">INSCRITS</div>
            <div class="stat-value">${totalConforme}</div>
          </div>
          <div class="stat">
            <div class="stat-label">ABSENTS</div>
            <div class="stat-value">${totalAbsents}</div>
          </div>
          <div class="stat">
            <div class="stat-label">NON-INSC.</div>
            <div class="stat-value">${totalNonInscrits}</div>
          </div>
        </div>
    `);

    // Afficher la liste unique (comme l'écran)
    printWindow.document.write(`
      <div class="list-section">
        <div class="matricule-list">
    `);
    allMatricules.forEach(mat => {
      const matInfo = matriculeAnalysisMap[mat];
      const groups = matInfo.displayGroups;
      printWindow.document.write(`<div class="matricule">${mat.padEnd(12)} ${groups}</div>`);
    });
    printWindow.document.write('</div></div></div>');

    printWindow.document.write(`
        <div class="divider"></div>
        <div class="footer">
          <p>🖨️ ${new Date().toLocaleString('fr-FR')}</p>
          <p>INTELLECTION CLASSBOARD</p>
        </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users size={28} />
            <h2 className="text-2xl font-bold">Contrôle de Séance</h2>
          </div>
          <button onClick={onClose} className="hover:bg-purple-800 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.includes('✅') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sélection des groupes (multi-select) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Groupes à contrôler (sélectionnez un ou plusieurs)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
                {groups.length === 0 ? (
                  <p className="text-gray-600 text-sm">Aucun groupe disponible</p>
                ) : (
                  groups.map((group) => (
                    <label key={group} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-purple-100 rounded transition">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group)}
                        onChange={() => toggleGroupSelection(group)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium">{group}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {selectedGroups.length > 0 ? `${selectedGroups.length} groupe(s) sélectionné(s): ${selectedGroups.join(', ')}` : 'Aucun groupe sélectionné'}
              </p>
            </div>

            {/* Sélection de la date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={18} /> Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Sélection de la salle */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={18} /> Salle
              </label>
              <input
                type="text"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                placeholder="Ex: A101, Amphi 1..."
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Zone de copie-colle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Coller les matricules scannés (un par ligne)
            </label>
            <textarea
              value={matriculesInput}
              onChange={(e) => setMatriculesInput(e.target.value)}
              placeholder="MED00125&#10;MED00148&#10;MED00255&#10;MED00411"
              className="w-full h-24 px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              {parseMatricules(matriculesInput).length} matricule(s) détecté(s)
            </p>
          </div>

          <button
            onClick={analyzeAttendance}
            disabled={loading || selectedGroups.length === 0 || !matriculesInput.trim()}
            className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition font-semibold flex items-center justify-center gap-2 text-lg"
          >
            <Save size={22} />
            {loading ? 'Analyse en cours...' : 'Analyser et enregistrer'}
          </button>

          {/* Résultats */}
          {analysis && (
            <div className="space-y-6 border-t-2 border-gray-200 pt-6">
              <div className="flex gap-3">
                <button
                  onClick={handlePrintTicket}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold flex items-center gap-2"
                >
                  <Printer size={20} />
                  🖨️ Imprimer Ticket Thermique
                </button>
                <button
                  onClick={handleExportXls}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold flex items-center gap-2"
                >
                  <Download size={20} />
                  📊 Exporter en XLS
                </button>
              </div>

              {/* Résultat combiné - une seule liste */}
              {(() => {
                const firstGroupAnalysis = Object.values(analysis)[0];
                const totalConforme = Object.values(analysis).reduce((sum, g) => sum + g.conforme.length, 0);
                const totalAbsents = Object.values(analysis).reduce((sum, g) => sum + g.nombreAbsents, 0);
                const totalNonInscrits = Object.values(firstGroupAnalysis.matriculeAnalysis || {}).filter(m => !m.isInscrit).length;

                return (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-l-4 border-purple-500">
                    <h3 className="text-xl font-bold text-purple-900 mb-2">
                      Groupes sélectionnés: {selectedGroups.join(', ')}
                    </h3>

                    {/* Statistiques globales */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <StatBox label="Scannés" value={parseMatricules(matriculesInput).length} color="bg-blue-100 text-blue-800" />
                      <StatBox label="Inscrits" value={totalConforme} color="bg-green-100 text-green-800" />
                      <StatBox label="Absents" value={totalAbsents} color="bg-red-100 text-red-800" />
                      <StatBox label="Non inscrits" value={totalNonInscrits} color="bg-orange-100 text-orange-800" />
                    </div>

                    {/* Liste simple matricule → groupe */}
                    <div className="bg-white p-4 rounded border border-gray-300">
                      <div className="font-mono text-sm space-y-1">
                        {Object.entries(firstGroupAnalysis.matriculeAnalysis || {})
                          .sort(([matA], [matB]) => matA.localeCompare(matB))
                          .map(([mat, matInfo]) => (
                            <div key={mat} className="flex justify-between items-center py-1 border-b border-gray-200">
                              <span className="font-semibold text-gray-800">{mat}</span>
                              <span className={matInfo.isInscrit ? 'text-blue-600 font-bold' : 'text-orange-600 font-bold'}>
                                {matInfo.displayGroups}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Historique */}
          {history.length > 0 && !analysis && (
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">📜 Historique récent ({history.length})</h3>
                <button
                  onClick={deleteAllHistory}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 text-sm font-semibold"
                >
                  <Trash2 size={18} /> Vider l'historique
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="text-left px-4 py-2 font-semibold">Date</th>
                      <th className="text-left px-4 py-2 font-semibold">Groupe</th>
                      <th className="text-left px-4 py-2 font-semibold">Salle</th>
                      <th className="text-left px-4 py-2 font-semibold">Présents</th>
                      <th className="text-left px-4 py-2 font-semibold">Absents</th>
                      <th className="text-left px-4 py-2 font-semibold">Anomalies</th>
                      <th className="text-left px-4 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="border-t border-gray-300 hover:bg-gray-100">
                        <td className="px-4 py-2">{record.date}</td>
                        <td className="px-4 py-2 font-semibold text-blue-600">{record.group}</td>
                        <td className="px-4 py-2">{record.room}</td>
                        <td className="px-4 py-2 text-green-600 font-semibold">{record.analysis.conforme.length}</td>
                        <td className="px-4 py-2 text-red-600 font-semibold">{record.analysis.absents.length}</td>
                        <td className="px-4 py-2 text-orange-600 font-semibold">{record.analysis.matriculesNonInscritPartout ? record.analysis.matriculesNonInscritPartout.length : (record.analysis.pasInscritGroupe ? record.analysis.pasInscritGroupe.length : 0)}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => deleteHistoryRecord(record.id)}
                            className="px-2 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition flex items-center gap-1 text-xs"
                          >
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }) => (
  <div className={`${color} p-3 rounded-lg text-center`}>
    <p className="text-xs font-semibold opacity-75">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default GroupAttendanceControl;
