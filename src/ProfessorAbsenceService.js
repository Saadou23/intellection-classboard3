import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

const ABSENCES_COLLECTION = 'professor_absences';

export const ProfessorAbsenceService = {
  // Enregistrer une absence
  async recordAbsence(absenceData) {
    try {
      const docRef = await addDoc(collection(db, ABSENCES_COLLECTION), {
        ...absenceData,
        status: 'absent',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'absence:', error);
      throw error;
    }
  },

  // Planifier un rattrapage
  async scheduleMakeup(absenceId, makeupDate) {
    try {
      const absenceRef = doc(db, ABSENCES_COLLECTION, absenceId);
      await updateDoc(absenceRef, {
        makeupDate: Timestamp.fromDate(new Date(makeupDate)),
        status: 'scheduled_makeup',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la planification du rattrapage:', error);
      throw error;
    }
  },

  // Marquer un rattrapage comme complété
  async completeMakeup(absenceId) {
    try {
      const absenceRef = doc(db, ABSENCES_COLLECTION, absenceId);
      await updateDoc(absenceRef, {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la complétion du rattrapage:', error);
      throw error;
    }
  },

  // Récupérer les absences d'une date
  async getAbsencesForDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, ABSENCES_COLLECTION),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay)),
        where('status', '==', 'absent'),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des absences:', error);
      throw error;
    }
  },

  // Récupérer toutes les absences actives (non expirées)
  async getActiveAbsences() {
    try {
      const now = new Date();
      const q = query(
        collection(db, ABSENCES_COLLECTION),
        where('status', 'in', ['absent', 'scheduled_makeup']),
        where('date', '>=', Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000))),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des absences actives:', error);
      throw error;
    }
  },

  // Récupérer l'historique complet
  async getAbsenceHistory(filters = {}) {
    try {
      let q = query(collection(db, ABSENCES_COLLECTION));

      // Appliquer les filtres
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.professorId) {
        q = query(q, where('professorId', '==', filters.professorId));
      }

      if (filters.center) {
        q = query(q, where('center', '==', filters.center));
      }

      q = query(q, orderBy('date', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  },

  // Récupérer les séances annulées pour une date (affichage étudiant)
  async getCancelledSessionsForDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, ABSENCES_COLLECTION),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay)),
        where('status', 'in', ['absent', 'scheduled_makeup']),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des séances annulées:', error);
      return [];
    }
  },

  // Expirer les absences de plus de 24h (à appeler via Cloud Function)
  async expireOldAbsences() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const q = query(
        collection(db, ABSENCES_COLLECTION),
        where('status', 'in', ['absent']),
        where('date', '<', Timestamp.fromDate(yesterday))
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snapshot.docs.length;
    } catch (error) {
      console.error('Erreur lors de l\'expiration des absences:', error);
      throw error;
    }
  },

  // Supprimer une absence
  async deleteAbsence(absenceId) {
    try {
      await deleteDoc(doc(db, ABSENCES_COLLECTION, absenceId));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'absence:', error);
      throw error;
    }
  },

  // Vérifier si une séance est annulée
  async isSessionCancelled(sessionId) {
    try {
      const q = query(
        collection(db, ABSENCES_COLLECTION),
        where('sessionId', '==', sessionId),
        where('status', 'in', ['absent', 'scheduled_makeup'])
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0 ? snapshot.docs[0].data() : null;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'annulation:', error);
      return null;
    }
  },
};
