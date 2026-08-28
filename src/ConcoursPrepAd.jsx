import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection, doc } from 'firebase/firestore';

const DEFAULT_AUTO_TRIGGER_MINUTES = 2;

const ConcoursPrepAd = ({ onAdVisibilityChange, adLockRef }) => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [progress, setProgress] = useState(100);
  const [imageUrl, setImageUrl] = useState('/concours-prep.jpg');
  const [displayDuration, setDisplayDuration] = useState(30000);
  const [autoTriggerInterval, setAutoTriggerInterval] = useState(DEFAULT_AUTO_TRIGGER_MINUTES * 60 * 1000);
  const [enabled, setEnabled] = useState(true);

  // Charger l'image, la durée, la fréquence et l'activation depuis Firebase (live)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'concours_prep_image'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setImageUrl(data.url || '/concours-prep.jpg');
        setDisplayDuration((data.displayDuration || 30) * 1000);
        setAutoTriggerInterval((data.autoTriggerMinutes || DEFAULT_AUTO_TRIGGER_MINUTES) * 60 * 1000);
        setEnabled(data.enabled !== false);
      }
    }, (error) => console.error('Erreur chargement image Concours:', error));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (onAdVisibilityChange) onAdVisibilityChange(showAd);
  }, [showAd, onAdVisibilityChange]);

  // Affichage auto, cadencé par autoTriggerInterval (configurable côté admin)
  useEffect(() => {
    if (!enabled) {
      setShowAd(false);
      if (adLockRef && adLockRef.current === 'concours') adLockRef.current = null;
      setTimeout(() => setShouldRender(false), 500);
      return undefined;
    }

    let activeCleanup = null;

    const showAuto = () => {
      if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
      }
      if (adLockRef && adLockRef.current && adLockRef.current !== 'concours') {
        return; // une autre pub est déjà affichée, on saute ce cycle
      }
      if (adLockRef) adLockRef.current = 'concours';

      setShouldRender(true);
      setShowAd(true);
      setProgress(100);

      const closeTimer = setTimeout(() => {
        setShowAd(false);
        if (adLockRef && adLockRef.current === 'concours') adLockRef.current = null;
        setTimeout(() => setShouldRender(false), 500);
      }, displayDuration);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.max(0, prev - (100 / (displayDuration / 100))));
      }, 100);

      activeCleanup = () => {
        clearTimeout(closeTimer);
        clearInterval(progressInterval);
      };
    };

    showAuto();
    const recurringInterval = setInterval(showAuto, autoTriggerInterval);

    const unsubscribeTrigger = onSnapshot(collection(db, 'concours_prep_trigger'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') showAuto();
      });
    });

    return () => {
      if (activeCleanup) activeCleanup();
      clearInterval(recurringInterval);
      unsubscribeTrigger();
      if (adLockRef && adLockRef.current === 'concours') adLockRef.current = null;
    };
  }, [displayDuration, autoTriggerInterval, adLockRef, enabled]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center transition-all duration-500 ${
        showAd ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        pointerEvents: showAd ? 'auto' : 'none',
        backgroundColor: showAd ? 'rgba(15, 23, 42, 0.95)' : 'rgba(0, 0, 0, 0)',
      }}
    >
      <style>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.05) translate(8px, -5px);
          }
          100% {
            transform: scale(1.08) translate(-4px, 8px);
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.98);
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
            transform: scale(0.98);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-20px);
            opacity: 1;
          }
        }
        @keyframes textGlow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
          }
          50% {
            text-shadow: 0 0 40px rgba(255, 193, 7, 1);
          }
        }
        .ad-image {
          animation: fadeInScale 1s ease-out forwards, kenBurns 30s ease-in-out forwards;
          animation-delay: 0s, 1s;
          animation-fill-mode: forwards;
        }
        .particle {
          animation: float 3s ease-in-out infinite;
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: rgba(255, 193, 7, 0.8);
          border-radius: 50%;
        }
        .text-overlay {
          animation: textGlow 2s ease-in-out infinite;
          text-shadow: 0 0 30px rgba(255, 193, 7, 0.8), 0 0 60px rgba(255, 193, 7, 0.4);
        }
      `}</style>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          setShowAd(false);
          if (adLockRef && adLockRef.current === 'concours') adLockRef.current = null;
          setTimeout(() => setShouldRender(false), 500);
        }}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition z-50"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="particle" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
        <div className="particle" style={{ top: '20%', right: '10%', animationDelay: '0.5s' }}></div>
        <div className="particle" style={{ bottom: '15%', left: '20%', animationDelay: '1s' }}></div>
        <div className="particle" style={{ bottom: '10%', right: '15%', animationDelay: '1.5s' }}></div>
        <div className="particle" style={{ top: '50%', left: '5%', animationDelay: '2s' }}></div>
        <div className="particle" style={{ top: '30%', right: '5%', animationDelay: '2.5s' }}></div>
      </div>

      {/* Image container with Ken Burns effect */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt="Préparation aux Concours"
            className="ad-image w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
};

export default ConcoursPrepAd;
