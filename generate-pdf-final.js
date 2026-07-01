import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF({
  orientation: 'p',
  unit: 'mm',
  format: 'a4'
});

doc.setFont('Helvetica');

const primaryColor = [31, 78, 121];
const accentColor = [66, 139, 202];
const darkGray = [50, 50, 50];

let yPos = 20;
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 15;

function addPage() {
  doc.addPage();
  yPos = 20;
}

function addTitle(text) {
  doc.setFillColor(...primaryColor);
  doc.rect(0, yPos - 8, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.text(text, margin, yPos);
  yPos += 18;
}

function addSubtitle(text) {
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
  const lines = doc.splitTextToSize(text, pageWidth - (2 * margin) - indent);
  lines.forEach(line => {
    doc.text(line, margin + indent, yPos);
    yPos += 5;
  });
}

function addBulletPoint(text, indent = 8) {
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text('• ', margin, yPos);
  const lines = doc.splitTextToSize(text, pageWidth - (2 * margin) - indent - 5);
  lines.forEach((line, idx) => {
    if (idx === 0) {
      doc.text(line, margin + indent, yPos);
    } else {
      doc.text(line, margin + indent, yPos);
    }
    yPos += 5;
  });
}

function addHighlightBox(text) {
  yPos += 2;
  doc.setFillColor(230, 245, 250);
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos - 4, pageWidth - (2 * margin), 20, 'FD');
  doc.setTextColor(...accentColor);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  const lines = doc.splitTextToSize(text, pageWidth - (2 * margin) - 6);
  doc.text(lines, margin + 3, yPos);
  yPos += lines.length * 5 + 5;
}

function checkPageEnd() {
  if (yPos > pageHeight - 30) {
    addPage();
  }
}

function addImage(imagePath, title = '', maxHeight = 90) {
  if (!fs.existsSync(imagePath)) {
    console.log('⚠️ Image non trouvee:', imagePath);
    return;
  }

  checkPageEnd();

  if (title) {
    doc.setTextColor(...accentColor);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(title, margin, yPos);
    yPos += 7;
  }

  try {
    const imageData = fs.readFileSync(imagePath, 'base64');
    // Utiliser une largeur optimale et ajuster la hauteur proportionnellement
    const imgWidth = pageWidth - (2 * margin) - 4;
    // Garder le ratio d'aspect naturel du screenshot (généralement 16:9 ou similaire)
    const imgHeight = Math.min(maxHeight, (imgWidth * 9) / 16);

    if (yPos + imgHeight > pageHeight - 20) {
      addPage();
      if (title) {
        doc.setTextColor(...accentColor);
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'bold');
        doc.text(title, margin, yPos);
        yPos += 7;
      }
    }

    doc.setLineWidth(0.3);
    doc.setDrawColor(...lightGray);
    doc.rect(margin + 2, yPos - 2, imgWidth, imgHeight + 4);

    doc.addImage('data:image/png;base64,' + imageData, 'PNG', margin + 2, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 8;
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'image:', err);
  }
}

const lightGray = [220, 220, 220];

