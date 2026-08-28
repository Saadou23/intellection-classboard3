import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection, doc } from 'firebase/firestore';

const DEFAULT_AUTO_TRIGGER_MINUTES = 3;

const CustomAdsDisplay = ({ onAdVisibilityChange, adLockRef }) => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ads, setAds] = useState([]);
  const [autoTriggerInterval, setAutoTriggerInterval] = useState(DEFAULT_AUTO_TRIGGER_MINUTES * 60 * 1000);

  // Charger les pubs personnalisées depuis Firebase (live)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'custom_ads'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const activeAds = (data.ads || []).filter(ad => ad.url && ad.enabled !== false);
        setAds(activeAds);
        setAutoTriggerInterval((data.autoTriggerMinutes || DEFAULT_AUTO_TRIGGER_MINUTES) * 60 * 1000);
      }
    }, (error) => console.error('Erreur chargement pubs personnalisées:', error));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (onAdVisibilityChange) onAdVisibilityChange(showAd);
  }, [showAd, onAdVisibilityChange]);

  // Affichage auto: enchaîne toutes les pubs actives, chacune pendant sa durée propre
  useEffect(() => {
    if (ads.length === 0) return undefined;

    let activeCleanup = null;

    const showAuto = () => {
      if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
      }
      if (adLockRef && adLockRef.current && adLockRef.current !== 'custom') {
        return; // une autre pub est déjà affichée, on saute ce cycle
      }
      if (adLockRef) adLockRef.current = 'custom';

      setShouldRender(true);
      setShowAd(true);
      setCurrentIndex(0);

      const timers = [];
      let elapsed = 0;
      ads.forEach((ad, i) => {
        timers.push(setTimeout(() => setCurrentIndex(i), elapsed));
        elapsed += (ad.displayDuration || 15) * 1000;
      });

      const closeTimer = setTimeout(() => {
        setShowAd(false);
        if (adLockRef && adLockRef.current === 'custom') adLockRef.current = null;
        setTimeout(() => setShouldRender(false), 500);
      }, elapsed);
      timers.push(closeTimer);

      activeCleanup = () => timers.forEach(clearTimeout);
    };

    showAuto();
    const recurringInterval = setInterval(showAuto, autoTriggerInterval);

    const unsubscribeTrigger = onSnapshot(collection(db, 'custom_ads_trigger'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') showAuto();
      });
    });

    return () => {
      if (activeCleanup) activeCleanup();
      clearInterval(recurringInterval);
      unsubscribeTrigger();
      if (adLockRef && adLockRef.current === 'custom') adLockRef.current = null;
    };
  }, [ads, autoTriggerInterval, adLockRef]);

  if (!shouldRender || ads.length === 0) return null;
  const current = ads[currentIndex] || ads[0];

  return (
    <div
      className={`fixed inset-0 z-[9996] flex items-center justify-center transition-all duration-500 ${
        showAd ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        pointerEvents: showAd ? 'auto' : 'none',
        backgroundColor: showAd ? 'rgba(15, 23, 42, 0.95)' : 'rgba(0, 0, 0, 0)',
      }}
    >
      <style>{`
        @keyframes customAdFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .custom-ad-image { animation: customAdFadeIn 0.6s ease-out forwards; }
      `}</style>

      <button
        onClick={() => {
          setShowAd(false);
          if (adLockRef && adLockRef.current === 'custom') adLockRef.current = null;
          setTimeout(() => setShouldRender(false), 500);
        }}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition z-50"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        <img
          key={currentIndex}
          src={current.url}
          alt={current.title || 'Publicité'}
          className="custom-ad-image w-full h-full object-cover"
        />
        {current.title && (
          <div className="absolute bottom-10 left-0 right-0 text-center">
            <p className="text-white text-2xl font-bold drop-shadow-lg px-6">{current.title}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomAdsDisplay;
