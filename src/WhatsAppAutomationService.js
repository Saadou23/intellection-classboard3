import { db, storage } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const WHATSAPP_AUTOMATION_COLLECTION = 'whatsapp_automations';
const JOBS_SUBCOLLECTION = 'jobs';
const LOGS_SUBCOLLECTION = 'logs';
const BACKEND_URL = import.meta.env.VITE_WHATSAPP_BOT_URL || 'http://localhost:3001';

class WhatsAppAutomationService {
  // ============= JOBS (Emplois du temps) =============

  /**
   * Créer un nouveau job d'envoi
   * @param {Object} jobData - {name, pdfUrl, pdfName, groupIds, groupNames, caption, days, time, enabled}
   * @returns {Promise<string>} ID du job créé
   */
  static async createJob(jobData) {
    try {
      const docRef = await addDoc(
        collection(db, `${WHATSAPP_AUTOMATION_COLLECTION}_${JOBS_SUBCOLLECTION}`),
        {
          name: jobData.name,
          pdfUrl: jobData.pdfUrl,
          pdfName: jobData.pdfName,
          groupIds: jobData.groupIds || [],
          groupNames: jobData.groupNames || [],
          caption: jobData.caption || '',
          days: jobData.days || [],
          time: jobData.time || '08:00',
          enabled: jobData.enabled !== false,
          createdAt: serverTimestamp(),
          lastRun: null
        }
      );

      console.log('✅ Job créé:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur création job:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les jobs
   * @returns {Promise<Array>} Liste de tous les jobs
   */
  static async getAllJobs() {
    try {
      const jobsSnapshot = await getDocs(
        collection(db, `${WHATSAPP_AUTOMATION_COLLECTION}_${JOBS_SUBCOLLECTION}`)
      );

      const jobs = [];
      jobsSnapshot.forEach(doc => {
        jobs.push({ id: doc.id, ...doc.data() });
      });

      return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('❌ Erreur récupération jobs:', error);
      return [];
    }
  }

  /**
   * Récupérer un job spécifique
   * @param {string} jobId - ID du job
   * @returns {Promise<Object>} Données du job
   */
  static async getJob(jobId) {
    try {
      const jobDoc = await getDocs(
        query(collection(db, WHATSAPP_AUTOMATION_COLLECTION, JOBS_SUBCOLLECTION), where('id', '==', jobId))
      );

      if (jobDoc.empty) return null;
      const doc = jobDoc.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('❌ Erreur récupération job:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un job
   * @param {string} jobId - ID du job
   * @param {Object} updates - Données à mettre à jour
   */
  static async updateJob(jobId, updates) {
    try {
      await updateDoc(
        doc(db, `${WHATSAPP_AUTOMATION_COLLECTION}_${JOBS_SUBCOLLECTION}`, jobId),
        {
          ...updates,
          updatedAt: serverTimestamp()
        }
      );

      console.log('✅ Job mis à jour:', jobId);
    } catch (error) {
      console.error('❌ Erreur mise à jour job:', error);
      throw error;
    }
  }

  /**
   * Supprimer un job
   * @param {string} jobId - ID du job
   */
  static async deleteJob(jobId) {
    try {
      await deleteDoc(doc(db, `${WHATSAPP_AUTOMATION_COLLECTION}_${JOBS_SUBCOLLECTION}`, jobId));
      console.log('✅ Job supprimé:', jobId);
    } catch (error) {
      console.error('❌ Erreur suppression job:', error);
      throw error;
    }
  }

  // ============= PDF UPLOAD =============

  /**
   * Uploader un PDF dans Firebase Storage
   * @param {File} file - Fichier PDF
   * @returns {Promise<Object>} {url, name}
   */
  static async uploadPDF(file) {
    try {
      const timestamp = Date.now();
      const fileName = `whatsapp-pdfs/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Upload le fichier
      await uploadBytes(storageRef, file);

      // Récupère l'URL de téléchargement
      const url = await getDownloadURL(storageRef);

      console.log('✅ PDF uploadé:', fileName);
      return {
        url,
        name: file.name
      };
    } catch (error) {
      console.error('❌ Erreur upload PDF:', error);
      throw error;
    }
  }

  // ============= LOGS =============

  /**
   * Enregistrer un log d'envoi
   * @param {Object} logData - {jobId, jobName, status, groupId, groupName, error}
   */
  static async addLog(logData) {
    try {
      await addDoc(
        collection(db, `${WHATSAPP_AUTOMATION_COLLECTION}_${LOGS_SUBCOLLECTION}`),
        {
          jobId: logData.jobId,
          jobName: logData.jobName,
          status: logData.status, // 'success' ou 'error'
          groupId: logData.groupId,
          groupName: logData.groupName,
          error: logData.error || null,
          timestamp: serverTimestamp()
        }
      );

      console.log('✅ Log enregistré');
    } catch (error) {
      console.error('❌ Erreur enregistrement log:', error);
    }
  }

  /**
   * Récupérer les logs
   * @param {string} jobId - ID du job (optionnel)
   * @param {number} logLimit - Nombre de logs à récupérer
   * @returns {Promise<Array>} Liste des logs
   */
  static async getLogs(jobId = null, logLimit = 100) {
    try {
      let q;
      if (jobId) {
        q = query(
          collection(db, `${WHATSAPP_AUTOMATION_COLLECTION}_${LOGS_SUBCOLLECTION}`),
          where('jobId', '==', jobId),
          orderBy('timestamp', 'desc'),
          limit(logLimit)
        );
      } else {
        q = query(
          collection(db, `${WHATSAPP_AUTOMATION_COLLECTION}_${LOGS_SUBCOLLECTION}`),
          orderBy('timestamp', 'desc'),
          limit(logLimit)
        );
      }

      const logsSnapshot = await getDocs(q);
      const logs = [];
      logsSnapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      return logs;
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      return [];
    }
  }

  // ============= COMMUNICATION BACKEND =============

  /**
   * Vérifier le statut du bot WhatsApp
   * @returns {Promise<Object>} {connected, clientStatus}
   */
  static async getBackendStatus() {
    try {
      const response = await fetch(`${BACKEND_URL}/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return {
        connected: data.connected,
        clientStatus: data.clientStatus,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('❌ Erreur statut backend:', error);
      return {
        connected: false,
        clientStatus: 'error',
        error: error.message
      };
    }
  }

  /**
   * Récupérer la liste des groupes WhatsApp
   * @returns {Promise<Array>} Groupes [{id, name, participantCount, isActive}]
   */
  static async getWhatsAppGroups() {
    try {
      const response = await fetch(`${BACKEND_URL}/groups`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      console.error('❌ Erreur récupération groupes:', error);
      return [];
    }
  }

  /**
   * Initialiser et charger les groupes depuis WhatsApp
   * @returns {Promise<Object>} {success, groups, message}
   */
  static async initializeGroups() {
    try {
      const response = await fetch(`${BACKEND_URL}/initialize-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Groupes initialisés:', data);
      return {
        success: true,
        groups: data.groups || [],
        message: data.message
      };
    } catch (error) {
      console.error('❌ Erreur initialisation groupes:', error);
      return {
        success: false,
        groups: [],
        error: error.message,
        message: 'Impossible de charger les groupes. Assurez-vous que le bot est lancé.'
      };
    }
  }

  /**
   * Envoyer un PDF immédiatement (test)
   * @param {string} pdfUrl - URL du PDF
   * @param {Array} groupIds - IDs des groupes WhatsApp
   * @param {string} caption - Caption optionnel
   * @returns {Promise<Object>} Résultats de l'envoi
   */
  static async sendNow(pdfUrl, groupIds, caption = '') {
    try {
      const response = await fetch(`${BACKEND_URL}/send-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pdfUrl,
          groupIds,
          caption
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return {
        success: data.success,
        results: data.results || []
      };
    } catch (error) {
      console.error('❌ Erreur envoi test:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Tester une connexion avec un groupe (message texte simple)
   * @param {string} groupId - ID du groupe
   * @param {string} message - Message de test
   * @returns {Promise<Object>} Résultat
   */
  static async testConnection(groupId, message = '✅ Test de connexion réussi!') {
    try {
      const response = await fetch(`${BACKEND_URL}/test-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupId,
          message
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur test connexion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============= UTILITAIRES =============

  /**
   * Formater un numéro WhatsApp
   * @param {string} number - Numéro à formater
   * @returns {string} Numéro formaté
   */
  static formatWhatsAppNumber(number) {
    let cleaned = number.replace(/\D/g, '');

    if (!cleaned.startsWith('212') && !cleaned.startsWith('1')) {
      if (cleaned.startsWith('0')) {
        cleaned = '212' + cleaned.substring(1);
      } else {
        cleaned = '212' + cleaned;
      }
    }

    return '+' + cleaned;
  }

  /**
   * Valider un numéro WhatsApp
   * @param {string} number - Numéro à valider
   * @returns {boolean}
   */
  static isValidNumber(number) {
    const formatted = this.formatWhatsAppNumber(number);
    return /^\+\d{10,15}$/.test(formatted);
  }

  /**
   * Extraire les IDs de groupes d'une liste d'objets
   * @param {Array} groups - Groupes avec {id, name, ...}
   * @returns {Object} {ids: [...], names: [...]}
   */
  static extractGroupInfo(groups) {
    return {
      ids: groups.map(g => g.id),
      names: groups.map(g => g.name)
    };
  }
}

export default WhatsAppAutomationService;
