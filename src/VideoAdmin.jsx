import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  Play,
  Film
} from 'lucide-react';

const VideoAdmin = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'announcement',
    duration: 30,
    enabled: true,
    order: 0
  });

  const videoTypes = [
    { value: 'announcement', label: '📢 Annonce' },
    { value: 'advertisement', label: '📺 Publicité' }
  ];

  // Load videos
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'videos'));
      const querySnapshot = await getDocs(q);
      const videosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (a.order || 0) - (b.order || 0));

      setVideos(videosData);
    } catch (error) {
      console.error('Erreur chargement vidéos:', error);
      alert('Erreur chargement vidéos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingVideo(null);
    setFormData({
      title: '',
      description: '',
      url: '',
      type: 'announcement',
      duration: 30,
      enabled: true,
      order: videos.length
    });
    setShowAddModal(true);
  };

  const handleEditClick = (video) => {
    setEditingVideo(video.id);
    setFormData({
      title: video.title,
      description: video.description || '',
      url: video.url,
      type: video.type || 'announcement',
      duration: video.duration || 30,
      enabled: video.enabled !== false,
      order: video.order || 0
    });
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      alert('Le titre est requis');
      return;
    }
    if (!formData.url.trim()) {
      alert('L\'URL est requise');
      return;
    }
    if (formData.duration < 5 || formData.duration > 300) {
      alert('Durée entre 5 et 300 secondes');
      return;
    }

    setLoading(true);
    try {
      if (editingVideo) {
        // Update
        const videoRef = doc(db, 'videos', editingVideo);
        await updateDoc(videoRef, {
          ...formData,
          updatedAt: Timestamp.now()
        });
        alert('Vidéo mise à jour ✅');
      } else {
        // Create
        const videoId = `video_${Date.now()}`;
        await setDoc(doc(db, 'videos', videoId), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        alert('Vidéo ajoutée ✅');
      }

      setShowAddModal(false);
      await loadVideos();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Supprimer cette vidéo ?')) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      alert('Vidéo supprimée ✅');
      await loadVideos();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (videoId, currentEnabled) => {
    try {
      await updateDoc(doc(db, 'videos', videoId), {
        enabled: !currentEnabled,
        updatedAt: Timestamp.now()
      });
      await loadVideos();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">📺 Gestion des Vidéos</h1>
            </div>
            <button
              onClick={handleAddClick}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all"
            >
              <Plus className="w-5 h-5" />
              Ajouter vidéo
            </button>
          </div>
          <p className="text-gray-600 mt-2">Gérez les vidéos d'annonce et de publicité pour PublicToday</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-600 text-sm">Total vidéos</div>
            <div className="text-3xl font-bold text-blue-600">{videos.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-600 text-sm">Activées</div>
            <div className="text-3xl font-bold text-green-600">
              {videos.filter(v => v.enabled !== false).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-600 text-sm">Durée totale</div>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(videos.reduce((sum, v) => sum + (v.duration || 0), 0) / 60)}m
            </div>
          </div>
        </div>

        {/* Videos Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {videos.length === 0 ? (
            <div className="p-8 text-center">
              <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-4">Aucune vidéo trouvée</p>
              <button
                onClick={handleAddClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Créer la première vidéo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Titre</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Durée</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Ordre</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">État</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video, idx) => (
                    <tr key={video.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{video.title}</div>
                          <div className="text-sm text-gray-500">{video.description || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          video.type === 'announcement'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {video.type === 'announcement' ? '📢 Annonce' : '📺 Publicité'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900 font-semibold">
                        {video.duration}s
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {video.order || 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleEnabled(video.id, video.enabled !== false)}
                          className={`inline-flex items-center justify-center p-2 rounded-lg transition-all ${
                            video.enabled !== false
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={video.enabled !== false ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                        >
                          {video.enabled !== false ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewVideo(video)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-lg transition-all"
                            title="Aperçu"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(video)}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-600 p-2 rounded-lg transition-all"
                            title="Éditer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingVideo ? '✏️ Éditer vidéo' : '➕ Nouvelle vidéo'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Bienvenue sur Intellection"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Description courte de la vidéo"
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    URL de la vidéo *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/video.mp4"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* URL Formats Help */}
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                    <strong>📌 Formats supportés :</strong>
                    <ul className="mt-2 space-y-1">
                      <li>✅ <strong>MP4 direct</strong> : <code className="bg-white px-1 rounded">https://example.com/video.mp4</code></li>
                      <li>✅ <strong>YouTube</strong> : <code className="bg-white px-1 rounded">https://www.youtube.com/embed/VIDEO_ID</code></li>
                      <li className="text-blue-700">💡 Pour YouTube : ouvrez la vidéo, cliquez "Partager" → "Intégrer", copiez l'URL du src</li>
                      <li>✅ <strong>Vimeo</strong> : <code className="bg-white px-1 rounded">https://player.vimeo.com/video/VIDEO_ID</code></li>
                      <li>✅ <strong>Firebase Storage</strong> : <code className="bg-white px-1 rounded">https://firebasestorage.googleapis.com/...</code></li>
                    </ul>
                  </div>
                </div>

                {/* Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {videoTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Durée (secondes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="5"
                      max="300"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Enabled */}
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    name="enabled"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2"
                  />
                  <label htmlFor="enabled" className="text-gray-700 font-semibold cursor-pointer">
                    ✅ Activer cette vidéo
                  </label>
                </div>

                {/* Preview Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    <strong>Aperçu :</strong><br />
                    {formData.title || '(titre)'} • {formData.duration}s • {formData.type === 'announcement' ? '📢' : '📺'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewVideo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden">
              <div className="bg-black relative">
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black rounded-full p-2 z-10"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  {previewVideo.url.includes('youtube.com') || previewVideo.url.includes('youtu.be') ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={previewVideo.url}
                      frameBorder="0"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={previewVideo.url}
                      controls
                      style={{ width: '100%', height: '100%' }}
                      onError={() => alert('Erreur chargement vidéo')}
                    />
                  )}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{previewVideo.title}</h3>
                <p className="text-gray-600 mb-4">{previewVideo.description || 'Pas de description'}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-semibold text-gray-900">
                      {previewVideo.type === 'announcement' ? '📢 Annonce' : '📺 Publicité'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Durée</div>
                    <div className="font-semibold text-gray-900">{previewVideo.duration}s</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">État</div>
                    <div className="font-semibold text-gray-900">
                      {previewVideo.enabled !== false ? '✅ Actif' : '❌ Inactif'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAdmin;
