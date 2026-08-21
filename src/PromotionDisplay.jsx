import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from './firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

const PromotionDisplay = ({ audience = 'all' }) => {
  const [activePromotion, setActivePromotion] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownPromotions, setShownPromotions] = useState({});

  // Charger les promotions actives
  useEffect(() => {
    loadActivePromotions();
  }, [audience]);

  const loadActivePromotions = async () => {
    try {
      const now = new Date().toISOString().split('T')[0];

      let q;
      if (audience === 'all') {
        q = query(
          collection(db, 'promotions'),
          where('enabled', '==', true)
        );
      } else {
        q = query(
          collection(db, 'promotions'),
          where('enabled', '==', true),
          where('targetAudience', 'in', [audience, 'all'])
        );
      }

      const querySnapshot = await getDocs(q);
      const promotionsData = [];

      querySnapshot.forEach(doc => {
        const promo = doc.data();
        const startDate = promo.startDate;
        const endDate = promo.endDate;

        // Vérifier les dates
        if (startDate && startDate <= now && (!endDate || endDate >= now)) {
          promotionsData.push({ id: doc.id, ...promo });
        }
      });

      setPromotions(promotionsData);

      // Afficher la première promotion valide
      if (promotionsData.length > 0) {
        selectPromotion(promotionsData[0]);
      }
    } catch (error) {
      console.error('Erreur chargement promotions:', error);
    }
  };

  const selectPromotion = (promotion) => {
    // Vérifier si on doit afficher
    const today = new Date().toISOString().split('T')[0];
    const key = `${promotion.id}-${today}`;

    if (promotion.frequency === 'always') {
      setActivePromotion(promotion);
      setIsVisible(true);
      recordPromoDisplay(promotion.id, key);
    } else if (promotion.frequency === 'daily') {
      if (!shownPromotions[key]) {
        setActivePromotion(promotion);
        setIsVisible(true);
        recordPromoDisplay(promotion.id, key);
      }
    } else if (promotion.frequency === 'custom' && promotion.maxShowsPerDay) {
      const count = shownPromotions[key] || 0;
      if (count < promotion.maxShowsPerDay) {
        setActivePromotion(promotion);
        setIsVisible(true);
        recordPromoDisplay(promotion.id, key);
      }
    } else if (promotion.frequency === 'weekly') {
      const week = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24 * 7));
      const weekKey = `${promotion.id}-week-${week}`;
      if (!shownPromotions[weekKey]) {
        setActivePromotion(promotion);
        setIsVisible(true);
        recordPromoDisplay(promotion.id, weekKey);
      }
    }
  };

  const recordPromoDisplay = async (promotionId, key) => {
    try {
      // Sauvegarder localement
      setShownPromotions(prev => ({
        ...prev,
        [key]: (prev[key] || 0) + 1
      }));

      // Mettre à jour Firebase
      const docRef = doc(db, 'promotions', promotionId);
      await updateDoc(docRef, {
        showCount: (activePromotion?.showCount || 0) + 1,
        lastShown: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur enregistrement affichage:', error);
    }
  };

  const closePromotion = () => {
    setIsVisible(false);

    // Afficher la prochaine après 5 secondes
    setTimeout(() => {
      const nextIndex = (currentIndex + 1) % promotions.length;
      setCurrentIndex(nextIndex);
      if (promotions[nextIndex]) {
        selectPromotion(promotions[nextIndex]);
      }
    }, 5000);
  };

  // Auto-fermer après la durée spécifiée
  useEffect(() => {
    if (isVisible && activePromotion) {
      const timer = setTimeout(() => {
        closePromotion();
      }, (activePromotion.displayDuration || 15) * 1000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, activePromotion]);

  if (!isVisible || !activePromotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fadeIn">
        {/* Close button */}
        <button
          onClick={closePromotion}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition z-10 bg-white/80"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Image */}
        {activePromotion.imageUrl && (
          <div className="w-full h-64 overflow-hidden bg-gray-200">
            <img
              src={activePromotion.imageUrl}
              alt={activePromotion.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {activePromotion.title}
          </h2>
          {activePromotion.description && (
            <p className="text-gray-600 text-lg mb-4">
              {activePromotion.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1 mt-4">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all"
              style={{
                animation: `shrink ${(activePromotion.displayDuration || 15)}s linear forwards`
              }}
            />
          </div>

          <div className="text-xs text-gray-500 mt-2 text-center">
            Fermeture automatique dans {activePromotion.displayDuration || 15}s
          </div>
        </div>

        {/* Promotions counter */}
        {promotions.length > 1 && (
          <div className="flex justify-center gap-2 pb-4 px-4">
            {promotions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition ${
                  idx === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default PromotionDisplay;
