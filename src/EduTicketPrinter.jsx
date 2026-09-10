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
  const ticketRef = useRef(null);

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
        qrs[key] = await QRCode.toDataURL(url, { width: 140, margin: 0, color: { dark: '#000', light: '#fff' } });
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

  return (
    <>
      <style>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
          }

          body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            height: auto !important;
            background: white !important;
          }

          .print-hide {
            display: none !important;
          }

          .ticket-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto print-hide">
        <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Ticket Thermique</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition font-bold"
              >
                <Printer className="w-4 h-4" />
                {isPrinting ? 'Impression...' : 'Imprimer'}
              </button>
            </div>

          {/* Ticket Preview - 80mm width */}
          <div ref={ticketRef} className="ticket-container mx-auto bg-white" style={{ width: '80mm', fontFamily: 'Bebas Neue, Arial, sans-serif' }}>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue:wght@400;700&display=swap');

              * {
                margin: 0;
                padding: 0;
                font-family: 'Bebas Neue', Arial, sans-serif;
              }

              body {
                background: white;
                color: black;
              }

              @media print {
                body, html {
                  margin: 0;
                  padding: 0;
                  width: 80mm;
                  height: auto;
                }
                .no-print { display: none !important; }
                * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
              }
            `}</style>

            {/* Ticket Body */}
            <div className="border-2 border-black p-2 text-center" style={{ fontFamily: 'Bebas Neue, Arial, sans-serif', backgroundColor: '#f5f5f5' }}>
              {/* Logo - SVG version */}
              <svg viewBox="0 0 300 80" style={{ width: '100%', height: 'auto', marginBottom: '3px' }}>
                {/* Left black diamond */}
                <polygon points="20,40 35,25 50,40 35,55" fill="#000" />

                {/* Red diamond (top center) */}
                <polygon points="60,15 75,30 60,45 45,30" fill="#000" />

                {/* Right black diamond */}
                <polygon points="85,40 100,25 115,40 100,55" fill="#000" />

                {/* Red vertical bar */}
                <rect x="60" y="28" width="8" height="30" fill="#000" />

                {/* Main text INTELLECTION */}
                <text x="170" y="45" fontSize="28" fontWeight="900" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="2">
                  INTELLECTION
                </text>

                {/* Small text above */}
                <text x="170" y="20" fontSize="10" fontWeight="700" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="1">
                  CENTRE DE SOUTIEN
                </text>
              </svg>

              {/* Header */}
              <div className="border-b-4 border-black pb-2 mb-2">
                <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '2px', color: '#000' }}>INTELLECTION</div>
                <div style={{ fontSize: '9px', letterSpacing: '1px', fontWeight: '700', color: '#000' }}>PLATEFORME EDUCATIVE</div>
              </div>

              {/* Rules Section */}
              <div style={{ borderTop: '3px solid black', borderBottom: '3px solid black', margin: '3px 0', padding: '3px 0', fontSize: '9px', fontWeight: '700', backgroundColor: '#000', color: '#fff' }}>
                REGLES &amp; RESPECT
              </div>

              {/* Consignes */}
              <div style={{ fontSize: '8px', textAlign: 'left', margin: '3px 0', lineHeight: '1.4', fontWeight: '600' }}>
                <div style={{ fontWeight: '700', textAlign: 'center', marginBottom: '2px', fontSize: '9px' }}>CONSIGNES</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '4px' }}>✓</span>
                  <span>Respectez vos groupes et horaires</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '4px' }}>✓</span>
                  <span>Pas de rassemblement devant le centre</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '4px' }}>✓</span>
                  <span>Respectez les voisins</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '4px' }}>✓</span>
                  <span>Évacuez les lieux à la fin des séances</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '4px' }}>✓</span>
                  <span>Utilisez l'application</span>
                </div>
              </div>

              {/* Download App Section */}
              <div style={{ borderTop: '3px dashed black', borderBottom: '3px solid black', margin: '3px 0', padding: '3px 0', fontSize: '9px', fontWeight: '700' }}>
                TELECHARGER L'APP
              </div>

              {/* QR Codes */}
              <div style={{ margin: '4px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', fontWeight: '700', marginBottom: '2px' }}>iOS - APPLE</div>
                {qrCodes.ios && <img src={qrCodes.ios} alt="iOS" style={{ width: '75px', height: '75px', margin: '0 auto', display: 'block' }} />}
              </div>

              <div style={{ margin: '4px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', fontWeight: '700', marginBottom: '2px' }}>ANDROID</div>
                {qrCodes.android && <img src={qrCodes.android} alt="Android" style={{ width: '75px', height: '75px', margin: '0 auto', display: 'block' }} />}
              </div>

              {/* Manuals Section */}
              <div style={{ borderTop: '3px dashed black', borderBottom: '3px solid black', margin: '3px 0', padding: '3px 0', fontSize: '9px', fontWeight: '700' }}>
                MANUELS &amp; AIDE
              </div>

              <div style={{ margin: '4px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', fontWeight: '700', marginBottom: '2px' }}>DOCUMENTATION</div>
                {qrCodes.manuals && <img src={qrCodes.manuals} alt="Manuals" style={{ width: '75px', height: '75px', margin: '0 auto', display: 'block' }} />}
              </div>

              {/* App Features */}
              <div style={{ borderTop: '2px solid black', borderBottom: '2px solid black', margin: '3px 0', padding: '2px 0', fontSize: '8px', fontWeight: '600' }}>
                <div style={{ fontWeight: '700', marginBottom: '1px' }}>L'APPLICATION</div>
                <div>• Suivi des paiements</div>
                <div>• Emplois du temps</div>
                <div>• Absence &amp; présence</div>
                <div>• Documentation</div>
              </div>

              {/* Footer */}
              <div style={{ fontSize: '7px', marginTop: '2px', borderTop: '2px solid black', paddingTop: '2px', fontWeight: '600' }}>
                <div>www.intellection.edu.ma</div>
                <div>{new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-100 p-3 text-xs border border-gray-300 rounded">
            <p className="font-bold mb-2">Format thermique 80mm</p>
            <p>Adapté pour imprimante thermique standard</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default EduTicketPrinter;
