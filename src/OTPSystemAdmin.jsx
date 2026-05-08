import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, QrCode, MapPin, Users, Settings, Eye, EyeOff, AlertCircle, Smartphone, Clock, HelpCircle, DollarSign } from 'lucide-react';
import QRCode from 'qrcode';
import AgentSchedulesManager from './AgentSchedulesManager';
import CheckoutQuestionsManager from './CheckoutQuestionsManager';
import AdminSalaryManager from './AdminSalaryManager';
import {
  createOTPUser,
  getOTPUsers,
  toggleUserActive,
  deleteOTPUser,
  generateOTPAuthURL,
  loadOTPSettings,
  saveOTPSettings,
  registerComputerFingerprint,
  getRegisteredComputers,
  revokeComputer
} from './OTPService';

const OTPSystemAdmin = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // User management form
  const [formData, setFormData] = useState({ name: '', role: 'agent', email: '' });
  const [formError, setFormError] = useState('');

  // Computer management form
  const [computerFormData, setComputerFormData] = useState({ name: '', centreZone: 'Hay Salam', code: '' });
  const [computerFormError, setComputerFormError] = useState('');
  const [computerRegistering, setComputerRegistering] = useState(false);
  const [showComputerCode, setShowComputerCode] = useState(false);
  const [computerPassword, setComputerPassword] = useState('');
  const [computerPasswordError, setComputerPasswordError] = useState('');
  const [computerPasswordAuthenticated, setComputerPasswordAuthenticated] = useState(false);
  const COMPUTER_PASSWORD = 'Mdp123..s';

  // QR Modal
  const [showQR, setShowQR] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Computer Registration Modal
  const [showComputerSetup, setShowComputerSetup] = useState(false);
  const [registeredComputer, setRegisteredComputer] = useState(null);

  // Settings
  const [settings, setSettings] = useState({
    'Hay Salam': { centerLat: 0, centerLng: 0, radiusMeters: 200 },
    'Doukkali': { centerLat: 0, centerLng: 0, radiusMeters: 200 },
    'Saada': { centerLat: 0, centerLng: 0, radiusMeters: 200 },
    workStartTime: '09:00'
  });
  const [selectedZone, setSelectedZone] = useState('Hay Salam');

  useEffect(() => {
    loadUsers();
    loadComputers();
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

  const loadComputers = async () => {
    try {
      const data = await getRegisteredComputers();
      setComputers(data);
    } catch (e) {
      console.error('Error loading computers:', e);
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

  const handleComputerPasswordSubmit = () => {
    if (!computerPassword) {
      setComputerPasswordError('Veuillez entrer le mot de passe');
      return;
    }

    if (computerPassword === COMPUTER_PASSWORD) {
      setComputerPasswordAuthenticated(true);
      setComputerPasswordError('');
      setComputerPassword('');
    } else {
      setComputerPasswordError('❌ Mot de passe incorrect');
      setComputerPassword('');
    }
  };

  const handleRegisterComputer = async e => {
    e.preventDefault();
    setComputerFormError('');

    if (!computerFormData.name.trim()) {
      setComputerFormError('Le nom de l\'ordinateur est requis');
      return;
    }

    if (!computerFormData.code.trim()) {
      setComputerFormError('Le code d\'authentification est requis');
      return;
    }

    if (computerFormData.code !== 'OTPOTP1122') {
      setComputerFormError('❌ Code incorrect. Vérifiez et réessayez.');
      setComputerFormData({ ...computerFormData, code: '' });
      return;
    }

    setComputerRegistering(true);
    try {
      const newComputer = await registerComputerFingerprint({
        name: computerFormData.name,
        centreZone: computerFormData.centreZone
      });
      setComputers([...computers, newComputer]);
      setComputerFormData({ name: '', centreZone: 'Hay Salam', code: '' });
      setRegisteredComputer(newComputer);
      setShowComputerSetup(true);
    } catch (e) {
      setComputerFormError('Erreur: ' + e.message);
    } finally {
      setComputerRegistering(false);
    }
  };

  const handleRevokeComputer = async computerId => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer cet ordinateur?')) return;
    try {
      await revokeComputer(computerId);
      setComputers(computers.map(c => c.id === computerId ? { ...c, isActive: false } : c));
    } catch (e) {
      console.error('Error revoking computer:', e);
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
      const otpauthUrl = generateOTPAuthURL(user.otpSecret, user.name);
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

        {/* Tabs - Grouped by Theme */}
        <div className="space-y-3 mb-6">
          {/* Authentication & Access */}
          <div className="flex gap-3">
            <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-2">🔐 Authentification</div>
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
              onClick={() => setActiveTab('computers')}
              className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'computers'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Ordinateurs
            </button>
          </div>

          {/* Agent Management */}
          <div className="flex gap-3">
            <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-2">👥 Agents</div>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'schedules'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Clock className="w-4 h-4" />
              Horaires
            </button>
            <button
              onClick={() => setActiveTab('checkout-questions')}
              className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'checkout-questions'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Questions Checkout
            </button>
          </div>

          {/* Finance */}
          <div className="flex gap-3">
            <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-2">💰 Finances</div>
            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'salaries'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Salaires Profs
            </button>
          </div>

          {/* Settings */}
          <div className="flex gap-3">
            <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-2">⚙️ Paramètres</div>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Configuration Zone
            </button>
          </div>
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
                      <option value="professor">Professeur</option>
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
                            user.role === 'directeur' ? 'bg-purple-900 text-purple-200' :
                            user.role === 'professor' ? 'bg-green-900 text-green-200' :
                            'bg-blue-900 text-blue-200'
                          }`}>
                            {user.role === 'directeur' ? 'Directeur' : user.role === 'professor' ? 'Professeur' : 'Agent'}
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

        {/* Computers Tab */}
        {activeTab === 'computers' && (
          <div className="space-y-6">
            {!computerPasswordAuthenticated && (
              <div className="bg-gray-800 rounded-lg p-8 border border-yellow-500 text-center space-y-4">
                <h3 className="text-xl font-bold">🔒 Accès Sécurisé</h3>
                <p className="text-gray-400">Enregistrement d'ordinateurs</p>
                <form onSubmit={e => { e.preventDefault(); handleComputerPasswordSubmit(); }} className="max-w-md mx-auto space-y-3">
                  <input
                    type="password"
                    value={computerPassword}
                    onChange={e => setComputerPassword(e.target.value)}
                    placeholder="Entrez le mot de passe"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
                    autoFocus
                  />
                  {computerPasswordError && (
                    <div className="text-red-400 text-sm">{computerPasswordError}</div>
                  )}
                  <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded-lg font-semibold">
                    Accéder
                  </button>
                </form>
              </div>
            )}

            {computerPasswordAuthenticated && (
              <>
            {/* Registration Form */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                Enregistrer un nouvel ordinateur
              </h2>

              <div className="bg-blue-900/30 border border-blue-500 rounded p-4 mb-6 text-blue-200 text-sm">
                <p><strong>💡 Comment ça marche:</strong></p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Entrez le nom de l'ordinateur du centre</li>
                  <li>Cliquez sur "Enregistrer"</li>
                  <li>L'empreinte unique de cet ordinateur sera sauvegardée</li>
                  <li>Cet ordinateur pourra accéder au pointage</li>
                  <li>Les autres ordinateurs seront bloqués</li>
                </ol>
              </div>

              <form onSubmit={handleRegisterComputer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Nom de l'ordinateur</label>
                    <input
                      type="text"
                      value={computerFormData.name}
                      onChange={e => setComputerFormData({ ...computerFormData, name: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      placeholder="PC Bureau Hay Salam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Centre/Zone</label>
                    <select
                      value={computerFormData.centreZone}
                      onChange={e => setComputerFormData({ ...computerFormData, centreZone: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="Hay Salam">Hay Salam</option>
                      <option value="Doukkali">Doukkali</option>
                      <option value="Saada">Saada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">🔐 Code d'authentification</label>
                    <div className="relative">
                      <input
                        type={showComputerCode ? 'text' : 'password'}
                        value={computerFormData.code}
                        onChange={e => setComputerFormData({ ...computerFormData, code: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white pr-10"
                        placeholder="••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowComputerCode(!showComputerCode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showComputerCode ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                </div>

                {computerFormError && (
                  <div className="bg-red-900/30 border border-red-500 rounded p-3 text-red-200 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {computerFormError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={computerRegistering}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 px-6 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {computerRegistering ? 'Enregistrement...' : 'Enregistrer cet ordinateur'}
                </button>
              </form>
            </div>

            {/* Computers Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Ordinateur</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Centre</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Enregistré</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Dernière utilisation</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {computers.map(computer => (
                      <tr key={computer.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-semibold">{computer.name}</td>
                        <td className="px-6 py-4 text-gray-400">{computer.centreZone}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${
                            computer.isActive ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {computer.isActive ? '✓ Actif' : '✗ Révoqué'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(computer.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {computer.lastUsedAt
                            ? new Date(computer.lastUsedAt).toLocaleString('fr-FR')
                            : '—'
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRevokeComputer(computer.id)}
                            disabled={!computer.isActive}
                            className={`px-3 py-1 rounded text-xs flex items-center gap-1 ml-auto ${
                              computer.isActive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                            Révoquer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {computers.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                  <Smartphone className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p>Aucun ordinateur enregistré</p>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        )}

        {/* Agent Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <AgentSchedulesManager />
          </div>
        )}

        {/* Checkout Questions Tab */}
        {activeTab === 'checkout-questions' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <CheckoutQuestionsManager />
          </div>
        )}

        {/* Salaries Tab */}
        {activeTab === 'salaries' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <AdminSalaryManager />
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
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-left">
            <h3 className="text-xl font-bold mb-4 text-center">{selectedUser.name}</h3>

            <div className="space-y-4 mb-6 bg-blue-900/30 border border-blue-500 rounded p-4">
              <p className="text-blue-200 font-semibold text-sm">📱 Instructions d'installation:</p>
              <ol className="text-blue-100 text-sm space-y-2 list-decimal list-inside">
                <li>Télécharger <strong>Google Authenticator</strong></li>
                <li>Appuyer sur <strong>+</strong> pour ajouter un compte</li>
                <li>Scanner le code QR ci-dessous</li>
                <li>Sauvegarder (une clé de 6 chiffres sera générée)</li>
              </ol>
            </div>

            <div className="bg-white p-4 rounded-lg mb-6 flex justify-center">
              <img src={qrDataUrl} alt="OTP QR Code" className="w-56 h-56" />
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
                  {selectedUser.otpSecret}
                </div>
              )}
            </div>

            <div className="bg-orange-900/30 border border-orange-500 rounded p-3 mb-6 text-orange-200 text-xs">
              <strong>⚠️ Important:</strong> L'horloge du téléphone doit être synchronisée. Si le code OTP ne fonctionne pas, vérifiez l'heure du téléphone.
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

      {/* Computer Registration Success Modal */}
      {showComputerSetup && registeredComputer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-left">
            <h3 className="text-xl font-bold mb-4 text-center text-green-400">✅ Ordinateur Enregistré</h3>

            <div className="bg-green-900/30 border border-green-500 rounded p-4 mb-6">
              <p className="text-green-200 font-semibold text-sm mb-3">Détails de l'enregistrement:</p>
              <div className="space-y-2 text-sm text-green-100">
                <div><strong>Ordinateur:</strong> {registeredComputer.name}</div>
                <div><strong>Centre:</strong> {registeredComputer.centreZone}</div>
                <div><strong>Empreinte:</strong> {registeredComputer.fingerprint.substring(0, 16)}...</div>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-500 rounded p-4 mb-6">
              <p className="text-blue-200 font-semibold text-sm mb-3">ℹ️ Ce qu'il se passe maintenant:</p>
              <ol className="text-blue-100 text-sm space-y-2 list-decimal list-inside">
                <li>L'empreinte unique de <strong>{registeredComputer.name}</strong> est enregistrée</li>
                <li>Cet ordinateur peut maintenant accéder au pointage</li>
                <li>Les autres ordinateurs seront bloqués automatiquement</li>
                <li>Si l'ordinateur change, l'empreinte sera différente</li>
              </ol>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-500 rounded p-3 mb-6 text-yellow-200 text-xs">
              <strong>⚠️ Important:</strong> Ne pas modifier cet ordinateur (mise à jour majeure, changement de navigateur). Sinon, réenregistrez-le.
            </div>

            <button
              onClick={() => {
                setShowComputerSetup(false);
                setRegisteredComputer(null);
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
