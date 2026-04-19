import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, AlertCircle, Send } from 'lucide-react';
import {
  getDirecteurs,
  getSupervisionSchedules,
  createSupervisionSchedule,
  deleteSupervisionSchedule,
  getPointagesForWeek,
  calculateWorkHours
} from './OTPService';

const CENTRES = ['Hay Salam', 'Doukkali', 'Saada'];
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const SupervisionScheduleAdmin = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [directeurs, setDirecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    directeurId: '',
    centre: 'Hay Salam',
    jours: [],
    heuresMin: 2
  });
  const [submitting, setSubmitting] = useState(false);

  // Rapport state
  const [rapport, setRapport] = useState(null);
  const [rapportLoading, setRapportLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dirs, scheds] = await Promise.all([
        getDirecteurs(),
        getSupervisionSchedules()
      ]);
      setDirecteurs(dirs);
      setSchedules(scheds);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async e => {
    e.preventDefault();
    if (!formData.directeurId || formData.jours.length === 0) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);
    try {
      const directeur = directeurs.find(d => d.id === formData.directeurId);
      await createSupervisionSchedule({
        directeurId: formData.directeurId,
        directeurName: directeur.name,
        centre: formData.centre,
        jours: formData.jours,
        heuresMin: parseFloat(formData.heuresMin)
      });

      await loadData();
      setFormData({ directeurId: '', centre: 'Hay Salam', jours: [], heuresMin: 2 });
      setError('');
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async id => {
    if (!window.confirm('Êtes-vous sûr?')) return;
    try {
      await deleteSupervisionSchedule(id);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (e) {
      setError('Erreur suppression: ' + e.message);
    }
  };

  const generateWeeklyReport = async () => {
    setRapportLoading(true);
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - diffToMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      const pointages = await getPointagesForWeek(lastMonday, lastSunday);
      const workStats = calculateWorkHours(pointages);

      const rapport = {
        weekStart: lastMonday.toLocaleDateString('fr-FR'),
        weekEnd: lastSunday.toLocaleDateString('fr-FR'),
        defaillances: []
      };

      for (const schedule of schedules) {
        const dirStats = workStats.filter(s => s.directeurId === schedule.directeurId);

        for (const jourIndex of schedule.jours.map(j => JOURS.indexOf(j))) {
          const dateReq = new Date(lastMonday);
          dateReq.setDate(lastMonday.getDate() + jourIndex);
          const dateKey = dateReq.toISOString().split('T')[0];

          const dayStat = dirStats.find(s => s.date === dateKey);
          const heures = dayStat?.heuresTravaillees || 0;

          if (heures < schedule.heuresMin) {
            rapport.defaillances.push({
              directeur: schedule.directeurName,
              centre: schedule.centre,
              jour: JOURS[jourIndex],
              dateKey: dateKey,
              heuresRequises: schedule.heuresMin,
              heuresPresentees: heures
            });
          }
        }
      }

      setRapport(rapport);
    } catch (e) {
      setError('Erreur générant le rapport: ' + e.message);
    } finally {
      setRapportLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!rapport) return;
    setSendingEmail(true);
    try {
      const response = await fetch(
        'https://us-central1-intellectionclasseboard-v2-u.cloudfunctions.net/sendSupervisionReportNow',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rapport })
        }
      );

      if (!response.ok) throw new Error('Erreur API');
      alert('✅ Email envoyé avec succès!');
    } catch (e) {
      alert('❌ Erreur envoi email: ' + e.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gray-700 border-t-purple-500 rounded-full mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold">Supervision Schedules</h1>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-6 py-2 rounded-lg transition ${
              activeTab === 'schedules'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📋 Schedules
          </button>
          <button
            onClick={() => { setActiveTab('rapport'); generateWeeklyReport(); }}
            className={`px-6 py-2 rounded-lg transition ${
              activeTab === 'rapport'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📊 Rapport Semaine
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded p-3 flex gap-2 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            {/* Create Form */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Ajouter un Schedule
              </h2>

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Directeur</label>
                    <select
                      value={formData.directeurId}
                      onChange={e => setFormData({ ...formData, directeurId: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {directeurs.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Centre</label>
                    <select
                      value={formData.centre}
                      onChange={e => setFormData({ ...formData, centre: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {CENTRES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Jours</label>
                  <div className="flex flex-wrap gap-2">
                    {JOURS.map(jour => (
                      <label key={jour} className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded cursor-pointer hover:bg-gray-600">
                        <input
                          type="checkbox"
                          checked={formData.jours.includes(jour)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData({ ...formData, jours: [...formData.jours, jour] });
                            } else {
                              setFormData({ ...formData, jours: formData.jours.filter(j => j !== jour) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm capitalize">{jour}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Heures minimum par jour</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.heuresMin}
                    onChange={e => setFormData({ ...formData, heuresMin: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 px-6 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? 'Création...' : 'Créer'}
                </button>
              </form>
            </div>

            {/* Schedules Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Directeur</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Centre</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Jours</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Min/Jour</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {schedules.map(s => (
                      <tr key={s.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">{s.directeurName}</td>
                        <td className="px-6 py-4">{s.centre}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {s.jours.map(j => j.substring(0, 3)).join(', ')}
                        </td>
                        <td className="px-6 py-4">{s.heuresMin}h</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSchedule(s.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {schedules.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">Aucun schedule créé</div>
              )}
            </div>
          </div>
        )}

        {/* Rapport Tab */}
        {activeTab === 'rapport' && rapport && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">
                Rapport du {rapport.weekStart} au {rapport.weekEnd}
              </h2>

              {rapport.defaillances.length === 0 ? (
                <div className="bg-green-900/30 border border-green-500 rounded p-4 text-green-200">
                  ✅ Tous les directeurs ont respecté leurs obligations cette semaine!
                </div>
              ) : (
                <>
                  <div className="bg-red-900/30 border border-red-500 rounded p-4 mb-4 text-red-200">
                    ⚠️ {rapport.defaillances.length} manquement(s) détecté(s)
                  </div>

                  <div className="space-y-3">
                    {rapport.defaillances.map((d, idx) => (
                      <div key={idx} className="bg-red-900/20 border border-red-700 rounded p-3">
                        <div className="font-semibold text-red-200">{d.directeur}</div>
                        <div className="text-sm text-gray-300 mt-1">
                          📍 {d.centre} | 📅 {d.jour} ({d.dateKey})
                        </div>
                        <div className="text-sm text-gray-300">
                          ⏱️ Requis: {d.heuresRequises}h | Présent: {d.heuresPresentees}h
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 px-6 py-2 rounded-lg transition flex items-center gap-2 w-full justify-center"
                  >
                    <Send className="w-4 h-4" />
                    {sendingEmail ? 'Envoi...' : 'Envoyer l\'email maintenant'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisionScheduleAdmin;
