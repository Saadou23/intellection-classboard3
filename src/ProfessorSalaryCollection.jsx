import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { getProfessors, getProfessorPendingSalaries, confirmSalaryCollection, validateOTP } from './OTPService';

const ProfessorSalaryCollection = () => {
  const [step, setStep] = useState(1); // 1: Select prof, 2: Enter OTP, 3: Confirm OTP, 4: Success
  const [professors, setProfessors] = useState([]);
  const [professorsWithPendingSalaries, setProfessorsWithPendingSalaries] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [pendingSalaries, setPendingSalaries] = useState([]);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [confirmOtp, setConfirmOtp] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    setLoading(true);
    try {
      const profs = await getProfessors();
      setProfessors(profs);

      // Filter professors who have pending salaries
      const profsWithPending = [];
      for (const prof of profs) {
        const salaries = await getProfessorPendingSalaries(prof.id);
        if (salaries.length > 0) {
          profsWithPending.push(prof);
        }
      }

      console.log(`✅ ${profsWithPending.length} professeur(s) avec salaire(s) en attente`);
      setProfessorsWithPendingSalaries(profsWithPending);
      setProfessors(profs);
    } catch (e) {
      setError('Erreur de chargement des professeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfessor = async prof => {
    setLoading(true);
    setError('');

    try {
      // Load pending salaries for this professor
      const salaries = await getProfessorPendingSalaries(prof.id);

      if (salaries.length === 0) {
        setError('Aucun salaire en attente pour ce professeur');
        setLoading(false);
        return;
      }

      setSelectedProfessor(prof);
      setPendingSalaries(salaries);
      setStep(2);
      setOtpInput('');
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput) {
      setError('Veuillez entrer votre code OTP');
      return;
    }

    if (!selectedProfessor) {
      setError('Professeur non sélectionné');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Vérification OTP:');
      console.log('  Professeur:', selectedProfessor.name);
      console.log('  Code OTP saisi:', otpInput);
      console.log('  Secret OTP stocké:', selectedProfessor.otpSecret ? '✅ Présent' : '❌ Manquant');

      const isValidOTP = validateOTP(selectedProfessor.otpSecret, otpInput);
      console.log('  Résultat validation:', isValidOTP ? '✅ VALIDE' : '❌ INVALIDE');

      if (!isValidOTP) {
        setError('❌ Code OTP invalide. Vérifiez que votre authenticateur est synchronisé.');
        console.error('❌ OTP invalide pour:', selectedProfessor.name);
        setLoading(false);
        return;
      }

      // If only one salary, select it automatically
      if (pendingSalaries.length === 1) {
        setSelectedSalary(pendingSalaries[0]);
      }

      setStep(3);
      setOtpInput('');
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSalaryAndConfirm = salary => {
    setSelectedSalary(salary);
    setStep(3);
  };

  const handleConfirmCollection = async () => {
    if (!confirmOtp) {
      setError('Veuillez entrer votre code OTP pour confirmer');
      return;
    }

    if (!selectedProfessor || !selectedSalary) {
      setError('Données manquantes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValidOTP = validateOTP(selectedProfessor.otpSecret, confirmOtp);

      if (!isValidOTP) {
        setError('Code OTP invalide');
        setLoading(false);
        return;
      }

      // Confirm salary collection with comment
      await confirmSalaryCollection(selectedSalary.id, selectedProfessor.id, comment);

      setSuccess(`✅ Montant de ${selectedSalary.amount.toLocaleString('fr-FR')} DH collecté avec succès!`);
      setStep(4); // Success step

      // Reset after 3 seconds
      setTimeout(() => {
        setStep(1);
        setSelectedProfessor(null);
        setPendingSalaries([]);
        setSelectedSalary(null);
        setConfirmOtp('');
        setComment('');
        setSuccess('');
      }, 3000);
    } catch (e) {
      setError('Erreur: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedProfessor(null);
    setPendingSalaries([]);
    setSelectedSalary(null);
    setOtpInput('');
    setConfirmOtp('');
    setError('');
  };

  // Step 1: Select Professor
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <DollarSign className="w-12 h-12 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold">Collecte de Salaire</h1>
              <p className="text-gray-400">Sélectionnez votre nom pour commencer</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-200 flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-400">Chargement des professeurs...</div>
            ) : professorsWithPendingSalaries.length === 0 ? (
              <div className="text-center py-8 text-green-400">
                ✅ Aucun salaire en attente de collecte!
                <p className="text-sm text-gray-400 mt-2">Tous les salaires ont été collectés</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {professorsWithPendingSalaries.map(prof => (
                  <button
                    key={prof.id}
                    onClick={() => handleSelectProfessor(prof)}
                    disabled={loading}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:from-gray-600 disabled:to-gray-600 rounded-lg p-4 text-left transition transform hover:scale-105 font-semibold text-white"
                  >
                    👤 {prof.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Enter OTP to display salary
  if (step === 2 && selectedProfessor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Saisissez votre OTP</h1>
              <p className="text-gray-400">Professeur: <span className="font-semibold text-teal-400">{selectedProfessor.name}</span></p>
              <p className="text-sm text-gray-500">{pendingSalaries.length} salaire(s) en attente</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.toUpperCase())}
                placeholder="Entrez votre code OTP"
                maxLength="6"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest font-mono"
                onKeyPress={e => e.key === 'Enter' && handleVerifyOTP()}
                disabled={loading}
                autoFocus
              />

              {error && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-200 flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || !otpInput}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition font-semibold text-white"
              >
                {loading ? 'Vérification...' : 'Afficher Salaire'}
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 px-6 py-2 rounded-lg transition font-semibold"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirm with OTP
  if (step === 3 && selectedProfessor && selectedSalary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Montant à Collecter</h1>
              <p className="text-gray-400">Professeur: <span className="font-semibold text-teal-400">{selectedProfessor.name}</span></p>

              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8">
                <div className="text-5xl font-bold text-white">
                  {selectedSalary.amount.toLocaleString('fr-FR')}
                </div>
                <div className="text-green-200 mt-2">DH - {selectedSalary.month}</div>
              </div>

              <p className="text-gray-400 text-sm">Saisissez votre OTP pour confirmer la réception</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={confirmOtp}
                onChange={e => setConfirmOtp(e.target.value.toUpperCase())}
                placeholder="Confirmez avec votre OTP"
                maxLength="6"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest font-mono"
                onKeyPress={e => e.key === 'Enter' && handleConfirmCollection()}
                disabled={loading}
                autoFocus
              />

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  📝 Commentaire (optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Ex: Discordance, retard, etc..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
                  rows="3"
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-200 flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleConfirmCollection}
                disabled={loading || !confirmOtp}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition font-semibold text-white"
              >
                {loading ? 'Confirmation...' : 'Confirmer la Réception'}
              </button>

              {pendingSalaries.length > 1 && (
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 px-6 py-2 rounded-lg transition font-semibold"
                >
                  Choisir un autre salaire
                </button>
              )}

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 px-6 py-2 rounded-lg transition font-semibold text-sm"
              >
                Retour au début
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-xl p-8 border border-green-500 shadow-2xl space-y-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto" />
            <h1 className="text-2xl font-bold">Collecte Confirmée!</h1>
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
              <p className="text-green-200 font-semibold">{success}</p>
            </div>
            <div className="pt-4 text-sm text-gray-500">
              Redirection automatique en cours...
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default ProfessorSalaryCollection;
