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
      if (rapport.suspicions.length > 0 || rapport.encaissements.anormaux.length > 0) {
        await sendFraudEmail(rapport);
      }
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
      if (rapport.suspicions.length > 0 || rapport.encaissements.anormaux.length > 0) {
        const result = await sendFraudEmail(rapport);
        res.status(200).json({ success: true, message: result, rapport });
      } else {
        res.status(200).json({ success: true, message: 'Aucune anomalie détectée', rapport });
      }
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
    matiere: anomalyData.matiere,
    montant: anomalyData.montant || anomalyData.montantFacture,
    prixNormal: anomalyData.prixNormal || anomalyData.montantNormal,
    reportedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Générer le rapport de fraude
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

    // 1. Récupérer les inscriptions de la semaine depuis payment_records
    let inscriptions = [];
    const paymentSnap = await db
      .collection('payment_records')
      .limit(1000)
      .get();

    inscriptions = paymentSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().date?.toDate() || d.data().createdAt?.toDate() || new Date()
    })).filter(i => {
      const date = i.createdAt || new Date();
      return date >= lastMonday && date <= lastSunday;
    });

  // 2. Grouper par matière et trouver le prix normal (modal - le plus fréquent)
  const prixParMatiere = {};
  inscriptions.forEach(insc => {
    const matiere = insc.matiere || 'Unknown';
    if (!prixParMatiere[matiere]) {
      prixParMatiere[matiere] = {
        montants: [],
        inscriptions: []
      };
    }
    const montant = parseFloat(insc.amount) || 0;
    prixParMatiere[matiere].montants.push(montant);
    prixParMatiere[matiere].inscriptions.push(insc);
  });

  // 3. Trouver le prix MODAL (le plus fréquent) et détecter variations ±25%
  const suspicions = [];
  Object.entries(prixParMatiere).forEach(([matiere, data]) => {
    if (data.montants.length < 2) return; // Besoin d'au moins 2 pour comparer

    // Compter les fréquences de chaque montant
    const frequences = {};
    data.montants.forEach(m => {
      frequences[m] = (frequences[m] || 0) + 1;
    });

    // Trouver le prix qui revient le plus souvent (mode)
    let prixNormal = data.montants[0];
    let maxFrequence = 0;
    Object.entries(frequences).forEach(([prix, freq]) => {
      if (freq > maxFrequence) {
        maxFrequence = freq;
        prixNormal = parseFloat(prix);
      }
    });

    const tolerance = prixNormal * 0.25; // 25% du prix normal
    const minAcceptable = prixNormal - tolerance;
    const maxAcceptable = prixNormal + tolerance;

    data.inscriptions.forEach((insc) => {
      const montant = parseFloat(insc.amount) || 0;
      if (montant < minAcceptable || montant > maxAcceptable) {
        const variation = Math.abs(montant - prixNormal);
        const anomalyId = `${matiere}-${montant}-${insc.createdAt?.toISOString().split('T')[0] || 'unknown'}`;

        // Ne pas ajouter si déjà rapportée
        if (reportedAnomalies[anomalyId]) {
          return;
        }

        suspicions.push({
          id: anomalyId,
          matiere,
          etudiant: insc.studentName || 'Unknown',
          centre: insc.centre || 'Unknown',
          montantFacture: montant,
          prixNormal: prixNormal,
          variation: Math.round((variation / prixNormal * 100) * 10) / 10,
          date: insc.createdAt?.toLocaleDateString('fr-FR') || new Date().toLocaleDateString('fr-FR'),
          type: montant < minAcceptable ? '📉 Trop bas' : '📈 Trop haut'
        });
      }
    });
  });

  // 4. Analyser encaissements par centre
  const encaisementsParCentre = {};
  inscriptions.forEach(insc => {
    const centre = insc.centre || 'Unknown';
    if (!encaisementsParCentre[centre]) {
      encaisementsParCentre[centre] = { total: 0, count: 0, montants: [], matières: {} };
    }
    const montant = parseFloat(insc.amount) || 0;
    const matiere = insc.matiere || 'Unknown';

    encaisementsParCentre[centre].total += montant;
    encaisementsParCentre[centre].count++;
    encaisementsParCentre[centre].montants.push(montant);

    if (!encaisementsParCentre[centre].matières[matiere]) {
      encaisementsParCentre[centre].matières[matiere] = 0;
    }
    encaisementsParCentre[centre].matières[matiere] += montant;
  });

  // Détecter encaissements anormaux (écart > 30% du prix modal)
  const encaissementsAnormaux = [];
  Object.entries(encaisementsParCentre).forEach(([centre, data]) => {
    if (data.count < 3) return;

    // Trouver le montant modal pour ce centre
    const frequences = {};
    data.montants.forEach(m => {
      frequences[m] = (frequences[m] || 0) + 1;
    });
    let montantNormal = data.montants[0];
    let maxFrequence = 0;
    Object.entries(frequences).forEach(([m, freq]) => {
      if (freq > maxFrequence) {
        maxFrequence = freq;
        montantNormal = parseFloat(m);
      }
    });

    const tolerance = montantNormal * 0.30; // 30%
    const minAcceptable = montantNormal - tolerance;
    const maxAcceptable = montantNormal + tolerance;
    const moyenne = data.total / data.count;

    data.montants.forEach((montant) => {
      if (montant < minAcceptable || montant > maxAcceptable) {
        const variation = Math.abs(montant - montantNormal);
        const anomalyId = `encaissement-${centre}-${montant}`;

        // Ne pas ajouter si déjà rapportée
        if (reportedAnomalies[anomalyId]) {
          return;
        }

        encaissementsAnormaux.push({
          id: anomalyId,
          centre,
          montant,
          montantNormal: montantNormal,
          moyenneParInscription: Math.round(moyenne * 100) / 100,
          variation: Math.round((variation / montantNormal * 100) * 10) / 10,
          type: montant < minAcceptable ? '📉 Montant anormalement bas' : '📈 Montant anormalement haut'
        });
      }
    });
  });

  return {
    weekStart: lastMonday.toLocaleDateString('fr-FR'),
    weekEnd: lastSunday.toLocaleDateString('fr-FR'),
    suspicions: suspicions.slice(0, 20), // Limit to 20
    encaissements: {
      parCentre: Object.entries(encaisementsParCentre).map(([centre, data]) => ({
        centre,
        totalEncaisse: Math.round(data.total * 100) / 100,
        nombreInscriptions: data.count,
        moyenneParInscription: Math.round((data.total / data.count) * 100) / 100
      })),
      anormaux: encaissementsAnormaux
    }
    };
  } catch (error) {
    console.error('Error in generateFraudReport:', error);
    return { suspicions: [], encaissements: { parCentre: [], anormaux: [] }, weekStart: '', weekEnd: '', error: error.message };
  }
}

