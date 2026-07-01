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
const green = [39, 174, 96];

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
    const imgHeight = (imgWidth * 3) / 4;

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
doc.text('Guide Complet pour les Etudiants', pageWidth / 2, 55, { align: 'center' });

doc.setFontSize(12);
doc.text('Intellection ClassBoard - 2026', pageWidth / 2, 75, { align: 'center' });

yPos = 110;

// ============ INTRODUCTION AMÉLIORÉE ============
addTitle('Qu\'est-ce qu\'un Concours Blanc ?');

addText('Un Concours Blanc est bien plus qu\'un simple examen pratique. C\'est un outil pedagogique essentiel concu pour vous preparer optimalement a vos examens reels.');

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

addHighlightBox('Rapport aux Professeurs: Vos resultats individuels et collectifs sont analyses par nos professeurs pour identifier les lacunes communes chez les etudiants. Ces donnees permettent d\'adapter l\'enseignement et d\'offrir un soutien cible aux domaines les plus difficiles. Votre participation aide toute la classe a progresser !');

// ============ PAGE 2 - INTERFACE ============
addPage();
addTitle('Interface du Concours Blanc');

addText('L\'interface de ClassBoard est concue pour vous offrir une experience d\'examen fluide et intuitive. Voici comment elle est organisee :');

yPos += 3;

// Boîte interface
doc.setDrawColor(...accentColor);
doc.setLineWidth(0.5);
doc.rect(margin, yPos - 4, pageWidth - (2 * margin), 50, 'S');

yPos += 3;

doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('GAUCHE (60%) - Sujet de l\'Epreuve', margin + 5, yPos);
yPos += 5;
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
doc.text('Affichage du PDF avec le sujet complet de l\'epreuve. Vous pouvez zoomer,', margin + 8, yPos);
yPos += 4;
doc.text('scroller et consulter le document autant de fois que necessaire.', margin + 8, yPos);

yPos += 6;
doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('DROITE (40%) - Questions QCM', margin + 5, yPos);
yPos += 5;
doc.setTextColor(...darkGray);
doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
doc.text('Les questions a choix multiples (A, B, C, D) avec votre progression', margin + 8, yPos);
yPos += 4;
doc.text('et l\'indicateur de reponses. Selectionnez facilement vos reponses.', margin + 8, yPos);

yPos += 8;

doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('HAUT - Chronometre et Progression', margin, yPos);
yPos += 5;
doc.setTextColor(...darkGray);
doc.setFontSize(10);
doc.setFont('Helvetica', 'normal');
addText('Suivi du temps restant en temps reel et barre de progression montrant le nombre de questions repondues.', 10, false, 8);

doc.setTextColor(...accentColor);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('BAS - Actions Finales', margin, yPos);
yPos += 5;
doc.setTextColor(...darkGray);
doc.setFontSize(10);
doc.setFont('Helvetica', 'normal');
addText('Boutons "Annuler" (quitter sans soumettre) et "Soumettre l\'examen" (finaliser votre participation).', 10, false, 8);

// ============ PAGE 3 - SCREENSHOTS ============
addPage();
addTitle('Illustrations - L\'interface en action');

addText('Decouvrez ci-dessous comment l\'interface fonctionne a travers une serie de captures d\'ecran commentees :');
yPos += 5;

const screenshotsPath = 'C:/Users/Ahmed/OneDrive/Bureau/Nouveau dossier (2)';
const screenshots = [
  { file: 'Capture d\'écran 2026-06-27 234737.png', title: 'Ecran 1 : Liste des Concours Disponibles' },
  { file: 'Capture d\'écran 2026-06-27 234749.png', title: 'Ecran 2 : Message de Bienvenue et Instructions' },
  { file: 'Capture d\'écran 2026-06-27 234802.png', title: 'Ecran 3 : Interface Principale (PDF + QCM)' },
  { file: 'Capture d\'écran 2026-06-27 234829.png', title: 'Ecran 4 : Navigation entre les Epreuves' },
  { file: 'Capture d\'écran 2026-06-27 235354.png', title: 'Ecran 5 : Progression et Chronometre' },
  { file: 'Capture d\'écran 2026-06-27 235428.png', title: 'Ecran 6 : Resultats Finaux Detailles' }
];

