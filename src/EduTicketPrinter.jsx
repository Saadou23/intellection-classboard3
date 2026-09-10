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
      // QR generation failed silently
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
      border: 3px solid #000;
      padding: 3.5mm;
      background: #ffffff;
    }

    .header {
      text-align: center;
      border-bottom: 4px double #000;
      padding-bottom: 3mm;
      margin-bottom: 3mm;
      background: #f9f9f9;
      padding: 3mm;
      margin: -3.5mm -3.5mm 3mm -3.5mm;
    }

    .header h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 2mm;
    }

    .header h2 {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 0;
    }

    .section-header {
      background: #000;
      color: #fff;
      padding: 3mm 2.5mm;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin: 3mm -3.5mm 2.5mm -3.5mm;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }

    .rules {
      font-size: 9px;
      font-weight: 600;
      margin: 2.5mm 0;
      line-height: 1.6;
      background: #f9f9f9;
      padding: 2mm;
      border-left: 3px solid #000;
    }

    .rule-item {
      display: flex;
      align-items: flex-start;
      margin: 1.5mm 0;
    }

    .rule-item span:first-child {
      font-weight: 900;
      margin-right: 4px;
      flex-shrink: 0;
      font-size: 11px;
      color: #000;
    }

    .qr-section {
      display: flex;
      justify-content: space-around;
      margin: 2.5mm 0;
      gap: 2mm;
    }

    .qr-item {
      text-align: center;
      flex: 1;
    }

    .qr-item img {
      width: 72px;
      height: 72px;
      margin: 2mm 0;
      border: 2px solid #000;
    }

    .qr-label {
      font-size: 9px;
      font-weight: 700;
      margin: 1.2mm 0;
      word-break: break-word;
    }

    .store-logo {
      width: 20px;
      height: 20px;
      display: inline-block;
      margin: 0 2px;
      vertical-align: middle;
    }

    .features {
      font-size: 9px;
      font-weight: 600;
      border: 2px solid #000;
      padding: 2mm;
      margin: 2.5mm 0;
      line-height: 1.5;
      background: #fafafa;
    }

    .feature-item {
      margin: 1mm 0;
      display: flex;
      align-items: center;
    }

    .feature-item:before {
      content: "▸";
      margin-right: 4px;
      font-weight: 900;
      font-size: 11px;
    }

    .footer {
      text-align: center;
      border-top: 3px solid #000;
      padding-top: 2.5mm;
      margin-top: 3mm;
      font-size: 8px;
      font-weight: 700;
    }

    .footer-text {
      margin: 1mm 0;
      letter-spacing: 0.5px;
    }

    .divider {
      border-top: 2px dashed #000;
      margin: 2.5mm 0;
      padding: 0;
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
        <div class="qr-label">
          <svg class="store-logo" viewBox="0 0 24 24" fill="black">
            <path d="M17.05 13.5c-.91 0-1.64.7-1.64 1.56.91 0 1.64.7 1.64 1.56s-.73 1.56-1.64 1.56c-1.82 0-3.28-1.46-3.28-3.27 0-1.82 1.46-3.27 3.28-3.27 1.06 0 2 .5 2.64 1.29l-1.06.85c-.39-.52-1.02-.86-1.58-.86zm-5.08 4.66c.99 0 1.8-.8 1.8-1.79 0-.99-.81-1.79-1.8-1.79-.99 0-1.8.8-1.8 1.79 0 .99.81 1.79 1.8 1.79z"/>
            <text x="12" y="20" font-size="3" text-anchor="middle" font-weight="bold">APPLE</text>
          </svg>
          iOS
        </div>
        ${qrCodes.ios ? `<img src="${qrCodes.ios}" alt="iOS">` : ''}
        <div style="font-size: 7px; font-weight: 700;">APP STORE</div>
      </div>
      <div class="qr-item">
        <div class="qr-label">
          <svg class="store-logo" viewBox="0 0 24 24" fill="black">
            <path d="M3,13.5V3.2C3,2.1,3.9,1,5,1h14c1.1,0,2,0.9,2,2v10.3M3,13.5c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2M3,13.5h16M5,4h2v2H5V4z M9,4h2v2H9V4z M13,4h2v2h-2V4z M17,4h2v2h-2V4z M5,8h2v2H5V8z M9,8h2v2H9V8z M13,8h2v2h-2V8z M17,8h2v2h-2V8z"/>
            <text x="12" y="20" font-size="3" text-anchor="middle" font-weight="bold">PLAY</text>
          </svg>
          Android
        </div>
        ${qrCodes.android ? `<img src="${qrCodes.android}" alt="Android">` : ''}
        <div style="font-size: 7px; font-weight: 700;">PLAY STORE</div>
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
      <div class="feature-item">• Suivi des paiements en temps réel</div>
      <div class="feature-item">• Emplois du temps et horaires</div>
      <div class="feature-item">• Absence &amp; présence</div>
      <div class="feature-item">• Discipline et suivi comportement</div>
      <div class="feature-item">• Demande de cours individuels</div>
      <div class="feature-item">• Notifications instantanées</div>
      <div class="feature-item">• Documentation &amp; manuels</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text" style="font-size: 9px; margin-bottom: 1.5mm;">www.intellectiongroupe.ma</div>
      <div class="footer-text" style="font-size: 9px; margin-bottom: 1mm;">📞 06 16 13 06 03</div>
      <div class="footer-text" style="font-size: 7px; color: #333;">${new Date().toLocaleDateString('fr-FR')}</div>
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
