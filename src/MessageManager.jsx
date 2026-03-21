import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, X, Plus, Trash2, Send } from 'lucide-react';
import { db } from './firebase';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';

const MessageManager = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Charger les messages depuis Firebase
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const docRef = doc(db, 'settings', 'publicTodayMessages');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMessages(docSnap.data().messages || []);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  // Sauvegarder les messages dans Firebase
  const saveMessages = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'publicTodayMessages');
      await setDoc(docRef, {
        messages: messages,
        updatedAt: new Date(),
        count: messages.length
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
    setSaving(false);
  };

  // Ajouter un nouveau message
  const addMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: Date.now(),
        text: newMessage,
        createdAt: new Date().toLocaleString('fr-FR')
      }]);
      setNewMessage('');
    }
  };

  // Supprimer un message
  const deleteMessage = (id) => {
    setMessages(messages.filter(msg => msg.id !== id));
  };

  // Déclencher une annonce immédiatement
  const triggerAnnouncement = async (message) => {
    try {
      await addDoc(collection(db, 'announcement_trigger'), {
        text: message.text,
        createdAt: message.createdAt,
        triggeredAt: new Date(),
        id: message.id
      });
      // Afficher un succès
      alert('✅ Annonce lancée immédiatement!');
    } catch (error) {
      console.error('Erreur lors du lancement de l\'annonce:', error);
      alert('❌ Erreur lors du lancement de l\'annonce');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Messages PublicToday</h2>
      </div>

      {success && (
        <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
          <p className="text-green-700 font-medium">✅ Messages sauvegardés avec succès!</p>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          ➕ Ajouter un nouveau message
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMessage()}
            placeholder="Entrez le message à afficher..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-bold text-gray-700">
          📋 Messages configurés ({messages.length})
        </label>

        {messages.length === 0 ? (
          <div className="bg-gray-50 p-6 text-center rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Aucun message. Ajoutez-en un ci-dessus!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-xs text-gray-500">{msg.createdAt}</span>
                  </div>
                  <p className="text-gray-800 font-medium text-lg break-words">
                    {msg.text}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={() => triggerAnnouncement(msg)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition"
                    title="Annoncer maintenant"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                    title="Supprimer ce message"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Comment ça marche:</strong><br/>
          • Les messages s'affichent en rotation sur PublicToday<br/>
          • Chaque message s'affiche pendant <strong>1 minute</strong> toutes les <strong>15 minutes</strong><br/>
          • Les messages sont sélectionnés aléatoirement
        </p>
      </div>

      {/* Bouton de sauvegarde */}
      <button
        onClick={saveMessages}
        disabled={saving}
        className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
          saving
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {saving ? (
          <>
            <span className="animate-spin">⏳</span>
            Sauvegarde en cours...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Sauvegarder tous les messages
          </>
        )}
      </button>
    </div>
  );
};

export default MessageManager;
