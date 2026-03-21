import React, { useState, useEffect } from 'react';
import { X, Calendar, Bell, BookOpen, Zap, Download } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection } from 'firebase/firestore';

const AppAdvertisement = ({ onAdVisibilityChange }) => {
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

  // Notifier le parent quand la pub s'affiche/disparaît
  useEffect(() => {
    if (onAdVisibilityChange) {
      onAdVisibilityChange(showAd);
    }
  }, [showAd, onAdVisibilityChange]);

  useEffect(() => {
    // Afficher la pub toutes les 10 minutes
    const showAdvertisement = () => {
      setShouldRender(true);
      setShowAd(true);
      setCurrentSlide(0);

      // Auto-progression des slides
      const intervals = [];
      for (let i = 0; i < slides.length + 1; i++) {
        const delay = i < slides.length ? i * 3000 : slides.length * 3000;
        intervals.push(
          setTimeout(() => {
            if (i < slides.length) {
              setCurrentSlide(i);
            } else {
              setCurrentSlide(slides.length);
            }
          }, delay)
        );
      }

      // Fermer après tout - Le dernier slide (QR) reste 15 secondes
      const closeTimer = setTimeout(() => {
        setShowAd(false);
        setTimeout(() => setShouldRender(false), 500);
      }, slides.length * 3000 + 15000);

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
              const delay = i < slides.length ? i * 3000 : slides.length * 3000;
              intervals.push(
                setTimeout(() => {
                  if (i < slides.length) {
                    setCurrentSlide(i);
                  } else {
                    setCurrentSlide(slides.length);
                  }
                }, delay)
              );
            }

            // Fermer après tout - Le dernier slide (QR) reste 15 secondes
            const closeTimer = setTimeout(() => {
              setShowAd(false);
              setTimeout(() => setShouldRender(false), 500);
            }, slides.length * 3000 + 15000);

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
        <div className="w-full h-full flex items-end justify-center pb-8">
          {/* Slide 0-3: Features */}
          {currentSlide < slides.length && (
            <div className="teaser-slide text-center text-white px-8 max-w-4xl">
              {/* Content + Logo in vertical layout */}
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center mb-4">
                  {React.createElement(slides[currentSlide].icon, {
                    className: `w-40 h-40 mb-3 text-${slides[currentSlide].color}-500`
                  })}
                  <h2 className="text-5xl font-black tracking-tight leading-tight text-center">
                    {slides[currentSlide].title}
                  </h2>
                </div>
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto mb-4">
                {slides[currentSlide].description}
              </p>

                {/* Logo at bottom */}
                <img
                  src="/logo-intellection.png"
                  alt="Intellection"
                  className="w-56 h-56 object-contain drop-shadow-2xl mb-3"
                  style={{ filter: 'drop-shadow(0 20px 40px rgba(255,255,255,0.2))' }}
                />
              </div>
              <div className="mt-2 flex justify-center gap-2">
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
            <div className="teaser-slide w-full py-4">
              <div className="max-w-6xl mx-auto px-8">
                {/* Header - Title */}
                <div className="text-center mb-4">
                  <h2 className="text-5xl font-black text-white tracking-tight leading-tight">
                    INTELLECTION<br />CLASSBOARD
                  </h2>
                  <p className="text-lg text-gray-300 mt-1">L'app indispensable de vos études</p>
                </div>

                {/* Download Section */}
                <div className="grid lg:grid-cols-2 gap-5 max-w-3xl mx-auto mb-4">
                  {/* Apple */}
                  <div className="bg-white rounded-2xl p-5 flex flex-col items-center hover:scale-105 transition">
                    <div className="flex items-center gap-3 mb-2 w-full">
                      <img
                        src="/app-store-logo.png"
                        alt="Apple App Store"
                        className="w-14 h-14 object-contain"
                      />
                      <h3 className="text-xl font-bold text-gray-900">App Store</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg mb-2 border-3 border-gray-300">
                      <img
                        src={appleQRCode}
                        alt="Apple QR Code"
                        className="w-44 h-44"
                      />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm">Scannez pour télécharger</p>
                  </div>

                  {/* Android */}
                  <div className="bg-white rounded-2xl p-5 flex flex-col items-center hover:scale-105 transition">
                    <div className="flex items-center gap-3 mb-2 w-full">
                      <img
                        src="/google-play-logo.png"
                        alt="Google Play Store"
                        className="w-14 h-14 object-contain"
                      />
                      <h3 className="text-xl font-bold text-gray-900">Google Play</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg mb-2 border-3 border-gray-300">
                      <img
                        src={androidQRCode}
                        alt="Android QR Code"
                        className="w-44 h-44"
                      />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm">Scannez pour télécharger</p>
                  </div>
                </div>

                {/* Logo at bottom */}
                <div className="flex justify-center">
                  <img
                    src="/logo-intellection.png"
                    alt="Intellection"
                    className="w-48 h-48 object-contain drop-shadow-2xl mt-2 mb-2"
                    style={{ filter: 'drop-shadow(0 20px 40px rgba(255,255,255,0.2))' }}
                  />
                </div>

                {/* Footer */}
                <div className="text-center mt-1">
                  <p className="text-gray-400 text-xs">
                    iOS · Android · Gratuit · Sans engagement
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
