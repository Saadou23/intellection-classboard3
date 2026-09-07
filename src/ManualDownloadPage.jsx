import React from 'react';
import { ChevronLeft, Download, BookOpen, Users } from 'lucide-react';

const ManualDownloadPage = ({ onBack }) => {
  const manuals = [
    {
      id: 1,
      title: "Guide d'Utilisation - Espace Parent",
      description: "Manuel complet pour les parents utilisant l'application Intellection",
      icon: <Users className="w-12 h-12 text-blue-600" />,
      file: '/guide-parent.pdf',
      color: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-300'
    },
    {
      id: 2,
      title: "Guide d'Utilisation - ClassBoard Mobile",
      description: "Manuel complet pour l'application mobile ClassBoard",
      icon: <BookOpen className="w-12 h-12 text-purple-600" />,
      file: '/guide-mobile.pdf',
      color: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-300'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 py-6 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-200 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Manuels d'Utilisation</h1>
          <p className="text-blue-200">Téléchargez les guides complets pour utiliser nos applications</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {manuals.map((manual) => (
            <div
              key={manual.id}
              className={`bg-gradient-to-br ${manual.color} border-2 ${manual.borderColor} rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1`}
            >
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  {manual.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">
                  {manual.title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-center mb-6">
                  {manual.description}
                </p>

                {/* Download Button */}
                <a
                  href={manual.file}
                  download
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Télécharger PDF
                </a>

                {/* File Info */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  📄 Fichier PDF • Format paysage • Imprimable
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur">
          <h3 className="text-xl font-bold text-white mb-3">💡 À propos des manuels</h3>
          <ul className="text-blue-100 space-y-2">
            <li>✓ Guides complets et détaillés</li>
            <li>✓ Explications étape par étape</li>
            <li>✓ Captures d'écran et exemples</li>
            <li>✓ Disponibles en format PDF</li>
            <li>✓ Téléchargeables et imprimables</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManualDownloadPage;
