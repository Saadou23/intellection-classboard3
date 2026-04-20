const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Email configuration
const EMAIL_USER = 'intellectionaudit@gmail.com';
const EMAIL_PASS = 'pskbhozznaabffaa';
const EMAIL_TO = 'saaddalili@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// ============================================================================
// Fonction : Vérifier la conformité de supervision (déclenchée le dimanche 12h00)
// ============================================================================

exports.checkSupervisionMondayMorning = functions
  .region('us-central1')
  .pubsub.schedule('0 7 * * 1')  // UTC 7:00 = Maroc 8:00 (GMT+1) - Lundi
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Vérification de la supervision - Lundi 8h00');
      const rapport = await generateSupervisionReport();
      await sendSupervisionEmail(rapport);
      return { success: true };
    } catch (error) {
      console.error('Erreur checkSupervisionMondayMorning:', error);
      return { error: error.message };
    }
  });

// ============================================================================
// Fonction HTTP : Envoi manuel du rapport
// ============================================================================

exports.sendSupervisionReportNow = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).send('OK');
      return;
    }

    try {
      const rapport = req.body.rapport || await generateSupervisionReport();
      const result = await sendSupervisionEmail(rapport);
      res.status(200).json({ success: true, message: result });
    } catch (error) {
      console.error('Erreur sendSupervisionReportNow:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

// ============================================================================
// Fonction : Générer le rapport de supervision
// ============================================================================

async function generateSupervisionReport() {
  // Calculer la semaine passée (lundi → dimanche)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - diffToMonday - 7);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  // 1. Récupérer tous les schedules de supervision
  const schedulesSnap = await db.collection('supervision_schedules').get();
  const schedules = schedulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Récupérer les pointages de la semaine
  const pointagesSnap = await db
    .collection('pointages')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(lastMonday))
    .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(lastSunday))
    .get();

  const pointages = pointagesSnap.docs.map(d => ({
    ...d.data(),
    timestamp: d.data().timestamp.toDate()
  }));

  // 3. Calculer les heures par directeur/jour/zone
  const hoursByDirecteurDay = {};
  pointages.forEach(p => {
    const dateKey = p.timestamp.toISOString().split('T')[0];
    const key = `${p.directeurId}__${dateKey}__${p.zone}`;

    if (!hoursByDirecteurDay[key]) {
      hoursByDirecteurDay[key] = {
        directeurId: p.directeurId,
        directeurName: p.directeurName,
        zone: p.zone,
        date: dateKey,
        records: []
      };
    }
    hoursByDirecteurDay[key].records.push(p);
  });

  // 4. Calculer les heures travaillées
  const hoursWorked = {};
  Object.values(hoursByDirecteurDay).forEach(dayData => {
    const records = dayData.records.sort((a, b) => a.timestamp - b.timestamp);
    let totalMinutes = 0;
    let entreeTime = null;

    records.forEach(r => {
      if (r.type === 'entrée') {
        entreeTime = r.timestamp;
      } else if (r.type === 'sortie' && entreeTime) {
        totalMinutes += (r.timestamp - entreeTime) / 60000;
        entreeTime = null;
      }
    });

    const key = `${dayData.directeurId}__${dayData.date}__${dayData.zone}`;
    hoursWorked[key] = Math.round((totalMinutes / 60) * 10) / 10;
  });

  // 5. Vérifier les manquements
  const defaillances = [];

  for (const schedule of schedules) {
    for (const jour of schedule.jours) {
      const jourIndex = JOURS.indexOf(jour);
      const dateReq = new Date(lastMonday);
      dateReq.setDate(lastMonday.getDate() + jourIndex);
      const dateKey = dateReq.toISOString().split('T')[0];

      const hoursKey = `${schedule.directeurId}__${dateKey}__${schedule.centre}`;
      const heures = hoursWorked[hoursKey] || 0;

      if (heures < schedule.heuresMin) {
        defaillances.push({
          directeur: schedule.directeurName,
          centre: schedule.centre,
          jour: jour,
          dateKey: dateKey,
          heuresRequises: schedule.heuresMin,
          heuresPresentees: heures
        });
      }
    }
  }

  return {
    weekStart: lastMonday.toLocaleDateString('fr-FR'),
    weekEnd: lastSunday.toLocaleDateString('fr-FR'),
    defaillances: defaillances,
    defaillancesCount: defaillances.length
  };
}

