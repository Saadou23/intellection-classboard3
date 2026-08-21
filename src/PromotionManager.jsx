import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, Eye, EyeOff, Settings } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import SeedPromotions from './SeedPromotions';

const PromotionManager = ({ onClose }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    type: 'app', // app, branding, concours, languages, custom
    frequency: 'always', // always, daily, weekly, custom
    displayDuration: 15, // en secondes
    enabled: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    maxShowsPerDay: null,
    targetAudience: 'all' // all, students, admins
  });

  const promotionTypes = [
    { value: 'app', label: '📱 Promotion App Mobile' },
    { value: 'branding', label: '🏆 Branding INTELLECTION' },
    { value: 'concours', label: '🎓 Préparation Concours' },
    { value: 'languages', label: '🌍 Cours de Langues' },
    { value: 'custom', label: '📢 Promotion Personnalisée' }
  ];

  const frequencyOptions = [
    { value: 'always', label: 'Toujours (à chaque visite)' },
    { value: 'daily', label: 'Une fois par jour' },
    { value: 'weekly', label: 'Une fois par semaine' },
    { value: 'custom', label: 'Personnalisée (X fois par jour)' }
  ];

  const targetOptions = [
    { value: 'all', label: 'Tous les utilisateurs' },
    { value: 'students', label: 'Étudiants uniquement' },
    { value: 'admins', label: 'Administrateurs uniquement' }
  ];

  // Charger les promotions
  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'promotions'));
      const promotionsData = [];
      querySnapshot.forEach(doc => {
        promotionsData.push({ id: doc.id, ...doc.data() });
      });
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Erreur chargement promotions:', error);
      alert('❌ Erreur lors du chargement des promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Créer un URL de prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload image:', error);
      alert('❌ Erreur lors de l\'upload de l\'image');
    }
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.imageUrl) {
      alert('⚠️ Veuillez remplir le titre et télécharger une image');
      return;
    }

    try {
      const promotionData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (editingPromotion) {
        // Mettre à jour
        await updateDoc(doc(db, 'promotions', editingPromotion.id), promotionData);
        alert('✅ Promotion mise à jour');
      } else {
        // Ajouter
        await addDoc(collection(db, 'promotions'), {
          ...promotionData,
          createdAt: new Date().toISOString(),
          showCount: 0,
          lastShown: null
        });
        alert('✅ Promotion ajoutée');
      }

      // Réinitialiser le formulaire et recharger
      setShowForm(false);
      setEditingPromotion(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        type: 'app',
        frequency: 'always',
        displayDuration: 15,
        enabled: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        maxShowsPerDay: null,
        targetAudience: 'all'
      });
      setImagePreview(null);
      loadPromotions();
    } catch (error) {
      console.error('Erreur sauvegarde promotion:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      imageUrl: promotion.imageUrl,
      type: promotion.type,
      frequency: promotion.frequency,
      displayDuration: promotion.displayDuration,
      enabled: promotion.enabled,
      startDate: promotion.startDate,
      endDate: promotion.endDate || '',
      maxShowsPerDay: promotion.maxShowsPerDay,
      targetAudience: promotion.targetAudience
    });
    setImagePreview(promotion.imageUrl);
    setShowForm(true);
  };

  const handleDeletePromotion = async (id) => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer cette promotion?')) return;

    try {
      await deleteDoc(doc(db, 'promotions', id));
      alert('✅ Promotion supprimée');
      loadPromotions();
    } catch (error) {
      console.error('Erreur suppression promotion:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleToggleEnabled = async (promotion) => {
    try {
      await updateDoc(doc(db, 'promotions', promotion.id), {
        enabled: !promotion.enabled
      });
      loadPromotions();
    } catch (error) {
      console.error('Erreur toggle:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin text-blue-600">⏳</div>
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Promotions</h2>
        </div>
        <button
          onClick={() => {
            setShowForm(false);
            setEditingPromotion(null);
            onClose?.();
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Seed Promotions - Afficher seulement si aucune promotion */}
      {promotions.length === 0 && (
        <SeedPromotions />
      )}

      {/* Bouton Ajouter */}
      {!showForm && (
        <button
          onClick={() => {
            setEditingPromotion(null);
            setFormData({
              title: '',
              description: '',
              imageUrl: '',
              type: 'app',
              frequency: 'always',
              displayDuration: 15,
              enabled: true,
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              maxShowsPerDay: null,
              targetAudience: 'all'
            });
            setImagePreview(null);
            setShowForm(true);
          }}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter une promotion
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="bg-blue-50 p-6 rounded-xl mb-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold mb-4 text-gray-800">
            {editingPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
          </h3>

          <form onSubmit={handleSavePromotion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Promotion App Mobile"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de promotion</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {promotionTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description de la promotion"
                  rows="3"
                />
              </div>

              {/* Upload Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>
                  {imagePreview && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-blue-300">
                      <img src={imagePreview} alt="Prévisualisation" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Fréquence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence d'apparition</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {frequencyOptions.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Durée d'affichage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée d'affichage (secondes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={formData.displayDuration}
                  onChange={(e) => setFormData({ ...formData, displayDuration: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Max shows per day */}
              {formData.frequency === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre max par jour</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxShowsPerDay || ''}
                    onChange={(e) => setFormData({ ...formData, maxShowsPerDay: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 3"
                  />
                </div>
              )}

              {/* Audience cible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audience cible</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {targetOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (optionnel)</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Save className="w-5 h-5" />
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPromotion(null);
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des promotions */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          Promotions actives ({promotions.filter(p => p.enabled).length}/{promotions.length})
        </h3>

        {promotions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune promotion pour le moment. Créez-en une!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {promotions.map(promo => (
              <div
                key={promo.id}
                className={`border-2 rounded-lg p-4 flex gap-4 ${
                  promo.enabled ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                {/* Image */}
                {promo.imageUrl && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Infos */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800">{promo.title}</h4>
                      <p className="text-sm text-gray-600">{promo.description}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
                      {promotionTypes.find(t => t.value === promo.type)?.label.split(' ')[0]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Fréquence:</span> {frequencyOptions.find(f => f.value === promo.frequency)?.label.split(' ')[0]}
                    </div>
                    <div>
                      <span className="font-medium">Durée:</span> {promo.displayDuration}s
                    </div>
                    <div>
                      <span className="font-medium">Affichages:</span> {promo.showCount || 0}
                    </div>
                    <div>
                      <span className="font-medium">Début:</span> {promo.startDate}
                    </div>
                    {promo.endDate && (
                      <div>
                        <span className="font-medium">Fin:</span> {promo.endDate}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleEnabled(promo)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 transition ${
                        promo.enabled
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-400 hover:bg-gray-500 text-white'
                      }`}
                    >
                      {promo.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {promo.enabled ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => handleEditPromotion(promo)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeletePromotion(promo.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionManager;
