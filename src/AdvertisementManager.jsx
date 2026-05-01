import React, { useState } from 'react';
import { Send, Smartphone } from 'lucide-react';
import { db } from './firebase';
import { addDoc, collection } from 'firebase/firestore';

const AdvertisementManager = () => {
  const [loading, setLoading] = useState(false);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [concoursLoading, setConcoursLoading] = useState(false);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);
  const [concoursSuccess, setConcoursSuccess] = useState(false);
  const [languagesSuccess, setLanguagesSuccess] = useState(false);

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

  const triggerBrandingBanner = async () => {
    setBrandingLoading(true);
    try {
      await addDoc(collection(db, 'branding_trigger'), {
        triggeredAt: new Date(),
        type: 'branding'
      });
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors du lancement du branding:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setBrandingLoading(false);
    }
  };

  const triggerConcoursPrepAd = async () => {
    setConcoursLoading(true);
    try {
      await addDoc(collection(db, 'concours_prep_trigger'), {
        triggeredAt: new Date(),
        type: 'concours_prep'
      });
      setConcoursSuccess(true);
      setTimeout(() => setConcoursSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors du lancement de la pub concours:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setConcoursLoading(false);
    }
  };

  const triggerLanguagesCoursesAd = async () => {
    setLanguagesLoading(true);
    try {
      await addDoc(collection(db, 'languages_courses_trigger'), {
        triggeredAt: new Date(),
        type: 'languages_courses'
      });
      setLanguagesSuccess(true);
      setTimeout(() => setLanguagesSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors du lancement de la pub langues:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setLanguagesLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Publicités & Branding</h2>
      </div>

      {success && (
        <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
          <p className="text-green-700 font-medium">✅ Publicité lancée! Elle s'affichera pendant 15 secondes.</p>
        </div>
      )}

      {brandingSuccess && (
        <div className="bg-blue-100 border-l-4 border-blue-600 p-4 mb-4 rounded">
          <p className="text-blue-700 font-medium">✅ Banner INTELLECTION lancé! Il s'affichera pendant 8 secondes.</p>
        </div>
      )}

      {concoursSuccess && (
        <div className="bg-yellow-100 border-l-4 border-yellow-600 p-4 mb-4 rounded">
          <p className="text-yellow-700 font-medium">✅ Pub Préparation Concours lancée! Elle s'affichera pendant 30 secondes.</p>
        </div>
      )}

      {languagesSuccess && (
        <div className="bg-blue-100 border-l-4 border-blue-600 p-4 mb-4 rounded">
          <p className="text-blue-700 font-medium">✅ Pub Inscriptions Langues lancée! Elle s'affichera pendant 20 secondes.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* App Advertisement */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">📱</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Promouvoir l'app</h3>
              <p className="text-gray-600 text-sm">Affiche la publicité sur tous les écrans</p>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            La publicité affichera les QR codes pour:
          </p>
          <ul className="text-sm text-gray-700 mb-6 ml-4 space-y-2">
            <li>✅ <strong>Apple App Store</strong> (iOS)</li>
            <li>✅ <strong>Intellection APK</strong> (Android)</li>
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
                🚀 Lancer l'app
              </>
            )}
          </button>

          <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>Durée:</strong> 15 secondes auto-fermeture
            </p>
          </div>
        </div>

        {/* Branding Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">🏆</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Branding INTELLECTION</h3>
              <p className="text-gray-600 text-sm">Affiche la bannière de marque</p>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-6">
            N°1 du soutien scolaire & universitaire à EL JADIDA
          </p>

          <button
            onClick={triggerBrandingBanner}
            disabled={brandingLoading}
            className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              brandingLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {brandingLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Lancement en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                🎯 Lancer le branding
              </>
            )}
          </button>

          <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>Durée:</strong> 8 secondes auto-fermeture
            </p>
          </div>
        </div>

        {/* Concours Prep Advertisement */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border-2 border-yellow-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">🎓</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Pub Préparation Concours</h3>
              <p className="text-gray-600 text-sm">Affiche l'image fullscreen</p>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-6">
            Promotion des préparations aux concours: Médecine, ENSA/ENSAM, ENCG, ENA
          </p>

          <button
            onClick={triggerConcoursPrepAd}
            disabled={concoursLoading}
            className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              concoursLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700 hover:shadow-lg'
            }`}
          >
            {concoursLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Lancement en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                🚀 Lancer la pub concours
              </>
            )}
          </button>

          <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Durée:</strong> 30 secondes auto-fermeture
            </p>
          </div>
        </div>

        {/* Languages Courses Advertisement */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">🌍</div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Inscriptions Langues</h3>
              <p className="text-gray-600 text-sm">Français & Anglais Summer 2026</p>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-6">
            Cours interactifs, professeurs expérimentés, progression garantie
          </p>

          <button
            onClick={triggerLanguagesCoursesAd}
            disabled={languagesLoading}
            className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              languagesLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {languagesLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Lancement en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                🚀 Lancer pub langues
              </>
            )}
          </button>

          <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>Durée:</strong> 20 secondes auto-fermeture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementManager;
