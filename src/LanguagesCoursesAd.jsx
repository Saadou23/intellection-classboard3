import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection, doc, getDoc } from 'firebase/firestore';

const LanguagesCoursesAd = () => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [progress, setProgress] = useState(100);
  const [imageUrl, setImageUrl] = useState('/languages-courses.jpg');
  const [displayDuration, setDisplayDuration] = useState(30000);

  // Charger l'image et durée depuis Firebase
  useEffect(() => {
    const loadImageConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'languages_courses_image');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setImageUrl(docSnap.data().url || '/languages-courses.jpg');
          setDisplayDuration((docSnap.data().displayDuration || 30) * 1000);
        }
      } catch (error) {
        console.error('Erreur chargement image Langues:', error);
      }
    };
    loadImageConfig();
  }, []);

  const AUTO_TRIGGER_INTERVAL = 300000;

  // Auto-display every 3 minutes
  useEffect(() => {
    const showAuto = () => {
      setShouldRender(true);
      setShowAd(true);
      setProgress(100);

      const closeTimer = setTimeout(() => {
        setShowAd(false);
        setTimeout(() => setShouldRender(false), 500);
      }, displayDuration);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.max(0, prev - (100 / (displayDuration / 100))));
      }, 100);

      return () => {
        clearTimeout(closeTimer);
        clearInterval(progressInterval);
      };
    };

    const cleanup = showAuto();
    const recurringInterval = setInterval(showAuto, AUTO_TRIGGER_INTERVAL);

    return () => {
      cleanup();
      clearInterval(recurringInterval);
    };
  }, [displayDuration]);

  // Admin trigger from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'languages_courses_trigger'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          setShouldRender(true);
          setShowAd(true);
          setProgress(100);

          const closeTimer = setTimeout(() => {
            setShowAd(false);
            setTimeout(() => setShouldRender(false), 500);
          }, displayDuration);

          const progressInterval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - (100 / (displayDuration / 100))));
          }, 100);

          return () => {
            clearTimeout(closeTimer);
            clearInterval(progressInterval);
          };
        }
      });
    });

    return () => unsubscribe();
  }, [displayDuration]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9997] flex items-center justify-center transition-all duration-500 ${
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
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          }
          50% {
            text-shadow: 0 0 40px rgba(59, 130, 246, 1);
          }
        }
        .ad-image {
          animation: fadeInScale 1s ease-out forwards, kenBurns 20s ease-in-out forwards;
          animation-delay: 0s, 1s;
          animation-fill-mode: forwards;
        }
        .particle {
          animation: float 3s ease-in-out infinite;
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: rgba(59, 130, 246, 0.8);
          border-radius: 50%;
        }
        .text-overlay {
          animation: textGlow 2s ease-in-out infinite;
          text-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4);
        }
      `}</style>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          setShowAd(false);
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
            alt="Inscriptions Cours de Langues"
            className="ad-image w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
};

export default LanguagesCoursesAd;
