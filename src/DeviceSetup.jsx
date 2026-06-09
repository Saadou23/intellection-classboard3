import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const DeviceSetup = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deviceToken = params.get('token');

    if (!deviceToken) {
      setStatus('error');
      setMessage('❌ Token manquant. Vérifiez le lien fourni par l\'administrateur.');
      return;
    }

    try {
      localStorage.setItem('device_token', deviceToken);
      setToken(deviceToken);
      setStatus('success');
      setMessage('✅ Appareil enregistré avec succès!');
    } catch (e) {
      setStatus('error');
      setMessage('❌ Erreur lors de la sauvegarde du token: ' + e.message);
    }
  }, []);

  const handleGoToPointage = () => {
    window.location.href = '/pointage';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-blue-300 border-t-white rounded-full mx-auto"></div>
              <p className="text-gray-600">Enregistrement en cours...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-800">Enregistrement réussi!</h1>
              <p className="text-gray-600">Cet ordinateur est maintenant autorisé à effectuer des pointages.</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 break-all">
                  <strong>Token:</strong> {token.substring(0, 8)}...
                </p>
              </div>

              <button
                onClick={handleGoToPointage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Aller au pointage
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-800">Erreur</h1>
              <p className="text-red-600">{message}</p>

              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceSetup;
