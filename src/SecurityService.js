// Service de sécurité pour protéger contre le brute force
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

class SecurityService {
  constructor() {
    this.MAX_ATTEMPTS = 5;
    this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Enregistrer une tentative de login dans Firebase
   */
  async logLoginAttempt(password, success) {
    try {
      const attemptsRef = collection(db, 'security_logs');

      // Hasher basique du mot de passe pour la sécurité (on n'enregistre pas le mot de passe en clair)
      const passwordHash = this.simpleHash(password);

      await addDoc(attemptsRef, {
        timestamp: Timestamp.now(),
        type: 'login_attempt',
        success: success,
        passwordHash: passwordHash,
        userAgent: navigator.userAgent,
        ip: 'Unknown', // Limite browser (impossible d'avoir l'IP côté client)
        status: success ? 'SUCCESS' : 'FAILED'
      });

      console.log(`[SECURITY] Login ${success ? 'réussi' : 'échoué'} - ${new Date().toLocaleString()}`);
    } catch (error) {
      console.error('[SECURITY] Erreur lors de l\'enregistrement:', error);
    }
  }

  /**
   * Récupérer les tentatives échouées récentes
   */
  async getRecentFailedAttempts(minutesBack = 60) {
    try {
      const attemptsRef = collection(db, 'security_logs');
      const timeAgo = new Date(Date.now() - minutesBack * 60 * 1000);

      const q = query(
        attemptsRef,
        where('type', '==', 'login_attempt'),
        where('success', '==', false),
        where('timestamp', '>=', Timestamp.fromDate(timeAgo))
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    } catch (error) {
      console.error('[SECURITY] Erreur lors de la lecture des logs:', error);
      return 0;
    }
  }

  /**
   * Hasher basique du mot de passe (pour la sécurité, on n'enregistre pas le mot de passe en clair)
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Bloquer les tentatives de force brute automatisées
   */
  detectBotAttempts(loginAttempts, timeFrame = 5) {
    // Si plus de 3 tentatives en 5 secondes = probablement un bot
    if (loginAttempts >= 3) {
      console.warn('[SECURITY] Possible bot attack détecté!');
      return true;
    }
    return false;
  }

  /**
   * Enregistrer un accès réussi
   */
  async logSuccessfulAccess() {
    try {
      const logsRef = collection(db, 'security_logs');
      await addDoc(logsRef, {
        timestamp: Timestamp.now(),
        type: 'login_success',
        userAgent: navigator.userAgent,
        event: 'Admin login successful'
      });
    } catch (error) {
      console.error('[SECURITY] Erreur enregistrement accès:', error);
    }
  }

  /**
   * Enregistrer les tentatives bloquées
   */
  async logBlockedAttempt(reason) {
    try {
      const logsRef = collection(db, 'security_logs');
      await addDoc(logsRef, {
        timestamp: Timestamp.now(),
        type: 'blocked_attempt',
        reason: reason,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('[SECURITY] Erreur enregistrement bloc:', error);
    }
  }
}

export default new SecurityService();
