import { db } from './firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

/**
 * Get all videos from Firestore
 * @returns {Promise<Array>} Array of video objects
 */
export async function getVideos() {
  try {
    const q = query(collection(db, 'videos'), where('enabled', '==', true));
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return videos.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Erreur chargement vidéos:', error);
    return [];
  }
}

/**
 * Get videos by type
 * @param {string} type - 'advertisement' | 'announcement' | 'all'
 * @returns {Promise<Array>} Filtered videos
 */
export async function getVideosByType(type = 'all') {
  try {
    let q;
    if (type === 'all') {
      q = query(collection(db, 'videos'), where('enabled', '==', true));
    } else {
      q = query(
        collection(db, 'videos'),
        where('enabled', '==', true),
        where('type', '==', type)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur chargement vidéos par type:', error);
    return [];
  }
}

/**
 * Default sample videos for testing (if no videos in Firebase)
 * @returns {Array} Sample video data
 */
export function getDefaultVideos() {
  return [
    {
      id: 'sample_1',
      title: 'Bienvenue sur Intellection ClassBoard',
      description: 'Découvrez la plateforme collaborative pour l\'apprentissage',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Sample - replace with real video
      type: 'announcement',
      duration: 30,
      enabled: true,
      order: 1
    },
    {
      id: 'sample_2',
      title: 'Téléchargez l\'application mobile',
      description: 'Accédez à votre emploi du temps n\'importe où',
      url: 'https://www.youtube.com/embed/jNQXAC9IVRw', // Sample - replace with real video
      type: 'advertisement',
      duration: 25,
      enabled: true,
      order: 2
    }
  ];
}

/**
 * Validate video data structure
 * @param {Object} video - Video object to validate
 * @returns {boolean} True if valid
 */
export function isValidVideo(video) {
  return (
    video &&
    video.title &&
    video.url &&
    video.duration &&
    video.enabled !== undefined
  );
}