// ============================================================================
// Fonction : Envoyer l'email de rapport
// ============================================================================

async function sendSupervisionEmail(rapport) {
  // Déterminer le sujet
  const dateDebut = rapport.weekStart.split('/').reverse().join('-');
  const subject = rapport.defaillancesCount === 0
    ? `✅ RAS Supervision - Semaine du ${rapport.weekStart} : Tous présents`
    : `⚠️ ALERTE Supervision - Semaine du ${rapport.weekStart} : ${rapport.defaillancesCount} manquement(s)`;

  // Générer le HTML
  const htmlContent = generateEmailHTML(rapport);

  // Envoyer l'email
  const mailOptions = {
    from: `Rapport Supervision <${EMAIL_USER}>`,
    to: EMAIL_TO,
    subject: subject,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    return `Email envoyé avec succès à ${EMAIL_TO}`;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw error;
  }
}

// ============================================================================
// Fonction : Générer le HTML de l'email
// ============================================================================

function generateEmailHTML(rapport) {
  const defaillances = rapport.defaillances;

  let defaillancesHTML = '';
  if (defaillances.length === 0) {
    defaillancesHTML = `
      <div style="background-color: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="color: #166534; margin: 0; font-size: 18px;">✅ Tous les directeurs ont respecté leurs obligations</h3>
      </div>
    `;
  } else {
    defaillances.forEach(def => {
      defaillancesHTML += `
        <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <div style="color: #991b1b; font-weight: bold; font-size: 16px;">${def.directeur}</div>
          <div style="color: #7f1d1d; margin-top: 8px; font-size: 14px;">
            📍 <strong>${def.centre}</strong> | 📅 <strong>${def.jour}</strong> (${def.dateKey})
          </div>
          <div style="color: #7f1d1d; margin-top: 5px; font-size: 14px;">
            ⏱️ <strong>Requis:</strong> ${def.heuresRequises}h | <strong>Présent:</strong> ${def.heuresPresentees}h
          </div>
        </div>
      `;
    });
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .section-title { font-size: 18px; font-weight: bold; color: #1a1a2e; margin-top: 20px; margin-bottom: 15px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Rapport Supervision Hebdomadaire</h1>
          <p style="margin: 10px 0 0 0;">Semaine du ${rapport.weekStart} au ${rapport.weekEnd}</p>
        </div>
        <div class="content">
          <div class="section-title">Détail des supervision</div>
          ${defaillancesHTML}

          <div class="footer">
            <p>Ce rapport a été généré automatiquement chaque dimanche à 12h00</p>
            <p>Intellection ClassBoard © 2026</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// Fonction : Audit fraude - Détection variations de prix et encaissements anormaux
// ============================================================================

exports.checkFraudAudit = functions
  .region('us-central1')
  .pubsub.schedule('0 8 * * 0')  // UTC 8:00 = Maroc 9:00 (GMT+1) - Dimanche
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Audit fraude - Dimanche 9h00');
      const rapport = await generateFraudReport();
      // Toujours envoyer l'email (même avec 0 anomalies)
      await sendFraudEmail(rapport);
      return { success: true };
    } catch (error) {
      console.error('Erreur checkFraudAudit:', error);
      return { error: error.message };
    }
  });

// ============================================================================
// Fonction HTTP : Envoi manuel de l'audit fraude (pour test)
// ============================================================================

