import React, { useState, useEffect } from 'react';
import { ChevronRight, MapPin, Lock, CheckCircle, AlertCircle, X, Clock, ArrowRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  getDirecteurs,
  getAgents,
  loadOTPSettings,
  getCurrentPosition,
  haversineDistance,
  detectPointageType,
  validateOTP,
  recordPointage
} from './OTPService';

const OTPPointagePanel = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [directeurs, setDirecteurs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedZone, setSelectedZone] = useState('Hay Salam');
  const [selectedDirecteur, setSelectedDirecteur] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [pointageType, setPointageType] = useState('entrée');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoStatus, setGeoStatus] = useState('idle');
  const [userLocation, setUserLocation] = useState(null);
  const [settings, setSettings] = useState(null);
  const [otpToken, setOtpToken] = useState('');
  const [result, setResult] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dirs, agents_list, config] = await Promise.all([
        getDirecteurs(),
        getAgents(),
        loadOTPSettings()
      ]);
      setDirecteurs(dirs);
      setAgents(agents_list);
      setSettings(config);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Next = async () => {
    if (!selectedZone) {
      setError('Veuillez sélectionner une zone');
      return;
    }
    if (!selectedDirecteur) {
      setError('Veuillez sélectionner un directeur');
      return;
    }
    if (!selectedAgent) {
      setError('Veuillez sélectionner votre nom (agent)');
      return;
    }

    setGeoStatus('loading');
    setError('');

    try {
      const zoneConfig = settings[selectedZone];
      if (!zoneConfig) {
        setError('Zone non configurée');
        return;
      }

      const pos = await getCurrentPosition();
      const dist = haversineDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        zoneConfig.centerLat,
        zoneConfig.centerLng
      );

      if (dist > zoneConfig.radiusMeters) {
        setGeoStatus('error');
        setError(
          `❌ Vous êtes à ${Math.round(dist)}m du centre de ${selectedZone}. Zone autorisée: ${zoneConfig.radiusMeters}m.`
        );
        return;
      }

      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setGeoStatus('ok');

      const type = await detectPointageType(selectedDirecteur.id);
      setPointageType(type);
      setStep(2);
      setError('');
    } catch (e) {
      setGeoStatus('error');
      setError('Erreur géolocalisation: ' + e.message + '\nAssurez-vous que la géolocalisation est activée.');
    }
  };

  const handleValidateOTP = async () => {
    if (otpToken.length !== 6) {
      setError('Code à 6 chiffres requis');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const dirSnap = await getDoc(doc(db, 'otp_users', selectedDirecteur.id));
      if (!dirSnap.exists()) {
        setError('Directeur non trouvé');
        return;
      }

      const { secretKey } = dirSnap.data();
      const valid = validateOTP(secretKey, otpToken);

      if (!valid) {
        setError('❌ Code OTP invalide ou expiré. Vérifiez le code fourni par le directeur.');
        setOtpToken('');
        return;
      }

      await recordPointage({
        directeurId: selectedDirecteur.id,
        directeurName: selectedDirecteur.name,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        type: pointageType,
        location: userLocation
      });

      setResult({
        success: true,
        type: pointageType,
        directeurName: selectedDirecteur.name,
        agentName: selectedAgent.name,
        timestamp: new Date()
      });
      setStep(3);
    } catch (e) {
      setError('Erreur validation: ' + e.message);
    } finally {
      setValidating(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedZone('Hay Salam');
    setSelectedDirecteur(null);
    setSelectedAgent(null);
    setOtpToken('');
    setError('');
    setGeoStatus('idle');
    setResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-300 border-t-white rounded-full mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 p-4">
      <div className="max-w-md mx-auto mt-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Pointage
          </h1>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-blue-700 hover:bg-blue-600 text-white p-2 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition ${
                s <= step ? 'bg-teal-400' : 'bg-blue-700'
              }`}
            ></div>
          ))}
        </div>

        {/* Step 1: Select Zone, Directeur & Agent */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Étape 1 : Sélection</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏢 Zone
              </label>
              <select
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Hay Salam">Hay Salam</option>
                <option value="Doukkali">Doukkali</option>
                <option value="Saada">Saada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👔 Directeur
              </label>
              <select
                value={selectedDirecteur?.id || ''}
                onChange={e => {
                  const dir = directeurs.find(d => d.id === e.target.value);
                  setSelectedDirecteur(dir || null);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionnez un directeur —</option>
                {directeurs.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 Votre nom (Agent)
              </label>
              <select
                value={selectedAgent?.id || ''}
                onChange={e => {
                  const agent = agents.find(a => a.id === e.target.value);
                  setSelectedAgent(agent || null);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionnez un agent —</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm whitespace-pre-wrap">{error}</p>
              </div>
            )}

            {geoStatus === 'loading' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 flex gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mt-0.5"></div>
                <p className="text-blue-700 text-sm">Vérification de votre position GPS...</p>
              </div>
            )}

            <button
              onClick={handleStep1Next}
              disabled={!selectedZone || !selectedDirecteur || !selectedAgent || geoStatus === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Étape 2 : Code OTP</h2>
              <p className="text-gray-600 mb-2">
                Demandez le code OTP au directeur
                <strong className="block text-blue-600 mt-1">{selectedDirecteur.name}</strong>
              </p>
            </div>

            {/* Type Badge */}
            <div className="flex justify-center mb-4">
              <div
                className={`px-6 py-3 rounded-full font-bold text-white text-center ${
                  pointageType === 'entrée' ? 'bg-green-500' : 'bg-orange-500'
                }`}
              >
                {pointageType === 'entrée' ? '🟢 ENTRÉE' : '🟠 SORTIE'}
              </div>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code OTP (6 chiffres)
              </label>
              <input
                type="number"
                maxLength="6"
                min="0"
                max="999999"
                value={otpToken}
                onChange={e => {
                  const val = e.target.value.slice(0, 6);
                  setOtpToken(val);
                }}
                placeholder="000000"
                className="w-full text-4xl text-center font-bold tracking-widest border-2 border-gray-300 rounded px-4 py-4 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Entrez le code à 6 chiffres de Google Authenticator
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm whitespace-pre-wrap">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setError('');
                  setOtpToken('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
              >
                Retour
              </button>
              <button
                onClick={handleValidateOTP}
                disabled={otpToken.length !== 6 || validating}
                className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                {validating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Validation...
                  </>
                ) : (
                  <>
                    Valider
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && result && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">Pointage validé!</h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-700">Directeur:</span>
                <span className="font-semibold text-gray-900">{result.directeurName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Agent:</span>
                <span className="font-semibold text-gray-900">{result.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Type:</span>
                <span className={`font-semibold ${result.type === 'entrée' ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.type === 'entrée' ? 'ENTRÉE' : 'SORTIE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Heure:</span>
                <span className="font-semibold text-gray-900">
                  {result.timestamp.toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>

            <p className="text-gray-600 text-sm">
              ✅ Le pointage a été enregistré avec succès et géolocalisé.
            </p>

            <button
              onClick={handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              Nouveau pointage
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Location Indicator */}
      {step > 1 && userLocation && (
        <div className="fixed bottom-4 left-4 bg-blue-900 text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg">
          <MapPin className="w-3 h-3 text-green-400" />
          GPS OK • {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default OTPPointagePanel;
