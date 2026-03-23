import React, { useState, useEffect } from 'react';
import { X, Calendar, Bell, BookOpen, Zap, Download } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection } from 'firebase/firestore';

const AppAdvertisement = ({ onAdVisibilityChange }) => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const audioRef = React.useRef(null);

  const appleUrl = 'https://apps.apple.com/ma/app/intellection-classboard/id6758705463?l=ar';
  const androidUrl = 'https://drive.google.com/uc?export=download&id=1CEz3JigKOAD2iWErsLfTQhC38irng2Gz';
  const appleQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(appleUrl)}`;
  const androidQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(androidUrl)}`;

  const resultImages = ['/results-27950.jpg', '/results-3422.jpg', '/results-9168.jpg', '/results-4.jpg'];

  const getAnimationClass = (index) => {
    const animations = ['zoom-in-rotate', 'slide-in-left', 'zoom-in', 'slide-in-right', 'slide-up', 'zoom-in-rotate', 'slide-in-left'];
    return animations[index % animations.length];
  };

  const slides = [
    { icon: Calendar, color: 'blue', title: 'Consultez vos emplois du temps', description: 'Accédez instantanément à votre emploi du temps complet' },
    { icon: Bell, color: 'red', title: 'Recevez les notifications', description: 'Soyez alerté des absences ou retards des professeurs' },
    { icon: BookOpen, color: 'purple', title: 'Demandez des cours individuels', description: 'Accédez aux supports de cours et exercices électroniques' },
    { icon: Zap, color: 'amber', title: 'Restez connectés', description: 'Suivi en temps réel de votre scolarité' },
    { icon: Bell, color: 'green', title: 'Suivi Parental en Temps Réel', description: 'Les parents suivent précisément: présences, emploi du temps, performances et communications directes' }
  ];

  const playAdSoundtrack = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(() => {});
      }
    } catch (e) {}
  };

  const stopAdSoundtrack = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (onAdVisibilityChange) onAdVisibilityChange(showAd);
    if (showAd) playAdSoundtrack();
    else stopAdSoundtrack();
  }, [showAd, onAdVisibilityChange]);


  // Main advertisement - USING EXACT OLD LOGIC with UPDATED TIMINGS
  useEffect(() => {
    const showAdvertisement = () => {
      setShouldRender(true);
      setShowAd(true);
      setCurrentSlide(0);

      const intervals = [];
      let currentTime = 0;

      // Features slides: 2s each
      for (let i = 0; i < slides.length; i++) {
        intervals.push(
          setTimeout(() => {
            setCurrentSlide(i);
          }, currentTime)
        );
        currentTime += 2000;
      }

      // QR slide: 15s
      intervals.push(
        setTimeout(() => {
          setCurrentSlide(slides.length);
        }, currentTime)
      );
      currentTime += 15000;

      // Results slides: 10s each
      for (let i = 0; i < resultImages.length; i++) {
        intervals.push(
          setTimeout(() => {
            setCurrentSlide(slides.length + 1 + i);
          }, currentTime)
        );
        currentTime += 10000;
      }

      // Close ad
      const closeTimer = setTimeout(() => {
        setShowAd(false);
        setTimeout(() => setShouldRender(false), 500);
      }, currentTime);

      return () => {
        intervals.forEach(t => clearTimeout(t));
        clearTimeout(closeTimer);
      };
    };

    const cleanup = showAdvertisement();
    const recurringInterval = setInterval(showAdvertisement, 240000);

    return () => {
      cleanup();
      clearInterval(recurringInterval);
    };
  }, [slides.length]);

  // Admin trigger
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'advertisement_trigger'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          setShouldRender(true);
          setShowAd(true);
          setCurrentSlide(0);

          const intervals = [];
          let currentTime = 0;

          // Features slides: 2s each
          for (let i = 0; i < slides.length; i++) {
            intervals.push(
              setTimeout(() => {
                setCurrentSlide(i);
              }, currentTime)
            );
            currentTime += 2000;
          }

          // QR slide: 15s
          intervals.push(
            setTimeout(() => {
              setCurrentSlide(slides.length);
            }, currentTime)
          );
          currentTime += 15000;

          // Results slides: 10s each
          for (let i = 0; i < resultImages.length; i++) {
            intervals.push(
              setTimeout(() => {
                setCurrentSlide(slides.length + 1 + i);
              }, currentTime)
            );
            currentTime += 10000;
          }

          // Close ad
          const closeTimer = setTimeout(() => {
            setShowAd(false);
            setTimeout(() => setShouldRender(false), 500);
          }, currentTime);
        }
      });
    });

    return () => unsubscribe();
  }, [slides.length]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[9999] w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <audio ref={audioRef} src="/ad-soundtrack.mp3" onEnded={() => audioRef.current && (audioRef.current.currentTime = 0)} />
      <style>{`
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95) rotateX(10deg); } to { opacity: 1; transform: scale(1) rotateX(0deg); } }
        @keyframes fadeOutScale { from { opacity: 1; transform: scale(1) rotateX(0deg); } to { opacity: 0; transform: scale(0.95) rotateX(-10deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes rotate3D { 0% { transform: rotateY(0deg) rotateX(5deg); } 50% { transform: rotateY(5deg) rotateX(-5deg); } 100% { transform: rotateY(0deg) rotateX(5deg); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); } 50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.8) rotateZ(-5deg); } to { opacity: 1; transform: scale(1) rotateZ(0deg); } }
        @keyframes zoomInRotate { from { opacity: 0; transform: scale(0.7) rotate(-10deg); } to { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes crownRotate { 0% { transform: rotateZ(-5deg) translateY(0); } 50% { transform: rotateZ(5deg) translateY(-8px); } 100% { transform: rotateZ(-5deg) translateY(0); } }
        .teaser-slide { animation: fadeInScale 0.8s ease-out forwards; perspective: 1000px; }
        .logo-3d { animation: float 3s ease-in-out infinite, rotate3D 4s ease-in-out infinite; transform-style: preserve-3d; filter: drop-shadow(0 20px 40px rgba(255,255,255,0.2)); }
        .icon-bounce { animation: float 2.5s ease-in-out infinite; }
        .card-hover { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); transform-style: preserve-3d; }
        .card-hover:hover { transform: translateY(-10px) rotateY(5deg) scale(1.05); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); }
        .slide-in { animation: slideIn 0.6s ease-out; }
        .slide-in-left { animation: slideInLeft 0.7s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .slide-in-right { animation: slideInRight 0.7s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .zoom-in { animation: zoomIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .zoom-in-rotate { animation: zoomInRotate 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .slide-up { animation: slideUp 0.7s ease-out; }
      `}</style>

      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-700/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-800/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        <button onClick={() => { setShowAd(false); setTimeout(() => setShouldRender(false), 500); }} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition z-50">
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
          <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${((currentSlide + 1) / (slides.length + 2 + resultImages.length)) * 100}%` }}></div>
        </div>

        <div className="w-full h-full flex items-center justify-center">
          {currentSlide >= 0 && currentSlide < slides.length && (
            <div key={`slide-${currentSlide}`} className={`teaser-slide text-center text-white px-8 max-w-4xl ${getAnimationClass(currentSlide)}`}>
              <div className="flex flex-col items-center justify-center">
                {React.createElement(slides[currentSlide].icon, { className: `w-40 h-40 mb-3 text-${slides[currentSlide].color}-500 icon-bounce` })}
                <h2 className="text-5xl font-black tracking-tight leading-tight text-center text-white slide-in">{slides[currentSlide].title}</h2>
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto mb-4 mt-4">{slides[currentSlide].description}</p>
                <img src="/logo-intellection.png" alt="Intellection" className="w-56 h-56 object-contain logo-3d mb-3" />
              </div>
            </div>
          )}

          {currentSlide === slides.length && (
            <div key="qr-slide" className="teaser-slide w-full py-4 zoom-in">
              <div className="max-w-6xl mx-auto px-8">
                <div className="text-center mb-4">
                  <h2 className="text-5xl font-black tracking-tight leading-tight text-white slide-in">INTELLECTION<br />CLASSBOARD</h2>
                  <p className="text-lg text-gray-300 mt-1">L'app indispensable de vos études</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-5 max-w-3xl mx-auto mb-4">
                  <div className="bg-white rounded-3xl p-6 flex flex-col items-center card-hover h-full min-h-[480px] shadow-2xl">
                    <div className="flex items-center gap-3 mb-2 w-full">
                      <img src="/app-store-logo.png" alt="Apple App Store" className="w-14 h-14 object-contain" />
                      <h3 className="text-xl font-bold text-gray-900">App Store</h3>
                    </div>
                    <div className="bg-gray-100 p-2 rounded-lg border-3 border-gray-300 flex-grow flex items-center justify-center">
                      <img src={appleQRCode} alt="Apple QR Code" className="w-44 h-44" />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm mt-2">Scannez pour télécharger</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 flex flex-col items-center card-hover h-full min-h-[480px] shadow-2xl">
                    <div className="flex items-center gap-3 mb-2 w-full">
                      <img src="/google-play-logo.png" alt="Android APK Download" className="w-14 h-14 object-contain" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Intellection APK</h3>
                        <p className="text-xs text-green-600 font-semibold">Téléchargement Direct</p>
                      </div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded-lg border-3 border-gray-300 flex-grow flex items-center justify-center">
                      <img src={androidQRCode} alt="Android APK QR Code" className="w-44 h-44" />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm mt-2">Scannez pour télécharger</p>
                    <p className="text-gray-500 text-xs mt-1">Installation directe sans Play Store</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <img src="/logo-intellection.png" alt="Intellection" className="w-48 h-48 object-contain logo-3d mt-2 mb-2" />
                </div>
                <div className="text-center mt-1">
                  <p className="text-gray-400 text-xs">iOS · Android · Gratuit · Sans engagement</p>
                </div>
              </div>
            </div>
          )}

          {currentSlide > slides.length && currentSlide <= slides.length + resultImages.length && (
            <div className="teaser-slide w-full py-4">
              <div className="max-w-6xl mx-auto px-8 h-full flex items-center justify-center">
                <img src={resultImages[currentSlide - slides.length - 1]} alt={`Résultats`} className="w-full h-auto object-contain max-h-[90vh] rounded-lg shadow-2xl" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppAdvertisement;
