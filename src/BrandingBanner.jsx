import React, { useState, useEffect } from 'react';
import { X, Crown } from 'lucide-react';
import { db } from './firebase';
import { onSnapshot, collection } from 'firebase/firestore';

const BrandingBanner = () => {
  const [showAd, setShowAd] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Listen for branding trigger from admin
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'branding_trigger'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            setShouldRender(true);
            setShowAd(true);

            // Auto-hide after 8 seconds
            const hideTimer = setTimeout(() => {
              setShowAd(false);
              setTimeout(() => setShouldRender(false), 500);
            }, 8000);

            return () => clearTimeout(hideTimer);
          }
        });
      }
    );

    return () => unsubscribe();
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 pointer-events-none ${
        showAd ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        pointerEvents: showAd ? 'auto' : 'none',
        backgroundColor: showAd ? 'rgba(15, 23, 42, 0.95)' : 'rgba(0, 0, 0, 0)',
      }}
    >
      <style>{`
        @keyframes slideInCard {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(-50px) rotateY(-10deg);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0) rotateY(0);
          }
        }
        @keyframes slideOutCard {
          from {
            opacity: 1;
            transform: scale(1) translateY(0) rotateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.85) translateY(50px) rotateY(10deg);
          }
        }
        @keyframes floatUp {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-25px);
          }
        }
        @keyframes crownRotate {
          0% {
            transform: rotateZ(-5deg) translateY(0);
          }
          50% {
            transform: rotateZ(5deg) translateY(-8px);
          }
          100% {
            transform: rotateZ(-5deg) translateY(0);
          }
        }
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 50px rgba(59, 130, 246, 0.8);
          }
        }
        @keyframes textGlow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          }
          50% {
            text-shadow: 0 0 40px rgba(255, 193, 7, 0.6);
          }
        }
        .card-appear {
          animation: slideInCard 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          perspective: 1000px;
        }
        .card-disappear {
          animation: slideOutCard 0.6s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        .float-logo {
          animation: floatUp 3.5s ease-in-out infinite;
          filter: drop-shadow(0 15px 40px rgba(59, 130, 246, 0.5));
        }
        .crown-icon {
          animation: crownRotate 2.5s ease-in-out infinite;
        }
        .glow-effect {
          animation: glowPulse 2s ease-in-out infinite;
        }
        .text-glow {
          animation: textGlow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Branding Card */}
      <div
        className={`relative w-full max-w-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 rounded-3xl p-12 shadow-2xl glow-effect ${
          showAd ? 'card-appear' : 'card-disappear'
        }`}
        style={{
          border: '2px solid rgba(59, 130, 246, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setShowAd(false);
            setTimeout(() => setShouldRender(false), 500);
          }}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition z-10"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Crown Badge */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 rounded-full p-3 crown-icon shadow-lg">
            <Crown className="w-8 h-8 text-blue-950" strokeWidth={3} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center text-center py-4">
          {/* Logo Section */}
          <div className="mb-6 mt-4">
            <img
              src="/logo-intellection.png"
              alt="Intellection"
              className="w-40 h-40 object-contain float-logo"
            />
          </div>

          {/* Divider Line */}
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-8"></div>

          {/* Text Section */}
          <div className="space-y-3">
            <h1 className="text-5xl font-black text-white tracking-tighter leading-tight text-glow">
              INTELLECTION
            </h1>

            <div className="space-y-1 mt-4">
              <p className="text-xl font-bold text-blue-200">
                N°1 du soutien scolaire
              </p>
              <p className="text-xl font-bold text-blue-200">
                & universitaire
              </p>
              <p className="text-2xl font-black text-yellow-400 tracking-wide">
                À EL JADIDA
              </p>
            </div>
          </div>

          {/* Animated Divider */}
          <div className="mt-6 flex justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>

          {/* Professional Subtitle */}
          <div className="mt-6 space-y-2">
            <p className="text-blue-100 text-sm font-semibold tracking-widest">
              ★ EXCELLENCE ACADÉMIQUE ★
            </p>
            <p className="text-blue-200/70 text-xs">
              Suivi Personnel • Qualité Garantie • Succès Assuré
            </p>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-yellow-400 to-blue-600 rounded-b-3xl"></div>
      </div>
    </div>
  );
};

export default BrandingBanner;
