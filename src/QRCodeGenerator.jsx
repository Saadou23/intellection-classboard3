import React, { useEffect, useRef } from 'react';

const QRCodeGenerator = ({ url, size = 200, label = 'Download' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use QR Server API for generating QR codes
    const encodedUrl = encodeURIComponent(url);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;

    const img = document.createElement('img');
    img.src = qrImageUrl;
    img.alt = `QR Code - ${label}`;
    img.className = 'w-full h-full object-cover';
    img.onload = () => {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(img);
    };
  }, [url, size, label]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Code with Border */}
      <div className="relative bg-white p-3 rounded-lg shadow-2xl border-2 border-white">
        <div
          ref={containerRef}
          className="w-48 h-48 bg-white rounded flex items-center justify-center"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <div className="text-gray-400 text-sm">Chargement QR...</div>
        </div>

        {/* Corner Markers (QR Code style) */}
        <div className="absolute top-2 left-2 w-4 h-4 border-2 border-black" />
        <div className="absolute top-2 right-2 w-4 h-4 border-2 border-black" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-black" />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-white text-sm font-semibold mt-2">
          📱 Scannez pour {label}
        </p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
