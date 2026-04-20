import React, { useState, useEffect } from 'react';
import { MessageCircle, Settings, Upload, Send, Trash2, Plus, Eye, EyeOff, AlertCircle, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';
import WhatsAppAutomationService from './WhatsAppAutomationService';

const WhatsAppAutomationAdmin = ({ sessions, branches, branchesData, onClose }) => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [backendStatus, setBackendStatus] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingJobId, setTestingJobId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [initializingGroups, setInitializingGroups] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Form pour nouveau job
  const [newJob, setNewJob] = useState({
    name: '',
    pdfFile: null,
    selectedGroups: [],
    caption: '',
    days: [],
    time: '08:00',
    enabled: true
  });

  // Form pour édition
  const [editingJob, setEditingJob] = useState({
    name: '',
    pdfFile: null,
    selectedGroups: [],
    caption: '',
    days: [],
    time: '08:00',
    enabled: true
  });

  const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, logsData, statusData, groupsData] = await Promise.all([
        WhatsAppAutomationService.getAllJobs(),
        WhatsAppAutomationService.getLogs(),
        WhatsAppAutomationService.getBackendStatus(),
        WhatsAppAutomationService.getWhatsAppGroups()
      ]);

      setJobs(jobsData);
      setLogs(logsData);
      setBackendStatus(statusData);
      setAvailableGroups(groupsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============= GESTION JOBS =============

  const handleCreateJob = async (e) => {
    e.preventDefault();

    if (!newJob.name || !newJob.pdfFile || newJob.selectedGroups.length === 0 || newJob.days.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);

      // Upload le PDF
      const { url, name } = await WhatsAppAutomationService.uploadPDF(newJob.pdfFile);

      // Récupérer les infos des groupes sélectionnés
      const selectedGroupObjs = availableGroups.filter(g => newJob.selectedGroups.includes(g.id));
      const groupInfo = WhatsAppAutomationService.extractGroupInfo(selectedGroupObjs);

      // Créer le job
      await WhatsAppAutomationService.createJob({
        name: newJob.name,
        pdfUrl: url,
        pdfName: name,
        groupIds: groupInfo.ids,
        groupNames: groupInfo.names,
        caption: newJob.caption,
        days: newJob.days,
        time: newJob.time,
        enabled: newJob.enabled
      });

      // Réinitialiser le formulaire
      setNewJob({
        name: '',
        pdfFile: null,
        selectedGroups: [],
        caption: '',
        days: [],
        time: '08:00',
        enabled: true
      });

      await loadData();
      alert('✅ Job créé avec succès!');
      setActiveTab('jobs');
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJob = async (jobId, enabled) => {
    try {
      setLoading(true);
      await WhatsAppAutomationService.updateJob(jobId, { enabled: !enabled });
      await loadData();
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Supprimer ce job?')) return;

    try {
      setLoading(true);
      await WhatsAppAutomationService.deleteJob(jobId);
      await loadData();
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSend = async (job) => {
    setTestingJobId(job.id);
    try {
      const result = await WhatsAppAutomationService.sendNow(
        job.pdfUrl,
        job.groupIds,
        `📋 ${job.name}\n${job.caption || ''}`
      );

      if (result.success) {
        alert('✅ Envoi de test réussi!');
        await loadData();
      } else {
        alert('❌ Erreur lors de l\'envoi: ' + result.error);
      }
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setTestingJobId(null);
    }
  };

  const handleStartEdit = (job) => {
    setEditingJobId(job.id);
    setEditingJob({
      name: job.name,
      pdfFile: null,
      selectedGroups: job.groupIds || [],
      caption: job.caption || '',
      days: job.days || [],
      time: job.time || '08:00',
      enabled: job.enabled
    });
    setActiveTab('edit');
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditingJob({
      name: '',
      pdfFile: null,
      selectedGroups: [],
      caption: '',
      days: [],
      time: '08:00',
      enabled: true
    });
  };

  const handleSaveEditJob = async (e) => {
    e.preventDefault();

    if (!editingJob.name || editingJob.selectedGroups.length === 0 || editingJob.days.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);

      let pdfUrl = jobs.find(j => j.id === editingJobId)?.pdfUrl;
      let pdfName = jobs.find(j => j.id === editingJobId)?.pdfName;

      // Si un nouveau PDF est uploádé
      if (editingJob.pdfFile) {
        const { url, name } = await WhatsAppAutomationService.uploadPDF(editingJob.pdfFile);
        pdfUrl = url;
        pdfName = name;
      }

      // Récupérer les infos des groupes sélectionnés
      const selectedGroupObjs = availableGroups.filter(g => editingJob.selectedGroups.includes(g.id));
      const groupInfo = WhatsAppAutomationService.extractGroupInfo(selectedGroupObjs);

      // Mettre à jour le job
      await WhatsAppAutomationService.updateJob(editingJobId, {
        name: editingJob.name,
        pdfUrl: pdfUrl,
        pdfName: pdfName,
        groupIds: groupInfo.ids,
        groupNames: groupInfo.names,
        caption: editingJob.caption,
        days: editingJob.days,
        time: editingJob.time,
        enabled: editingJob.enabled
      });

      handleCancelEdit();
      await loadData();
      alert('✅ Job mis à jour avec succès!');
      setActiveTab('jobs');
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEditDay = (day) => {
    setEditingJob(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const toggleEditGroup = (groupId) => {
    setEditingJob(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(g => g !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  // ============= UTILITAIRES =============

  const toggleDay = (day) => {
    setNewJob(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const toggleGroup = (groupId) => {
    setNewJob(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(g => g !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  const refreshGroups = async () => {
    try {
      setLoading(true);
      const groupsData = await WhatsAppAutomationService.getWhatsAppGroups();
      setAvailableGroups(groupsData);
      if (groupsData.length > 0) {
        alert(`✅ ${groupsData.length} groupes trouvés`);
      } else {
        alert('⚠️  Aucun groupe trouvé. Essayez "Charger les groupes".');
      }
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeGroups = async () => {
    try {
      setInitializingGroups(true);
      const result = await WhatsAppAutomationService.initializeGroups();

      if (result.success) {
        setAvailableGroups(result.groups);
        alert(`✅ ${result.groups.length} groupes trouvés et sauvegardés!`);
      } else {
        alert(`❌ ${result.error}\n\nAssurez-vous que:\n1. Le bot est lancé (npm start)\n2. Vous êtes connecté à WhatsApp`);
      }
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setInitializingGroups(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">WhatsApp Automation</h2>
                <p className="text-green-200 text-sm mt-1">Automatisez l'envoi des emplois du temps</p>
              </div>
            </div>
            <button onClick={onClose} className="bg-green-800 hover:bg-green-600 p-2 rounded-lg transition-all">
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-0 bg-gray-50">
          {[
            { id: 'jobs', label: '📋 Emplois', icon: '📋' },
            { id: 'create', label: '➕ Nouveau Job', icon: '➕' },
            ...(editingJobId ? [{ id: 'edit', label: '✏️ Modifier Job', icon: '✏️' }] : []),
            { id: 'logs', label: '📊 Logs', icon: '📊' },
            { id: 'status', label: '⚙️ Statut', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Chargement...</span>
            </div>
          )}

          {/* TAB: JOBS */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Emplois du temps configurés ({jobs.length})</h3>
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  Aucun job configuré. Créez-en un dans l'onglet "Nouveau Job".
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map(job => (
                    <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{job.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {job.days?.join(', ') || 'Non configuré'} à {job.time}
                          </p>
                          <p className="text-sm text-gray-600">
                            👥 {job.groupNames?.length || 0} groupes
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {job.enabled ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              ACTIF
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                              INACTIF
                            </span>
                          )}
                        </div>
                      </div>

                      {job.groupNames && job.groupNames.length > 0 && (
                        <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>Groupes:</strong> {job.groupNames.join(', ')}
                        </div>
                      )}

                      {job.caption && (
                        <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                          <strong>Message:</strong> {job.caption}
                        </div>
                      )}

                      {job.lastRun && (
                        <p className="text-xs text-gray-500 mb-3">
                          Dernier envoi: {new Date(job.lastRun).toLocaleString('fr-FR')}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleTestSend(job)}
                          disabled={testingJobId === job.id}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {testingJobId === job.id ? 'Envoi...' : 'Test'}
                        </button>

                        <button
                          onClick={() => handleStartEdit(job)}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Modifier
                        </button>

                        <button
                          onClick={() => handleToggleJob(job.id, job.enabled)}
                          className={`px-4 py-2 text-white text-sm rounded-lg font-medium flex items-center gap-2 ${
                            job.enabled
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {job.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {job.enabled ? 'Désactiver' : 'Activer'}
                        </button>

                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CREATE JOB */}
          {activeTab === 'create' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Créer un nouvel emploi du temps
                </h3>

                <form onSubmit={handleCreateJob} className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📝 Nom de l'emploi</label>
                    <input
                      type="text"
                      placeholder="Ex: S2 Eco - Matin"
                      value={newJob.name}
                      onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Upload PDF */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📄 Fichier PDF</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewJob({ ...newJob, pdfFile: e.target.files?.[0] || null })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    {newJob.pdfFile && (
                      <p className="text-xs text-green-600 mt-1">✅ {newJob.pdfFile.name}</p>
                    )}
                  </div>

                  {/* Message optionnel */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">💬 Message WhatsApp (optionnel)</label>
                    <textarea
                      placeholder="Texte accompagnant le PDF..."
                      value={newJob.caption}
                      onChange={(e) => setNewJob({ ...newJob, caption: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows="3"
                    />
                  </div>

                  {/* Sélection groupes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-700">👥 Groupes WhatsApp</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={initializeGroups}
                          disabled={initializingGroups}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-200 flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          {initializingGroups ? 'Chargement...' : 'Charger'}
                        </button>
                        <button
                          type="button"
                          onClick={refreshGroups}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Rafraîchir
                        </button>
                      </div>
                    </div>

                    {availableGroups.length === 0 ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm space-y-2">
                        <div className="font-bold">⚠️ Aucun groupe trouvé</div>
                        <p>Pour voir vos groupes WhatsApp:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Lancez le bot: <code className="bg-yellow-100 px-1 rounded">npm start</code> dans <code className="bg-yellow-100 px-1 rounded">intellection-whatsapp-bot/</code></li>
                          <li>Scannez le code QR avec WhatsApp</li>
                          <li>Cliquez sur le bouton <strong>"Charger"</strong> ci-dessus</li>
                        </ol>
                        <button
                          type="button"
                          onClick={initializeGroups}
                          disabled={initializingGroups}
                          className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {initializingGroups ? 'Chargement...' : 'Charger les groupes maintenant'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {availableGroups.map(group => (
                          <label key={group.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newJob.selectedGroups.includes(group.id)}
                              onChange={() => toggleGroup(group.id)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-900">{group.name}</span>
                            <span className="text-xs text-gray-500">({group.participantCount} membres)</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {newJob.selectedGroups.length > 0 && (
                      <p className="text-xs text-green-600 mt-2">
                        ✅ {newJob.selectedGroups.length} groupe(s) sélectionné(s)
                      </p>
                    )}
                  </div>

                  {/* Jours */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📅 Jours d'envoi</label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            newJob.days.includes(day)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day.substring(0, 3).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Heure */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🕐 Heure d'envoi</label>
                    <input
                      type="time"
                      value={newJob.time}
                      onChange={(e) => setNewJob({ ...newJob, time: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Créer le job
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: EDIT JOB */}
          {activeTab === 'edit' && editingJobId && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Modifier l'emploi du temps
                </h3>

                <form onSubmit={handleSaveEditJob} className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📝 Nom de l'emploi</label>
                    <input
                      type="text"
                      placeholder="Ex: S2 Eco - Matin"
                      value={editingJob.name}
                      onChange={(e) => setEditingJob({ ...editingJob, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Upload PDF (optionnel) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📄 Nouveau fichier PDF (optionnel)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setEditingJob({ ...editingJob, pdfFile: e.target.files?.[0] || null })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    {editingJob.pdfFile ? (
                      <p className="text-xs text-green-600 mt-1">✅ {editingJob.pdfFile.name} sera uploadé</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Laissez vide pour garder le PDF actuel</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">💬 Message WhatsApp (optionnel)</label>
                    <textarea
                      placeholder="Texte accompagnant le PDF..."
                      value={editingJob.caption}
                      onChange={(e) => setEditingJob({ ...editingJob, caption: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows="3"
                    />
                  </div>

                  {/* Sélection groupes */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-700">👥 Groupes WhatsApp</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={initializeGroups}
                          disabled={initializingGroups}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-200 flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          {initializingGroups ? 'Chargement...' : 'Charger'}
                        </button>
                        <button
                          type="button"
                          onClick={refreshGroups}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Rafraîchir
                        </button>
                      </div>
                    </div>

                    {availableGroups.length === 0 ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm space-y-2">
                        <div className="font-bold">⚠️ Aucun groupe trouvé</div>
                        <p>Cliquez sur le bouton <strong>"Charger"</strong> pour récupérer vos groupes WhatsApp.</p>
                        <button
                          type="button"
                          onClick={initializeGroups}
                          disabled={initializingGroups}
                          className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {initializingGroups ? 'Chargement...' : 'Charger les groupes'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {availableGroups.map(group => (
                          <label key={group.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingJob.selectedGroups.includes(group.id)}
                              onChange={() => toggleEditGroup(group.id)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-900">{group.name}</span>
                            <span className="text-xs text-gray-500">({group.participantCount} membres)</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {editingJob.selectedGroups.length > 0 && (
                      <p className="text-xs text-purple-600 mt-2">
                        ✅ {editingJob.selectedGroups.length} groupe(s) sélectionné(s)
                      </p>
                    )}
                  </div>

                  {/* Jours */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📅 Jours d'envoi</label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleEditDay(day)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            editingJob.days.includes(day)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day.substring(0, 3).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Heure */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🕐 Heure d'envoi</label>
                    <input
                      type="time"
                      value={editingJob.time}
                      onChange={(e) => setEditingJob({ ...editingJob, time: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Statut */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingJob.enabled}
                        onChange={(e) => setEditingJob({ ...editingJob, enabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-bold text-gray-700">Activer ce job</span>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-bold flex items-center justify-center gap-2"
                    >
                      <Settings className="w-5 h-5" />
                      Sauvegarder les modifications
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-bold"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Historique d'envoi ({logs.length})</h3>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  Aucun log disponible
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        log.status === 'success'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{log.jobName}</p>
                        <p className="text-xs text-gray-600">
                          Groupe: {log.groupName} • {new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString('fr-FR')}
                        </p>
                        {log.error && <p className="text-xs text-red-600 mt-1">Erreur: {log.error}</p>}
                      </div>

                      {log.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-6 max-w-2xl">
              {/* Bot Status */}
              <div className={`p-4 rounded-lg border-2 ${
                backendStatus?.connected
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">🤖 Statut du Bot WhatsApp</h4>
                  <button
                    onClick={loadData}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Rafraîchir
                  </button>
                </div>

                {backendStatus?.connected ? (
                  <div className="space-y-2">
                    <p className="text-green-700 font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Connecté ✅
                    </p>
                    <p className="text-sm text-gray-700">
                      Status: <strong>{backendStatus.clientStatus}</strong>
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Le bot est prêt à envoyer des emplois du temps!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-700 font-bold flex items-center gap-2">
                      <XCircle className="w-5 h-5" /> Non connecté ❌
                    </p>
                    <p className="text-sm text-gray-700">
                      {backendStatus?.error || 'Le serveur bot n\'est pas accessible'}
                    </p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Instructions - Charger les groupes
                </h4>

                <div className="space-y-3 text-sm text-blue-900">
                  <div>
                    <p className="font-bold">1️⃣ Démarrer le bot</p>
                    <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto text-gray-700 font-mono">
cd intellection-whatsapp-bot && npm install && npm start
                    </pre>
                  </div>

                  <div>
                    <p className="font-bold">2️⃣ Scanner le code QR</p>
                    <p>Vous verrez un code QR dans le terminal. Scannez-le avec WhatsApp sur votre téléphone.</p>
                  </div>

                  <div>
                    <p className="font-bold">3️⃣ Charger les groupes</p>
                    <p>Une fois connecté, cliquez sur le bouton <strong>"Charger les groupes"</strong> dans l'onglet "Nouveau Job". Vos groupes WhatsApp apparaîtront.</p>
                    <button
                      type="button"
                      onClick={initializeGroups}
                      disabled={initializingGroups}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 w-full justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      {initializingGroups ? 'Chargement...' : 'Charger les groupes maintenant'}
                    </button>
                  </div>

                  <div>
                    <p className="font-bold">4️⃣ Créer les jobs d'envoi</p>
                    <p>Allez à l'onglet "Nouveau Job" et sélectionnez les groupes où envoyer les emplois du temps.</p>
                  </div>

                  <div>
                    <p className="font-bold">📊 Groupes chargés: <span className="text-green-700">{availableGroups.length}</span></p>
                  </div>
                </div>
              </div>

              {/* Debugging */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-3">🔧 Informations Système</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Backend URL:</strong> <code className="bg-white p-1 rounded">http://localhost:3001</code>
                  </p>
                  <p>
                    <strong>Statut:</strong> <span className={backendStatus?.connected ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {backendStatus?.connected ? '✅ Connecté' : '❌ Non connecté'}
                    </span>
                  </p>
                  <p>
                    <strong>Groupes chargés:</strong> <span className="font-bold">{availableGroups.length}</span>
                  </p>
                  <p>
                    <strong>Service:</strong> whatsapp-web.js + Node.js + Express
                  </p>
                  <p>
                    <strong>Logs du bot:</strong> Consultez le terminal où vous avez lancé `npm start`
                  </p>
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                    💡 Si aucun groupe ne s'affiche: assurez-vous que le bot est en cours d'exécution et que vous êtes connecté à WhatsApp
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAutomationAdmin;
