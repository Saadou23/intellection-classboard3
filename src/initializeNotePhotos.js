import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const initializeNotePhotos = async () => {
  try {
    const notePhotosData = {
      photos: [
        { url: '/results-27950.jpg', title: 'Résultats 1', displayDuration: 15 },
        { url: '/results-3422.jpg', title: 'Résultats 2', displayDuration: 15 },
        { url: '/results-9168.jpg', title: 'Résultats 3', displayDuration: 15 },
        { url: '/results-4.jpg', title: 'Résultats 4', displayDuration: 15 },
      ]
    };

    await setDoc(doc(db, 'settings', 'note_photos'), notePhotosData);
    console.log('✅ Photos de notes initialisées avec succès!');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    return false;
  }
};
