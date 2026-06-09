// Test script for agent schedule report email
const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_USER = 'intellectionaudit@gmail.com';
const EMAIL_PASS = 'plcyojeqnxxwvktr';
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

// Test report data
const testRapport = {
  weekStart: new Date().toLocaleDateString('fr-FR'),
  weekEnd: new Date(Date.now() + 6*24*60*60*1000).toLocaleDateString('fr-FR'),
  agents: [
    {
      agent: 'Ali Mohamed',
      centre: 'Hay Salam',
      analysis: {
        days: [
          { jour: 'lundi', statut: '✅ OK', details: 'Hay Salam | 09:00-17:00 | Entrée: 08:55 | Sortie: 17:05', ecart: 0 },
          { jour: 'mardi', statut: '⚠️ RETARD', details: 'Doukkali | 09:00-17:00 | Entrée: 09:15 | Sortie: 17:00', ecart: 15 },
          { jour: 'mercredi', statut: '✅ OK', details: 'Saada | 10:00-18:00 | Entrée: 09:58 | Sortie: 18:02', ecart: 0 },
          { jour: 'jeudi', statut: '❌ ABSENT', details: 'Hay Salam | 09:00-17:00 | Pas d\'entrée/sortie', ecart: 480 },
          { jour: 'vendredi', statut: '✅ OK', details: 'Hay Salam | 09:00-17:00 | Entrée: 09:00 | Sortie: 17:00', ecart: 0 },
          { jour: 'samedi', statut: 'REPOS', details: '—', ecart: 0 },
          { jour: 'dimanche', statut: 'REPOS', details: '—', ecart: 0 }
        ],
        summary: {
          daysPresent: 4,
          daysAbsent: 1,
          totalEcarts: 495,
          status: '⚠️ ÉCARTS: 495min'
        }
      }
    },
    {
      agent: 'Fatima Bennani',
      centre: 'Doukkali',
      analysis: {
        days: [
          { jour: 'lundi', statut: '✅ OK', details: 'Doukkali | 09:00-17:00 | Entrée: 09:00 | Sortie: 17:00', ecart: 0 },
          { jour: 'mardi', statut: '✅ OK', details: 'Doukkali | 09:00-17:00 | Entrée: 09:02 | Sortie: 16:58', ecart: 0 },
          { jour: 'mercredi', statut: '✅ OK', details: 'Doukkali | 09:00-17:00 | Entrée: 09:00 | Sortie: 17:00', ecart: 0 },
          { jour: 'jeudi', statut: '✅ OK', details: 'Doukkali | 09:00-17:00 | Entrée: 08:55 | Sortie: 17:05', ecart: 0 },
          { jour: 'vendredi', statut: '✅ OK', details: 'Doukkali | 09:00-17:00 | Entrée: 09:00 | Sortie: 17:00', ecart: 0 },
          { jour: 'samedi', statut: 'REPOS', details: '—', ecart: 0 },
          { jour: 'dimanche', statut: 'REPOS', details: '—', ecart: 0 }
        ],
        summary: {
          daysPresent: 5,
          daysAbsent: 0,
          totalEcarts: 0,
          status: '✅ CONFORME'
        }
      }
    }
  ]
};

// Generate HTML
const htmlContent = `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .ok { color: #27ae60; font-weight: bold; }
        .warning { color: #e67e22; font-weight: bold; }
        .error { color: #e74c3c; font-weight: bold; }
        .summary { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <h1>📋 Rapport Hebdomadaire - Respect des Horaires des Agents</h1>
      <p><strong>Période:</strong> ${testRapport.weekStart} → ${testRapport.weekEnd}</p>

      ${testRapport.agents.map(agent => `
        <div class="summary">
          <h2>👤 ${agent.agent}</h2>
          <p><strong>Centre:</strong> ${agent.centre}</p>
          <p><strong>Statut Global:</strong> <span class="${
            agent.analysis.summary.status.includes('CONFORME') ? 'ok' : 'warning'
          }">${agent.analysis.summary.status}</span></p>
          <p>Jours présents: ${agent.analysis.summary.daysPresent} | Jours absents: ${agent.analysis.summary.daysAbsent} | Total écarts: ${agent.analysis.summary.totalEcarts}min</p>

          <table>
            <thead>
              <tr>
                <th>Jour</th>
                <th>Statut</th>
                <th>Détails</th>
                <th>Écart (min)</th>
              </tr>
            </thead>
            <tbody>
              ${agent.analysis.days.map(day => `
                <tr>
                  <td>${day.jour}</td>
                  <td class="${
                    day.statut.includes('OK') ? 'ok' :
                    day.statut.includes('ABSENT') ? 'error' : 'warning'
                  }">${day.statut}</td>
                  <td>${day.details}</td>
                  <td>${day.ecart || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
        ✅ Ceci est un email de TEST - Les données sont fictives
      </p>
    </body>
  </html>
`;

const mailOptions = {
  from: EMAIL_USER,
  to: EMAIL_TO,
  subject: `🧪 TEST - Rapport Horaires Agents - Semaine du ${testRapport.weekStart}`,
  html: htmlContent
};

console.log('📧 Envoi du mail de test...');
console.log('À:', EMAIL_TO);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Email envoyé avec succès!');
    console.log('📬 Réponse:', info.response);
    process.exit(0);
  }
});
