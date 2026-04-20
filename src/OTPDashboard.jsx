import React, { useState, useEffect } from 'react';
import { X, Download, Calendar, BarChart3, Users, Clock, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getDirecteurs, getPointages, calculateWorkHours } from './OTPService';

const OTPDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [records, setRecords] = useState([]);
  const [workStats, setWorkStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [filterDirecteur, setFilterDirecteur] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [directeurs, setDirecteurs] = useState([]);

  useEffect(() => {
    loadData();
    loadDirecteurs();
  }, []);

  const loadDirecteurs = async () => {
    try {
      const dirs = await getDirecteurs();
      setDirecteurs(dirs);
    } catch (e) {
      console.error('Error loading directeurs:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDirecteur) params.directeurId = filterDirecteur;
      if (filterDateStart) params.startDate = filterDateStart;
      if (filterDateEnd) params.endDate = filterDateEnd;

      const data = await getPointages(params);
      setRecords(data);

      const stats = calculateWorkHours(data);
      setWorkStats(stats);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      const rows = records.map(r => ({
        Date: r.timestamp.toLocaleDateString('fr-FR'),
        Heure: r.timestamp.toLocaleTimeString('fr-FR'),
        Directeur: r.directeurName,
        Agent: r.agentName,
        Type: r.type === 'entrée' ? 'Entrée' : 'Sortie',
        Bulletin: r.commentaire || ''
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pointages');
      XLSX.writeFile(wb, `pointages_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      alert('Erreur export: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  const monthlyStats = (() => {
    const grouped = {};
    workStats.forEach(stat => {
      const [year, month] = stat.date.split('-');
      const key = `${year}-${month}`;
      if (!grouped[key]) {
        grouped[key] = { month: key, directeurs: {} };
      }
      if (!grouped[key].directeurs[stat.directeurId]) {
        grouped[key].directeurs[stat.directeurId] = {
          name: stat.directeurName,
          heures: 0,
          jours: 0
        };
      }
      grouped[key].directeurs[stat.directeurId].heures += stat.heuresTravaillees;
      grouped[key].directeurs[stat.directeurId].jours += 1;
    });
    return Object.values(grouped).reverse();
  })();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold">Dashboard Pointages</h1>
          </div>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtres
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-2">Directeur</label>
              <select
                value={filterDirecteur}
                onChange={e => setFilterDirecteur(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="">Tous les directeurs</option>
                {directeurs.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Date début</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={e => setFilterDateStart(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Date fin</label>
              <input
                type="date"
                value={filterDateEnd}
                onChange={e => setFilterDateEnd(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 px-4 py-2 rounded-lg transition"
              >
                {loading ? 'Chargement...' : 'Filtrer'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={records.length === 0 || exporting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-4 py-2 rounded-lg transition flex items-center gap-2"
                title="Exporter en Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            Historique
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </button>
        </div>

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Heure</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Directeur</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Agent</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Bulletin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm">{r.timestamp.toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 text-sm font-mono">{r.timestamp.toLocaleTimeString('fr-FR')}</td>
                      <td className="px-6 py-4">{r.directeurName}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{r.agentName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            r.type === 'entrée'
                              ? 'bg-green-900 text-green-200'
                              : 'bg-orange-900 text-orange-200'
                          }`}
                        >
                          {r.type === 'entrée' ? '🟢 Entrée' : '🟠 Sortie'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {r.commentaire ? (
                          <div className="bg-gray-700 rounded p-2 max-w-xs">
                            <p className="text-xs italic">{r.commentaire}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {records.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">Aucun pointage trouvé</div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Daily Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Détail par jour
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workStats.map(stat => (
                  <div
                    key={`${stat.directeurId}_${stat.date}`}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{stat.directeurName}</h4>
                        <p className="text-xs text-gray-400">{stat.date}</p>
                      </div>
                      <span className="bg-emerald-900 text-emerald-200 px-2 py-1 rounded text-xs font-semibold">
                        Présent
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Heures travaillées:</span>
                        <span className="font-semibold text-emerald-400">{stat.heuresTravaillees}h</span>
                      </div>

                      {stat.retardMinutes > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Retard:</span>
                          <span className="font-semibold text-red-400">{stat.retardMinutes}min</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {workStats.length === 0 && !loading && (
                <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
                  <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Aucune donnée de présence</p>
                </div>
              )}
            </div>

            {/* Monthly Summary */}
            {monthlyStats.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Récapitulatif mensuel</h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  {monthlyStats.map(month => (
                    <div key={month.month} className="border-b border-gray-700 last:border-b-0 p-4">
                      <h4 className="font-semibold text-emerald-400 mb-3">
                        {new Date(month.month + '-01').toLocaleDateString('fr-FR', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(month.directeurs).map(([dirId, stats]) => (
                          <div key={dirId} className="bg-gray-700 rounded p-3 text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold">{stats.name}</span>
                              <span className="text-emerald-400 font-semibold">{stats.heures}h</span>
                            </div>
                            <div className="text-xs text-gray-400">{stats.jours} jours</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPDashboard;
