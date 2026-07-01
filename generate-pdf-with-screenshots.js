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

function addText(text, size = 10, bold = false) {
  doc.setTextColor(...darkGray);
  doc.setFontSize(size);
  doc.setFont('Helvetica', bold ? 'bold' : 'normal');
  const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
  doc.text(lines, margin, yPos);
  yPos += lines.length * 5 + 2;
}

function checkPageEnd() {
  if (yPos > pageHeight - 30) {
    addPage();
  }
}

function addImage(imagePath, title = '') {
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
    yPos += 8;
  }

  try {
    const imageData = fs.readFileSync(imagePath, 'base64');
    const imgWidth = pageWidth - (2 * margin);
    const imgHeight = (imgWidth * 3) / 4; // Ratio 4:3

    if (yPos + imgHeight > pageHeight - 20) {
      addPage();
    }

    doc.addImage('data:image/png;base64,' + imageData, 'PNG', margin, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 5;
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'image:', err);
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
addTitle('Qu\'est-ce qu\'un Concours Blanc ?');
addText('Un Concours Blanc est un examen pratique qui vous permet de :');
addText('Tester vos connaissances avant l\'examen reel', 10, false);
addText('Vous familiariser avec le format des questions', 10, false);
addText('Gerer votre temps dans les conditions reelles', 10, false);
addText('Recevoir un score et des retours immediats', 10, false);

addPage();
addTitle('Interface du Concours Blanc');
addText('L\'interface du concours blanc est divisee en 3 parties principales :');
yPos += 3;

addText('GAUCHE (60%) : Affichage du PDF du sujet de l\'epreuve', 10, false);
addText('DROITE (40%) : Questions a choix multiples (QCM)', 10, false);
addText('HAUT : Chronometre et barre de progression', 10, false);
addText('BAS : Boutons Annuler et Soumettre l\'examen', 10, false);

yPos += 5;

// ============ SCREENSHOTS ============
addPage();
addTitle('Illustrations - L\'interface en action');

const screenshotsPath = 'C:/Users/Ahmed/OneDrive/Bureau/Nouveau dossier (2)';
const screenshots = [
  { file: 'Capture d\'écran 2026-06-27 234737.png', title: 'Ecran 1 : Liste des concours blancs' },
  { file: 'Capture d\'écran 2026-06-27 234749.png', title: 'Ecran 2 : Bienvenue au concours' },
  { file: 'Capture d\'écran 2026-06-27 234802.png', title: 'Ecran 3 : Interface principale (PDF + QCM)' },
  { file: 'Capture d\'écran 2026-06-27 234829.png', title: 'Ecran 4 : Questions avec reponses' },
  { file: 'Capture d\'écran 2026-06-27 235354.png', title: 'Ecran 5 : Progression et chronometre' },
  { file: 'Capture d\'écran 2026-06-27 235428.png', title: 'Ecran 6 : Resultats finaux' }
];

screenshots.forEach((screenshot) => {
  const fullPath = path.join(screenshotsPath, screenshot.file).replace(/\//g, '\\');
  addImage(fullPath, screenshot.title);
});

// ============ PAGE - GUIDE ETAPE PAR ETAPE ============
addPage();
addTitle('Guide Etape par Etape');

const steps = [
  { num: '1', title: 'Accedez au Concours Blanc', text: 'Connectez-vous a ClassBoard et selectionnez le concours blanc dans la liste des concours disponibles.' },
  { num: '2', title: 'Lisez les Instructions', text: 'Consultez le message de bienvenue avec le nombre d\'epreuves, le nombre total de questions et la duree.' },
  { num: '3', title: 'Lancez le Concours', text: 'Cliquez sur "Commencer le concours" pour demarrer le chronometre et acceder au contenu.' },
  { num: '4', title: 'Consultez le Sujet (PDF)', text: 'A gauche : Consultez le PDF du sujet de l\'epreuve. Vous pouvez zoomer et scroller dans le document.' },
  { num: '5', title: 'Repondez aux Questions', text: 'A droite : Lisez chaque question et selectionnez votre reponse (A, B, C ou D) en cliquant sur le bouton correspondant.' },
  { num: '6', title: 'Changez d\'Epreuve', text: 'Cliquez sur une autre epreuve pour voir son sujet (PDF) et ses questions associees.' },
  { num: '7', title: 'Soumettez votre Examen', text: 'Quand vous avez termine, cliquez "Soumettre l\'examen" pour finaliser votre participation.' },
  { num: '8', title: 'Consultez vos Resultats', text: 'Vous verrez immediatement votre score global et le detail par epreuve avec les bonnes reponses.' }
];

steps.forEach((step) => {
  checkPageEnd();

  doc.setFillColor(...accentColor);
  doc.circle(margin + 3, yPos + 2, 3.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text(step.num, margin + 3, yPos + 2.5, { align: 'center' });

  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(step.title, margin + 12, yPos);

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  const lines = doc.splitTextToSize(step.text, pageWidth - (2 * margin) - 12);
  doc.text(lines, margin + 12, yPos + 5);

  yPos += Math.max(lines.length * 5 + 3, 10) + 2;
});

// ============ PAGE - CONSEILS ============
addPage();
addTitle('Conseils et Astuces');

const tips = [
  ['Gerez votre temps', 'Consultez le chronometre en haut a droite. Divisez votre temps en fonction du nombre d\'epreuves et de questions.'],
  ['Suivez votre progression', 'La barre de progression montre le nombre de questions repondues. Essayez de repondre a toutes les questions avant la fin du temps.'],
  ['Comprenez le sujet', 'Lisez attentivement le sujet en PDF a gauche avant de repondre aux questions.'],
  ['Reverifiez vos reponses', 'Avant de soumettre, verifiez que vous avez repondu a toutes les questions.'],
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
  const lines = doc.splitTextToSize(tip, pageWidth - (2 * margin) - 5);
  doc.text(lines, margin + 5, yPos);
  yPos += lines.length * 5 + 4;
});

// ============ SAUVEGARDER ============
doc.setTextColor(150, 150, 150);
doc.setFontSize(8);
doc.setFont('Helvetica', 'normal');

const totalPages = doc.internal.pages.length - 1;
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.text(`Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

const outputPath = 'Guide_Concours_Blanc_Etudiants_FINAL.pdf';
doc.save(outputPath);
console.log('✅ PDF genere avec succes: ' + outputPath);
console.log('✅ ' + screenshots.length + ' screenshots integres');
console.log('✅ Total pages: ' + totalPages);
