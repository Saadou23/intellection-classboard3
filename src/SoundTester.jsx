import React from 'react';
import { Volume2, Music } from 'lucide-react';
import SoundSystem from './SoundSystem';

const SoundTester = ({ onClose }) => {
  const testSound = (type) => {
    console.log(`Testing sound: ${type}`);
    switch (type) {
      case 'new':
        SoundSystem.playNewSession();
        break;
      case 'delay':
        SoundSystem.playDelay();
        break;
      case 'absence':
        SoundSystem.playAbsence();
        break;
      case 'cancel':
        SoundSystem.playCancellation();
        break;
      case 'notif':
        SoundSystem.playNotification();
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Volume2 className="w-7 h-7" />
            Test des Sons
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => testSound('new')}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium"
          >
            🎵 Nouveau Cours (Do-Mi-Sol)
          </button>

          <button
            onClick={() => testSound('delay')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium"
          >
            ⚠️ Retard (Bip-Bip)
          </button>

          <button
            onClick={() => testSound('absence')}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium"
          >
            ❌ Absence (Biiip long)
          </button>

          <button
            onClick={() => testSound('cancel')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium"
          >
            🚫 Annulation (Descendant)
          </button>

          <button
            onClick={() => testSound('notif')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium"
          >
            🔔 Notification
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-600 text-center">
          Cliquez sur un bouton pour tester le son
        </div>
      </div>
    </div>
  );
};

export default SoundTester;
