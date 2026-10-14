const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Cloud Function - Expirer les absences de plus de 24h
 * Planifiée tous les jours à minuit
 *
 * Cette fonction supprime automatiquement les enregistrements d'absence
 * qui ont le statut "absent" et dont la date est antérieure à 24h
 *
 * Cela crée un effet "éphémère" où les séances annulées disparaissent
 * de la vue étudiants après 24h
 */

exports.expireOldAbsences = functions
  .region('europe-west1')
  .pubsub.schedule('0 0 * * *') // Exécuter tous les jours à minuit (UTC)
  .timeZone('Africa/Casablanca') // Adapter au fuseau horaire du Maroc
  .onRun(async context => {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      console.log(`Expiration des absences - Heure: ${now.toISOString()}`);
      console.log(`Suppression des absences avant: ${yesterday.toISOString()}`);

      // Requête : absences avec statut "absent" et date < 24h
      const query = db
        .collection('professor_absences')
        .where('status', '==', 'absent')
        .where('date', '<', admin.firestore.Timestamp.fromDate(yesterday));

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('Aucune absence à expirer');
        return {
          success: true,
          expired: 0,
          message: 'Aucune absence à expirer',
        };
      }

      // Supprimer par batch
      const batch = db.batch();
      let count = 0;

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });

      await batch.commit();

      const logMessage = `✅ ${count} absence(s) expirée(s)`;
      console.log(logMessage);

      return {
        success: true,
        expired: count,
        message: logMessage,
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'expiration des absences:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  });

/**
 * Cloud Function - Notification de rattrapage prévu
 * Planifiée tous les jours à 08:00
 *
 * Envoie une notification aux étudiants concernés quand un rattrapage
 * est planifié et la date est dans les 2 jours
 */

exports.notifyUpcomingMakeups = functions
  .region('europe-west1')
  .pubsub.schedule('0 8 * * *')
  .timeZone('Africa/Casablanca')
  .onRun(async context => {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      console.log(`Notification des rattrapages - Heure: ${now.toISOString()}`);

      // Requête : rattrapages planifiés dans les 2 jours
      const query = db
        .collection('professor_absences')
        .where('status', '==', 'scheduled_makeup')
        .where('makeupDate', '>=', admin.firestore.Timestamp.fromDate(tomorrow))
        .where('makeupDate', '<=', admin.firestore.Timestamp.fromDate(twoDaysFromNow));

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('Aucun rattrapage prévu dans les 2 jours');
        return {
          success: true,
          notified: 0,
        };
      }

      // Ici, vous pouvez ajouter la logique de notification
      // Par exemple, envoyer des emails, SMS ou notifications push

      console.log(`${snapshot.size} rattrapage(s) à notifier`);

      snapshot.docs.forEach(doc => {
        const absence = doc.data();
        console.log(`Rattrapage: ${absence.matiere} - ${absence.groupe}`);
        // Ajouter ici la logique d'envoi de notification
      });

      return {
        success: true,
        notified: snapshot.size,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la notification:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  });

/**
 * Cloud Function - Générer un rapport quotidien
 * Planifiée tous les jours à 17:00
 *
 * Génère un résumé des absences et rattrapages du jour
 */

exports.generateDailyAbsenceReport = functions
  .region('europe-west1')
  .pubsub.schedule('0 17 * * *')
  .timeZone('Africa/Casablanca')
  .onRun(async context => {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Rapport quotidien - Date: ${today.toISOString()}`);

      // Requête : toutes les absences du jour
      const query = db
        .collection('professor_absences')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(endOfDay));

      const snapshot = await query.get();

      const stats = {
        total: snapshot.size,
        absent: 0,
        scheduled_makeup: 0,
        completed: 0,
      };

      snapshot.docs.forEach(doc => {
        const absence = doc.data();
        stats[absence.status] = (stats[absence.status] || 0) + 1;
      });

      console.log('📊 Rapport du jour:', JSON.stringify(stats));

      // Optionnel: Sauvegarder le rapport dans une collection
      await db.collection('absence_reports').doc(today.toISOString().split('T')[0]).set({
        date: admin.firestore.Timestamp.fromDate(today),
        stats,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        date: today.toISOString().split('T')[0],
        stats,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  });
