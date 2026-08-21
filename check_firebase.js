import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAzB4HZxEMDfzTDBaAcOc2JxC_S2kKO6EY",
  authDomain: "intellection-bd3b8.firebaseapp.com",
  projectId: "intellection-bd3b8",
  storageBucket: "intellection-bd3b8.appspot.com",
  messagingSenderId: "834883405826",
  appId: "1:834883405826:web:b2abf0de65f5b74fbb0b98"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkConfig() {
  try {
    const configRef = doc(db, 'exam-settings', 'config');
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const data = configSnap.data();
      console.log('✅ exam-settings/config existe');
      console.log('📊 Données:');
      console.log('  - levels:', data.levels?.length || 0, 'niveaux');
      console.log('  - subjects:', data.subjects?.length || 0, 'matières');
      console.log('  - examTypes:', data.examTypes?.length || 0, 'types');
      console.log('\n📋 Détails des levels:', JSON.stringify(data.levels, null, 2));
      console.log('\n📋 Détails des subjects:', JSON.stringify(data.subjects, null, 2));
    } else {
      console.log('❌ exam-settings/config N\'existe PAS');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  process.exit(0);
}

checkConfig();
