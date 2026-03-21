import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, BookOpen, Smartphone } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection } from 'firebase/firestore';

const AppAdvertisement = () => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const appleUrl = 'https://apps.apple.com/ma/app/intellection-classboard/id6758705463?l=ar';
  const androidUrl = 'https://play.google.com/store/apps/details?id=com.intellection.mobile';

  const appleQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(appleUrl)}`;
  const androidQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(androidUrl)}`;

  useEffect(() => {
    // Afficher la pub aléatoirement (30% de chance)
    const randomShow = Math.random() < 0.3;
    if (randomShow) {
      setShouldRender(true);
      setShowAd(true);

      // Fermer automatiquement après 15 secondes
      const autoCloseTimer = setTimeout(() => {
        setShowAd(false);
        setTimeout(() => setShouldRender(false), 500);
      }, 15000);

      return () => clearTimeout(autoCloseTimer);
    }
  }, []);

  // Écouter les triggers admin
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'advertisement_trigger'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            setShouldRender(true);
            setShowAd(true);

            // Fermer automatiquement après 15 secondes
            const autoCloseTimer = setTimeout(() => {
              setShowAd(false);
              setTimeout(() => setShouldRender(false), 500);
            }, 15000);

            return () => clearTimeout(autoCloseTimer);
          }
        });
      }
    );

    return () => unsubscribe();
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideOutUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ad-container {
          animation: ${showAd ? 'slideInDown' : 'slideOutUp'} 0.5s ease-out forwards;
        }
        .feature-card {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .qr-box {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .qr-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      {/* Banner principal - Style Apple Professional */}
      <div className="ad-container bg-white py-8 px-6 text-gray-900 relative overflow-hidden">
        {/* Bouton fermer */}
        <button
          onClick={() => {
            setShowAd(false);
            setTimeout(() => setShouldRender(false), 500);
          }}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-red-600 mb-3 tracking-wide">INTELLECTION CLASSBOARD</p>
            <h2 className="text-5xl font-black mb-4 tracking-tight">
              L'app indispensable<br />de vos études
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Restez connecté avec votre emploi du temps, vos notifications et vos cours
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Feature 1 */}
            <div className="feature-card bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Consultation emploi du temps</h3>
                  <p className="text-sm text-gray-700">Accédez facilement à votre emploi du temps à tout moment</p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-6 border border-red-200" style={{animationDelay: '0.1s'}}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-600 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Notifications immédiates</h3>
                  <p className="text-sm text-gray-700">Soyez alerté des absences professeurs et retards</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200" style={{animationDelay: '0.2s'}}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Suivi en temps réel</h3>
                  <p className="text-sm text-gray-700">Consultez vos emplois du temps en direct</p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200" style={{animationDelay: '0.3s'}}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Demande de cours</h3>
                  <p className="text-sm text-gray-700">Demandez et gérez vos cours individuels facilement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Section */}
          <div className="bg-gray-900 rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Téléchargez maintenant</h3>
            <div className="grid lg:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Apple */}
              <div className="qr-box bg-white rounded-2xl p-6 flex flex-col items-center">
                <img
                  src="/app-store-logo.png"
                  alt="Apple App Store"
                  className="w-20 h-20 object-contain mb-4"
                />
                <h4 className="font-bold text-gray-900 mb-4">App Store</h4>
                <div className="bg-gray-100 p-2 rounded-lg mb-3">
                  <img
                    src={appleQRCode}
                    alt="Apple QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">Scannez pour télécharger</p>
              </div>

              {/* Android */}
              <div className="qr-box bg-white rounded-2xl p-6 flex flex-col items-center">
                <img
                  src="/google-play-logo.png"
                  alt="Google Play Store"
                  className="w-20 h-20 object-contain mb-4"
                />
                <h4 className="font-bold text-gray-900 mb-4">Google Play</h4>
                <div className="bg-gray-100 p-2 rounded-lg mb-3">
                  <img
                    src={androidQRCode}
                    alt="Android QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">Scannez pour télécharger</p>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Disponible sur iOS et Android · Gratuit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppAdvertisement;