screenshots.forEach((screenshot) => {
  const fullPath = path.join(screenshotsPath, screenshot.file).replace(/\//g, '\\');
  addImage(fullPath, screenshot.title);
});

// ============ PAGE - GUIDE ÉTAPE PAR ÉTAPE ============
addPage();
addTitle('Guide Etape par Etape');

addText('Suivez ces etapes pour reussir votre Concours Blanc :');
yPos += 5;

const steps = [
  { num: '1', title: 'Accedez au Concours Blanc', text: 'Connectez-vous a ClassBoard et selectionnez le concours blanc dans la liste des concours disponibles pour votre niveau.' },
  { num: '2', title: 'Lisez les Instructions', text: 'Consultez attentivement le message de bienvenue qui indique le nombre d\'epreuves, le nombre total de questions et la duree totale.' },
  { num: '3', title: 'Lancez le Concours', text: 'Cliquez sur "Commencer le concours" pour demarrer le chronometre. A partir de ce moment, le temps commence a s\'ecouter.' },
  { num: '4', title: 'Consultez le Sujet (PDF)', text: 'A gauche : Consultez le PDF du sujet de l\'epreuve. C\'est votre document de reference. Vous pouvez zoomer et naviguer librement.' },
  { num: '5', title: 'Repondez aux Questions', text: 'A droite : Lisez chaque question attentivement et selectionnez votre reponse (A, B, C ou D) en cliquant sur le bouton correspondant.' },
  { num: '6', title: 'Changez d\'Epreuve', text: 'Vous pouvez naviguer entre les epreuves librement. Changer d\'epreuve change le PDF et les questions affichees. Organisez-vous comme vous le souhaitez.' },
  { num: '7', title: 'Soumettez votre Examen', text: 'Quand vous avez termine toutes les epreuves, cliquez "Soumettre l\'examen" pour finaliser votre participation. Cette action est irreversible.' },
  { num: '8', title: 'Consultez vos Resultats', text: 'Immediatement apres la soumission, vous verrez votre score global, le detail par epreuve, et les bonnes reponses pour chaque question.' }
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

  yPos += Math.max(lines.length * 5 + 3, 10) + 3;
});

// ============ PAGE - CONSEILS ============
addPage();
addTitle('Conseils et Astuces pour Reussir');

const tips = [
  {
    title: 'Gerez votre temps strategiquement',
    text: 'Consultez le chronometre en haut a droite. Divisez votre temps en fonction du nombre d\'epreuves : si vous avez 3 epreuves et 120 minutes, consacrez environ 40 minutes par epreuve.'
  },
  {
    title: 'Suivez votre progression en temps reel',
    text: 'La barre de progression montre exactement combien de questions vous avez repondues. Essayez de repondre a toutes les questions avant la fin du temps limite.'
  },
  {
    title: 'Lisez attentivement le sujet en PDF',
    text: 'Ne vous pressez pas. Lisez completement le sujet en PDF a gauche avant de repondre aux questions. C\'est votre principale source d\'information.'
  },
  {
    title: 'Reverifiez avant de soumettre',
    text: 'Avant de cliquer "Soumettre l\'examen", verifiez que vous avez repondu a toutes les questions. Un symbole indique les questions repondues.'
  },
  {
    title: 'Naviguer entre les epreuves intelligemment',
    text: 'Vous pouvez naviguer librement. Commencez par les epreuves que vous trouvez les plus faciles pour gagner de la confiance et des points.'
  },
  {
    title: 'Restez honnete et serieux',
    text: 'Ce concours est une evaluation reelle. Repondez seul selon les regles. Votre honnete contribue a une evaluation juste pour toute la classe.'
  },
  {
    title: 'Ne paniquez pas si vous ne savez pas',
    text: 'Si une question est difficile, passez a la suivante et revenez-y plus tard. Ne vous bloquez pas sur une seule question.'
  },
  {
    title: 'Pas de retour apres soumission',
    text: 'Une fois soumis, vous ne pouvez pas modifier vos reponses. Soyez certain(e) avant de cliquer "Soumettre l\'examen".'
  }
];

