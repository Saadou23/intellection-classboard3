import React, { useState } from 'react';
import { Zap, Download } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const SeedPromotions = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const testPromotions = [
    {
      title: '📱 Téléchargez l\'App INTELLECTION',
      description: 'Accédez à votre emploi du temps, vos notes et plus encore, directement depuis votre téléphone.',
      imageUrl: 'https://via.placeholder.com/600x400?text=App+INTELLECTION&font=raleway',
      type: 'app',
      frequency: 'always',
      displayDuration: 15,
      enabled: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      maxShowsPerDay: null,
      targetAudience: 'students',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      showCount: 0,
      lastShown: null
    },
    {
      title: '🏆 INTELLECTION - N°1 du Soutien Scolaire',
      description: 'Le leader du soutien scolaire et universitaire à El Jadida depuis 2015.',
      imageUrl: 'https://via.placeholder.com/600x400?text=INTELLECTION+Branding&font=raleway',
      type: 'branding',
      frequency: 'daily',
      displayDuration: 8,
      enabled: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      maxShowsPerDay: null,
      targetAudience: 'all',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      showCount: 0,
      lastShown: null
    },
    {
      title: '🎓 Préparation aux Concours',
      description: 'Préparez-vous aux concours d\'accès: Médecine, ENSA/ENSAM, ENCG, ENA. Taux de réussite: 85%',
      imageUrl: 'https://via.placeholder.com/600x400?text=Concours+Prep&font=raleway',
      type: 'concours',
      frequency: 'weekly',
      displayDuration: 30,
      enabled: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      maxShowsPerDay: null,
      targetAudience: 'students',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      showCount: 0,
      lastShown: null
    },
    {
      title: '🌍 Cours d\'Anglais & Français',
      description: 'Summer 2026: Cours interactifs, professeurs expérimentés, progression garantie. Inscriptions ouvertes!',
      imageUrl: 'https://via.placeholder.com/600x400?text=Langues+Courses&font=raleway',
      type: 'languages',
      frequency: 'custom',
      displayDuration: 20,
      enabled: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      maxShowsPerDay: 2,
      targetAudience: 'students',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      showCount: 0,
      lastShown: null
    }
  ];

  const handleSeedPromotions = async () => {
    setLoading(true);
    try {
      let count = 0;
      for (const promo of testPromotions) {
        await addDoc(collection(db, 'promotions'), promo);
        count++;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      console.log(`✅ ${count} promotions ajoutées!`);
      // Recharger la page après quelques secondes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de l\'ajout des promotions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🌱</div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Données de Test</h3>
            <p className="text-sm text-gray-600">Ajoutez 4 promotions de test pour démarrer rapidement</p>
          </div>
        </div>
        <button
          onClick={handleSeedPromotions}
          disabled={loading || success}
          className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition text-white ${
            success
              ? 'bg-green-600'
              : loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          {success ? (
            <>
              <span>✅ Ajoutées!</span>
            </>
          ) : loading ? (
            <>
              <span className="animate-spin">⏳</span>
              Ajout en cours...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              🌱 Ajouter les données de test
            </>
          )}
        </button>
      </div>

      <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Les promotions ajoutées:</strong> App Mobile, Branding, Concours, Langues
        </p>
      </div>
    </div>
  );
};

export default SeedPromotions;