// ============ PAGE 1 - TITRE ============
doc.setFillColor(...primaryColor);
doc.rect(0, 0, pageWidth, 100, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(36);
doc.setFont('Helvetica', 'bold');
doc.text('CONCOURS BLANC', pageWidth / 2, 35, { align: 'center' });

doc.setFontSize(18);
doc.setFont('Helvetica', 'normal');
doc.text('Guide Complet pour les Etudiants', pageWidth / 2, 55, { align: 'center' });

doc.setFontSize(12);
doc.text('Intellection ClassBoard - 2026', pageWidth / 2, 75, { align: 'center' });

yPos = 110;

// ============ INTRODUCTION ============
addTitle('Qu\'est-ce qu\'un Concours Blanc ?');

addText('Un Concours Blanc est bien plus qu\'un simple examen pratique. C\'est un outil pedagogique essentiel concu pour vous preparer optimalement a vos examens reels et pour ameliorer la qualite de l\'enseignement.');

yPos += 3;
addSubtitle('Pourquoi passer un Concours Blanc ?');
yPos += 2;

addBulletPoint('Tester vos connaissances dans les vraies conditions d\'examen avec un temps limite');
addBulletPoint('Identifier vos points faibles et les domaines a revoir prioritairement');
addBulletPoint('Vous familiariser avec le format des questions et l\'interface');
addBulletPoint('Ameliorer votre gestion du temps et votre strategie de reponse');
addBulletPoint('Recevoir un score detaille et des retours immediats sur vos reponses');
addBulletPoint('Contribuer a une analyse collective pour ameliorer l\'enseignement');

yPos += 3;

checkPageEnd();

addHighlightBox('Rapport aux Professeurs: Vos resultats sont analyses par nos professeurs pour identifier les lacunes communes. Ces donnees permettent d\'adapter l\'enseignement et d\'offrir un soutien cible aux domaines les plus difficiles. Votre participation aide toute la classe !');

// ============ PAGE 2 - INTERFACE ============
addPage();
addTitle('Interface du Concours Blanc');

addText('L\'interface de ClassBoard est concue pour une experience d\'examen fluide. Voici comment elle est organisee :');

yPos += 3;

// Boîte interface
doc.setDrawColor(...accentColor);
doc.setLineWidth(0.5);
doc.rect(margin, yPos - 4, pageWidth - (2 * margin), 48, 'S');

yPos += 3;

doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('GAUCHE (60%)', margin + 5, yPos);
yPos += 4;
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
doc.text('Affichage du PDF avec le sujet complet. Zoomez, scrollez et consultez', margin + 8, yPos);
yPos += 4;
doc.text('le document autant de fois que necessaire.', margin + 8, yPos);

yPos += 6;
doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('DROITE (40%)', margin + 5, yPos);
yPos += 4;
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
doc.text('Questions a choix multiples (A, B, C, D). Selectionnez vos reponses', margin + 8, yPos);
yPos += 4;
doc.text('et suivez votre progression en temps reel.', margin + 8, yPos);

yPos += 6;
doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('HAUT : Chronometre & Progression', margin, yPos);
yPos += 3;
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
doc.text('Temps restant et nombre de questions repondues', margin + 5, yPos);

yPos += 5;
doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('BAS : Actions Finales', margin, yPos);
yPos += 3;
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
doc.text('Boutons "Annuler" et "Soumettre l\'examen"', margin + 5, yPos);

yPos += 8;

// ============ PAGES - SCREENSHOTS ============
addPage();
addTitle('Illustrations - L\'interface en action');

addText('Decouvrez comment l\'interface fonctionne a travers ces captures d\'ecran :');
yPos += 5;

const screenshotsPath = 'C:/Users/Ahmed/OneDrive/Bureau/Nouveau dossier (2)';
const screenshots = [
  { file: 'Capture d\'écran 2026-06-27 234737.png', title: 'Ecran 1 : Liste des Concours' },
  { file: 'Capture d\'écran 2026-06-27 234749.png', title: 'Ecran 2 : Message de Bienvenue' },
  { file: 'Capture d\'écran 2026-06-27 234802.png', title: 'Ecran 3 : Interface Principale' },
  { file: 'Capture d\'écran 2026-06-27 234829.png', title: 'Ecran 4 : Navigation' },
  { file: 'Capture d\'écran 2026-06-27 235354.png', title: 'Ecran 5 : Progression' },
  { file: 'Capture d\'écran 2026-06-27 235428.png', title: 'Ecran 6 : Resultats' }
];

screenshots.forEach((screenshot) => {
  const fullPath = path.join(screenshotsPath, screenshot.file).replace(/\//g, '\\');
  addImage(fullPath, screenshot.title, 80);
});

// ============ PAGE - GUIDE ÉTAPE PAR ÉTAPE ============
addPage();
addTitle('Guide Etape par Etape');

addText('Suivez ces etapes pour reussir votre Concours Blanc :');
yPos += 5;

const steps = [
  { num: '1', title: 'Accedez au Concours Blanc', text: 'Connectez-vous a ClassBoard et selectionnez le concours blanc dans la liste.' },
  { num: '2', title: 'Lisez les Instructions', text: 'Consultez le message de bienvenue (nombre d\'epreuves, questions, duree).' },
  { num: '3', title: 'Lancez le Concours', text: 'Cliquez "Commencer le concours" pour demarrer le chronometre.' },
  { num: '4', title: 'Consultez le Sujet (PDF)', text: 'A gauche : consultez le PDF. C\'est votre document de reference principal.' },
  { num: '5', title: 'Repondez aux Questions', text: 'A droite : lisez et selectionnez votre reponse (A, B, C ou D).' },
  { num: '6', title: 'Changez d\'Epreuve', text: 'Naviguez librement. Le PDF et les questions changent avec chaque epreuve.' },
  { num: '7', title: 'Soumettez l\'Examen', text: 'Cliquez "Soumettre l\'examen" pour finaliser. Cette action est irreversible.' },
  { num: '8', title: 'Consultez vos Resultats', text: 'Vous verrez votre score, le detail par epreuve et les bonnes reponses.' }
];

steps.forEach((step) => {
  checkPageEnd();

  doc.setFillColor(...accentColor);
  doc.circle(margin + 3, yPos + 2, 3.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.text(step.num, margin + 3, yPos + 2.5, { align: 'center' });

  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(step.title, margin + 12, yPos);

  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  const lines = doc.splitTextToSize(step.text, pageWidth - (2 * margin) - 12);
  doc.text(lines, margin + 12, yPos + 5);

  yPos += Math.max(lines.length * 4.5 + 3, 10) + 2;
});

// ============ PAGE - CONSEILS ============
addPage();
addTitle('Conseils et Astuces');

const tips = [
  ['Gerez votre temps', 'Divisez votre temps en fonction du nombre d\'epreuves. Ne vous bloquez pas sur une seule question.'],
  ['Lisez attentivement le sujet', 'Le PDF a gauche est votre principale source d\'information. Lisez-le completement.'],
  ['Suivez votre progression', 'Consultez la barre de progression. Essayez de repondre a toutes les questions.'],
  ['Naviguer intelligemment', 'Commencez par les epreuves que vous trouvez les plus faciles.'],
  ['Reverifiez avant de soumettre', 'Verifiez que vous avez repondu a toutes les questions.'],
  ['Restez honnete', 'Votre honnete contribue a une evaluation juste pour toute la classe.'],
  ['Pas de retour apres soumission', 'Une fois soumis, vous ne pouvez pas modifier vos reponses.']
];

tips.forEach(([title, text]) => {
  checkPageEnd();

  doc.setTextColor(...accentColor);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text(title, margin, yPos);
  yPos += 4;

  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  const lines = doc.splitTextToSize(text, pageWidth - (2 * margin) - 5);
  doc.text(lines, margin + 5, yPos);
  yPos += lines.length * 4.5 + 2;
});

// ============ PAGE - COMPRENDRE VOS RÉSULTATS ============
addPage();
addTitle('Comprendre vos Resultats');

addText('Apres soumission, vous recevrez un rapport detaille :');
yPos += 3;

addSubtitle('Score Global');
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
addText('Somme de tous les points obtenus.', 9);

yPos += 2;
addSubtitle('Detail par Epreuve');
addText('Score, nombre de bonnes reponses et pourcentage pour chaque epreuve.', 9);

yPos += 2;
addSubtitle('Les Bonnes Reponses');
addText('Comparez vos reponses avec les bonnes reponses. Identifiez vos erreurs.', 9);

yPos += 3;

addHighlightBox('Vos donnees sont analysees par les professeurs pour identifier les lacunes communes et adapter l\'enseignement. Vous contribuez a l\'amelioration de la qualite pedagogique !');

// ============ PAGE - CONTACT ============
addPage();
addTitle('Besoin d\'Aide ?');

addSubtitle('Problemes Techniques');
addText('Contactez l\'administrateur du systeme immediatement.');
yPos += 3;

addSubtitle('Questions sur le Contenu');
addText('Consultez votre professeur pendant les heures de cours ou permanences.');
yPos += 3;

addSubtitle('Informations de Contact');
yPos += 2;
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'bold');
doc.text('Email :', margin, yPos);
doc.setFont('Helvetica', 'normal');
doc.text('support@intellection.edu', margin + 20, yPos);
yPos += 5;

doc.setFont('Helvetica', 'bold');
doc.text('Horaires :', margin, yPos);
doc.setFont('Helvetica', 'normal');
doc.text('Lundi-Vendredi, 9h-17h', margin + 20, yPos);
yPos += 5;

doc.setFont('Helvetica', 'bold');
doc.text('Portail :', margin, yPos);
doc.setFont('Helvetica', 'normal');
doc.text('https://classboard.intellection.edu', margin + 20, yPos);

yPos += 10;

addHighlightBox('Bonne chance ! Votre effort et votre honnetete contribuent a la progression de toute la classe. C\'est une opportunite d\'apprendre !');

// ============ FOOTER ============
const totalPages = doc.internal.pages.length - 1;
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

const outputPath = 'Guide_Concours_Blanc_Etudiants_FINAL.pdf';
doc.save(outputPath);
console.log('✅ PDF genere avec succes: ' + outputPath);
console.log('✅ Screenshots ajustes pour ne pas etre deformes');
console.log('✅ Contenu ameliore avec informations sur le rapport aux professeurs');
console.log('✅ Total pages: ' + totalPages);
