import { jsPDF } from 'jspdf';
import fs from 'fs';

const doc = new jsPDF({
  orientation: 'p',
  unit: 'mm',
  format: 'a4',
  compress: true
});

// Utiliser Helvetica qui supporte mieux l'UTF-8
doc.setFont('Helvetica');

// Couleurs
const primaryColor = [31, 78, 121];
const accentColor = [66, 139, 202];
const darkGray = [50, 50, 50];
const lightGray = [200, 200, 200];

let yPos = 20;
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 15;

function addPage() {
  doc.addPage();
  yPos = 20;
}

function addTitle(text, color = primaryColor) {
  doc.setFillColor(...color);
  doc.rect(0, yPos - 8, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text(text, margin, yPos);
  yPos += 18;
}

function addSectionTitle(text) {
  doc.setTextColor(...accentColor);
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.text(text, margin, yPos);
  yPos += 8;
}

function addText(text, size = 10, bold = false, indent = 0) {
  doc.setTextColor(...darkGray);
  doc.setFontSize(size);
  doc.setFont('Helvetica', bold ? 'bold' : 'normal');

  const x = margin + indent;
  const maxWidth = pageWidth - (2 * margin) - indent;
  const lines = doc.splitTextToSize(text, maxWidth);

  lines.forEach((line, idx) => {
    if (yPos > pageHeight - 25) {
      addPage();
    }
    doc.text(line, x, yPos);
    yPos += 6;
  });
}

function checkPageEnd() {
  if (yPos > pageHeight - 30) {
    addPage();
  }
}

// ============ PAGE 1 - TITRE ============
doc.setFillColor(...primaryColor);
doc.rect(0, 0, pageWidth, 100, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(36);
doc.setFont('Helvetica', 'bold');
doc.text('CONCOURS BLANC', pageWidth / 2, 35, { align: 'center' });

doc.setFontSize(18);
doc.setFont('Helvetica', 'normal');
doc.text('Guide pour les Etudiants', pageWidth / 2, 55, { align: 'center' });

doc.setFontSize(12);
doc.text('Intellection ClassBoard - 2026', pageWidth / 2, 75, { align: 'center' });

yPos = 110;

// ============ INTRODUCTION ============
addSectionTitle('Qu\'est-ce qu\'un Concours Blanc ?');
yPos += 2;

addText('Un Concours Blanc est un examen pratique qui vous permet de :');
yPos += 2;

addText('Tester vos connaissances avant l\'examen reel', 10, false, 10);
addText('Vous familiariser avec le format des questions', 10, false, 10);
addText('Gerer votre temps dans les conditions reelles', 10, false, 10);
addText('Recevoir un score et des retours immediats', 10, false, 10);

yPos += 8;

// ============ INTERFACE ============
addSectionTitle('Interface du Concours Blanc');
yPos += 2;

doc.setDrawColor(...accentColor);
doc.setLineWidth(0.5);
doc.rect(margin, yPos - 6, pageWidth - 2*margin, 40);

addText('GAUCHE (60%) : Affichage du PDF du sujet de l\'epreuve', 10, false, 5);
addText('DROITE (40%) : Questions a choix multiples (QCM)', 10, false, 5);
yPos += 2;
addText('HAUT : Chronometre et barre de progression', 10, false, 5);
addText('BAS : Boutons Annuler et Soumettre l\'examen', 10, false, 5);

yPos += 10;

checkPageEnd();

// ============ PAGE 2 - GUIDE ETAPE PAR ETAPE ============
addPage();
addTitle('Guide Etape par Etape');

const steps = [
  {
    num: '1',
    title: 'Accedez au Concours Blanc',
    text: 'Connectez-vous a ClassBoard et selectionnez le concours blanc dans la liste des concours disponibles.'
  },
  {
    num: '2',
    title: 'Lisez les Instructions',
    text: 'Consultez le message de bienvenue avec le nombre d\'epreuves, le nombre total de questions et la duree.'
  },
  {
    num: '3',
    title: 'Lancez le Concours',
    text: 'Cliquez sur "Commencer le concours" pour demarrer le chronometre et acceder au contenu.'
  },
  {
    num: '4',
    title: 'Consultez le Sujet (PDF)',
    text: 'A gauche : Consultez le PDF du sujet de l\'epreuve. Vous pouvez zoomer et scroller dans le document.'
  },
  {
    num: '5',
    title: 'Repondez aux Questions',
    text: 'A droite : Lisez chaque question et selectionnez votre reponse (A, B, C ou D) en cliquant sur le bouton correspondant.'
  },
  {
    num: '6',
    title: 'Changez d\'Epreuve',
    text: 'Cliquez sur une autre epreuve pour voir son sujet (PDF) et ses questions associees.'
  },
  {
    num: '7',
    title: 'Soumettez votre Examen',
    text: 'Quand vous avez termine, cliquez "Soumettre l\'examen" pour finaliser votre participation.'
  },
  {
    num: '8',
    title: 'Consultez vos Resultats',
    text: 'Vous verrez immediatement votre score global et le detail par epreuve avec les bonnes reponses.'
  }
];

steps.forEach((step, idx) => {
  checkPageEnd();

  // Numero
  doc.setFillColor(...accentColor);
  doc.circle(margin + 3, yPos + 2, 3.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text(step.num, margin + 3, yPos + 2.5, { align: 'center' });

  // Titre
  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(step.title, margin + 12, yPos);

  // Texte
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  const lines = doc.splitTextToSize(step.text, pageWidth - (2 * margin) - 12);
  doc.text(lines, margin + 12, yPos + 5);

  yPos += Math.max(lines.length * 5 + 3, 10) + 2;
});

// ============ PAGE 3 - CONSEILS ============
addPage();
addTitle('Conseils et Astuces');

const tips = [
  ['Gerez votre temps', 'Consultez le chronometre en haut a droite. Divisez votre temps en fonction du nombre d\'epreuves et de questions.'],
  ['Suivez votre progression', 'La barre de progression montre le nombre de questions repondues. Essayez de repondre a toutes les questions avant la fin du temps.'],
  ['Comprenez le sujet', 'Lisez attentivement le sujet en PDF a gauche avant de repondre aux questions. C\'est votre reference principale.'],
  ['Reverifiez vos reponses', 'Avant de soumettre, verifiez que vous avez repondu a toutes les questions. Un point vert indique une question repondues.'],
  ['Changez d\'epreuve', 'Vous pouvez naviguer entre les epreuves librement. Commencez par les epreuves les plus faciles si vous preferez.'],
  ['Pas de copier-coller', 'Vous devez repondre seul(e) selon les regles de votre etablissement. Les triches ne sont pas tolerees.'],
  ['Auto-sauvegarde', 'Vos reponses sont automatiquement enregistrees. Pas besoin de cliquer sur "Sauvegarder".'],
  ['Pas de retour apres soumission', 'Une fois soumis, vous ne pouvez pas modifier vos reponses. Soyez sur(e) avant de soumettre !']
];

tips.forEach(([title, tip]) => {
  checkPageEnd();

  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(title, margin, yPos);
  yPos += 5;

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  const lines = doc.splitTextToSize(tip, pageWidth - (2 * margin) - 8);
  doc.text(lines, margin + 5, yPos);
  yPos += lines.length * 5 + 4;
});

yPos += 5;

checkPageEnd();

// ============ NOTATION ============
addSectionTitle('Systeme de Notation');
yPos += 2;

addText('Chaque question a une valeur en points (generalement 1 ou 2 points)', 10, false, 8);
addText('Une bonne reponse = Points de la question', 10, false, 8);
addText('Une mauvaise reponse = 0 points', 10, false, 8);
addText('Score final = Somme de tous les points obtenus', 10, false, 8);
addText('Pourcentage = (Score / Score Total Possible) x 100', 10, false, 8);

yPos += 8;

// ============ SUPPORT ============
checkPageEnd();
addSectionTitle('Besoin d\'Aide ?');
yPos += 2;

addText('Probleme technique : Contactez l\'administrateur du systeme', 10, false, 8);
addText('Question sur le contenu : Posez a votre professeur', 10, false, 8);
addText('Email de support : support@intellection.edu', 10, false, 8);
addText('Horaires de support : Lundi-Vendredi, 9h-17h', 10, false, 8);

// ============ FOOTER ============
doc.setTextColor(150, 150, 150);
doc.setFontSize(8);
doc.setFont('Helvetica', 'normal');
doc.text('Intellection ClassBoard - Guide Etudiant', pageWidth / 2, pageHeight - 10, { align: 'center' });

// ============ SAUVEGARDER ============
const outputPath = 'Guide_Concours_Blanc_Etudiants.pdf';
doc.save(outputPath);
console.log('✅ PDF genere avec succes:', outputPath);
console.log('✅ Tous les caracteres sont correctement encodes');
console.log('✅ Format: 3 pages A4');
