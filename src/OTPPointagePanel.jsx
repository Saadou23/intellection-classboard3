import React, { useState, useEffect } from 'react';
import { ChevronRight, Lock, CheckCircle, AlertCircle, X, Clock, ArrowRight, Smartphone } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  getDirecteurs,
  getAgents,
  loadOTPSettings,
  detectPointageType,
  validateOTP,
  recordPointage,
  verifyComputerFingerprint,
  detectAgentPointageType,
  recordAgentPointage,
  getOTPUser,
  getCheckoutQuestions,
  saveCheckoutResponse
} from './OTPService';

const OTPPointagePanel = ({ onBack }) => {
  const [deviceValid, setDeviceValid] = useState(false);
  const [deviceChecking, setDeviceChecking] = useState(true);
  const [deviceError, setDeviceError] = useState('');
  const [computerId, setComputerId] = useState('');

  const [mode, setMode] = useState('directeur'); // 'directeur' or 'agent'
  const [step, setStep] = useState(1);
  const [directeurs, setDirecteurs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedZone, setSelectedZone] = useState('Hay Salam');
  const [selectedDirecteur, setSelectedDirecteur] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [pointageType, setPointageType] = useState('entrée');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [result, setResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [checkoutQuestions, setCheckoutQuestions] = useState([]);
  const [checkoutResponses, setCheckoutResponses] = useState({});
  const [showCheckoutQuestions, setShowCheckoutQuestions] = useState(false);

  useEffect(() => {
    validateDevice();
  }, []);

  useEffect(() => {
    if (deviceValid) {
      loadData();
      loadCheckoutQuestions();
    }
  }, [deviceValid]);

  useEffect(() => {
    console.log('🔍 STATE DEBUG:', { step, showCheckoutQuestions, mode, pointageType });
  }, [step, showCheckoutQuestions, mode, pointageType]);

  const loadCheckoutQuestions = async () => {
    try {
      const questions = await getCheckoutQuestions();
      console.log('📋 Questions de checkout chargées:', questions);
      setCheckoutQuestions(questions);
    } catch (e) {
      console.error('Error loading checkout questions:', e);
    }
  };

  const validateDevice = async () => {
    try {
      const { valid, computer } = await verifyComputerFingerprint();

      if (!valid) {
        setDeviceError('🚫 Cet ordinateur n\'est pas autorisé à faire de pointage.\n\nContactez l\'administrateur du centre pour l\'enregistrer.');
        setDeviceValid(false);
        return;
      }

      setComputerId(computer.id);
      setDeviceValid(true);
      setDeviceError('');
    } catch (e) {
      setDeviceError('❌ Erreur lors de la vérification: ' + e.message);
      setDeviceValid(false);
    } finally {
      setDeviceChecking(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dirs, agents_list] = await Promise.all([
        getDirecteurs(),
        getAgents()
      ]);
      setDirecteurs(dirs);
      setAgents(agents_list);
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

    setError('');

    try {
      const type = await detectPointageType(selectedDirecteur.id);
      setPointageType(type);
      setStep(2);
      setError('');
    } catch (e) {
      setError('Erreur: ' + e.message);
    }
  };

  const handleValidateOTP = async () => {
    console.log('🔐 Validation OTP - Type:', pointageType);
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

      if (!secretKey) {
        setError('❌ Clé OTP non configurée pour ce directeur. Contactez l\'administrateur.');
        return;
      }

      const valid = validateOTP(secretKey, otpToken);

      if (!valid) {
        setError('❌ Code OTP invalide ou expiré.\n\n💡 Vérifications:\n• Code à 6 chiffres?\n• Pas plus de 2 minutes depuis la génération?\n• Horloge du téléphone synchronisée?\n\nRéessayez avec un nouveau code.');
        setOtpToken('');
        return;
      }

      if (pointageType === 'sortie') {
        console.log('✅ SORTIE détectée - Affichage des questions');
        console.log('Questions chargées:', checkoutQuestions.length);
        setCheckoutResponses({});
        setShowCheckoutQuestions(true);
        setStep(3);
      } else {
        await recordPointage({
          directeurId: selectedDirecteur.id,
          directeurName: selectedDirecteur.name,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          type: pointageType,
          zone: selectedZone,
          commentaire: commentaire,
          computerId
        });

        setResult({
          success: true,
          type: pointageType,
          directeurName: selectedDirecteur.name,
          agentName: selectedAgent.name,
          timestamp: new Date()
        });
        setStep(3);
        setShowCheckoutQuestions(false);
      }
    } catch (e) {
      setError('Erreur validation: ' + e.message);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmitCheckoutQuestions = async () => {
    const requiredQuestions = checkoutQuestions.filter(q => q.required);
    const unanswered = requiredQuestions.filter(q => !checkoutResponses[q.id]);

    if (unanswered.length > 0) {
      setError(`Veuillez répondre à toutes les questions obligatoires (${unanswered.length} question(s))`);
      return;
    }

    setValidating(true);
    setError('');

    try {
      const responseId = await saveCheckoutResponse(
        selectedDirecteur.id,
        selectedDirecteur.name,
        checkoutResponses
      );

      await recordPointage({
        directeurId: selectedDirecteur.id,
        directeurName: selectedDirecteur.name,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        type: pointageType,
        zone: selectedZone,
        commentaire: commentaire,
        computerId,
        checkoutResponseId: responseId
      });

      setResult({
        success: true,
        type: pointageType,
        directeurName: selectedDirecteur.name,
        agentName: selectedAgent.name,
        timestamp: new Date()
      });
      setShowCheckoutQuestions(false);
    } catch (e) {
      setError('Erreur: ' + e.message);
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
    setResult(null);
    setCommentaire('');
    setCheckoutResponses({});
    setShowCheckoutQuestions(false);
  };

  const handleAgentStep1Next = async () => {
    if (!selectedZone) {
      setError('Veuillez sélectionner une zone');
      return;
    }
    if (!selectedAgent) {
      setError('Veuillez sélectionner votre nom');
      return;
    }

    setError('');

    try {
      const type = await detectAgentPointageType(selectedAgent.id);
      setPointageType(type);
      setStep(2);
      setError('');
    } catch (e) {
      setError('Erreur: ' + e.message);
    }
  };

  const handleValidateAgentOTP = async () => {
    if (otpToken.length !== 6) {
      setError('Code à 6 chiffres requis');
      return;
    }

    setValidating(true);
    setError('');

    try {
      const agentData = await getOTPUser(selectedAgent.id);
      if (!agentData) {
        setError('Agent non trouvé');
        return;
      }

      const { secretKey } = agentData;

      if (!secretKey) {
        setError('❌ Clé OTP non configurée pour cet agent. Contactez l\'administrateur.');
        return;
      }

      const valid = validateOTP(secretKey, otpToken);

      if (!valid) {
        setError('❌ Code OTP invalide ou expiré.\n\n💡 Vérifications:\n• Code à 6 chiffres?\n• Pas plus de 2 minutes depuis la génération?\n• Horloge du téléphone synchronisée?\n\nRéessayez avec un nouveau code.');
        setOtpToken('');
        return;
      }

      await recordAgentPointage({
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        type: pointageType,
        zone: selectedZone,
        commentaire: commentaire,
        computerId
      });

      setResult({
        success: true,
        type: pointageType,
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

  const handleAgentReset = () => {
    setStep(1);
    setSelectedZone('Hay Salam');
    setSelectedAgent(null);
    setOtpToken('');
    setError('');
    setResult(null);
    setCommentaire('');
  };

  if (deviceChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-300 border-t-white rounded-full mx-auto mb-4"></div>
          <p className="text-white">Vérification de l'appareil...</p>
        </div>
      </div>
    );
  }

  if (!deviceValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Accès refusé</h1>
            <p className="text-gray-600">{deviceError}</p>
            {onBack && (
              <button
                onClick={onBack}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Retour
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex justify-between items-center mb-6">
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

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('directeur');
              handleReset();
            }}
            className={`flex-1 py-2 rounded-lg transition font-semibold ${
              mode === 'directeur'
                ? 'bg-white text-blue-600'
                : 'bg-blue-700 text-white hover:bg-blue-600'
            }`}
          >
            👔 Directeur
          </button>
          <button
            onClick={() => {
              setMode('agent');
              handleAgentReset();
            }}
            className={`flex-1 py-2 rounded-lg transition font-semibold flex items-center justify-center gap-1 ${
              mode === 'agent'
                ? 'bg-white text-blue-600'
                : 'bg-blue-700 text-white hover:bg-blue-600'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Agent
          </button>
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

        {/* Step 1: Directeur Mode */}
        {step === 1 && mode === 'directeur' && (
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
                👤 Votre nom (Agent validateur)
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

            <button
              onClick={handleStep1Next}
              disabled={!selectedZone || !selectedDirecteur || !selectedAgent}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Agent Mode */}
        {step === 1 && mode === 'agent' && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Étape 1 : Votre Information</h2>

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
                👤 Votre nom
              </label>
              <select
                value={selectedAgent?.id || ''}
                onChange={e => {
                  const agent = agents.find(a => a.id === e.target.value);
                  setSelectedAgent(agent || null);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionnez votre nom —</option>
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

            <button
              onClick={handleAgentStep1Next}
              disabled={!selectedZone || !selectedAgent}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Directeur Mode */}
        {step === 2 && mode === 'directeur' && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Étape 2 : Code OTP</h2>
              <p className="text-gray-600 mb-2">
                Demandez le code OTP au directeur
                <strong className="block text-blue-600 mt-1">{selectedDirecteur?.name}</strong>
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

            {/* Commentaire (Sortie seulement) */}
            {pointageType === 'sortie' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Bulletin de renseignement (optionnel)
                </label>
                <textarea
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                  placeholder="Ex: Inspection complétée, aucun problème signalé..."
                  maxLength={500}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{commentaire.length}/500</p>
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code OTP (6 chiffres) {otpToken.length}/6
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={otpToken}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setOtpToken(val);
                }}
                placeholder="000000"
                className="w-full text-4xl text-center font-bold tracking-widest border-2 border-gray-300 rounded px-4 py-4 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {otpToken.length === 6 ? '✅ Code complet - Cliquez sur Valider' : '⏳ Entrez 6 chiffres'}
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

        {/* Step 2: Agent Mode */}
        {step === 2 && mode === 'agent' && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Étape 2 : Code OTP</h2>
              <p className="text-gray-600 mb-2">
                Entrez votre code OTP personnel
                <strong className="block text-blue-600 mt-1">{selectedAgent?.name}</strong>
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

            {/* Commentaire (Sortie seulement) */}
            {pointageType === 'sortie' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Notes (optionnel)
                </label>
                <textarea
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                  placeholder="Remarques..."
                  maxLength={500}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{commentaire.length}/500</p>
              </div>
            )}

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
                onClick={handleValidateAgentOTP}
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

        {/* Step 3: Checkout Questions - Directeur Mode */}
        {step === 3 && showCheckoutQuestions && mode === 'directeur' && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">📋 Rapport de Sortie</h2>
              <p className="text-gray-600 text-sm">
                {checkoutQuestions.length > 0
                  ? 'Veuillez répondre aux questions suivantes:'
                  : 'Cliquez sur "Finaliser" pour enregistrer votre sortie'}
              </p>
            </div>

            {checkoutQuestions.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm">✅ Aucune question configurée pour cette sortie</p>
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {checkoutQuestions.map((question, idx) => (
                <div key={question.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="block font-semibold text-gray-800 mb-3">
                    {idx + 1}. {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {question.type === 'text' ? (
                    <textarea
                      value={checkoutResponses[question.id] || ''}
                      onChange={e => setCheckoutResponses({
                        ...checkoutResponses,
                        [question.id]: e.target.value
                      })}
                      placeholder="Votre réponse..."
                      maxLength={500}
                      rows={2}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />
                  ) : (
                    <div className="space-y-2">
                      {question.options?.map((option, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={checkoutResponses[question.id] === option}
                            onChange={e => setCheckoutResponses({
                              ...checkoutResponses,
                              [question.id]: e.target.value
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700 text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
                  setStep(2);
                  setError('');
                  setShowCheckoutQuestions(false);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold transition"
              >
                Retour
              </button>
              <button
                onClick={handleSubmitCheckoutQuestions}
                disabled={validating}
                className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                {validating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Finalisation...
                  </>
                ) : (
                  <>
                    Finaliser
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success - Directeur Mode */}
        {step === 3 && result && mode === 'directeur' && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">Pointage validé!</h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-700">Directeur:</span>
                <span className="font-semibold text-gray-900">{result.directeurName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Agent validateur:</span>
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
              ✅ Le pointage a été enregistré avec succès.
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

        {/* Step 3: Success - Agent Mode */}
        {step === 3 && result && mode === 'agent' && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">Pointage enregistré!</h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-700">Agent:</span>
                <span className="font-semibold text-gray-900">{result.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Type:</span>
                <span className={`font-semibold ${result.type === 'entrée' ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.type === 'entrée' ? '🟢 ENTRÉE' : '🟠 SORTIE'}
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
              ✅ Votre pointage a été enregistré avec succès.
            </p>

            <button
              onClick={handleAgentReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              Nouveau pointage
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default OTPPointagePanel;
