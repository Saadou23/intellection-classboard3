import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, QrCode, MapPin, Users, Settings, Eye, EyeOff, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import {
  createOTPUser,
  getOTPUsers,
  toggleUserActive,
  deleteOTPUser,
  generateOTPAuthURL,
  loadOTPSettings,
  saveOTPSettings,
  getCurrentPosition
} from './OTPService';

const OTPSystemAdmin = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // User management form
  const [formData, setFormData] = useState({ name: '', role: 'agent', email: '' });
  const [formError, setFormError] = useState('');

  // QR Modal
  const [showQR, setShowQR] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    'Hay Salam': { centerLat: 0, centerLng: 0, radiusMeters: 200 },
    'Doukkali': { centerLat: 0, centerLng: 0, radiusMeters: 200 },
    'Saada': { centerLat: 0, centerLng: 0, radiusMeters: 200 },
    workStartTime: '09:00'
  });
  const [selectedZone, setSelectedZone] = useState('Hay Salam');
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSettings();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getOTPUsers();
      setUsers(data);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await loadOTPSettings();
      setSettings(data);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const handleCreateUser = async e => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Le nom est requis');
      return;
    }

    setSaving(true);
    try {
      const newUser = await createOTPUser(formData);
      setUsers([...users, newUser]);
      setFormData({ name: '', role: 'agent', email: '' });
      handleShowQR(newUser);
    } catch (e) {
      setFormError('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShowQR = async user => {
    try {
      const otpauthUrl = generateOTPAuthURL(user.secretKey, user.name);
      const dataUrl = await QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2 });
      setQrDataUrl(dataUrl);
      setSelectedUser(user);
      setShowQR(true);
    } catch (e) {
      console.error('Error generating QR code:', e);
    }
  };

  const handleToggleUser = async (userId, currentState) => {
    try {
      await toggleUserActive(userId, !currentState);
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentState } : u));
    } catch (e) {
      console.error('Error toggling user:', e);
    }
  };

  const handleDeleteUser = async userId => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur?')) return;
    try {
      await deleteOTPUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await saveOTPSettings(settings);
      alert('Paramètres sauvegardés');
    } catch (e) {
      alert('Erreur: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGetCurrentPosition = async () => {
    setGeoLoading(true);
    try {
      const pos = await getCurrentPosition();
      setSettings({
        ...settings,
        [selectedZone]: {
          ...settings[selectedZone],
          centerLat: Math.round(pos.coords.latitude * 10000) / 10000,
          centerLng: Math.round(pos.coords.longitude * 10000) / 10000
        }
      });
    } catch (e) {
      alert('Erreur géolocalisation: ' + e.message);
    } finally {
      setGeoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-400" />
            <h1 className="text-3xl font-bold">Gestion OTP</h1>
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
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg transition ${
              activeTab === 'users'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Paramètres Zone
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Create Form */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                Ajouter un utilisateur
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Nom complet</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="Mohammed Alami"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Rôle</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="agent">Agent</option>
                      <option value="directeur">Directeur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Email/ID</label>
                    <input
                      type="text"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="bg-red-900/30 border border-red-500 rounded p-3 text-red-200 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 px-6 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {saving ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
              </form>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Nom</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Rôle</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">{user.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            user.role === 'directeur' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'
                          }`}>
                            {user.role === 'directeur' ? 'Directeur' : 'Agent'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{user.email || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            user.isActive ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                          <button
                            onClick={() => handleShowQR(user)}
                            className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-xs flex items-center gap-1"
                            title="Afficher QR Code"
                          >
                            <QrCode className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleToggleUser(user.id, user.isActive)}
                            className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${
                              user.isActive
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {user.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">Aucun utilisateur créé</div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-400" />
                Configuration des zones GPS
              </h2>

              {/* Zone Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Sélectionner une zone :</label>
                <div className="flex gap-2">
                  {['Hay Salam', 'Doukkali', 'Saada'].map(zone => (
                    <button
                      key={zone}
                      onClick={() => setSelectedZone(zone)}
                      className={`px-4 py-2 rounded-lg transition ${
                        selectedZone === zone
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone Settings */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="font-semibold text-white mb-4">Zone : <span className="text-teal-400">{selectedZone}</span></h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2">Latitude du centre</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={settings[selectedZone]?.centerLat || 0}
                      onChange={e => setSettings({
                        ...settings,
                        [selectedZone]: {
                          ...settings[selectedZone],
                          centerLat: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Longitude du centre</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={settings[selectedZone]?.centerLng || 0}
                      onChange={e => setSettings({
                        ...settings,
                        [selectedZone]: {
                          ...settings[selectedZone],
                          centerLng: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Rayon autorisé (mètres)</label>
                    <input
                      type="number"
                      value={settings[selectedZone]?.radiusMeters || 200}
                      onChange={e => setSettings({
                        ...settings,
                        [selectedZone]: {
                          ...settings[selectedZone],
                          radiusMeters: parseInt(e.target.value)
                        }
                      })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Heure début travail</label>
                    <input
                      type="time"
                      value={settings.workStartTime}
                      onChange={e => setSettings({ ...settings, workStartTime: e.target.value })}
                      className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500 rounded text-blue-200 text-sm">
                  <strong>{selectedZone}</strong> : Lat {settings[selectedZone]?.centerLat.toFixed(4)}, Lng {settings[selectedZone]?.centerLng.toFixed(4)} | Rayon: {settings[selectedZone]?.radiusMeters}m
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  onClick={handleGetCurrentPosition}
                  disabled={geoLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {geoLoading ? 'Localisation...' : `Obtenir position actuelle pour ${selectedZone}`}
                </button>

                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 px-6 py-2 rounded-lg transition w-full md:w-auto"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder tous les paramètres'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4">{selectedUser.name}</h3>
            <p className="text-gray-300 mb-6 text-sm">Scanner ce code avec Google Authenticator</p>

            <div className="bg-white p-4 rounded-lg mb-6 inline-block">
              <img src={qrDataUrl} alt="OTP QR Code" className="w-64 h-64" />
            </div>

            <div className="mb-6">
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="text-teal-400 hover:text-teal-300 text-sm mb-2 flex items-center gap-1 mx-auto"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecret ? 'Masquer' : 'Afficher'} la clé secrète
              </button>

              {showSecret && (
                <div className="bg-gray-700 rounded p-4 font-mono text-sm break-all border-l-4 border-yellow-500">
                  {selectedUser.secretKey}
                </div>
              )}
            </div>

            <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-6 text-red-200 text-sm">
              <strong>Important :</strong> Cette clé secrète ne sera plus affichée. Conservez-la en lieu sûr ou utilisez
              directement le QR code.
            </div>

            <button
              onClick={() => {
                setShowQR(false);
                setSelectedUser(null);
              }}
              className="bg-teal-600 hover:bg-teal-700 px-6 py-2 rounded-lg w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTPSystemAdmin;
