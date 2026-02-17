import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Building2, Clock, MapPin, AlertCircle, Power, Calendar, Moon } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import PeriodEditor from './PeriodEditor_ADMIN';

const BranchManager = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('branches');
  const [branches, setBranches] = useState([]);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Formulaire de nouvelle filiale ou édition
  const [formData, setFormData] = useState({
    name: '',
    rooms: 4,
    active: true,
    schedule: {
      monday: { open: true, start: '16:00', end: '22:00' },
      tuesday: { open: true, start: '16:00', end: '22:00' },
      wednesday: { open: true, start: '16:00', end: '22:00' },
      thursday: { open: true, start: '16:00', end: '22:00' },
      friday: { open: true, start: '16:00', end: '22:00' },
      saturday: { open: true, start: '14:00', end: '22:00' },
      sunday: { open: true, start: '09:00', end: '22:00' }
    },
    color: 'blue',
    exceptionalPeriods: []
  });

  // Formulaire de période exceptionnelle
  const [periodFormData, setPeriodFormData] = useState({
    name: '',
    type: 'ramadan',
    startDate: '',
    endDate: '',
    schedule: {
      monday: { open: true, start: '09:00', end: '14:00' },
      tuesday: { open: true, start: '09:00', end: '14:00' },
      wednesday: { open: true, start: '09:00', end: '14:00' },
      thursday: { open: true, start: '09:00', end: '14:00' },
      friday: { open: true, start: '09:00', end: '14:00' },
      saturday: { open: true, start: '09:00', end: '14:00' },
      sunday: { open: true, start: '09:00', end: '14:00' }
    }
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  const colorOptions = [
    { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { value: 'green', label: 'Vert', class: 'bg-green-500' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
    { value: 'red', label: 'Rouge', class: 'bg-red-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'teal', label: 'Turquoise', class: 'bg-teal-500' }
  ];

  const periodTypes = [
    { value: 'ramadan', label: 'Ramadan', icon: Moon, color: 'purple' },
    { value: 'vacances', label: 'Vacances', icon: Calendar, color: 'blue' },
    { value: 'examens', label: 'Examens', icon: AlertCircle, color: 'orange' },
    { value: 'autre', label: 'Autre', icon: Calendar, color: 'gray' }
  ];

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const docRef = doc(db, 'settings', 'branches');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const migratedBranches = (data.branches || []).map(branch => ({
          ...branch,
          active: branch.active !== undefined ? branch.active : true,
          exceptionalPeriods: branch.exceptionalPeriods || []
        }));
        setBranches(migratedBranches);
      } else {
        const defaultBranches = [
          {
            name: 'Hay Salam',
            rooms: 8,
            color: 'blue',
            active: true,
            exceptionalPeriods: [],
            schedule: {
              monday: { open: true, start: '16:00', end: '22:00' },
              tuesday: { open: true, start: '16:00', end: '22:00' },
              wednesday: { open: true, start: '16:00', end: '22:00' },
              thursday: { open: true, start: '16:00', end: '22:00' },
              friday: { open: true, start: '16:00', end: '22:00' },
              saturday: { open: true, start: '14:00', end: '22:00' },
              sunday: { open: true, start: '09:00', end: '22:00' }
            }
          },
          {
            name: 'Doukkali',
            rooms: 4,
            color: 'green',
            active: true,
            exceptionalPeriods: [],
            schedule: {
              monday: { open: true, start: '16:00', end: '22:00' },
              tuesday: { open: true, start: '16:00', end: '22:00' },
              wednesday: { open: true, start: '16:00', end: '22:00' },
              thursday: { open: true, start: '16:00', end: '22:00' },
              friday: { open: true, start: '16:00', end: '22:00' },
              saturday: { open: true, start: '14:00', end: '22:00' },
              sunday: { open: true, start: '09:00', end: '22:00' }
            }
          },
          {
            name: 'Saada',
            rooms: 4,
            color: 'purple',
            active: true,
            exceptionalPeriods: [],
            schedule: {
              monday: { open: true, start: '16:00', end: '22:00' },
              tuesday: { open: true, start: '16:00', end: '22:00' },
              wednesday: { open: true, start: '16:00', end: '22:00' },
              thursday: { open: true, start: '16:00', end: '22:00' },
              friday: { open: true, start: '16:00', end: '22:00' },
              saturday: { open: true, start: '14:00', end: '22:00' },
              sunday: { open: true, start: '09:00', end: '22:00' }
            }
          }
        ];
        setBranches(defaultBranches);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
  };

  const saveBranches = async (newBranches) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'branches'), {
        branches: newBranches || branches,
        lastUpdated: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleBranchActive = async (branchName) => {
    const newBranches = branches.map(b => 
      b.name === branchName ? { ...b, active: !b.active } : b
    );
    setBranches(newBranches);
    const saved = await saveBranches(newBranches);
    if (saved) {
      const branch = newBranches.find(b => b.name === branchName);
      alert(branch.active ? 
        `✅ Filiale "${branchName}" activée` : 
        `⚠️ Filiale "${branchName}" désactivée (invisible dans les plannings)`
      );
    }
  };

  const addBranch = async () => {
    if (!formData.name.trim()) {
      alert('⚠️ Le nom de la filiale est requis');
      return;
    }

    if (branches.some(b => b.name === formData.name.trim())) {
      alert('⚠️ Cette filiale existe déjà');
      return;
    }

    const newBranches = [...branches, { 
      ...formData, 
      name: formData.name.trim(),
      active: true,
      exceptionalPeriods: []
    }];
    setBranches(newBranches);
    
    const saved = await saveBranches(newBranches);
    if (saved) {
      alert('✅ Filiale ajoutée avec succès !');
      resetForm();
      setShowAddForm(false);
    }
  };

  const updateBranch = async () => {
    if (!formData.name.trim()) {
      alert('⚠️ Le nom de la filiale est requis');
      return;
    }

    const newBranches = branches.map(b => 
      b.name === editingBranch ? { ...formData, name: formData.name.trim() } : b
    );
    setBranches(newBranches);
    
    const saved = await saveBranches(newBranches);
    if (saved) {
      alert('✅ Filiale modifiée avec succès !');
      resetForm();
      setEditingBranch(null);
    }
  };

  const deleteBranch = async (branchName) => {
    if (confirm(`Supprimer "${branchName}" ?\n\nATTENTION : Les séances existantes pour cette filiale ne seront pas supprimées mais ne seront plus accessibles depuis l'interface.`)) {
      const newBranches = branches.filter(b => b.name !== branchName);
      setBranches(newBranches);
      
      const saved = await saveBranches(newBranches);
      if (saved) {
        alert('✅ Filiale supprimée avec succès !');
      }
    }
  };

  const startEdit = (branch) => {
    setFormData(branch);
    setEditingBranch(branch.name);
    setShowAddForm(false);
    setShowPeriodForm(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rooms: 4,
      active: true,
      schedule: {
        monday: { open: true, start: '16:00', end: '22:00' },
        tuesday: { open: true, start: '16:00', end: '22:00' },
        wednesday: { open: true, start: '16:00', end: '22:00' },
        thursday: { open: true, start: '16:00', end: '22:00' },
        friday: { open: true, start: '16:00', end: '22:00' },
        saturday: { open: true, start: '14:00', end: '22:00' },
        sunday: { open: true, start: '09:00', end: '22:00' }
      },
      color: 'blue',
      exceptionalPeriods: []
    });
  };

  const updateSchedule = (day, field, value) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [day]: {
          ...formData.schedule[day],
          [field]: value
        }
      }
    });
  };

  const updatePeriodSchedule = (day, field, value) => {
    setPeriodFormData({
      ...periodFormData,
      schedule: {
        ...periodFormData.schedule,
        [day]: {
          ...periodFormData.schedule[day],
          [field]: value
        }
      }
    });
  };

  const addExceptionalPeriod = async (branchName) => {
    if (!periodFormData.name.trim()) {
      alert('⚠️ Le nom de la période est requis');
      return;
    }
    if (!periodFormData.startDate || !periodFormData.endDate) {
      alert('⚠️ Les dates de début et fin sont requises');
      return;
    }
    if (new Date(periodFormData.startDate) > new Date(periodFormData.endDate)) {
      alert('⚠️ La date de début doit être avant la date de fin');
      return;
    }

    const newPeriod = {
      id: Date.now().toString(),
      ...periodFormData
    };

    const newBranches = branches.map(b => {
      if (b.name === branchName) {
        return {
          ...b,
          exceptionalPeriods: [...(b.exceptionalPeriods || []), newPeriod]
        };
      }
      return b;
    });

    setBranches(newBranches);
    const saved = await saveBranches(newBranches);
    
    if (saved) {
      alert(`✅ Période "${periodFormData.name}" ajoutée avec succès !\n\n💡 Vous pouvez maintenant saisir les emplois du temps pour cette période dans le planning principal en activant le mode "${periodFormData.name}".`);
      resetPeriodForm();
      setShowPeriodForm(null);
    }
  };

  const deleteExceptionalPeriod = async (branchName, periodId) => {
    if (confirm('Supprimer cette période exceptionnelle ?\n\nATTENTION : Les sessions saisies pour cette période resteront dans la base de données mais ne seront plus actives.')) {
      const newBranches = branches.map(b => {
        if (b.name === branchName) {
          return {
            ...b,
            exceptionalPeriods: b.exceptionalPeriods.filter(p => p.id !== periodId)
          };
        }
        return b;
      });

      setBranches(newBranches);
      const saved = await saveBranches(newBranches);
      
      if (saved) {
        alert('✅ Période supprimée avec succès !');
      }
    }
  };

  const resetPeriodForm = () => {
    setPeriodFormData({
      name: '',
      type: 'ramadan',
      startDate: '',
      endDate: '',
      schedule: {
        monday: { open: true, start: '09:00', end: '14:00' },
        tuesday: { open: true, start: '09:00', end: '14:00' },
        wednesday: { open: true, start: '09:00', end: '14:00' },
        thursday: { open: true, start: '09:00', end: '14:00' },
        friday: { open: true, start: '09:00', end: '14:00' },
        saturday: { open: true, start: '09:00', end: '14:00' },
        sunday: { open: true, start: '09:00', end: '14:00' }
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isCurrentPeriod = (period) => {
    const now = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return now >= start && now <= end;
  };

  const isFuturePeriod = (period) => {
    const now = new Date();
    const start = new Date(period.startDate);
    return now < start;
  };

  const getPeriodTypeInfo = (type) => {
    return periodTypes.find(t => t.value === type) || periodTypes[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">Gestion des Filiales & Périodes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1 px-4">
            <button
              onClick={() => setActiveTab('branches')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'branches'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Filiales
            </button>
            <button
              onClick={() => setActiveTab('periods')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'periods'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Éditeur de Périodes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'branches' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Liste des filiales */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Filiales existantes</h3>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddForm(true);
                      setEditingBranch(null);
                      setShowPeriodForm(null);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle
                  </button>
                </div>

                <div className="space-y-3">
                  {branches.map((branch) => (
                    <div
                      key={branch.name}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        branch.active 
                          ? 'border-gray-200 bg-white' 
                          : 'border-gray-300 bg-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-3 h-3 rounded-full bg-${branch.color}-500 mt-1.5 flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-800">{branch.name}</h4>
                              {!branch.active && (
                                <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">
                                  Désactivée
                                </span>
                              )}
                              {branch.exceptionalPeriods?.some(p => isCurrentPeriod(p)) && (
                                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Moon className="w-3 h-3" />
                                  Période active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{branch.rooms} salles</p>
                            
                            {/* Périodes exceptionnelles */}
                            {branch.exceptionalPeriods && branch.exceptionalPeriods.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {branch.exceptionalPeriods.map(period => {
                                  const typeInfo = getPeriodTypeInfo(period.type);
                                  const IconComponent = typeInfo.icon;
                                  const isCurrent = isCurrentPeriod(period);
                                  const isFuture = isFuturePeriod(period);
                                  return (
                                    <div 
                                      key={period.id}
                                      className={`text-xs flex items-center gap-2 p-2 rounded ${
                                        isCurrent 
                                          ? 'bg-purple-50 border border-purple-200' 
                                          : isFuture
                                          ? 'bg-blue-50 border border-blue-200'
                                          : 'bg-gray-50'
                                      }`}
                                    >
                                      <IconComponent className={`w-3 h-3 text-${typeInfo.color}-600`} />
                                      <span className="font-medium">{period.name}</span>
                                      <span className="text-gray-500">
                                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                      </span>
                                      {isCurrent && (
                                        <span className="text-purple-600 font-semibold">● En cours</span>
                                      )}
                                      {isFuture && (
                                        <span className="text-blue-600 font-semibold">⏱ À venir</span>
                                      )}
                                      <button
                                        onClick={() => deleteExceptionalPeriod(branch.name, period.id)}
                                        className="ml-auto text-red-600 hover:bg-red-50 p-1 rounded"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleBranchActive(branch.name)}
                            className={`p-2 rounded transition-all ${
                              branch.active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-200'
                            }`}
                            title={branch.active ? 'Désactiver' : 'Activer'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setShowPeriodForm(branch.name);
                              resetPeriodForm();
                              setShowAddForm(false);
                              setEditingBranch(null);
                            }}
                            className="text-purple-600 hover:bg-purple-50 p-2 rounded transition-all"
                            title="Ajouter période exceptionnelle"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEdit(branch)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-all"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBranch(branch.name)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {branches.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune filiale configurée</p>
                      <p className="text-sm">Cliquez sur "Nouvelle" pour ajouter</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Formulaires */}
              <div>
                {/* Formulaire d'ajout/édition de filiale */}
                {(showAddForm || editingBranch) && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {editingBranch ? 'Modifier la filiale' : 'Nouvelle filiale'}
                    </h3>

                    {/* Nom */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la filiale *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Hay Salam"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Nombre de salles */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de salles
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.rooms}
                        onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) || 1 })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Couleur */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur d'identification
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorOptions.map(color => (
                          <button
                            key={color.value}
                            onClick={() => setFormData({ ...formData, color: color.value })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              formData.color === color.value 
                                ? 'border-gray-800 ring-2 ring-gray-300' 
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <div className={`w-full h-6 rounded ${color.class}`}></div>
                            <div className="text-xs text-center mt-1">{color.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Horaires normaux */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horaires d'ouverture normaux
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {daysOfWeek.map(day => (
                          <div key={day.key} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={formData.schedule[day.key].open}
                                onChange={(e) => updateSchedule(day.key, 'open', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="font-medium text-gray-700 w-24">{day.label}</span>
                              {formData.schedule[day.key].open && (
                                <>
                                  <input
                                    type="time"
                                    value={formData.schedule[day.key].start}
                                    onChange={(e) => updateSchedule(day.key, 'start', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                  <span className="text-gray-500">à</span>
                                  <input
                                    type="time"
                                    value={formData.schedule[day.key].end}
                                    onChange={(e) => updateSchedule(day.key, 'end', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </>
                              )}
                              {!formData.schedule[day.key].open && (
                                <span className="text-gray-400 text-sm">Fermé</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3">
                      <button
                        onClick={editingBranch ? updateBranch : addBranch}
                        disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Sauvegarde...' : (editingBranch ? 'Mettre à jour' : 'Ajouter')}
                      </button>
                      <button
                        onClick={() => {
                          resetForm();
                          setEditingBranch(null);
                          setShowAddForm(false);
                        }}
                        disabled={saving}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulaire de période exceptionnelle */}
                {showPeriodForm && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Période exceptionnelle - {showPeriodForm}
                    </h3>
                    <p className="text-sm text-purple-700 mb-4">
                      💡 Après avoir créé cette période, vous pourrez saisir les emplois du temps spécifiques dans le planning principal.
                    </p>

                    {/* Type de période */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de période
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {periodTypes.map(type => {
                          const IconComponent = type.icon;
                          return (
                            <button
                              key={type.value}
                              onClick={() => setPeriodFormData({ ...periodFormData, type: type.value })}
                              className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                                periodFormData.type === type.value 
                                  ? 'border-purple-600 bg-purple-100' 
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <IconComponent className={`w-4 h-4 text-${type.color}-600`} />
                              <span className="text-sm font-medium">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nom de la période */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la période *
                      </label>
                      <input
                        type="text"
                        value={periodFormData.name}
                        onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })}
                        placeholder="Ex: Ramadan 2025"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de début *
                        </label>
                        <input
                          type="date"
                          value={periodFormData.startDate}
                          onChange={(e) => setPeriodFormData({ ...periodFormData, startDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de fin *
                        </label>
                        <input
                          type="date"
                          value={periodFormData.endDate}
                          onChange={(e) => setPeriodFormData({ ...periodFormData, endDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Note importante */}
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note :</strong> Les horaires ci-dessous sont indicatifs. Vous pourrez saisir les sessions récurrentes avec leurs horaires exacts dans le planning principal une fois la période créée.
                      </p>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => addExceptionalPeriod(showPeriodForm)}
                        disabled={saving}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Sauvegarde...' : 'Créer la période'}
                      </button>
                      <button
                        onClick={() => {
                          resetPeriodForm();
                          setShowPeriodForm(null);
                        }}
                        disabled={saving}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {!showAddForm && !editingBranch && !showPeriodForm && (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Sélectionnez une action</p>
                    <div className="text-sm space-y-1">
                      <p>• 📝 Modifier une filiale</p>
                      <p>• 📅 Ajouter une période (Ramadan, vacances...)</p>
                      <p>• ➕ Créer une nouvelle filiale</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'periods' && (
            <PeriodEditor />
          )}

          {activeTab === 'branches' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
                <Moon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-800">
                  <p className="font-semibold mb-1">Périodes exceptionnelles (Ramadan) :</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Créez la période ici (ex: Ramadan 2025)</li>
                    <li>Allez dans le planning principal</li>
                    <li>Activez le mode "Ramadan 2025"</li>
                    <li>Saisissez vos sessions récurrentes Ramadan</li>
                    <li>Elles s'activeront automatiquement aux dates définies</li>
                  </ol>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Power className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Activation/Désactivation :</p>
                  <p>Une filiale désactivée reste dans le système mais n'apparaît plus dans les plannings. Utile pour éviter les conflits temporaires sans perdre les données.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {branches.length} filiale{branches.length > 1 ? 's' : ''} • 
            {branches.filter(b => b.active).length} active{branches.filter(b => b.active).length > 1 ? 's' : ''} • 
            {branches.reduce((sum, b) => sum + (b.exceptionalPeriods?.length || 0), 0)} période{branches.reduce((sum, b) => sum + (b.exceptionalPeriods?.length || 0), 0) > 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchManager;