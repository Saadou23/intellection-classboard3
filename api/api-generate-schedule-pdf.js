// api/generate-schedule-pdf.js
// API endpoint pour générer des PDFs d'emplois du temps
// Compatible avec Vercel serverless functions

import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export default async function handler(req, res) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Validation basique
    if (!data.type || !data.sessions) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Créer des fichiers temporaires
    const tempDir = tmpdir();
    const timestamp = Date.now();
    const dataFile = join(tempDir, `schedule-data-${timestamp}.json`);
    const pdfFile = join(tempDir, `schedule-${timestamp}.pdf`);

    // Écrire les données JSON
    await writeFile(dataFile, JSON.stringify(data, null, 2));

    // Exécuter le script Python
    const pythonProcess = spawn('python3', [
      join(process.cwd(), 'scripts', 'generate_schedule_pdf.py'),
      '--data', dataFile,
      '--output', pdfFile
    ]);

    let errorOutput = '';

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Attendre la fin du processus
    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });

    // Lire le PDF généré
    const pdfBuffer = await readFile(pdfFile);

    // Nettoyer les fichiers temporaires
    await Promise.all([
      unlink(dataFile).catch(() => {}),
      unlink(pdfFile).catch(() => {})
    ]);

    // Définir le nom du fichier
    let filename = 'emploi-du-temps.pdf';
    if (data.type === 'branch') {
      filename = `emploi-${data.branch.replace(/\s+/g, '-')}.pdf`;
    } else if (data.type === 'professor') {
      filename = `emploi-${data.professor.replace(/\s+/g, '-')}.pdf`;
    }

    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
}

// Configuration Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};