exports.sendFraudAuditNow = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).send('OK');
      return;
    }

    try {
      const rapport = await generateFraudReport();
      // Toujours envoyer l'email (même avec 0 anomalies)
      const result = await sendFraudEmail(rapport);
      res.status(200).json({ success: true, message: result, rapport });
    } catch (error) {
      console.error('Erreur sendFraudAuditNow:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

// Récupérer les anomalies déjà rapportées pour cette semaine
async function getReportedAnomaliesForWeek(weekStart) {
  const weekKey = weekStart.toISOString().split('T')[0];
  const snap = await db.collection('fraud_anomalies_reported')
    .where('weekStart', '==', weekKey)
    .get();

  const reported = {};
  snap.docs.forEach(doc => {
    reported[doc.data().anomalyId] = true;
  });
  return reported;
}

// Sauvegarder une anomalie comme rapportée
async function saveReportedAnomaly(anomalyId, anomalyData, weekStart) {
  const weekKey = weekStart.toISOString().split('T')[0];
  await db.collection('fraud_anomalies_reported').add({
    anomalyId: anomalyId,
    weekStart: weekKey,
    type: anomalyData.type,
    etudiant: anomalyData.etudiant || anomalyData.matiere || 'Unknown',
    cours: anomalyData.cours || anomalyData.matiere || 'Unknown',
    centre: anomalyData.centre || 'Unknown',
    montant: anomalyData.montant || anomalyData.montantFacture,
    prixOfficiel: anomalyData.prixOfficiel || anomalyData.prixNormal || anomalyData.montantNormal,
    ecart: anomalyData.ecart || Math.abs(anomalyData.montant - (anomalyData.prixOfficiel || anomalyData.prixNormal || 0)),
    reportedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Générer le rapport de fraude - version avancée avec détection par étudiant
async function generateFraudReport() {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - diffToMonday - 7);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    // Récupérer les anomalies déjà rapportées pour cette semaine
    const reportedAnomalies = await getReportedAnomaliesForWeek(lastMonday);

    // 1. Récupérer les inscriptions de la semaine
    let inscriptions = [];
    const paymentSnap = await db
      .collection('payment_records')
      .get();

    inscriptions = paymentSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().date?.toDate() || d.data().createdAt?.toDate() || new Date()
    })).filter(i => {
      const date = i.createdAt || new Date();
      return date >= lastMonday && date <= lastSunday;
    });

    // 2. Trouver les prix normaux (modal) par matière
    const prixParMatiere = {};
    const allAnomalies = [];

    if (!Array.isArray(inscriptions)) inscriptions = [];

    inscriptions.forEach(insc => {
      if (!insc) return;
      const matiere = insc.matiere || 'Unknown';
      if (!prixParMatiere[matiere]) {
        prixParMatiere[matiere] = {
          montants: [],
          inscriptions: []
        };
      }
      const montant = parseFloat(insc.amount) || 0;
      if (typeof montant === 'number') {
        prixParMatiere[matiere].montants.push(montant);
        prixParMatiere[matiere].inscriptions.push(insc);
      }
    });

    // 3. Calculer le prix modal et détecter anomalies individuelles
    Object.entries(prixParMatiere).forEach(([matiere, data]) => {
      if (!data || !Array.isArray(data.montants) || data.montants.length < 2) return;

      // Trouver le prix modal
      const frequences = {};
      data.montants.forEach(m => {
        if (typeof m === 'number') {
          frequences[m] = (frequences[m] || 0) + 1;
        }
      });

      let prixNormal = data.montants[0] || 0;
      let maxFrequence = 0;
      Object.entries(frequences).forEach(([prix, freq]) => {
        if (freq > maxFrequence) {
          maxFrequence = freq;
          prixNormal = parseFloat(prix) || 0;
        }
      });

      const tolerance = prixNormal * 0.25;
      const minAcceptable = prixNormal - tolerance;
      const maxAcceptable = prixNormal + tolerance;

      if (Array.isArray(data.inscriptions)) {
        data.inscriptions.forEach((insc) => {
          if (!insc) return;
          const montant = parseFloat(insc.amount) || 0;
          if (montant < minAcceptable || montant > maxAcceptable) {
            const variation = Math.abs(montant - prixNormal);
            const variationPercent = prixNormal > 0 ? Math.round((variation / prixNormal * 100) * 10) / 10 : 0;
            const anomalyId = `${matiere}-${montant}-${insc.createdAt?.toISOString().split('T')[0] || 'unknown'}`;

            if (!reportedAnomalies[anomalyId]) {
              allAnomalies.push({
                id: anomalyId,
                etudiant: insc.studentName || 'Unknown',
                cours: matiere,
                prixOfficiel: prixNormal,
                montantFacture: montant,
                ecart: Math.round(variation * 100) / 100,
                ecartPercent: variationPercent,
                centre: insc.centre || 'Unknown',
                type: montant < minAcceptable ? 'Sous-facturation' : 'Sur-facturation',
                date: insc.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
              });
            }
          }
        });
      }
    });

    // 4. Identifier les étudiants récidivistes
    const anomalieParEtudiant = {};
    if (Array.isArray(allAnomalies)) {
      allAnomalies.forEach(anom => {
        if (!anom || !anom.etudiant) return;
        if (!anomalieParEtudiant[anom.etudiant]) {
          anomalieParEtudiant[anom.etudiant] = [];
        }
        anomalieParEtudiant[anom.etudiant].push(anom);
      });
    }

    const recidivistes = Object.entries(anomalieParEtudiant)
      .filter(([_, anomalies]) => Array.isArray(anomalies) && anomalies.length > 1)
      .map(([etudiant, anomalies]) => ({
        etudiant,
        nombreAnomalies: anomalies.length,
        totalEcart: Math.round(anomalies.reduce((sum, a) => sum + a.ecart, 0) * 100) / 100
      }))
      .sort((a, b) => b.nombreAnomalies - a.nombreAnomalies);

    // 5. Top 5 anomalies par écart absolu
    const top5Anomalies = [...allAnomalies]
      .sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart))
      .slice(0, 5);

    // 6. Calcul conformité
    const totalTransactions = inscriptions.length;
    const transactionsNormales = totalTransactions - allAnomalies.length;
    const conformite = totalTransactions > 0
      ? Math.round((transactionsNormales / totalTransactions) * 100)
      : 100;

    // 7. Statistiques globales
    const totalInscriptions = inscriptions.length;
    const totalCA = inscriptions.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const totalEcart = allAnomalies.reduce((sum, a) => sum + a.ecart, 0);
    const moyenneParInscription = totalInscriptions > 0 ? totalCA / totalInscriptions : 0;

    // 8. Statistiques par centre (pour comparaison)
    const statsParCentre = {};
    if (Array.isArray(inscriptions)) {
      inscriptions.forEach(insc => {
        if (!insc) return;
        const centre = insc.centre || 'Unknown';
        if (!statsParCentre[centre]) {
          statsParCentre[centre] = {
            inscriptions: 0,
            ca: 0,
            anomalies: 0
          };
        }
        statsParCentre[centre].inscriptions++;
        statsParCentre[centre].ca += parseFloat(insc.amount) || 0;
      });
    }

    if (Array.isArray(allAnomalies)) {
      allAnomalies.forEach(anom => {
        if (!anom || !anom.centre) return;
        if (statsParCentre[anom.centre]) {
          statsParCentre[anom.centre].anomalies++;
        }
      });
    }

    const centresSorted = Object.entries(statsParCentre)
      .map(([centre, data]) => {
        const inscr = data.inscriptions || 0;
        const conf = inscr > 0 ? Math.round(((inscr - data.anomalies) / inscr) * 100) : 100;
        return {
          centre,
          inscriptions: inscr,
          ca: Math.round(data.ca * 100) / 100,
          anomalies: data.anomalies || 0,
          conformite: conf
        };
      })
      .sort((a, b) => b.ca - a.ca);

    return {
      weekStart: lastMonday.toLocaleDateString('fr-FR'),
      weekEnd: lastSunday.toLocaleDateString('fr-FR'),
      dateStart: lastMonday.toISOString().split('T')[0],
      dateEnd: lastSunday.toISOString().split('T')[0],
      statistiques: {
        totalInscriptions: totalInscriptions,
        totalCA: Math.round(totalCA * 100) / 100,
        totalAnomalies: allAnomalies.length,
        totalEcart: Math.round(totalEcart * 100) / 100,
        surFacturations: allAnomalies.filter(a => a.type === 'Sur-facturation').length,
        sousFacturations: allAnomalies.filter(a => a.type === 'Sous-facturation').length,
        conformite: conformite,
        moyenneParInscription: Math.round(moyenneParInscription * 100) / 100
      },
      anomalies: allAnomalies,
      top5: top5Anomalies,
      recidivistes: recidivistes,
      centres: centresSorted
    };
  } catch (error) {
    console.error('Error in generateFraudReport:', error);
    return {
      anomalies: [],
      top5: [],
      recidivistes: [],
      centres: [],
      weekStart: '',
      weekEnd: '',
      statistiques: {
        totalInscriptions: 0,
        totalCA: 0,
        totalAnomalies: 0,
        totalEcart: 0,
        conformite: 100
      },
      error: error.message
    };
  }
}