// Envoyer l'email de fraude
async function sendFraudEmail(rapport) {
  const subject = `🔍 AUDIT FRAUDE - Semaine du ${rapport.weekStart} : ${rapport.suspicions.length + rapport.encaissements.anormaux.length} anomalie(s)`;

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
    const weekStart = new Date(rapport.weekStart.split('/').reverse().join('-'));

    // Sauvegarder les suspicions (variations de prix)
    for (const suspicion of rapport.suspicions) {
      if (suspicion.id) {
        await saveReportedAnomaly(suspicion.id, suspicion, weekStart);
      }
    }

    // Sauvegarder les encaissements anormaux
    for (const anomaly of rapport.encaissements.anormaux) {
      if (anomaly.id) {
        await saveReportedAnomaly(anomaly.id, anomaly, weekStart);
      }
    }

    console.log(`✅ ${rapport.suspicions.length + rapport.encaissements.anormaux.length} anomalies sauvegardées`);
    return `Email envoyé avec succès`;
  } catch (error) {
    console.error('Erreur envoi email fraude:', error);
    throw error;
  }
}

// Générer le HTML de l'email fraude
function generateFraudEmailHTML(rapport) {
  let suspicionsHTML = '';
  if (rapport.suspicions.length === 0) {
    suspicionsHTML = `
      <div style="background-color: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="color: #166534; margin: 0; font-size: 16px;">✅ Aucune variation de prix suspecte (±25%)</h3>
      </div>
    `;
  } else {
    suspicionsHTML = rapport.suspicions.map(s => `
      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 10px 0; border-radius: 4px;">
        <div style="font-weight: bold; color: #991b1b; font-size: 14px;">${s.type} ${s.matiere}</div>
        <div style="color: #7f1d1d; font-size: 13px; margin-top: 5px;">
          👤 ${s.etudiant} | 📍 ${s.centre}
        </div>
        <div style="color: #7f1d1d; font-size: 13px; margin-top: 3px;">
          💰 Montant facturé: <strong>${s.montantFacture}DH</strong> | Prix normal: ${s.prixNormal}DH
        </div>
        <div style="color: #991b1b; font-size: 13px; font-weight: bold; margin-top: 3px;">
          ⚠️ Écart: <strong>${s.variation}%</strong> du prix normal
        </div>
        <div style="color: #9ca3af; font-size: 12px; margin-top: 3px;">📅 ${s.date}</div>
      </div>
    `).join('');
  }

  let encaissementsHTML = rapport.encaissements.parCentre.map(e => `
    <div style="background-color: #f0f4f8; padding: 15px; margin: 8px 0; border-radius: 4px; border-left: 4px solid #3b82f6;">
      <div style="font-weight: bold; color: #1e40af; font-size: 14px;">📍 ${e.centre}</div>
      <div style="color: #475569; font-size: 13px; margin-top: 5px;">
        💰 Total encaissé: <strong>${e.totalEncaisse}DH</strong>
      </div>
      <div style="color: #475569; font-size: 13px; margin-top: 2px;">
        📊 ${e.nombreInscriptions} inscriptions | Moyenne: ${e.moyenneParInscription}DH/inscription
      </div>
    </div>
  `).join('');

  let anomaliesHTML = '';
  if (rapport.encaissements.anormaux.length > 0) {
    anomaliesHTML = `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #fbbf24;">
        <h3 style="color: #92400e; font-size: 16px; margin: 0 0 15px 0;">⚠️ Montants Anormaux (variation > 30%)</h3>
        ${rapport.encaissements.anormaux.map(a => `
          <div style="background-color: #fef3c7; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #f59e0b;">
            <div style="color: #92400e; font-size: 13px; font-weight: bold;">
              ${a.type} - ${a.centre}
            </div>
            <div style="color: #92400e; font-size: 13px; margin-top: 3px;">
              💰 Montant: <strong>${a.montant}DH</strong> | Normal: ${a.montantNormal}DH
            </div>
            <div style="color: #92400e; font-size: 13px; margin-top: 2px;">
              📊 Écart: <strong>${a.variation}%</strong> | Moyenne générale: ${a.moyenneParInscription}DH
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; background-color: #f9fafb; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 20px 0 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔍 AUDIT FRAUDE - RAPPORT HEBDOMADAIRE</h1>
          <p style="margin: 10px 0 0 0;">Semaine du ${rapport.weekStart} au ${rapport.weekEnd}</p>
        </div>
        <div class="content">
          <div class="section-title">🚨 Variations de Prix Suspectes (±25%)</div>
          ${suspicionsHTML}

          <div class="section-title">💼 Encaissements par Centre</div>
          ${encaissementsHTML}

          ${anomaliesHTML}

          <div class="footer">
            <p>Ce rapport a été généré automatiquement chaque dimanche à 09h00</p>
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
