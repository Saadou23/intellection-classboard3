import React, { useEffect, useRef, useState } from 'react';
import { Printer, X, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import html2pdf from 'html2pdf.js';

const EduTicketPrinter = ({ onClose }) => {
  const [qrCodes, setQrCodes] = useState({
    ios: '',
    android: '',
    manuals: ''
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    generateQRCodes();
  }, []);

  const generateQRCodes = async () => {
    try {
      const urls = {
        ios: 'https://apps.apple.com/ma/app/intellection-classboard/id6758705463',
        android: 'https://play.google.com/store/apps/details?id=com.intellection.mobile&hl=fr',
        manuals: window.location.origin + '/manuels'
      };

      const qrs = {};
      for (const [key, url] of Object.entries(urls)) {
        qrs[key] = await QRCode.toDataURL(url, { width: 150, margin: 1 });
      }
      setQrCodes(qrs);
    } catch (e) {
      console.error('Erreur génération QR:', e);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      window.print();
      setTimeout(() => setIsPrinting(false), 1000);
    } catch (e) {
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsPrinting(true);
    try {
      const element = ticketRef.current;
      const options = {
        margin: 0,
        filename: 'intellection-ticket.pdf',
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { format: [80, 200], unit: 'mm' }
      };
      html2pdf().set(options).from(element).save();
      setTimeout(() => setIsPrinting(false), 1000);
    } catch (e) {
      console.error('Erreur PDF:', e);
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            Ticket Thermique Éducatif
          </h2>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview + Controls */}
        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Printer className="w-5 h-5" />
              {isPrinting ? 'Impression...' : 'Imprimer'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isPrinting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              📥 Télécharger PDF
            </button>
          </div>

          {/* Ticket Preview */}
          <div ref={ticketRef} className="bg-gray-50 p-8 rounded-lg border-2 border-gray-200 max-w-sm mx-auto">
            <style>{`
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
              }
            `}</style>

            {/* Ticket Content */}
            <div className="w-80 bg-white text-center space-y-4 text-sm">
              {/* Logo/Header */}
              <div className="border-b pb-3">
                <h1 className="text-xl font-bold">INTELLECTION</h1>
                <p className="text-xs text-gray-600">Plateforme Éducative</p>
              </div>

              {/* Consignes Comportement */}
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-left">
                <h3 className="font-bold text-center mb-2">🤝 RESPECT & CIVISME</h3>
                <ul className="text-xs space-y-1">
                  <li>✓ Respectez le silence des voisins</li>
                  <li>✓ Limitez le bruit après 22h</li>
                  <li>✓ Soyez courtois avec l'entourage</li>
                  <li>✓ Gardez les lieux propres</li>
                  <li>✓ Pas de nuisance sonore</li>
                  <li>✓ Respectez les règles communes</li>
                </ul>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-gray-300 py-2">
                <p className="text-xs font-bold">📱 TÉLÉCHARGER L'APP</p>
              </div>

              {/* iOS QR */}
              <div className="space-y-1">
                <p className="text-xs font-semibold">🍎 iPhone/iPad</p>
                {qrCodes.ios && <img src={qrCodes.ios} alt="iOS QR" className="w-32 h-32 mx-auto" />}
                <p className="text-xs text-gray-600">Intellection ClassBoard</p>
              </div>

              {/* Android QR */}
              <div className="space-y-1">
                <p className="text-xs font-semibold">🤖 Android</p>
                {qrCodes.android && <img src={qrCodes.android} alt="Android QR" className="w-32 h-32 mx-auto" />}
                <p className="text-xs text-gray-600">Intellection Mobile</p>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-gray-300 py-2">
                <p className="text-xs font-bold">📚 MANUELS D'UTILISATION</p>
              </div>

              {/* Manuals QR */}
              <div className="space-y-1">
                {qrCodes.manuals && <img src={qrCodes.manuals} alt="Manuels QR" className="w-32 h-32 mx-auto" />}
                <p className="text-xs text-gray-600">Docs & Tutoriels</p>
              </div>

              {/* Features */}
              <div className="bg-blue-50 border border-blue-300 rounded p-3 text-left">
                <h3 className="font-bold text-center mb-2">⭐ FEATURES MOBILES</h3>
                <ul className="text-xs space-y-1">
                  <li>💰 Suivi des paiements en temps réel</li>
                  <li>📅 Absence et emplois du temps</li>
                  <li>📚 Accès à la documentation</li>
                  <li>🔍 Contrôle et pointage</li>
                  <li>📊 Tableau de bord personnel</li>
                  <li>🔔 Notifications instantanées</li>
                </ul>
              </div>

              {/* Footer */}
              <div className="border-t pt-2 text-xs text-gray-600">
                <p>www.intellection.edu.ma</p>
                <p>Support: info@intellection.edu.ma</p>
                <p className="mt-2 text-xs">Ticket généré le {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4 print:hidden">
            <h3 className="font-bold mb-2">📋 Instructions d'impression</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>✓ Format papier thermique: 80mm (largeur idéale)</li>
              <li>✓ Orientation: Portrait</li>
              <li>✓ Marges: Minimales (0mm)</li>
              <li>✓ Cliquez "Imprimer" ou "Télécharger PDF"</li>
              <li>✓ Afficher au centre/classe pour les étudiants</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body, html { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .bg-white { background: white; }
          img { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default EduTicketPrinter;
