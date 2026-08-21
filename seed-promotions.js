import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Configuration Firebase (à adapter avec vos vraies credentials)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Images de test (base64 ou URLs)
const testPromotions = [
  {
    title: '📱 Téléchargez l\'App INTELLECTION',
    description: 'Accédez à votre emploi du temps, vos notes et plus encore, directement depuis votre téléphone.',
    imageUrl: 'https://via.placeholder.com/600x300?text=App+INTELLECTION',
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
    imageUrl: 'https://via.placeholder.com/600x300?text=INTELLECTION+Branding',
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
    imageUrl: 'https://via.placeholder.com/600x300?text=Concours+Prep',
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
    imageUrl: 'https://via.placeholder.com/600x300?text=Langues+Courses',
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

async function seedPromotions() {
  try {
    console.log('🌱 Ajout des promotions de test...\n');

    for (const promo of testPromotions) {
      const docRef = await addDoc(collection(db, 'promotions'), promo);
      console.log(`✅ ${promo.title}`);
      console.log(`   ID: ${docRef.id}`);
      console.log(`   Type: ${promo.type}`);
      console.log(`   Fréquence: ${promo.frequency}\n`);
    }

    console.log('✨ Toutes les promotions ont été ajoutées!');
    console.log('\n📍 Vérifiez dans l\'admin: Communications → 📢 Gestion des Promotions');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedPromotions();
