import { jsPDF } from 'jspdf';
import fs from 'fs';

const doc = new jsPDF('p', 'mm', 'a4');

// Couleurs
const primaryColor = [31, 78, 121];      // Bleu foncé
const accentColor = [66, 139, 202];      // Bleu moyen
const lightGray = [245, 245, 245];       // Gris clair
const darkGray = [80, 80, 80];           // Gris foncé

let yPos = 20;

// ========== PAGE DE TITRE ==========
doc.setFillColor(...primaryColor);
doc.rect(0, 0, 210, 80, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(32);
doc.setFont(undefined, 'bold');
doc.text('CONCOURS BLANC', 105, 35, { align: 'center' });

doc.setFontSize(16);
doc.setFont(undefined, 'normal');
doc.text('Guide pour les Étudiants', 105, 50, { align: 'center' });

doc.setFontSize(11);
doc.text('Intellection ClassBoard - 2026', 105, 65, { align: 'center' });

yPos = 95;

// ========== INTRODUCTION ==========
doc.setTextColor(...darkGray);
doc.setFontSize(14);
doc.setFont(undefined, 'bold');
doc.text('📚 Qu\'est-ce qu\'un Concours Blanc ?', 15, yPos);

yPos += 8;
doc.setFontSize(11);
doc.setFont(undefined, 'normal');
const introText = [
  'Un Concours Blanc est un examen pratique qui vous permet de :',
  '• Tester vos connaissances avant l\'examen réel',
  '• Vous familiariser avec le format des questions',
  '• Gérer votre temps dans les conditions réelles',
  '• Recevoir un score et des retours immédiats'
];

introText.forEach(line => {
  doc.text(line, 15, yPos);
  yPos += 6;
});

yPos += 5;

// ========== INTERFACE ==========
doc.setFillColor(...accentColor);
doc.rect(15, yPos - 5, 180, 7, 'F');
doc.setTextColor(255, 255, 255);
doc.setFontSize(12);
doc.setFont(undefined, 'bold');
doc.text('🖥️ Interface du Concours Blanc', 20, yPos);

yPos += 12;
doc.setTextColor(...darkGray);
doc.setFontSize(11);

// Section interface
const interfaceContent = [
  ['GAUCHE (60%)', 'Affichage du PDF du sujet de l\'épreuve'],
  ['DROITE (40%)', 'Questions à choix multiples (QCM)'],
  ['HAUT', 'Chronomètre et barre de progression'],
  ['BAS', 'Boutons Annuler et Soumettre l\'examen']
];

interfaceContent.forEach(([label, desc]) => {
  doc.setFont(undefined, 'bold');
  doc.text(label + ':', 15, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(desc, 50, yPos);
  yPos += 6;
});

yPos += 5;

// ========== PAGE 2 ==========
doc.addPage();
yPos = 20;

// ========== GUIDE ÉTAPE PAR ÉTAPE ==========
doc.setTextColor(255, 255, 255);
doc.setFillColor(...accentColor);
doc.rect(15, yPos - 5, 180, 7, 'F');
doc.setFontSize(12);
doc.setFont(undefined, 'bold');
doc.text('📋 Guide Étape par Étape', 20, yPos);

yPos += 15;
doc.setTextColor(...darkGray);
doc.setFontSize(11);

const steps = [
  {
    num: '1',
    title: 'Accédez au Concours Blanc',
    details: 'Connectez-vous à ClassBoard et sélectionnez le concours blanc\ndans la liste des concours disponibles.'
  },
  {
    num: '2',
    title: 'Lisez les Instructions',
    details: 'Consultez le message de bienvenue avec le nombre d\'épreuves,\nle nombre total de questions et la durée.'
  },
  {
    num: '3',
    title: 'Lancez le Concours',
    details: 'Cliquez sur "Commencer le concours" pour démarrer\nle chronomètre et accéder au contenu.'
  },
  {
    num: '4',
    title: 'Consultez le Sujet (PDF)',
    details: 'À gauche : Consultez le PDF du sujet de l\'épreuve.\nVous pouvez zoomer et scroller dans le document.'
  },
  {
    num: '5',
    title: 'Répondez aux Questions',
    details: 'À droite : Lisez chaque question et sélectionnez votre réponse\n(A, B, C ou D) en cliquant sur le bouton correspondant.'
  },
  {
    num: '6',
    title: 'Changez d\'Épreuve',
    details: 'Cliquez sur une autre épreuve pour voir son sujet (PDF)\net ses questions associées.'
  },
  {
    num: '7',
    title: 'Soumettez votre Examen',
    details: 'Quand vous avez terminé, cliquez "Soumettre l\'examen"\npour finaliser votre participation.'
  },
  {
    num: '8',
    title: 'Consultez vos Résultats',
    details: 'Vous verrez immédiatement votre score global et\nle détail par épreuve avec les bonnes réponses.'
  }
];

steps.forEach((step, idx) => {
  // Numéro du pas
  doc.setFillColor(...accentColor);
  doc.setDrawColor(...accentColor);
  doc.circle(20, yPos + 2, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text(step.num, 20, yPos + 3.5, { align: 'center' });

  // Titre
  doc.setTextColor(...darkGray);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(step.title, 28, yPos);

  // Détails
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(120, 120, 120);
  const lines = doc.splitTextToSize(step.details, 160);
  doc.text(lines, 28, yPos + 5);

  yPos += lines.length * 5 + 8;

  // Nouvelle page si nécessaire
  if (yPos > 260) {
    doc.addPage();
    yPos = 20;
  }
});

// ========== PAGE 3 - CONSEILS ==========
doc.addPage();
yPos = 20;

doc.setTextColor(255, 255, 255);
doc.setFillColor(...accentColor);
doc.rect(15, yPos - 5, 180, 7, 'F');
doc.setFontSize(12);
doc.setFont(undefined, 'bold');
doc.text('💡 Conseils et Astuces', 20, yPos);

yPos += 15;
doc.setTextColor(...darkGray);
doc.setFontSize(11);

const tips = [
  ['⏱️ Gérez votre temps', 'Consultez le chronomètre en haut à droite. Divisez votre temps en fonction du nombre d\'épreuves et de questions.'],
  ['📊 Suivez votre progression', 'La barre de progression montre le nombre de questions répondues. Essayez de répondre à toutes les questions avant la fin du temps.'],
  ['📄 Comprenez le sujet', 'Lisez attentivement le sujet en PDF à gauche avant de répondre aux questions. C\'est votre référence principale.'],
  ['✅ Revérifiez vos réponses', 'Avant de soumettre, vérifiez que vous avez répondu à toutes les questions. Un point vert indique une question répondée.'],
  ['🔄 Changez d\'épreuve', 'Vous pouvez naviguer entre les épreuves librement. Commencez par les épreuves les plus faciles si vous préférez.'],
  ['🚫 Pas de copier-coller', 'Vous devez répondre seul(e) selon les règles de votre établissement. Les triche ne sont pas tolérées.'],
  ['💾 Auto-sauvegarde', 'Vos réponses sont automatiquement enregistrées. Pas besoin de cliquer sur "Sauvegarder".'],
  ['⚠️ Pas de retour après soumission', 'Une fois soumis, vous ne pouvez pas modifier vos réponses. Soyez sûr(e) avant de soumettre !']
];

tips.forEach(([title, tip]) => {
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...accentColor);
  doc.text(title, 15, yPos);

  doc.setFont(undefined, 'normal');
  doc.setTextColor(120, 120, 120);
  yPos += 5;
  const lines = doc.splitTextToSize(tip, 175);
  doc.text(lines, 20, yPos);
  yPos += lines.length * 5 + 4;
});

yPos += 5;

// ========== SCORING ==========
doc.setTextColor(255, 255, 255);
doc.setFillColor(...accentColor);
doc.rect(15, yPos - 5, 180, 7, 'F');
doc.setFontSize(12);
doc.setFont(undefined, 'bold');
doc.text('🎯 Système de Notation', 20, yPos);

yPos += 12;
doc.setTextColor(...darkGray);
doc.setFontSize(11);

const scoringInfo = [
  'Chaque question a une valeur en points (généralement 1 ou 2 points).',
  'Une bonne réponse = Points de la question',
  'Une mauvaise réponse = 0 points',
  'Score final = Somme de tous les points obtenus',
  'Pourcentage = (Score / Score Total Possible) × 100'
];

scoringInfo.forEach(info => {
  doc.text('• ' + info, 20, yPos);
  yPos += 6;
});

yPos += 8;

// ========== SUPPORT ==========
doc.setTextColor(255, 255, 255);
doc.setFillColor(...accentColor);
doc.rect(15, yPos - 5, 180, 7, 'F');
doc.setFontSize(12);
doc.setFont(undefined, 'bold');
doc.text('📞 Besoin d\'Aide ?', 20, yPos);

yPos += 12;
doc.setTextColor(...darkGray);
doc.setFontSize(11);
doc.setFont(undefined, 'normal');

const supportInfo = [
  'Problème technique : Contactez l\'administrateur du système',
  'Question sur le contenu : Posez à votre professeur',
  'Email de support : support@intellection.edu',
  'Horaires de support : Lundi-Vendredi, 9h-17h'
];

supportInfo.forEach(info => {
  doc.text('• ' + info, 20, yPos);
  yPos += 6;
});

// ========== FOOTER ==========
yPos = 270;
doc.setTextColor(150, 150, 150);
doc.setFontSize(9);
doc.text('Intellection ClassBoard - Guide Étudiant', 105, yPos, { align: 'center' });
doc.text('Document généré le ' + new Date().toLocaleDateString('fr-FR'), 105, yPos + 5, { align: 'center' });

// ========== SAUVEGARDER ==========
const outputPath = 'Guide_Concours_Blanc_Etudiants.pdf';
doc.save(outputPath);
console.log('✅ PDF généré avec succès:', outputPath);
