/**
 * Service pour exécuter automatiquement les envois WhatsApp programmés
 *
 * Ce service:
 * 1. Vérifie les horaires toutes les minutes
 * 2. Génère les PDFs des emplois du temps
 * 3. Envoie via Twilio WhatsApp
 * 4. Enregistre les logs
 */

import WhatsAppAutomationService from './WhatsAppAutomationService';
import TwilioWhatsAppService from './TwilioWhatsAppService';
import { filterSessionsByPeriod } from './periodUtils';
import { sessionIncludesLevel } from './levelUtils';

class WhatsAppScheduleExecutor {
  static isRunning = false;
  static lastCheck = null;

  /**
   * Démarrer le monitoring des horaires
   * @param {Object} sessions - Données des sessions
   * @param {Array} branches - Liste des centres
   */
  static startScheduleMonitoring(sessions, branches) {
    if (this.isRunning) {
      console.log('⚠️ Le monitoring est déjà en cours');
      return;
    }

    this.isRunning = true;
    console.log('✅ Monitoring WhatsApp démarré');

    // Vérifier les horaires toutes les minutes
    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndExecuteSchedules(sessions, branches);
      } catch (error) {
        console.error('❌ Erreur lors du monitoring:', error);
      }
    }, 60000); // Chaque minute

    // Vérifier immédiatement au démarrage
    this.checkAndExecuteSchedules(sessions, branches);
  }

  /**
   * Arrêter le monitoring
   */
  static stopScheduleMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('⏹️ Monitoring WhatsApp arrêté');
    }
  }

  /**
   * Vérifier et exécuter les horaires dus
   * @private
   */
  static async checkAndExecuteSchedules(sessions, branches) {
    try {
      const schedules = await WhatsAppAutomationService.getAllSchedules();

      if (!schedules || schedules.length === 0) {
        return;
      }

      for (const schedule of schedules) {
        if (!schedule.enabled) continue;

        // Vérifier si c'est le moment d'exécuter cet horaire
        if (this._shouldExecuteNow(schedule)) {
          console.log(`🚀 Exécution de l'horaire: ${schedule.centre} - ${schedule.niveau}`);
          await this.executeSchedule(schedule, sessions, branches);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des horaires:', error);
    }
  }

  /**
   * Exécuter un horaire
   * @param {Object} schedule - Configuration d'horaire
   * @param {Object} sessions - Données des sessions
   * @param {Array} branches - Liste des centres
   */
  static async executeSchedule(schedule, sessions, branches) {
    try {
      // 1. Récupérer les groupes pour ce centre/niveau
      const groups = await WhatsAppAutomationService.getGroupsByCenter(schedule.centre);
      const targetGroups = groups.filter(g => g.niveau === schedule.niveau);

      if (targetGroups.length === 0) {
        console.log('⚠️ Aucun groupe WhatsApp pour ce centre/niveau');
        await WhatsAppAutomationService.logSend({
          scheduleId: schedule.id,
          centre: schedule.centre,
          niveau: schedule.niveau,
          status: 'skipped',
          error: 'Aucun groupe configuré'
        });
        return;
      }

      // 2. Générer le PDF
      const pdfContent = await this._generateSchedulePDF(
        sessions[schedule.centre],
        schedule.centre,
        schedule.niveau
      );

      // 3. Pour chaque groupe, envoyer le PDF
      for (const group of targetGroups) {
        try {
          const result = await TwilioWhatsAppService.sendMessage(
            group.whatsappNumber,
            `📋 *Emploi du temps - ${schedule.centre}*\n\n${this._generateScheduleText(
              sessions[schedule.centre],
              schedule.centre,
              schedule.niveau
            )}\n\n_Envoyé le ${new Date().toLocaleString('fr-FR')}_`
          );

          if (result.success) {
            console.log(`✅ Message envoyé à ${group.whatsappNumber}`);
            await WhatsAppAutomationService.logSend({
              scheduleId: schedule.id,
              groupId: group.id,
              centre: schedule.centre,
              niveau: schedule.niveau,
              status: 'success',
              messageId: result.messageId
            });

            // Mettre à jour lastSentAt du groupe
            await WhatsAppAutomationService.updateWhatsAppGroup(group.id, {
              lastSentAt: new Date(),
              messageCount: (group.messageCount || 0) + 1
            });
          } else {
            throw new Error(result.error);
          }
        } catch (groupError) {
          console.error(`❌ Erreur pour groupe ${group.whatsappNumber}:`, groupError);
          await WhatsAppAutomationService.logSend({
            scheduleId: schedule.id,
            groupId: group.id,
            centre: schedule.centre,
            niveau: schedule.niveau,
            status: 'error',
            error: groupError.message
          });
        }
      }

      // 4. Mettre à jour lastRun de l'horaire
      await WhatsAppAutomationService.updateSchedule(schedule.id, {
        lastRun: new Date(),
        nextRun: WhatsAppScheduleExecutor._calculateNextRun(schedule.days, schedule.time)
      });

      console.log('✅ Horaire exécuté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution:', error);
      await WhatsAppAutomationService.logSend({
        scheduleId: schedule.id,
        centre: schedule.centre,
        niveau: schedule.niveau,
        status: 'error',
        error: error.message
      });
    }
  }

  /**
   * Vérifier si un horaire doit être exécuté maintenant
   * @private
   */
  static _shouldExecuteNow(schedule) {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    const daysMap = {
      'lundi': 1,
      'mardi': 2,
      'mercredi': 3,
      'jeudi': 4,
      'vendredi': 5,
      'samedi': 6,
      'dimanche': 0
    };

    const currentDay = Object.keys(daysMap).find(key => daysMap[key] === now.getDay());
    const isRightDay = schedule.days.includes(currentDay);

    // Vérifier si c'est dans la bonne heure et minute
    // (tolérance de 1 minute pour éviter les exécutions multiples)
    const isRightTime = now.getHours() === hours && now.getMinutes() === minutes;

    // Vérifier qu'on n'a pas déjà exécuté dans la dernière minute
    const lastCheckMinutesAgo = this.lastCheck ? (now - this.lastCheck) / 1000 / 60 : 999;
    const notRecentlyExecuted = lastCheckMinutesAgo > 1;

    return isRightDay && isRightTime && notRecentlyExecuted && schedule.enabled;
  }

  /**
   * Générer le texte du programme
   * @private
   */
  static _generateScheduleText(branchSessions = [], centre, niveau) {
    if (!Array.isArray(branchSessions)) {
      return 'Aucune session disponible';
    }

    // Filtrer par niveau
    let filteredSessions = branchSessions.filter(s => {
      if (!Array.isArray(s.niveaux) && !s.niveau) return false;
      if (s.niveaux) return s.niveaux.includes(niveau);
      return s.niveau === niveau;
    });

    if (filteredSessions.length === 0) {
      return 'Aucune session pour ce niveau';
    }

    // Grouper par jour
    const daysMap = {
      1: '🔵 Lundi',
      2: '🟢 Mardi',
      3: '🟡 Mercredi',
      4: '🔴 Jeudi',
      5: '🟣 Vendredi',
      6: '⚫ Samedi',
      0: '⚪ Dimanche'
    };

    let text = '';
    for (const dayNum of [1, 2, 3, 4, 5, 6, 0]) {
      const daySessions = filteredSessions
        .filter(s => s.dayOfWeek === dayNum && s.status !== 'cancelled')
        .sort((a, b) => {
          const timeA = a.startTime.split(':').map(Number);
          const timeB = b.startTime.split(':').map(Number);
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

      if (daySessions.length > 0) {
        text += `\n${daysMap[dayNum]}\n`;
        daySessions.forEach(session => {
          text += `  ⏰ ${session.startTime} - ${session.endTime}\n`;
          text += `     ${session.subject || '-'} (${session.professor || '-'})\n`;
        });
      }
    }

    return text || 'Aucune session trouvée';
  }

  /**
   * Générer le PDF
   * @private
   */
  static async _generateSchedulePDF(branchSessions = [], centre, niveau) {
    // Cette méthode retourne un objet HTML pour être converti en PDF
    // En réalité, on utiliserait html2pdf ou une autre librairie
    return `
      <div style="font-family: Arial; padding: 20px;">
        <h2>${centre} - ${niveau}</h2>
        <p>${this._generateScheduleText(branchSessions, centre, niveau)}</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Généré le ${new Date().toLocaleString('fr-FR')}
        </p>
      </div>
    `;
  }

  /**
   * Calculer le prochain envoi
   * @private
   */
  static _calculateNextRun(days, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    const daysMap = {
      'lundi': 1,
      'mardi': 2,
      'mercredi': 3,
      'jeudi': 4,
      'vendredi': 5,
      'samedi': 6,
      'dimanche': 0
    };

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    while (!days.includes(Object.keys(daysMap).find(key => daysMap[key] === nextRun.getDay()))) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }
}

export default WhatsAppScheduleExecutor;