// Envoyer l'email de fraude
async function sendFraudEmail(rapport) {
  const subject = `🔍 AUDIT FRAUDE - Semaine du ${rapport.weekStart} : ${rapport.statistiques?.totalAnomalies || 0} anomalie(s)`;

  const htmlContent = generateFraudEmailHTML(rapport);

  const mailOptions = {
    from: `Audit Fraude <${EMAIL_USER}>`,
    to: EMAIL_TO,
    subject: subject,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email fraude envoyé:', info.messageId);

    // Sauvegarder les anomalies rapportées
    const weekStart = new Date(rapport.dateStart || rapport.weekStart.split('/').reverse().join('-'));

    // Sauvegarder les anomalies individuelles
    if (rapport.anomalies && Array.isArray(rapport.anomalies)) {
      for (const anomaly of rapport.anomalies) {
        if (anomaly.id) {
          await saveReportedAnomaly(anomaly.id, anomaly, weekStart);
        }
      }
    }

    // Sauvegarder le rapport complet pour référence
    await db.collection('fraud_reports').add({
      weekStart: rapport.dateStart || rapport.weekStart,
      weekEnd: rapport.dateEnd || rapport.weekEnd,
      totalAnomalies: rapport.statistiques?.totalAnomalies || 0,
      surFacturations: rapport.statistiques?.surFacturations || 0,
      sousFacturations: rapport.statistiques?.sousFacturations || 0,
      conformite: rapport.statistiques?.conformite || 100,
      totalEcart: rapport.statistiques?.totalEcart || 0,
      recidivistes: (rapport.recidivistes && rapport.recidivistes.length) || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ ${rapport.statistiques?.totalAnomalies || 0} anomalies sauvegardées`);
    return `Email envoyé avec succès`;
  } catch (error) {
    console.error('Erreur envoi email fraude:', error);
    throw error;
  }
}

// Générer le HTML de l'email fraude - version avancée
function generateFraudEmailHTML(rapport) {
  if (!rapport) {
    return `<html><body><h1>Erreur: Rapport invalide</h1></body></html>`;
  }

  const stats = rapport.statistiques || {
    totalInscriptions: 0,
    totalCA: 0,
    totalAnomalies: 0,
    totalEcart: 0,
    surFacturations: 0,
    sousFacturations: 0,
    conformite: 100,
    moyenneParInscription: 0
  };

  // Résumé court
  const resumeHTML = `
    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 15px 0;">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
        <div>
          <div style="color: #991b1b; font-size: 12px; font-weight: bold;">ANOMALIES</div>
          <div style="color: #dc2626; font-size: 28px; font-weight: bold;">${stats.totalAnomalies}</div>
        </div>
        <div>
          <div style="color: #991b1b; font-size: 12px; font-weight: bold;">CONFORMITÉ</div>
          <div style="color: ${stats.conformite >= 95 ? '#059669' : '#dc2626'}; font-size: 28px; font-weight: bold;">${stats.conformite}%</div>
        </div>
        <div>
          <div style="color: #991b1b; font-size: 12px; font-weight: bold;">ÉCART TOTAL</div>
          <div style="color: #dc2626; font-size: 28px; font-weight: bold;">${stats.totalEcart} DH</div>
        </div>
      </div>
    </div>
  `;

  // Statistiques détaillées
  const statsHTML = `
    <div style="background-color: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 20px; margin: 15px 0;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div>
          <div style="color: #059669; font-size: 12px; font-weight: bold;">Inscriptions</div>
          <div style="color: #065f46; font-size: 20px; font-weight: bold;">${stats.totalInscriptions}</div>
        </div>
        <div>
          <div style="color: #059669; font-size: 12px; font-weight: bold;">CA Total</div>
          <div style="color: #065f46; font-size: 20px; font-weight: bold;">${stats.totalCA} DH</div>
        </div>
        <div>
          <div style="color: #059669; font-size: 12px; font-weight: bold;">Sur-facturations</div>
          <div style="color: #065f46; font-size: 20px; font-weight: bold;">${stats.surFacturations}</div>
        </div>
        <div>
          <div style="color: #059669; font-size: 12px; font-weight: bold;">Sous-facturations</div>
          <div style="color: #065f46; font-size: 20px; font-weight: bold;">${stats.sousFacturations}</div>
        </div>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #a7f3d0;">
        <div style="color: #059669; font-size: 12px; font-weight: bold;">Moyenne par inscription</div>
        <div style="color: #065f46; font-size: 18px; font-weight: bold;">${stats.moyenneParInscription} DH</div>
      </div>
    </div>
  `;

  // Top 5 anomalies
  const top5Array = (rapport.top5 && Array.isArray(rapport.top5)) ? rapport.top5 : [];
  const top5HTML = top5Array.length > 0 ? `
    <h3 style="color: #dc2626; font-size: 16px; margin: 20px 0 15px 0;">🔴 Top 5 Anomalies</h3>
    <div style="background-color: #fef2f2; border-radius: 8px; padding: 15px;">
      ${top5Array.map((anom, idx) => `
        <div style="padding: 12px; margin: 8px 0; background-color: white; border-left: 4px solid #dc2626; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: bold; color: #1f2937;">
                <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${idx + 1}.</span> ${anom.etudiant}
              </div>
              <div style="font-size: 13px; color: #6b7280; margin-top: 3px;">
                ${anom.cours} | ${anom.centre}
              </div>
              <div style="font-size: 13px; color: #374151; margin-top: 3px;">
                Prix: ${anom.prixOfficiel} DH → Facturé: <strong>${anom.montantFacture} DH</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="color: #dc2626; font-weight: bold; font-size: 16px;">
                ${anom.type === 'Sur-facturation' ? '+' : '-'}${anom.ecart} DH
              </div>
              <div style="color: #9ca3af; font-size: 12px; margin-top: 3px;">
                ${anom.ecartPercent}%
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Récidivistes
  const recidivistesArray = (rapport.recidivistes && Array.isArray(rapport.recidivistes)) ? rapport.recidivistes : [];
  const recidivistesHTML = recidivistesArray.length > 0 ? `
    <h3 style="color: #dc2626; font-size: 16px; margin: 20px 0 15px 0;">⚠️ Étudiants Récidivistes</h3>
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px;">
      <table style="width: 100%; font-size: 13px;">
        <tr style="border-bottom: 1px solid #f59e0b;">
          <th style="text-align: left; padding: 8px; color: #92400e; font-weight: bold;">Étudiant</th>
          <th style="text-align: center; padding: 8px; color: #92400e; font-weight: bold;">Anomalies</th>
          <th style="text-align: right; padding: 8px; color: #92400e; font-weight: bold;">Écart Total</th>
        </tr>
        ${recidivistesArray.slice(0, 10).map(rec => `
          <tr style="border-bottom: 1px solid #fcd34d;">
            <td style="padding: 8px; color: #78350f;">${rec.etudiant}</td>
            <td style="text-align: center; padding: 8px; color: #92400e; font-weight: bold;">${rec.nombreAnomalies}</td>
            <td style="text-align: right; padding: 8px; color: #dc2626; font-weight: bold;">${rec.totalEcart} DH</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  // Statistiques par centre
  const centresArray = (rapport.centres && Array.isArray(rapport.centres)) ? rapport.centres : [];
  const centresHTML = centresArray.length > 0 ? `
    <h3 style="color: #1f2937; font-size: 16px; margin: 20px 0 15px 0;">📍 Récapitulatif par Centre</h3>
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; font-size: 13px;">
      <table style="width: 100%;">
        <tr style="border-bottom: 2px solid #d1d5db;">
          <th style="text-align: left; padding: 8px; color: #374151; font-weight: bold;">Centre</th>
          <th style="text-align: center; padding: 8px; color: #374151; font-weight: bold;">Inscr.</th>
          <th style="text-align: right; padding: 8px; color: #374151; font-weight: bold;">CA</th>
          <th style="text-align: center; padding: 8px; color: #374151; font-weight: bold;">Anom.</th>
          <th style="text-align: center; padding: 8px; color: #374151; font-weight: bold;">Conf.</th>
        </tr>
        ${centresArray.map(c => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; color: #1f2937; font-weight: bold;">${c.centre}</td>
            <td style="text-align: center; padding: 8px; color: #6b7280;">${c.inscriptions}</td>
            <td style="text-align: right; padding: 8px; color: #059669; font-weight: bold;">${c.ca} DH</td>
            <td style="text-align: center; padding: 8px; color: ${c.anomalies > 0 ? '#dc2626' : '#059669'}; font-weight: bold;">${c.anomalies}</td>
            <td style="text-align: center; padding: 8px; color: ${c.conformite >= 95 ? '#059669' : '#dc2626'}; font-weight: bold;">${c.conformite}%</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  // Tableau détaillé des anomalies
  const anomaliesArray = (rapport.anomalies && Array.isArray(rapport.anomalies)) ? rapport.anomalies : [];
  const detailsHTML = anomaliesArray.length > 0 ? `
    <h3 style="color: #dc2626; font-size: 16px; margin: 20px 0 15px 0;">📋 Détail des Anomalies</h3>
    <div style="background-color: #fef2f2; border-radius: 8px; overflow-x: auto;">
      <table style="width: 100%; font-size: 12px;">
        <tr style="background-color: #fee2e2; border-bottom: 2px solid #ef4444;">
          <th style="padding: 8px; text-align: left; color: #991b1b; font-weight: bold;">ID</th>
          <th style="padding: 8px; text-align: left; color: #991b1b; font-weight: bold;">Étudiant</th>
          <th style="padding: 8px; text-align: left; color: #991b1b; font-weight: bold;">Cours</th>
          <th style="padding: 8px; text-align: right; color: #991b1b; font-weight: bold;">Prix</th>
          <th style="padding: 8px; text-align: right; color: #991b1b; font-weight: bold;">Facturé</th>
          <th style="padding: 8px; text-align: right; color: #991b1b; font-weight: bold;">Écart</th>
          <th style="padding: 8px; text-align: center; color: #991b1b; font-weight: bold;">Type</th>
        </tr>
        ${anomaliesArray.slice(0, 50).map((anom, idx) => `
          <tr style="border-bottom: 1px solid #fecaca;">
            <td style="padding: 6px; color: #6b7280;">${idx + 1}</td>
            <td style="padding: 6px; color: #1f2937;">${anom.etudiant}</td>
            <td style="padding: 6px; color: #6b7280; font-size: 11px;">${anom.cours}</td>
            <td style="padding: 6px; text-align: right; color: #059669;">${anom.prixOfficiel} DH</td>
            <td style="padding: 6px; text-align: right; color: #dc2626; font-weight: bold;">${anom.montantFacture} DH</td>
            <td style="padding: 6px; text-align: right; color: #dc2626; font-weight: bold;">${anom.type === 'Sur-facturation' ? '+' : '-'}${anom.ecart} DH</td>
            <td style="padding: 6px; text-align: center; color: ${anom.type === 'Sur-facturation' ? '#dc2626' : '#f59e0b'}; font-weight: bold;">
              ${anom.type === 'Sur-facturation' ? '📈' : '📉'}
            </td>
          </tr>
        `).join('')}
      </table>
      ${anomaliesArray.length > 50 ? `
        <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
          ... et ${anomaliesArray.length - 50} autres anomalies
        </div>
      ` : ''}
    </div>
  ` : `
    <div style="background-color: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #166534; margin: 0; font-size: 16px;">✅ Aucune anomalie détectée</h3>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 900px; margin: 0 auto; background-color: #f9fafb; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 20px 0 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
        table { border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔍 AUDIT FRAUDE - RAPPORT HEBDOMADAIRE</h1>
          <p style="margin: 10px 0 0 0;">Semaine du ${rapport.weekStart} au ${rapport.weekEnd}</p>
        </div>
        <div class="content">
          <div class="section-title">📊 Résumé Exécutif</div>
          ${resumeHTML}

          <div class="section-title">📈 Statistiques Détaillées</div>
          ${statsHTML}

          ${top5HTML}

          ${recidivistesHTML}

          ${centresHTML}

          ${detailsHTML}

          <div class="footer">
            <p>Ce rapport a été généré automatiquement</p>
            <p>Intellection ClassBoard © 2026</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// RESTORED FUNCTIONS - Recreated from standard Firebase patterns
// ============================================================================

// Save FCM push token for notifications
exports.savePushToken = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      const { userId, token } = data;
      if (!userId || !token) {
        throw new functions.https.HttpsError('invalid-argument', 'userId and token required');
      }
      await db.collection('users').doc(userId).collection('tokens').doc(token).set({
        token: token,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        platform: data.platform || 'unknown'
      });
      console.log(`Token saved for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error saving token:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Remove FCM push token
exports.removePushToken = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    try {
      const { userId, token } = data;
      if (!userId || !token) {
        throw new functions.https.HttpsError('invalid-argument', 'userId and token required');
      }
      await db.collection('users').doc(userId).collection('tokens').doc(token).delete();
      console.log(`Token removed for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error removing token:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

// Get student attendance - HTTP GET endpoint
exports.getStudentAttendance = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      const matricule = req.query.matricule;
      if (!matricule) {
        return res.status(400).json({ success: false, error: 'Matricule is required' });
      }
      const axios = require('axios');
      const cheerio = require('cheerio');
      const response = await axios.get(`https://www.intellectiongroupe.ma/etudiant/${matricule}`, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const $ = cheerio.load(response.data);
      const attendances = [];
      $('table').each((tableIndex, table) => {
        $(table).find('tbody tr').each((index, row) => {
          const cells = $(row).find('td');
          if (cells.length > 0) {
            const date = $(cells[0]).text().trim();
            const matiere = $(cells[1]).text().trim();
            const professor = $(cells[2]).text().trim();
            if (date && matiere) {
              attendances.push({
                id: `${matricule}-${date}-${matiere}`.replace(/\s+/g, '-'),
                matiere: matiere,
                date: date,
                professor: professor
              });
            }
          }
        });
      });
      res.status(200).json({ success: true, data: attendances, count: attendances.length, message: `${attendances.length} records found` });
    } catch (error) {
      console.error('Error getting attendance:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to scrape attendance' });
    }
  });

// Notify on session status change - Firestore trigger
exports.notifyOnSessionStatusChange = functions
  .region('us-central1')
  .firestore.document('sessions/{sessionId}')
  .onWrite(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const sessionId = context.params.sessionId;

      if (!before || !after) return;

      const statusChanged = before.status !== after.status;
      if (!statusChanged) return;

      console.log(`Session ${sessionId} status changed from ${before.status} to ${after.status}`);

      const usersSnapshot = await db.collection('users').get();
      const notificationPromises = [];

      usersSnapshot.forEach(userDoc => {
        const tokensRef = userDoc.ref.collection('tokens');
        notificationPromises.push(
          tokensRef.get().then(tokensSnap => {
            const tokens = tokensSnap.docs.map(d => d.id);
            if (tokens.length > 0) {
              const message = {
                notification: {
                  title: 'Session Updated',
                  body: `Session status changed to ${after.status}`
                },
                tokens: tokens
              };
              return admin.messaging().sendMulticast(message).catch(e => console.error('Send error:', e));
            }
          })
        );
      });

      await Promise.all(notificationPromises);
      console.log('Notifications sent for session status change');
      return { success: true };
    } catch (error) {
      console.error('Error in notifyOnSessionStatusChange:', error);
    }
  });
