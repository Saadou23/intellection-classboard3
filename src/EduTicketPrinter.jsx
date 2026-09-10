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
        manuals: window.location.origin + '/manuels'
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
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
          <div className="flex gap-2 print:hidden">
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
          <div ref={ticketRef} className="mx-auto bg-white" style={{ width: '80mm', fontFamily: 'Bebas Neue, Arial, sans-serif' }}>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

              * {
                margin: 0;
                padding: 0;
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
            <div className="border border-black p-3 text-center" style={{ fontFamily: 'Bebas Neue, Arial, sans-serif' }}>
              {/* Header */}
              <div className="border-b-2 border-black pb-2 mb-2">
                <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>INTELLECTION</div>
                <div style={{ fontSize: '9px', letterSpacing: '1px' }}>PLATEFORME EDUCATIVE</div>
              </div>

              {/* Separator */}
              <div style={{ borderTop: '1px solid black', borderBottom: '1px solid black', margin: '2px 0', padding: '2px 0', fontSize: '8px', fontWeight: 'bold' }}>
                RESPECT &amp; CIVISME
              </div>

              {/* Instructions */}
              <div style={{ fontSize: '7px', textAlign: 'left', margin: '3px 0', lineHeight: '1.3' }}>
                <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '2px' }}>CONSIGNES</div>
                <div>✓ Respectez le silence</div>
                <div>✓ Pas de bruit après 22h</div>
                <div>✓ Courtoisie envers tous</div>
                <div>✓ Propreté des lieux</div>
                <div>✓ Pas de nuisance sonore</div>
                <div>✓ Respectez les règles</div>
              </div>

              {/* Separator */}
              <div style={{ borderTop: '2px dashed black', borderBottom: '1px solid black', margin: '3px 0', padding: '2px 0', fontSize: '8px', fontWeight: 'bold' }}>
                TELECHARGER L'APP
              </div>

              {/* QR Codes */}
              <div style={{ margin: '3px 0' }}>
                <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '1px' }}>iOS - APPLE</div>
                {qrCodes.ios && <img src={qrCodes.ios} alt="iOS" style={{ width: '70px', height: '70px', margin: '0 auto' }} />}
              </div>

              <div style={{ margin: '3px 0' }}>
                <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '1px' }}>ANDROID</div>
                {qrCodes.android && <img src={qrCodes.android} alt="Android" style={{ width: '70px', height: '70px', margin: '0 auto' }} />}
              </div>

              {/* Separator */}
              <div style={{ borderTop: '2px dashed black', borderBottom: '1px solid black', margin: '3px 0', padding: '2px 0', fontSize: '8px', fontWeight: 'bold' }}>
                MANUELS D'UTILISATION
              </div>

              <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '1px' }}>DOCUMENTATION</div>
              {qrCodes.manuals && <img src={qrCodes.manuals} alt="Manuals" style={{ width: '70px', height: '70px', margin: '0 auto' }} />}

              {/* Features */}
              <div style={{ borderTop: '1px solid black', borderBottom: '1px solid black', margin: '3px 0', padding: '2px 0', fontSize: '7px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '1px' }}>FEATURES MOBILES</div>
                <div>• Suivi des paiements</div>
                <div>• Emplois du temps</div>
                <div>• Documentation</div>
                <div>• Contrôle pointage</div>
              </div>

              {/* Footer */}
              <div style={{ fontSize: '6px', marginTop: '2px', borderTop: '1px solid black', paddingTop: '2px' }}>
                <div>www.intellection.edu.ma</div>
                <div>{new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-100 p-3 text-xs border border-gray-300 rounded print:hidden">
            <p className="font-bold mb-2">Format thermique 80mm</p>
            <p>Adapté pour imprimante thermique standard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EduTicketPrinter;
