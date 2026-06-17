import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, X, Plus, Trash2, Send, Upload, Zap } from 'lucide-react';
import { db, storage } from './firebase';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeNotePhotos } from './initializeNotePhotos';

const MessageManager = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [launchingAd, setLaunchingAd] = useState(false);
  const [adSuccess, setAdSuccess] = useState(false);
  const [launchingBranding, setLaunchingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);
  const [launchingConcours, setLaunchingConcours] = useState(false);
  const [concoursSuccess, setConcoursSuccess] = useState(false);
  const [launchingLanguages, setLaunchingLanguages] = useState(false);
  const [languagesSuccess, setLanguagesSuccess] = useState(false);

  // Paramètres des publicités
  const [adParams, setAdParams] = useState({
    enabled: true,
    frequencyMinutes: 4,
    featureSlideDuration: 2,
    qrSlideDuration: 15,
    resultSlideDuration: 10
  });
  const [savingAdParams, setSavingAdParams] = useState(false);
  const [adParamsSuccess, setAdParamsSuccess] = useState(false);

  // Slides des publicités
  const [adSlides, setAdSlides] = useState([
    { icon: 'Calendar', color: 'blue', title: 'Consultez vos emplois du temps', description: 'Accédez instantanément à votre emploi du temps complet' },
    { icon: 'Bell', color: 'red', title: 'Recevez les notifications', description: 'Soyez alerté des absences ou retards des professeurs' },
    { icon: 'BookOpen', color: 'purple', title: 'Demandez des cours individuels', description: 'Accédez aux supports de cours et exercices électroniques' },
    { icon: 'Zap', color: 'amber', title: 'Restez connectés', description: 'Suivi en temps réel de votre scolarité' },
    { icon: 'Bell', color: 'green', title: 'Suivi Parental en Temps Réel', description: 'Les parents suivent précisément: présences, emploi du temps, performances et communications directes' }
  ]);
  const [savingAdSlides, setSavingAdSlides] = useState(false);
  const [adSlidesSuccess, setAdSlidesSuccess] = useState(false);

  // Images et Durées des Pubs
  const [concoursImage, setConcoursImage] = useState({
    url: '/concours-prep.jpg',
    displayDuration: 30
  });
  const [savingConcoursImage, setSavingConcoursImage] = useState(false);
  const [concoursImageSuccess, setConcoursImageSuccess] = useState(false);
  const [uploadingConcoursImage, setUploadingConcoursImage] = useState(false);

  const [languagesImage, setLanguagesImage] = useState({
    url: '/languages-courses.jpg',
    displayDuration: 30
  });
  const [savingLanguagesImage, setSavingLanguagesImage] = useState(false);
  const [languagesImageSuccess, setLanguagesImageSuccess] = useState(false);
  const [uploadingLanguagesImage, setUploadingLanguagesImage] = useState(false);

  // Autres pubs personnalisées
  const [customAds, setCustomAds] = useState([]);
  const [savingCustomAds, setSavingCustomAds] = useState(false);
  const [customAdsSuccess, setCustomAdsSuccess] = useState(false);
  const [uploadingCustomAdIndex, setUploadingCustomAdIndex] = useState(null);

  // Photos de notes (gestion)
  const [notePhotos, setNotePhotos] = useState([]);
  const [savingNotePhotos, setSavingNotePhotos] = useState(false);
  const [notePhotosSuccess, setNotePhotosSuccess] = useState(false);
  const [uploadingNotePhotoIndex, setUploadingNotePhotoIndex] = useState(null);
  const [initializingPhotos, setInitializingPhotos] = useState(false);

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

  // Charger les paramètres des publicités depuis Firebase
  useEffect(() => {
    const loadAdParams = async () => {
      try {
        const docRef = doc(db, 'settings', 'advertisement_params');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAdParams(docSnap.data());
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };

    loadAdParams();
  }, []);

  // Charger les slides des publicités depuis Firebase
  useEffect(() => {
    const loadAdSlides = async () => {
      try {
        const docRef = doc(db, 'settings', 'advertisement_slides');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAdSlides(docSnap.data().slides || adSlides);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des slides:', error);
      }
    };

    loadAdSlides();
  }, []);

  // Charger images Concours Prep
  useEffect(() => {
    const loadConcours = async () => {
      try {
        const docRef = doc(db, 'settings', 'concours_prep_image');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setConcoursImage(docSnap.data());
        }
      } catch (error) {
        console.error('Erreur lors du chargement Concours:', error);
      }
    };

    loadConcours();
  }, []);

  // Charger images Langues Courses
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const docRef = doc(db, 'settings', 'languages_courses_image');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setLanguagesImage(docSnap.data());
        }
      } catch (error) {
        console.error('Erreur lors du chargement Langues:', error);
      }
    };

    loadLanguages();
  }, []);

  // Charger les pubs personnalisées
  useEffect(() => {
    const loadCustomAds = async () => {
      try {
        const docRef = doc(db, 'settings', 'custom_ads');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCustomAds(docSnap.data().ads || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des pubs:', error);
      }
    };

    loadCustomAds();
  }, []);

  // Charger les photos de notes
  useEffect(() => {
    const loadNotePhotos = async () => {
      try {
        const docRef = doc(db, 'settings', 'note_photos');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setNotePhotos(docSnap.data().photos || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des photos:', error);
      }
    };

    loadNotePhotos();
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

  // Lancer la publicité de l'app
  const launchAdvertisement = async () => {
    setLaunchingAd(true);
    try {
      await addDoc(collection(db, 'advertisement_trigger'), {
        triggeredAt: new Date(),
        type: 'mobile_app'
      });
      setAdSuccess(true);
      setTimeout(() => setAdSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setLaunchingAd(false);
    }
  };

  // Lancer le branding INTELLECTION
  const launchBrandingBanner = async () => {
    setLaunchingBranding(true);
    try {
      await addDoc(collection(db, 'branding_trigger'), {
        triggeredAt: new Date(),
        type: 'branding'
      });
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setLaunchingBranding(false);
    }
  };

  // Lancer la pub Préparation Concours
  const launchConcoursPrepAd = async () => {
    setLaunchingConcours(true);
    try {
      await addDoc(collection(db, 'concours_prep_trigger'), {
        triggeredAt: new Date(),
        type: 'concours_prep'
      });
      setConcoursSuccess(true);
      setTimeout(() => setConcoursSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setLaunchingConcours(false);
    }
  };

  // Lancer la pub Inscriptions Langues
  const launchLanguagesCoursesAd = async () => {
    setLaunchingLanguages(true);
    try {
      await addDoc(collection(db, 'languages_courses_trigger'), {
        triggeredAt: new Date(),
        type: 'languages_courses'
      });
      setLanguagesSuccess(true);
      setTimeout(() => setLanguagesSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors du lancement');
    } finally {
      setLaunchingLanguages(false);
    }
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

  // Sauvegarder les paramètres des publicités
  const saveAdParams = async () => {
    setSavingAdParams(true);
    try {
      const docRef = doc(db, 'settings', 'advertisement_params');
      await setDoc(docRef, adParams);
      setAdParamsSuccess(true);
      setTimeout(() => setAdParamsSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setSavingAdParams(false);
  };

  // Sauvegarder les slides des publicités
  const saveAdSlides = async () => {
    setSavingAdSlides(true);
    try {
      const docRef = doc(db, 'settings', 'advertisement_slides');
      await setDoc(docRef, { slides: adSlides });
      setAdSlidesSuccess(true);
      setTimeout(() => setAdSlidesSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des slides:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setSavingAdSlides(false);
  };

  // Sauvegarder les pubs personnalisées
  const saveCustomAds = async () => {
    setSavingCustomAds(true);
    try {
      const docRef = doc(db, 'settings', 'custom_ads');
      await setDoc(docRef, { ads: customAds });
      setCustomAdsSuccess(true);
      setTimeout(() => setCustomAdsSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des pubs:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setSavingCustomAds(false);
  };

  // Upload image Concours Prep
  const uploadConcoursImage = async (file) => {
    if (!file) return;
    setUploadingConcoursImage(true);
    try {
      const timestamp = Date.now();
      const fileName = `concours-prep-${timestamp}`;
      const storageRef = ref(storage, `advertisements/concours/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setConcoursImage({...concoursImage, url: downloadURL});
      alert('✅ Image uploadée avec succès!');
    } catch (error) {
      console.error('Erreur upload Concours:', error);
      alert('❌ Erreur lors de l\'upload');
    }
    setUploadingConcoursImage(false);
  };

  // Upload image Langues Courses
  const uploadLanguagesImage = async (file) => {
    if (!file) return;
    setUploadingLanguagesImage(true);
    try {
      const timestamp = Date.now();
      const fileName = `languages-courses-${timestamp}`;
      const storageRef = ref(storage, `advertisements/languages/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setLanguagesImage({...languagesImage, url: downloadURL});
      alert('✅ Image uploadée avec succès!');
    } catch (error) {
      console.error('Erreur upload Langues:', error);
      alert('❌ Erreur lors de l\'upload');
    }
    setUploadingLanguagesImage(false);
  };

  // Sauvegarder image Concours Prep
  const saveConcoursImage = async () => {
    setSavingConcoursImage(true);
    try {
      const docRef = doc(db, 'settings', 'concours_prep_image');
      await setDoc(docRef, concoursImage);
      setConcoursImageSuccess(true);
      setTimeout(() => setConcoursImageSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde Concours:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setSavingConcoursImage(false);
  };

  // Sauvegarder image Langues Courses
  const saveLanguagesImage = async () => {
    setSavingLanguagesImage(true);
    try {
      const docRef = doc(db, 'settings', 'languages_courses_image');
      await setDoc(docRef, languagesImage);
      setLanguagesImageSuccess(true);
      setTimeout(() => setLanguagesImageSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde Langues:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setSavingLanguagesImage(false);
  };

  // Upload image pour pub personnalisée
  const uploadCustomAdImage = async (file, index) => {
    if (!file) return;
    setUploadingCustomAdIndex(index);
    try {
      const timestamp = Date.now();
      const fileName = `custom-ad-${timestamp}`;
      const storageRef = ref(storage, `advertisements/custom/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const updated = [...customAds];
      updated[index].url = downloadURL;
      setCustomAds(updated);
      alert('✅ Image uploadée avec succès!');
    } catch (error) {
      console.error('Erreur upload pub personnalisée:', error);
      alert('❌ Erreur lors de l\'upload');
    }
    setUploadingCustomAdIndex(null);
  };

  // Upload image pour photo de notes
  const uploadNotePhoto = async (file, index) => {
    if (!file) return;
    setUploadingNotePhotoIndex(index);
    try {
      const timestamp = Date.now();
      const fileName = `note-photo-${timestamp}`;
      const storageRef = ref(storage, `note_photos/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const updated = [...notePhotos];
      updated[index].url = downloadURL;
      setNotePhotos(updated);
      alert('✅ Photo uploadée avec succès!');
    } catch (error) {
      console.error('Erreur upload photo notes:', error);
      alert('❌ Erreur lors de l\'upload');
    }
    setUploadingNotePhotoIndex(null);
  };

  // Sauvegarder les photos de notes
  const saveNotePhotos = async () => {
    setSavingNotePhotos(true);
    try {
      const docRef = doc(db, 'settings', 'note_photos');
      await setDoc(docRef, { photos: notePhotos });
      setNotePhotosSuccess(true);
      setTimeout(() => setNotePhotosSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des photos:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
    setSavingNotePhotos(false);
  };

  // Initialiser les photos existantes
  const handleInitializePhotos = async () => {
    setInitializingPhotos(true);
    try {
      const success = await initializeNotePhotos();
      if (success) {
        await new Promise(r => setTimeout(r, 500));
        const docRef = doc(db, 'settings', 'note_photos');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNotePhotos(docSnap.data().photos || []);
        }
        alert('✅ Photos existantes importées avec succès!');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de l\'initialisation');
    }
    setInitializingPhotos(false);
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

      {adSuccess && (
        <div className="bg-blue-100 border-l-4 border-blue-600 p-4 mb-4 rounded">
          <p className="text-blue-700 font-medium">🚀 Publicité lancée! Elle s'affiche pendant 15 secondes.</p>
        </div>
      )}

      {brandingSuccess && (
        <div className="bg-indigo-100 border-l-4 border-indigo-600 p-4 mb-4 rounded">
          <p className="text-indigo-700 font-medium">🎯 Branding INTELLECTION lancé! Il s'affiche pendant 8 secondes.</p>
        </div>
      )}

      {concoursSuccess && (
        <div className="bg-yellow-100 border-l-4 border-yellow-600 p-4 mb-4 rounded">
          <p className="text-yellow-700 font-medium">🎓 Pub Préparation Concours lancée! Elle s'affiche pendant 30 secondes.</p>
        </div>
      )}

      {languagesSuccess && (
        <div className="bg-blue-100 border-l-4 border-blue-600 p-4 mb-4 rounded">
          <p className="text-blue-700 font-medium">🌍 Pub Inscriptions Langues lancée! Elle s'affiche pendant 20 secondes.</p>
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

      {/* Boutons d'action */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={saveMessages}
          disabled={saving}
          className={`py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {saving ? (
            <>
              <span className="animate-spin">⏳</span>
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Sauvegarder
            </>
          )}
        </button>

        <div className="flex gap-3">
          <button
            onClick={launchAdvertisement}
            disabled={launchingAd}
            className={`flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              launchingAd
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {launchingAd ? (
              <>
                <span className="animate-spin">⏳</span>
                Lancement...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                🚀 Lancer pub
              </>
            )}
          </button>

          <button
            onClick={launchBrandingBanner}
            disabled={launchingBranding}
            className={`flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              launchingBranding
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {launchingBranding ? (
              <>
                <span className="animate-spin">⏳</span>
                Lancement...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                🎯 Branding
              </>
            )}
          </button>

          <button
            onClick={launchConcoursPrepAd}
            disabled={launchingConcours}
            className={`flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              launchingConcours
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {launchingConcours ? (
              <>
                <span className="animate-spin">⏳</span>
                Lancement...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                🎓 Concours
              </>
            )}
          </button>

          <button
            onClick={launchLanguagesCoursesAd}
            disabled={launchingLanguages}
            className={`flex-1 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              launchingLanguages
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {launchingLanguages ? (
              <>
                <span className="animate-spin">⏳</span>
                Lancement...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                🌍 Langues
              </>
            )}
          </button>
        </div>

        {/* Paramètres des publicités */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            ⚙️ Paramètres des Publicités
          </h3>

          {adParamsSuccess && (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
              <p className="text-green-700 font-medium">✅ Paramètres sauvegardés!</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Activé/Désactivé */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adParams.enabled}
                  onChange={(e) => setAdParams({...adParams, enabled: e.target.checked})}
                  className="w-5 h-5 rounded"
                />
                <span className="font-medium text-gray-700">Publicités activées</span>
              </label>
            </div>

            {/* Fréquence */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Fréquence d'affichage (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={adParams.frequencyMinutes}
                onChange={(e) => setAdParams({...adParams, frequencyMinutes: parseInt(e.target.value)})}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Actuellement: {adParams.frequencyMinutes} min</p>
            </div>

            {/* Durée slides features */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏱️ Durée slides Features (secondes)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={adParams.featureSlideDuration}
                onChange={(e) => setAdParams({...adParams, featureSlideDuration: parseInt(e.target.value)})}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">×5 slides = {adParams.featureSlideDuration * 5}s total</p>
            </div>

            {/* Durée slide QR */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 Durée slide QR Code (secondes)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={adParams.qrSlideDuration}
                onChange={(e) => setAdParams({...adParams, qrSlideDuration: parseInt(e.target.value)})}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Actuellement: {adParams.qrSlideDuration}s</p>
            </div>

            {/* Durée slides résultats */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📈 Durée slides Résultats (secondes)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={adParams.resultSlideDuration}
                onChange={(e) => setAdParams({...adParams, resultSlideDuration: parseInt(e.target.value)})}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">×4 slides = {adParams.resultSlideDuration * 4}s total</p>
            </div>

            {/* Résumé */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <p className="font-medium text-blue-900 mb-2">📊 Durée totale d'une pub:</p>
              <p className="text-lg font-bold text-blue-700">
                {(adParams.featureSlideDuration * 5) + adParams.qrSlideDuration + (adParams.resultSlideDuration * 4)} secondes
              </p>
              <p className="text-xs text-blue-600 mt-1">({((adParams.featureSlideDuration * 5) + adParams.qrSlideDuration + (adParams.resultSlideDuration * 4)) / 60}.{Math.round(((adParams.featureSlideDuration * 5) + adParams.qrSlideDuration + (adParams.resultSlideDuration * 4)) % 60)}min)</p>
            </div>
          </div>

          <button
            onClick={saveAdParams}
            disabled={savingAdParams}
            className={`py-3 px-6 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              savingAdParams
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {savingAdParams ? (
              <>
                <span className="animate-spin">⏳</span>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder les paramètres
              </>
            )}
          </button>
        </div>

        {/* Slides des Publicités */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📺 Slides des Publicités (Features)
          </h3>

          {adSlidesSuccess && (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
              <p className="text-green-700 font-medium">✅ Slides sauvegardés!</p>
            </div>
          )}

          <div className="space-y-4 mb-4">
            {adSlides.map((slide, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 relative">
                {/* Bouton Supprimer */}
                <button
                  onClick={() => {
                    const updated = adSlides.filter((_, i) => i !== idx);
                    setAdSlides(updated);
                  }}
                  className="absolute top-3 right-3 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                  title="Supprimer ce slide"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slide {idx + 1} - Titre
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => {
                        const updated = [...adSlides];
                        updated[idx].title = e.target.value;
                        setAdSlides(updated);
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Couleur (Icône)
                    </label>
                    <input
                      type="text"
                      value={slide.color}
                      onChange={(e) => {
                        const updated = [...adSlides];
                        updated[idx].color = e.target.value;
                        setAdSlides(updated);
                      }}
                      placeholder="blue, red, purple, amber, green..."
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={slide.description}
                    onChange={(e) => {
                      const updated = [...adSlides];
                      updated[idx].description = e.target.value;
                      setAdSlides(updated);
                    }}
                    rows="2"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setAdSlides([
                  ...adSlides,
                  { icon: 'Star', color: 'gray', title: 'Nouveau Slide', description: 'Cliquez pour éditer' }
                ]);
              }}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Slide
            </button>
          </div>

          <button
            onClick={saveAdSlides}
            disabled={savingAdSlides}
            className={`py-3 px-6 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              savingAdSlides
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {savingAdSlides ? (
              <>
                <span className="animate-spin">⏳</span>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder les Slides
              </>
            )}
          </button>
        </div>

        {/* Image Concours Prep */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🎓 Image Pub Préparation Concours
          </h3>

          {concoursImageSuccess && (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
              <p className="text-green-700 font-medium">✅ Image Concours sauvegardée!</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 mb-4 space-y-4">
            {/* Preview image */}
            {concoursImage.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📸 Aperçu</label>
                <img src={concoursImage.url} alt="Concours" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            {/* Upload image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📤 Upload Image (JPG, PNG)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    uploadConcoursImage(e.target.files[0]);
                  }
                }}
                disabled={uploadingConcoursImage}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-yellow-600 file:text-white
                  hover:file:bg-yellow-700
                  cursor-pointer border-2 border-dashed border-yellow-300 rounded-lg p-3"
              />
              <p className="text-xs text-gray-500 mt-1">Format: JPG ou PNG (max 5MB)</p>
              {uploadingConcoursImage && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span className="text-sm text-gray-600">Upload en cours...</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏱️ Durée d'affichage (secondes)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={concoursImage.displayDuration}
                onChange={(e) => setConcoursImage({...concoursImage, displayDuration: parseInt(e.target.value)})}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <button
            onClick={saveConcoursImage}
            disabled={savingConcoursImage}
            className={`py-3 px-6 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              savingConcoursImage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {savingConcoursImage ? (
              <>
                <span className="animate-spin">⏳</span>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder Image Concours
              </>
            )}
          </button>
        </div>

        {/* Image Langues Courses */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🌍 Image Pub Inscriptions Langues
          </h3>

          {languagesImageSuccess && (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
              <p className="text-green-700 font-medium">✅ Image Langues sauvegardée!</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 mb-4 space-y-4">
            {/* Preview image */}
            {languagesImage.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📸 Aperçu</label>
                <img src={languagesImage.url} alt="Langues" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            {/* Upload image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📤 Upload Image (JPG, PNG)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    uploadLanguagesImage(e.target.files[0]);
                  }
                }}
                disabled={uploadingLanguagesImage}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-green-600 file:text-white
                  hover:file:bg-green-700
                  cursor-pointer border-2 border-dashed border-green-300 rounded-lg p-3"
              />
              <p className="text-xs text-gray-500 mt-1">Format: JPG ou PNG (max 5MB)</p>
              {uploadingLanguagesImage && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span className="text-sm text-gray-600">Upload en cours...</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏱️ Durée d'affichage (secondes)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={languagesImage.displayDuration}
                onChange={(e) => setLanguagesImage({...languagesImage, displayDuration: parseInt(e.target.value)})}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <button
            onClick={saveLanguagesImage}
            disabled={savingLanguagesImage}
            className={`py-3 px-6 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              savingLanguagesImage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {savingLanguagesImage ? (
              <>
                <span className="animate-spin">⏳</span>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder Image Langues
              </>
            )}
          </button>
        </div>

        {/* Autres Pubs Personnalisées */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🎪 Autres Pubs Personnalisées
          </h3>

          {customAdsSuccess && (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
              <p className="text-green-700 font-medium">✅ Pubs personnalisées sauvegardées!</p>
            </div>
          )}

          <div className="space-y-4 mb-4">
            {customAds.map((ad, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 relative">
                {/* Bouton Supprimer */}
                <button
                  onClick={() => {
                    const updated = customAds.filter((_, i) => i !== idx);
                    setCustomAds(updated);
                  }}
                  className="absolute top-3 right-3 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                  title="Supprimer cette pub"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="space-y-3 pr-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pub {idx + 1} - Titre
                    </label>
                    <input
                      type="text"
                      value={ad.title || ''}
                      onChange={(e) => {
                        const updated = [...customAds];
                        updated[idx].title = e.target.value;
                        setCustomAds(updated);
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Aperçu image */}
                  {ad.url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📸 Aperçu</label>
                      <img src={ad.url} alt={ad.title} className="w-full h-40 object-cover rounded-lg" />
                    </div>
                  )}

                  {/* Upload image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📤 Upload Image (JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          uploadCustomAdImage(e.target.files[0], idx);
                        }
                      }}
                      disabled={uploadingCustomAdIndex === idx}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-purple-600 file:text-white
                        hover:file:bg-purple-700
                        cursor-pointer border-2 border-dashed border-purple-300 rounded-lg p-3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: JPG ou PNG (max 5MB)</p>
                    {uploadingCustomAdIndex === idx && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span className="text-sm text-gray-600">Upload en cours...</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⏱️ Durée d'affichage (secondes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={ad.displayDuration || 15}
                      onChange={(e) => {
                        const updated = [...customAds];
                        updated[idx].displayDuration = parseInt(e.target.value);
                        setCustomAds(updated);
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {customAds.length === 0 && (
            <div className="bg-gray-50 p-6 text-center rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <p className="text-gray-500">Aucune pub personnalisée. Ajoutez-en une ci-dessous!</p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setCustomAds([
                  ...customAds,
                  { title: 'Nouvelle Pub', url: '', displayDuration: 15 }
                ]);
              }}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter une Pub
            </button>
          </div>

          <button
            onClick={saveCustomAds}
            disabled={savingCustomAds}
            className={`py-3 px-6 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              savingCustomAds
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {savingCustomAds ? (
              <>
                <span className="animate-spin">⏳</span>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder les Pubs Personnalisées
              </>
            )}
          </button>
        </div>

        {/* Photos de Notes */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📷 Gestion des Photos de Notes
          </h3>

          {notePhotosSuccess && (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 mb-4 rounded">
              <p className="text-green-700 font-medium">✅ Photos sauvegardées!</p>
            </div>
          )}

          {notePhotos.length === 0 && (
            <div className="mb-4">
              <button
                onClick={handleInitializePhotos}
                disabled={initializingPhotos}
                className={`py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                  initializingPhotos
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {initializingPhotos ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Chargement...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    ⚡ Charger les Photos Existantes
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">Importe les 4 photos de notes déjà présentes dans le projet</p>
            </div>
          )}

          <div className="space-y-4 mb-4">
            {notePhotos.map((photo, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 relative">
                {/* Bouton Supprimer */}
                <button
                  onClick={() => {
                    const updated = notePhotos.filter((_, i) => i !== idx);
                    setNotePhotos(updated);
                  }}
                  className="absolute top-3 right-3 p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                  title="Supprimer cette photo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="space-y-3 pr-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photo {idx + 1} - Titre (optionnel)
                    </label>
                    <input
                      type="text"
                      value={photo.title || ''}
                      onChange={(e) => {
                        const updated = [...notePhotos];
                        updated[idx].title = e.target.value;
                        setNotePhotos(updated);
                      }}
                      placeholder="Ex: Leçon de Mathématiques..."
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Aperçu image */}
                  {photo.url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">📸 Aperçu</label>
                      <img src={photo.url} alt={photo.title || 'Photo'} className="w-full h-48 object-cover rounded-lg" />
                    </div>
                  )}

                  {/* Upload image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📤 Upload Photo de Notes (JPG, PNG)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          uploadNotePhoto(e.target.files[0], idx);
                        }
                      }}
                      disabled={uploadingNotePhotoIndex === idx}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700
                        cursor-pointer border-2 border-dashed border-blue-300 rounded-lg p-3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: JPG ou PNG (max 5MB)</p>
                    {uploadingNotePhotoIndex === idx && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span className="text-sm text-gray-600">Upload en cours...</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⏱️ Durée d'affichage (secondes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={photo.displayDuration || 15}
                      onChange={(e) => {
                        const updated = [...notePhotos];
                        updated[idx].displayDuration = parseInt(e.target.value);
                        setNotePhotos(updated);
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notePhotos.length === 0 && (
            <div className="bg-gray-50 p-6 text-center rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <p className="text-gray-500">Aucune photo de notes. Ajoutez-en une ci-dessous!</p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setNotePhotos([
                  ...notePhotos,
                  { title: 'Nouvelle Photo', url: '', displayDuration: 15 }
                ]);
              }}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter une Photo
            </button>
          </div>

          <button
            onClick={saveNotePhotos}
            disabled={savingNotePhotos}
            className={`py-3 px-6 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
              savingNotePhotos
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {savingNotePhotos ? (
              <>
                <span className="animate-spin">⏳</span>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Sauvegarder les Photos de Notes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageManager;
