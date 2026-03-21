import React, { useState } from 'react';
import { Send, Smartphone } from 'lucide-react';
import { db } from './firebase';
import { addDoc, collection } from 'firebase/firestore';

const AdvertisementManager = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const triggerAdvertisement = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'advertisement_trigger'), {
        triggeredAt: new Date(),
        type: 'mobile_app'
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors du lancement de la publicité:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Publicité Application Mobile</h2>
      </div>

      {success && (
        <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
          <p className="text-green-700 font-medium">✅ Publicité lancée! Elle s'affichera pendant 15 secondes.</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">📱</div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Promouvoir l'app</h3>
            <p className="text-gray-600">Affiche la publicité sur tous les écrans ClassBoard</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          La publicité affichera les QR codes pour:
        </p>
        <ul className="text-sm text-gray-700 mb-6 ml-4 space-y-2">
          <li>✅ <strong>Apple App Store</strong> (iOS)</li>
          <li>✅ <strong>Google Play Store</strong> (Android)</li>
        </ul>

        <button
          onClick={triggerAdvertisement}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Lancement en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              🚀 Lancer la publicité maintenant
            </>
          )}
        </button>

        <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Info:</strong> La publicité s'affiche pendant 15 secondes et se ferme automatiquement. Les étudiants peuvent aussi la fermer manuellement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementManager;
