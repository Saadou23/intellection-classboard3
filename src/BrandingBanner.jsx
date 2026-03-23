import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const BrandingBanner = ({ isVisible = true }) => {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      setShowBanner(false);
      return;
    }

    setShowBanner(true);

    // Auto-hide after 8 seconds
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!showBanner) return null;

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Text Section */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/logo-intellection.png"
                alt="Intellection"
                className="h-16 w-16 object-contain drop-shadow"
              />
            </div>

            {/* Text Content */}
            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-black text-white tracking-tight">
                INTELLECTION
              </h3>
              <p className="text-sm font-bold text-blue-100">
                N°1 du soutien scolaire & universitaire à <span className="text-yellow-300">EL JADIDA</span>
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="hidden sm:flex items-center gap-2 text-white font-semibold text-sm hover:text-blue-100 cursor-pointer transition">
            <span>Découvrir l'app</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingBanner;