tips.forEach(({ title, text }) => {
  checkPageEnd();

  doc.setTextColor(...accentColor);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text(title, margin, yPos);
  yPos += 5;

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  const lines = doc.splitTextToSize(text, pageWidth - (2 * margin) - 5);
  doc.text(lines, margin + 5, yPos);
  yPos += lines.length * 5 + 3;
});

// ============ PAGE - COMPRENDRE VOS RÉSULTATS ============
addPage();
addTitle('Comprendre vos Resultats');

addText('Apres avoir soumis votre examen, vous recevrez un rapport detaille. Voici comment l\'interpreter :');
yPos += 5;

addSubtitle('Le Score Global');
addText('Votre score total est la somme de tous les points obtenus. Chaque question correcte vous rapporte ses points (generalement 1 ou 2 points).');
yPos += 2;

addSubtitle('Le Detail par Epreuve');
addText('Pour chaque epreuve, vous verrez votre score, le nombre de questions repondues correctement, et votre pourcentage de reussite.');
yPos += 2;

addSubtitle('Les Bonnes Reponses');
addText('Comparez vos reponses avec les bonnes reponses affichees. Identifiez les erreurs et cherchez a comprendre pourquoi vous avez fait erreur.');
yPos += 2;

addHighlightBox('Ces donnees sont analysees par vos professeurs ! Ils recherchent les patterns de reussite et d\'echec pour adapter les cours et offrir un soutien cible. Votre participation contribue directement a l\'amelioration de la qualite de l\'enseignement.');

// ============ PAGE - SUPPORT ============
addPage();
addTitle('Besoin d\'Aide ?');

addSubtitle('Problemes Techniques');
addText('Si vous rencontrez des problemes techniques pendant le concours, contactez immediatement l\'administrateur du systeme.');
yPos += 3;

addSubtitle('Questions sur le Contenu');
addText('Pour des questions sur le contenu des epreuves, consultez votre professeur pendant les heures de cours ou lors des permanences.');
yPos += 3;

addSubtitle('Informations de Contact');
doc.setTextColor(...darkGray);
doc.setFontSize(10);
doc.setFont('Helvetica', 'bold');
doc.text('Email de support :', margin, yPos);
doc.setFont('Helvetica', 'normal');
doc.text('support@intellection.edu', margin + 45, yPos);
yPos += 6;

doc.setFont('Helvetica', 'bold');
doc.text('Horaires de support :', margin, yPos);
doc.setFont('Helvetica', 'normal');
doc.text('Lundi-Vendredi, 9h00 - 17h00', margin + 45, yPos);
yPos += 6;

doc.setFont('Helvetica', 'bold');
doc.text('Portail ClassBoard :', margin, yPos);
doc.setFont('Helvetica', 'normal');
doc.text('https://classboard.intellection.edu', margin + 45, yPos);

yPos += 10;

addHighlightBox('Bonne chance dans votre Concours Blanc ! Votre effort et votre honnetete contribuent a la progression de toute la classe. N\'oubliez pas : c\'est une opportunite d\'apprendre, pas seulement de vous evaluer.');

// ============ FOOTER ============
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
console.log('✅ Contenu ameliore avec informations sur le rapport aux professeurs');
console.log('✅ ' + screenshots.length + ' screenshots integres');
console.log('✅ Total pages: ' + totalPages);
