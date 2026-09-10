import React, { useEffect, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';
import QRCode from 'qrcode';

const EduTicketPrinter = ({ onClose }) => {
  const [qrCodes, setQrCodes] = useState({
    ios: '',
    android: '',
    manuals: ''
  });
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    generateQRCodes();
  }, []);

  const generateQRCodes = async () => {
    try {
      const urls = {
        ios: 'https://apps.apple.com/ma/app/intellection-classboard/id6758705463',
        android: 'https://play.google.com/store/apps/details?id=com.intellection.mobile&hl=fr',
        manuals: 'https://intellection-classboard3.vercel.app/manuels'
      };

      const qrs = {};
      for (const [key, url] of Object.entries(urls)) {
        qrs[key] = await QRCode.toDataURL(url, {
          width: 150,
          margin: 0,
          color: { dark: '#000000', light: '#ffffff' }
        });
      }
      setQrCodes(qrs);
    } catch (e) {
      console.error('Erreur génération QR:', e);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);

    const printWindow = window.open('', '_blank');

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket Éducatif INTELLECTION</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue:wght@400;700&display=swap" rel="stylesheet">

  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
        padding: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Bebas Neue', 'Arial Black', sans-serif;
      width: 80mm;
      margin: 0 auto;
      padding: 2mm;
      background: white;
      color: #000;
      font-size: 14px;
      line-height: 1.2;
    }

    .container {
      border: 2px solid #000;
      padding: 3mm;
      background: #fafafa;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 2mm;
      margin-bottom: 3mm;
    }

    .header h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 1mm;
    }

    .header h2 {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 1mm;
    }

    .section-header {
      background: #000;
      color: #fff;
      padding: 2mm;
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      margin: 3mm 0 2mm 0;
      border: 2px solid #000;
    }

    .rules {
      font-size: 8px;
      font-weight: 600;
      margin: 2mm 0;
      line-height: 1.4;
    }

    .rule-item {
      display: flex;
      align-items: flex-start;
      margin: 1mm 0;
    }

    .rule-item span:first-child {
      font-weight: 700;
      margin-right: 3px;
      flex-shrink: 0;
    }

    .qr-section {
      display: flex;
      justify-content: space-around;
      margin: 2mm 0;
      gap: 2mm;
    }

    .qr-item {
      text-align: center;
      flex: 1;
    }

    .qr-item img {
      width: 65px;
      height: 65px;
      margin: 1mm 0;
      border: 1px solid #000;
    }

    .qr-label {
      font-size: 7px;
      font-weight: 700;
      margin: 1mm 0;
      word-break: break-word;
    }

    .features {
      font-size: 8px;
      font-weight: 600;
      border: 1px solid #000;
      padding: 1.5mm;
      margin: 2mm 0;
      line-height: 1.3;
    }

    .feature-item {
      margin: 0.5mm 0;
    }

    .footer {
      text-align: center;
      border-top: 2px solid #000;
      padding-top: 2mm;
      margin-top: 3mm;
      font-size: 7px;
      font-weight: 600;
    }

    .footer-text {
      margin: 0.5mm 0;
    }

    .divider {
      border-top: 2px dashed #000;
      margin: 2mm 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>INTELLECTION</h1>
      <h2>PLATEFORME EDUCATIVE</h2>
    </div>

    <!-- Rules Section -->
    <div class="section-header">REGLES &amp; RESPECT</div>

    <div class="rules">
      <div style="text-align: center; font-weight: 700; font-size: 9px; margin-bottom: 1mm;">CONSIGNES</div>
      <div class="rule-item">
        <span>✓</span>
        <span>Respectez vos groupes et horaires</span>
      </div>
      <div class="rule-item">
        <span>✓</span>
        <span>Pas de rassemblement devant le centre</span>
      </div>
      <div class="rule-item">
        <span>✓</span>
        <span>Respectez les voisins</span>
      </div>
      <div class="rule-item">
        <span>✓</span>
        <span>Évacuez les lieux à la fin des séances</span>
      </div>
      <div class="rule-item">
        <span>✓</span>
        <span>Utilisez l'application</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Download App Section -->
    <div class="section-header">TELECHARGER L'APP</div>

    <div class="qr-section">
      <div class="qr-item">
        <div class="qr-label">iOS</div>
        ${qrCodes.ios ? `<img src="${qrCodes.ios}" alt="iOS">` : ''}
        <div style="font-size: 6px;">Apple</div>
      </div>
      <div class="qr-item">
        <div class="qr-label">Android</div>
        ${qrCodes.android ? `<img src="${qrCodes.android}" alt="Android">` : ''}
        <div style="font-size: 6px;">Play Store</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Manuals Section -->
    <div class="section-header">MANUELS &amp; AIDE</div>

    <div style="text-align: center; margin: 2mm 0;">
      <div class="qr-label" style="margin-bottom: 1mm;">DOCUMENTATION</div>
      ${qrCodes.manuals ? `<img src="${qrCodes.manuals}" alt="Manuels" style="width: 70px; height: 70px; border: 1px solid #000;">` : ''}
    </div>

    <!-- Features Section -->
    <div class="features">
      <div style="font-weight: 700; margin-bottom: 1mm; text-align: center; font-size: 9px;">L'APPLICATION</div>
      <div class="feature-item">• Suivi des paiements</div>
      <div class="feature-item">• Emplois du temps</div>
      <div class="feature-item">• Absence &amp; présence</div>
      <div class="feature-item">• Documentation</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">www.intellection.edu.ma</div>
      <div class="footer-text">${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
  </div>
</body>
</html>
`;

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            <h2 className="text-lg font-bold">Ticket Thermique Éducatif</h2>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-800 p-2 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <p className="font-bold text-blue-900 mb-2">📋 Contenu du ticket:</p>
            <ul className="text-blue-800 space-y-1 text-xs">
              <li>✓ Consignes de respect (groupes, horaires, voisins)</li>
              <li>✓ QR codes iOS et Android</li>
              <li>✓ QR code Manuels &amp; Documentation</li>
              <li>✓ Features principales de l'application</li>
            </ul>
          </div>

          <button
            onClick={handlePrint}
            disabled={isPrinting || !qrCodes.ios}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition"
          >
            <Printer className="w-5 h-5" />
            {isPrinting ? 'Impression...' : 'Imprimer le Ticket'}
          </button>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
            <p className="font-bold mb-1">⚙️ Optimisé pour:</p>
            <p>Imprimante thermique 80mm • Bebas Neue • Noir et blanc</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EduTicketPrinter;
