import React, { useState, useEffect } from 'react';
import { X, Calendar, Bell, BookOpen, Zap, Download } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection } from 'firebase/firestore';

const AppAdvertisement = () => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const appleUrl = 'https://apps.apple.com/ma/app/intellection-classboard/id6758705463?l=ar';
  const androidUrl = 'https://play.google.com/store/apps/details?id=com.intellection.mobile';

  const appleQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(appleUrl)}`;
  const androidQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(androidUrl)}`;

  // Slides teaser
  const slides = [
    {
      icon: Calendar,
      color: 'blue',
      title: 'Consultez vos emplois du temps',
      description: 'Accédez instantanément à votre emploi du temps complet'
    },
    {
      icon: Bell,
      color: 'red',
      title: 'Recevez les notifications',
      description: 'Soyez alerté des absences ou retards des professeurs'
    },
    {
      icon: BookOpen,
      color: 'purple',
      title: 'Demandez des cours individuels',
      description: 'Accédez aux supports de cours et exercices électroniques'
    },
    {
      icon: Zap,
      color: 'amber',
      title: 'Restez connectés',
      description: 'Suivi en temps réel de votre scolarité'
    }
  ];

  useEffect(() => {
    // Afficher la pub toutes les 10 minutes
    const showAdvertisement = () => {
      setShouldRender(true);
      setShowAd(true);
      setCurrentSlide(0);

      // Auto-progression des slides
      const intervals = [];
      for (let i = 0; i < slides.length + 1; i++) {
        intervals.push(
          setTimeout(() => {
            if (i < slides.length) {
              setCurrentSlide(i);
            } else {
              setCurrentSlide(slides.length);
            }
          }, i * 3000)
        );
      }

      // Fermer après tout
      const closeTimer = setTimeout(() => {
        setShowAd(false);
        setTimeout(() => setShouldRender(false), 500);
      }, (slides.length + 1) * 3000 + 3000);

      return () => {
        intervals.forEach(t => clearTimeout(t));
        clearTimeout(closeTimer);
      };
    };

    // Afficher immédiatement au chargement
    showAdvertisement();

    // Puis toutes les 10 minutes (600000ms)
    const recurringInterval = setInterval(showAdvertisement, 600000);

    return () => clearInterval(recurringInterval);
  }, [slides.length]);

  // Écouter les triggers admin
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'advertisement_trigger'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            setShouldRender(true);
            setShowAd(true);
            setCurrentSlide(0);

            // Auto-progression des slides
            const intervals = [];
            for (let i = 0; i < slides.length + 1; i++) {
              intervals.push(
                setTimeout(() => {
                  if (i < slides.length) {
                    setCurrentSlide(i);
                  } else {
                    setCurrentSlide(slides.length);
                  }
                }, i * 3000)
              );
            }

            // Fermer après tout
            const closeTimer = setTimeout(() => {
              setShowAd(false);
              setTimeout(() => setShouldRender(false), 500);
            }, (slides.length + 1) * 3000 + 3000);

            return () => {
              intervals.forEach(t => clearTimeout(t));
              clearTimeout(closeTimer);
            };
          }
        });
      }
    );

    return () => unsubscribe();
  }, [slides.length]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeOutScale {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
        .teaser-slide {
          animation: fadeInScale 0.8s ease-out forwards;
        }
        .teaser-exit {
          animation: fadeOutScale 0.5s ease-out forwards;
        }
      `}</style>

      {/* Teaser Cinématique */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Bouton fermer */}
        <button
          onClick={() => {
            setShowAd(false);
            setTimeout(() => setShouldRender(false), 500);
          }}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition z-50"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
          <div
            className="h-full bg-red-600 transition-all duration-500"
            style={{ width: `${((currentSlide + 1) / (slides.length + 1)) * 100}%` }}
          ></div>
        </div>

        {/* Slides */}
        <div className="w-full h-full flex items-center justify-center">
          {/* Slide 0-3: Features */}
          {currentSlide < slides.length && (
            <div className="teaser-slide text-center text-white px-8 max-w-3xl">
              {/* Logo with white overlay */}
              <div className="mb-12 flex justify-center">
                <div className="relative w-32 h-32">
                  <img
                    src="/logo-intellection.png"
                    alt="Intellection"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-white/30 rounded-lg"></div>
                </div>
              </div>

              {/* Feature Icon */}
              {React.createElement(slides[currentSlide].icon, {
                className: `w-24 h-24 mx-auto mb-8 text-${slides[currentSlide].color}-500`
              })}
              <h2 className="text-6xl font-black mb-6 tracking-tight leading-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-2xl text-gray-300 leading-relaxed">
                {slides[currentSlide].description}
              </p>
              <div className="mt-8 flex justify-center gap-2">
                {slides.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentSlide ? 'bg-red-600 w-8' : 'bg-gray-700 w-2'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* Slide Final: Download */}
          {currentSlide === slides.length && (
            <div className="teaser-slide w-full">
              <div className="max-w-5xl mx-auto px-8">
                {/* Header */}
                <div className="text-center mb-12">
                  {/* Logo with white overlay */}
                  <div className="mb-8 flex justify-center">
                    <div className="relative w-40 h-40">
                      <img
                        src="/logo-intellection.png"
                        alt="Intellection"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-white/30 rounded-lg"></div>
                    </div>
                  </div>

                  <h2 className="text-6xl font-black text-white mb-4 tracking-tight">
                    INTELLECTION<br />CLASSBOARD
                  </h2>
                  <p className="text-2xl text-gray-400">L'app indispensable de vos études</p>
                </div>

                {/* Download Section */}
                <div className="grid lg:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  {/* Apple */}
                  <div className="bg-white rounded-3xl p-8 flex flex-col items-center hover:scale-105 transition">
                    <img
                      src="/app-store-logo.png"
                      alt="Apple App Store"
                      className="w-32 h-32 object-contain mb-6"
                    />
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">App Store</h3>
                    <div className="bg-gray-100 p-4 rounded-2xl mb-6 border-4 border-gray-200">
                      <img
                        src={appleQRCode}
                        alt="Apple QR Code"
                        className="w-56 h-56"
                      />
                    </div>
                    <p className="text-gray-700 font-semibold">Scannez pour télécharger</p>
                  </div>

                  {/* Android */}
                  <div className="bg-white rounded-3xl p-8 flex flex-col items-center hover:scale-105 transition">
                    <img
                      src="/google-play-logo.png"
                      alt="Google Play Store"
                      className="w-32 h-32 object-contain mb-6"
                    />
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Google Play</h3>
                    <div className="bg-gray-100 p-4 rounded-2xl mb-6 border-4 border-gray-200">
                      <img
                        src={androidQRCode}
                        alt="Android QR Code"
                        className="w-56 h-56"
                      />
                    </div>
                    <p className="text-gray-700 font-semibold">Scannez pour télécharger</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12">
                  <p className="text-gray-400 text-lg">
                    Disponible sur iOS et Android · Gratuit · Sans engagement
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppAdvertisement;
