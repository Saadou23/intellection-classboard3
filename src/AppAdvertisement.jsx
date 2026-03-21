import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection } from 'firebase/firestore';

const AppAdvertisement = () => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const appleUrl = 'https://apps.apple.com/ma/app/intellection-classboard/id6758705463?l=ar';
  const androidUrl = 'https://play.google.com/store/apps/details?id=com.intellection.mobile';

  const appleQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(appleUrl)}`;
  const androidQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(androidUrl)}`;

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
            transform: translateY(-30px);
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
            transform: translateY(-30px);
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(255,255,255,0.1);
          }
          50% {
            box-shadow: 0 0 50px rgba(59, 130, 246, 0.9), inset 0 0 30px rgba(255,255,255,0.15);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .ad-container {
          animation: ${showAd ? 'slideInDown' : 'slideOutUp'} 0.5s ease-out forwards;
        }
        .app-card {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .qr-container {
          animation: float 3s ease-in-out infinite;
        }
        .shimmer-bg {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* Banner principal - Identité Intellection */}
      <div className="ad-container bg-gradient-to-r from-black via-gray-900 to-red-950 py-6 px-6 text-white relative overflow-hidden border-b-4 border-red-700">
        {/* Arrière-plan animé avec plus de présence */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, transparent 50%)',
          }}></div>
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-red-900/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-700/10 rounded-full blur-3xl"></div>
        </div>

        {/* Contenu */}
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Bouton fermer */}
          <button
            onClick={() => {
              setShowAd(false);
              setTimeout(() => setShouldRender(false), 500);
            }}
            className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-full transition hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Titre et description */}
          <div className="text-center mb-6">
            <div className="inline-block mb-2 px-4 py-1.5 bg-red-700/50 border-2 border-red-500 rounded-full backdrop-blur-sm">
              <p className="text-red-100 text-xs font-black tracking-widest">✨ APPLICATION OFFICIELLE ✨</p>
            </div>
            <h2 className="text-5xl font-black mb-1 tracking-wider text-white drop-shadow-lg" style={{textShadow: '0 2px 8px rgba(220, 38, 38, 0.5)'}}>
              INTELLECTION
            </h2>
            <h3 className="text-3xl font-bold mb-3 text-red-400 tracking-wide">
              CLASSBOARD
            </h3>
            <p className="text-lg font-semibold text-gray-100 mb-3 max-w-3xl mx-auto leading-relaxed">
              📱 Emploi du temps · Notifications · Suivi temps réel
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="h-0.5 w-8 bg-gradient-to-r from-transparent to-red-600 rounded-full"></div>
              <span className="text-white font-bold text-sm tracking-wider">GRATUIT • RAPIDE • SÉCURISÉ</span>
              <div className="h-0.5 w-8 bg-gradient-to-l from-transparent to-red-600 rounded-full"></div>
            </div>
          </div>

          {/* Cartes QR - Taille optimisée */}
          <div className="grid lg:grid-cols-2 gap-5 max-w-4xl mx-auto mb-5">
            {/* Apple */}
            <div className="app-card bg-gradient-to-br from-gray-950/80 to-black/80 backdrop-blur-xl rounded-2xl p-5 border-2 border-red-700 hover:border-red-500 shadow-lg hover:shadow-red-900/50 transition">
              <div className="flex flex-col items-center gap-3">
                {/* Logo Apple Store */}
                <div className="p-2 rounded-xl shadow-lg bg-white/5">
                  <img
                    src="/app-store-logo.png"
                    alt="Apple App Store"
                    className="w-24 h-24 object-contain drop-shadow-lg"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Apple Store</h3>
                </div>
                {/* QR Code */}
                <div className="qr-container bg-white p-2 rounded-lg shadow-lg border-2 border-white">
                  <img
                    src={appleQRCode}
                    alt="Apple QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            </div>

            {/* Android */}
            <div className="app-card bg-gradient-to-br from-gray-950/80 to-black/80 backdrop-blur-xl rounded-2xl p-5 border-2 border-red-700 hover:border-red-500 shadow-lg hover:shadow-red-900/50 transition">
              <div className="flex flex-col items-center gap-3">
                {/* Logo Google Play */}
                <div className="p-2 rounded-xl shadow-lg bg-white/5">
                  <img
                    src="/google-play-logo.png"
                    alt="Google Play Store"
                    className="w-24 h-24 object-contain drop-shadow-lg"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Google Play</h3>
                </div>
                {/* QR Code */}
                <div className="qr-container bg-white p-2 rounded-lg shadow-lg border-2 border-white">
                  <img
                    src={androidQRCode}
                    alt="Android QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Avantages */}
          <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto text-center mt-4">
            <div className="bg-red-900/30 backdrop-blur border border-red-600/40 p-3 rounded-lg hover:border-red-500 transition">
              <div className="text-3xl mb-1">📱</div>
              <p className="text-sm font-bold text-white">Interface</p>
              <p className="text-xs text-gray-400">Moderne</p>
            </div>
            <div className="bg-red-900/30 backdrop-blur border border-red-600/40 p-3 rounded-lg hover:border-red-500 transition">
              <div className="text-3xl mb-1">🔔</div>
              <p className="text-sm font-bold text-white">Alertes</p>
              <p className="text-xs text-gray-400">Instant</p>
            </div>
            <div className="bg-red-900/30 backdrop-blur border border-red-600/40 p-3 rounded-lg hover:border-red-500 transition">
              <div className="text-3xl mb-1">⚡</div>
              <p className="text-sm font-bold text-white">Rapide</p>
              <p className="text-xs text-gray-400">Optimisé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ligne décoration - Intellection Red */}
      <div className="shimmer-bg h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
    </div>
  );
};

export default AppAdvertisement;
