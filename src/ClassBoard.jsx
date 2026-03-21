import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Monitor, Settings, AlertCircle, Maximize, Clock, BarChart3, Sliders, Building2, Calendar, Printer, Moon, FileDown, MapPin, BookOpen, Users, Bell, MessageSquare } from 'lucide-react';import { db } from './firebase';
import { doc, setDoc, getDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';
import Dashboard from './DashboardOptimized';
import SettingsManager from './SettingsManager';
import SearchableSelect from './SearchableSelect';
import MultiLevelSelect from './MultiLevelSelect';
import BranchManager from './BranchManager';
import ConflictDetector, { hasConflicts } from './ConflictDetector';
import ExceptionalSessionManager from './ExceptionalSessionManager';
import { filterSessionsForDate, getTodaySessions, getSessionDisplayStatus } from './sessionFilters';
import { getAllPeriods, getActivePeriodId, filterSessionsByPeriod, getPeriodIcon, getPeriodName } from './periodUtils';
import AvailableRoomsViewer from './AvailableRoomsViewer';
import SoundTester from './SoundTester';
import UpcomingSessionsPreview from './UpcomingSessionsPreview';
import useSessionNotifications from './useSessionNotifications';
import SoundSystem from './SoundSystem';
import ThermalPrintSchedule from './ThermalPrintSchedule';
import PDFExportModal from './PDFExportModal';
import DisciplineBoard from './DisciplineBoard';
import ProfPresenceModal from './ProfPresenceModal';
import ProfessorSettingsManager from './ProfessorSettingsManager';
import StudentIndividualLessonsManager from './StudentIndividualLessonsManager';
import MessageManager from './MessageManager';
import AppAdvertisement from './AppAdvertisement';
import { loadTodayRecords, createDisciplineRecord } from './disciplineService';
import { Volume2, VolumeX, Eye } from 'lucide-react';
const ClassBoard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [password, setPassword] = useState('');
  const [sessions, setSessions] = useState({});
  const [editingSession, setEditingSession] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [view, setView] = useState('login');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [showSettingsManager, setShowSettingsManager] = useState(false);
  const [showProfessorSettings, setShowProfessorSettings] = useState(false);
  const [showStudentIndividualLessons, setShowStudentIndividualLessons] = useState(false);
  const [showBranchManager, setShowBranchManager] = useState(false);
  const [showExceptionalSession, setShowExceptionalSession] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [maxGroups, setMaxGroups] = useState(6);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [showSoundTester, setShowSoundTester] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [branches, setBranches] = useState(['Hay Salam', 'Doukkali', 'Saada']); // Valeurs par défaut
  const [scrollPosition, setScrollPosition] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [branchesData, setBranchesData] = useState([]);
const [showAvailableRooms, setShowAvailableRooms] = useState(false);
const [soundEnabled, setSoundEnabled] = useState(true);
const [showThermalPrint, setShowThermalPrint] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [showDisciplineBoard, setShowDisciplineBoard] = useState(false);
  const [presenceRecordId, setPresenceRecordId] = useState(null);
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  const [presenceRecord, setPresenceRecord] = useState(null);
  const [periodMode, setPeriodMode] = useState(null); // null = normal, "ramadan-2025" = période
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [viewPeriodFilter, setViewPeriodFilter] = useState(null); // null = toutes, "normal" = normales, "period-id" = période spécifique
  const [viewDayFilter, setViewDayFilter] = useState(null); // null = tous les jours, 0-6 = jour spécifique
  const [showMessageManager, setShowMessageManager] = useState(false);
// Hook pour les notifications sonores
useSessionNotifications(sessions, selectedBranch, currentTime, soundEnabled);
  const daysOfWeek = [
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' }
  ];
  const statuses = [
    { value: 'normal', label: 'PRÉVU', color: 'text-white', bg: '' },
    { value: 'cancelled', label: 'ANNULÉE', color: 'text-red-400', bg: 'bg-red-900/30' },
    { value: 'delayed', label: 'RETARDÉE', color: 'text-red-400', bg: 'bg-red-900/30' },
    { value: 'absent', label: 'PROF ABSENT', color: 'text-red-400', bg: 'bg-red-900/30' },
    { value: 'ongoing', label: 'EN COURS', color: 'text-green-400', bg: 'bg-green-900/30' },
    { value: 'finished', label: 'TERMINÉ', color: 'text-gray-400', bg: 'bg-gray-900/30' }
  ];

  const formInitialState = {
    dayOfWeek: new Date().getDay(),
    startTime: '19:00',
    endTime: '20:30',
    levels: [], // Changé de 'level' à 'levels' en tableau
    subject: '',
    groupe: '',
    professor: '',
    room: '',
    status: 'normal',
    makeupDate: '',
    makeupTime: '',
    period: null
  };

  const [formData, setFormData] = useState(formInitialState);

  // ========== FONCTIONS FIREBASE ==========
  const loadTimeOffset = async () => {
    try {
      const docRef = doc(db, 'settings', 'timeOffset');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTimeOffset(docSnap.data().value || 0);
      }
    } catch (error) {
      console.log('Pas de réglage horaire');
    }
  };

  const saveTimeOffset = async (offset) => {
    try {
      await setDoc(doc(db, 'settings', 'timeOffset'), {
        value: offset
      });
      setTimeOffset(offset);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfessors(data.professors || []);
        setLevels(data.levels || []);
        setSubjects(data.subjects || []);
        setMaxGroups(data.maxGroups || 6);
      }
    } catch (error) {
      console.log('Pas de paramètres globaux');
    }

    // Charger les branches
    try {
      const branchesRef = doc(db, 'settings', 'branches');
      const branchesSnap = await getDoc(branchesRef);
      
      if (branchesSnap.exists()) {
        const branchesData = branchesSnap.data();
    const data2 = branchesSnap.data();
const branchesArray = data2.branches || [];
setBranchesData(branchesArray);
console.log('🔧 BranchesData loaded:', branchesArray);
const branchNames = branchesArray.map(b => b.name) || [];
        if (branchNames.length > 0) {
          setBranches(branchNames);
        }
      }
    } catch (error) {
      console.log('Pas de configuration des branches, utilisation des valeurs par défaut');
    }
  };

  const loadBranchData = (branch) => {
    const docRef = doc(db, 'branches', branch);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessions(prev => ({ ...prev, [branch]: data.sessions || [] }));
        setAdminMessage(data.adminMessage || '');
      }
    }, (error) => {
      console.error('Erreur Firebase:', error);
    });

    return unsubscribe;
  };

  const saveBranchData = async (branch, branchSessions) => {
    try {
      await setDoc(doc(db, 'branches', branch), {
        sessions: branchSessions,
        adminMessage: adminMessage,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Vérifiez votre connexion.');
    }
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + timeOffset);
      setCurrentTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  useEffect(() => {
    if (selectedBranch) {
      const unsubscribe = loadBranchData(selectedBranch);
      return () => unsubscribe && unsubscribe();
    }
  }, [selectedBranch]);

  // Charger toutes les branches au démarrage pour le Dashboard
  useEffect(() => {
    const unsubscribes = [];
    
    // Charger les données de toutes les branches
    branches.forEach(branch => {
      const unsubscribe = loadBranchData(branch);
      if (unsubscribe) {
        unsubscribes.push(unsubscribe);
      }
    });

    // Cleanup
    return () => {
      unsubscribes.forEach(unsub => unsub && unsub());
    };
  }, [branches]); // Se déclenche quand les branches sont chargées

  // Charger les périodes disponibles
  useEffect(() => {
    if (branchesData && branchesData.length > 0) {
      const periods = getAllPeriods(branchesData);
      setAvailablePeriods(periods);
    }
  }, [branchesData]);

  // Charger les salles disponibles pour le centre sélectionné
  useEffect(() => {
    if (selectedBranch && branchesData.length > 0) {
      const branchConfig = branchesData.find(b => b.name === selectedBranch);
      if (branchConfig && branchConfig.rooms) {
        // Générer la liste des salles : Salle 1, Salle 2, etc.
        const roomsList = [];
        for (let i = 1; i <= branchConfig.rooms; i++) {
          roomsList.push(`Salle ${i}`);
        }
        setAvailableRooms(roomsList);
        console.log(`🏢 ${selectedBranch} : ${branchConfig.rooms} salles disponibles`);
      } else {
        setAvailableRooms([]);
      }
    } else {
      setAvailableRooms([]);
    }
  }, [selectedBranch, branchesData]);

  useEffect(() => {
    loadTimeOffset();
    loadGlobalSettings();
  }, []);

  // Défilement automatique pour l'affichage public
  useEffect(() => {
    if ((view !== 'public' && view !== 'display') || !selectedBranch) return;

    const scrollContainer = document.getElementById('sessions-scroll-container');
    if (!scrollContainer) return;

    // Vérifier si le contenu dépasse le conteneur
    const needsScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
    setShouldAutoScroll(needsScroll);

    if (!needsScroll) {
      // Si pas besoin de scroll, remonter en haut
      scrollContainer.scrollTop = 0;
      return;
    }

    let scrollDirection = 1; // 1 = vers le bas, -1 = vers le haut
    let scrollSpeed = 0.5; // pixels par frame
    let pauseTime = 3000; // pause en millisecondes en haut/bas
    let isPaused = false;
    let pauseTimeout = null;

    const autoScroll = () => {
      if (isPaused) return;

      const currentScroll = scrollContainer.scrollTop;
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;

      // Atteint le bas
      if (currentScroll >= maxScroll - 5 && scrollDirection === 1) {
        isPaused = true;
        pauseTimeout = setTimeout(() => {
          scrollDirection = -1;
          isPaused = false;
        }, pauseTime);
        return;
      }

      // Atteint le haut
      if (currentScroll <= 5 && scrollDirection === -1) {
        isPaused = true;
        pauseTimeout = setTimeout(() => {
          scrollDirection = 1;
          isPaused = false;
        }, pauseTime);
        return;
      }

      // Défiler
      scrollContainer.scrollTop += scrollSpeed * scrollDirection;
      setScrollPosition(scrollContainer.scrollTop);
    };

    const intervalId = setInterval(autoScroll, 16); // ~60fps

    return () => {
      clearInterval(intervalId);
      if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [view, selectedBranch, sessions]);

  // Load messages from Firebase
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const docRef = doc(db, 'settings', 'publicTodayMessages');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAllMessages(docSnap.data().messages || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };

    loadMessages();

    // Listen for announcement triggers
    const unsubscribe = onSnapshot(
      collection(db, 'announcement_trigger'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const triggerData = change.doc.data();
            setCurrentMessage({
              text: triggerData.text,
              createdAt: triggerData.createdAt
            });
            setShowMessage(true);

            // Hide message after 1 minute (60000ms)
            const hideTimeout = setTimeout(() => {
              setShowMessage(false);
            }, 60000);

            // Delete the trigger doc after 1 minute
            const deleteTimeout = setTimeout(() => {
              deleteDoc(doc(db, 'announcement_trigger', change.doc.id)).catch(err =>
                console.error('Erreur suppression trigger:', err)
              );
            }, 65000);

            return () => {
              clearTimeout(hideTimeout);
              clearTimeout(deleteTimeout);
            };
          }
        });
      }
    );

    return () => unsubscribe();
  }, []);

  // Display message every 15 minutes for 1 minute
  useEffect(() => {
    if (allMessages.length === 0) return;

    // Show message immediately on first load
    const randomMessage = allMessages[Math.floor(Math.random() * allMessages.length)];
    setCurrentMessage(randomMessage);
    setShowMessage(true);

    // Hide message after 1 minute
    const hideTimeout = setTimeout(() => {
      setShowMessage(false);
    }, 60000); // 1 minute

    // Show new message every 15 minutes
    const intervalId = setInterval(() => {
      const newRandomMessage = allMessages[Math.floor(Math.random() * allMessages.length)];
      setCurrentMessage(newRandomMessage);
      setShowMessage(true);

      setTimeout(() => {
        setShowMessage(false);
      }, 60000); // 1 minute
    }, 900000); // 15 minutes

    return () => {
      clearTimeout(hideTimeout);
      clearInterval(intervalId);
    };
  }, [allMessages]);

  // ========== HANDLERS ==========
  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setIsAdmin(true);
      setView('admin');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const addOrUpdateSession = async () => {
    if (!selectedBranch) {
      alert('Veuillez sélectionner une filiale');
      return;
    }

    // Vérifier qu'au moins un niveau est sélectionné
    if (!formData.levels || formData.levels.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins un niveau');
      return;
    }

    // Vérifier que le groupe est sélectionné (OBLIGATOIRE)
    if (!formData.groupe || formData.groupe.trim() === '') {
      alert('⚠️ Veuillez sélectionner un groupe');
      return;
    }

    const branchSessions = sessions[selectedBranch] || [];

    if (editingSession) {
      // MODE ÉDITION : Mettre à jour la session existante
      // On garde un seul niveau pour l'édition (le premier sélectionné)
      const sessionToCheck = {
        ...formData,
        level: formData.levels[0], // Utiliser le premier niveau pour la compatibilité
        id: editingSession.id,
        period: periodMode
      };

      if (hasConflicts(sessions, sessionToCheck, selectedBranch)) {
        alert('⛔ Impossible d\'enregistrer : Des conflits critiques ont été détectés.\n\n' +
              'Veuillez résoudre les conflits affichés en rouge avant de sauvegarder.');
        return;
      }

      const updatedSession = {
        ...formData,
        level: formData.levels.join(' + '), // Combiner les niveaux : "1BAC + 2BAC"
        groupe: formData.groupe,  // 📌 Ajouter explicitement le groupe
        filiale: selectedBranch,  // 📌 SYNC: Ajouter centre/filiale
        id: editingSession.id,
        period: periodMode
      };

      const updatedSessions = branchSessions.map(s => 
        s.id === editingSession.id ? updatedSession : s
      );

      await saveBranchData(selectedBranch, updatedSessions);
      
    } else {
      // MODE AJOUT : Créer une session par niveau
      const sessionsToAdd = [];

      for (const level of formData.levels) {
        const sessionToCheck = {
          ...formData,
          level: level,
          id: `${Date.now()}-${level}`,
          period: periodMode
        };

        if (hasConflicts(sessions, sessionToCheck, selectedBranch)) {
          alert(`⛔ Conflit détecté pour ${level}.\n\nVeuillez résoudre les conflits avant de sauvegarder.`);
          return;
        }

        sessionsToAdd.push({
          ...formData,
          level: level,
          groupe: formData.groupe,  // 📌 Ajouter explicitement le groupe
          filiale: selectedBranch,  // 📌 SYNC: Ajouter centre/filiale
          id: `${Date.now()}-${level}`,
          period: periodMode
        });
      }

      const updatedSessions = [...branchSessions, ...sessionsToAdd];
      await saveBranchData(selectedBranch, updatedSessions);

      alert(`✅ ${sessionsToAdd.length} cours créé(s) avec succès !`);
    }
    
    setFormData(formInitialState);
    setEditingSession(null);
    setShowAddForm(false);
  };

  const addExceptionalSession = async (exceptionalSession) => {
    if (!selectedBranch) {
      alert('Veuillez sélectionner une filiale');
      return;
    }

    const branchSessions = sessions[selectedBranch] || [];
    const updatedSessions = [...branchSessions, exceptionalSession];

    // Sauvegarder immédiatement dans Firebase
    await saveBranchData(selectedBranch, updatedSessions);
    
    setShowExceptionalSession(false);
    alert('✅ Séance exceptionnelle ajoutée avec succès !');
  };

  const deleteSession = async (id) => {
    if (confirm('Confirmer la suppression ?')) {
      const branchSessions = sessions[selectedBranch] || [];
      const updatedSessions = branchSessions.filter(s => s.id !== id);
      
      // Sauvegarder immédiatement dans Firebase
      await saveBranchData(selectedBranch, updatedSessions);
    }
  };

  const editSession = (session) => {
    // Convertir level en tableau levels
    const levelsArray = session.level ? session.level.split(' + ') : [];
    
    setFormData({
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      levels: levelsArray, // Convertir en tableau
      subject: session.subject,
      groupe: session.groupe || '', // 📌 AJOUTER: Charger le groupe existant
      professor: session.professor,
      room: session.room,
      status: session.status,
      makeupDate: session.makeupDate || '',
      makeupTime: session.makeupTime || '',
      period: session.period || null
    });
    setPeriodMode(session.period || null);
    setEditingSession(session);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTodaySessionsForDisplay = () => {
  const branchSessions = sessions[selectedBranch] || [];
  const today = currentTime.toISOString().split('T')[0];
  
  // 🆕 CORRECTION : Détection de la période active POUR CETTE BRANCHE SPÉCIFIQUE
  const branchDataForPeriod = branchesData.find(b => b.name === selectedBranch);
  let activePeriodId = null;
  
  if (branchDataForPeriod && branchDataForPeriod.exceptionalPeriods) {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Chercher période active DANS CETTE BRANCHE UNIQUEMENT
    const activePeriod = branchDataForPeriod.exceptionalPeriods.find(period => {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      const isActive = todayDate >= startDate && todayDate <= endDate;
      
      return isActive;
    });

    activePeriodId = activePeriod ? activePeriod.id : null;
  }

  // Filtrer par période AVANT de filtrer par date
  const periodFilteredSessions = filterSessionsByPeriod(branchSessions, activePeriodId);

  // Filtrer avec les règles intelligentes
  const todaySessions = filterSessionsForDate(periodFilteredSessions, today);

  // Trier par heure
  let sorted = todaySessions.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // MASQUER LES COURS TERMINÉS sur l'affichage étudiant
  if (view === 'display') {
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();
    const currentMinutes = currentH * 60 + currentM;

    sorted = sorted.filter(session => {
      const [endH, endM] = session.endTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;

      // Masquer tous les cours terminés (peu importe leur statut)
      // Statuts spéciaux redeviennent 'normal' après la fin
      return currentMinutes < endMinutes;
    });
  }
  
  // Pour l'affichage public/display : TOUTES les séances actives (pas de limite)
  // Pour l'admin : limiter à 6 séances pour ne pas surcharger
  return (view === 'public' || view === 'display') ? sorted : sorted.slice(0, 6);
};


  const isSessionOngoing = (session) => {
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const [endHour, endMin] = session.endTime.split(':').map(Number);
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();

    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // EN COURS si : (début <= maintenant) ET (maintenant < fin)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const getSessionStatus = (session) => {
    const [startHour, startMin] = session.startTime.split(':').map(Number);
    const [endHour, endMin] = session.endTime.split(':').map(Number);
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();

    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Vérifier d'abord si la séance est terminée
    if (currentMinutes >= endMinutes) {
      // Si terminée, retourner 'finished' indépendamment du statut
      return 'finished';
    }

    // Avant la fin : utiliser les statuts manuels
    if (session.status === 'cancelled' || session.status === 'delayed' || session.status === 'absent') {
      return session.status;
    }

    // EN COURS si l'heure actuelle est entre le début et la fin
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return 'ongoing';
    }

    // PRÉVU si avant le début
    return 'normal';
  };

  const formatTime = (time) => {
    return time;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text;
  };

  // ========== ÉCRAN DE LOGIN ==========
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">INTELLECTION</h1>
            <h2 className="text-2xl font-semibold text-blue-200 mb-2">CLASSBOARD</h2>
            <p className="text-blue-300 text-sm">Système d'affichage dynamique</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setView('display')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Monitor className="w-5 h-5" />
              Affichage Étudiant
            </button>

            <button
              onClick={() => setView('adminLogin')}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-4 rounded-lg font-semibold transition-all border border-white/30 flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Interface Administrateur
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== ÉCRAN DE LOGIN ADMIN ==========
  if (view === 'adminLogin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
          <button
            onClick={() => setView('login')}
            className="text-blue-200 hover:text-white mb-6 flex items-center gap-2"
          >
            ← Retour
          </button>
          
          <div className="text-center mb-8">
            <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Authentification</h2>
            <p className="text-blue-200">Accès réservé aux administrateurs</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-white/10 border border-white/30 text-white placeholder-blue-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Se connecter
            </button>

            <p className="text-xs text-blue-300 text-center mt-4">
              Mot de passe par défaut: admin
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========== ÉCRAN D'AFFICHAGE ÉTUDIANT ==========
  if (view === 'display') {
    return (
      <div className="min-h-screen bg-blue-950 text-white overflow-hidden">
        {!isFullscreen && (
          <button
            onClick={() => setView('login')}
            className="absolute top-2 right-2 text-blue-300 hover:text-white text-xs z-50 bg-black/20 px-2 py-1 rounded"
          >
            ← Retour
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          className="absolute top-2 left-2 text-blue-300 hover:text-white text-xs z-50 bg-black/20 px-3 py-2 rounded flex items-center gap-2"
        >
          <Maximize className="w-4 h-4" />
          {isFullscreen ? 'Quitter' : 'Plein écran'}
        </button>

        {!selectedBranch ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-8">Sélectionnez votre filiale</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branches.map(branch => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className="bg-blue-800 hover:bg-blue-700 px-8 py-6 rounded-xl font-semibold text-xl transition-all transform hover:scale-105"
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-screen flex flex-col">
            <div className="bg-black py-4 px-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-white tracking-wide">INTELLECTION CLASSBOARD</h1>
                <div className="text-2xl font-bold text-yellow-400 tracking-wide">{selectedBranch}</div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white tracking-wider font-mono">
                  {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Publicité Application Mobile */}
            <AppAdvertisement />

            <div className="bg-blue-700 py-2 px-6">
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold tracking-wide">
                  SÉANCES DU {daysOfWeek.find(d => d.value === currentTime.getDay())?.label.toUpperCase()}
                </div>
                <div className="text-lg">
                  {currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="bg-blue-800 py-2 px-6">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold tracking-wider">
                <div className="col-span-2">HORAIRE</div>
                <div className="col-span-2">FILIÈRE</div>
                <div className="col-span-2">MATIÈRE</div>
                <div className="col-span-2">PROFESSEUR</div>
                <div className="col-span-2">SALLE</div>
                <div className="col-span-2">STATUT</div>
              </div>
            </div>

            {showMessage && currentMessage && (
              <>
                {/* URGENT Banner */}
                <style>{`
                  @keyframes urgentFlash {
                    0%, 100% { background-color: rgb(220, 38, 38); }
                    50% { background-color: rgb(153, 27, 27); }
                  }
                  @keyframes shimmer {
                    0% { box-shadow: -1000px 0 100px rgba(255, 255, 255, 0.5); }
                    100% { box-shadow: 1000px 0 100px rgba(255, 255, 255, 0.5); }
                  }
                  .urgent-banner {
                    animation: urgentFlash 0.8s infinite, shimmer 2s infinite;
                  }
                `}</style>
                <div className="urgent-banner bg-red-700 border-t-4 border-b-4 border-yellow-400 py-4 px-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-0 w-full h-full" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.05) 2px, rgba(255,255,255,.05) 4px)'
                    }}></div>
                  </div>
                  <div className="relative flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <Bell className="w-10 h-10 text-yellow-300 animate-bounce" />
                      <Bell className="w-10 h-10 text-yellow-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <Bell className="w-10 h-10 text-yellow-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-5xl font-black text-yellow-300 tracking-widest drop-shadow-lg">
                      URGENT
                    </span>
                    <div className="flex items-center gap-2">
                      <Bell className="w-10 h-10 text-yellow-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
                      <Bell className="w-10 h-10 text-yellow-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <Bell className="w-10 h-10 text-yellow-300 animate-bounce" />
                    </div>
                  </div>
                </div>

                {/* Message Banner */}
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b-2 border-yellow-500 py-8 px-8 text-center relative">
                  <p className="text-white font-bold text-3xl mb-6 leading-relaxed drop-shadow-lg">
                    {currentMessage.text}
                  </p>
                  <div className="border-t border-gray-700 pt-4 mt-4 flex items-center justify-center gap-8">
                    <p className="text-gray-300 text-sm">
                      {currentMessage.createdAt}
                    </p>
                    <p className="text-yellow-400 text-lg font-bold italic">
                      — l'administration
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMessage(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 p-2 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </>
            )}

            <div 
              className="flex-1 overflow-hidden relative"
              style={{ scrollBehavior: 'auto' }}
            >
              <div 
                id="sessions-scroll-container"
                className="h-full overflow-y-auto"
              >
                {getTodaySessionsForDisplay().length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-blue-300 text-2xl">
                      AUCUNE SÉANCE PROGRAMMÉE POUR CE {daysOfWeek.find(d => d.value === currentTime.getDay())?.label.toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-blue-800/50">{getTodaySessionsForDisplay().map((session, idx) => {
                    const status = getSessionStatus(session);
                    const statusInfo = statuses.find(s => s.value === status);
                    const isOngoing = status === 'ongoing';
                    const isExceptional = session.isExceptional;

                    return (
                      <div
                        key={session.id}
                        className={`py-2.5 px-6 transition-all duration-300 ${statusInfo?.bg} ${
                          isOngoing ? 'border-l-8 border-green-400' : ''
                        } ${isExceptional ? 'border-r-8 border-purple-500' : ''} animate-slideDown opacity-0`}
                        style={{ 
                          animation: `slideDown 0.5s ease-out ${idx * 0.15}s forwards`,
                        }}
                      >
                        <div className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-2 text-lg font-bold font-mono break-words">
                            <div>{formatTime(session.startTime)}</div>
                            <div className="text-xs text-gray-400 mt-0.5">→ {formatTime(session.endTime)}</div>
                            {isExceptional && (
                              <div className="text-xs font-bold text-purple-300 mt-0.5">
                                {session.reason === 'makeup' && '🔄 RATTRAPAGE'}
                                {session.reason === 'extra' && '➕ EXTRA'}
                                {session.reason === 'exam' && '📝 EXAMEN'}
                                {session.reason === 'makeup_student' && '👥 RATTRAPAGE'}
                                {session.reason === 'other' && '📌 SPÉCIAL'}
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 text-sm font-semibold break-words leading-tight">
                            {session.level}
                          </div>
                          <div className="col-span-2 text-sm break-words leading-tight">
                            <div>{session.subject}</div>
                            {session.groupe && (
                              <div className="text-xs text-blue-500 font-medium mt-0.5">
                                {session.groupe}
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 text-sm break-words leading-tight">
                            {session.professor}
                          </div>
                          <div className="col-span-2 text-lg font-bold text-yellow-400 break-words">
                            {session.room}
                          </div>
                          <div className="col-span-2">
                            <div className={`text-sm font-bold ${statusInfo?.color} break-words leading-tight`}>
                              {statusInfo?.label}
                            </div>
                            {session.status === 'absent' && session.makeupDate && (
                              <div className="text-xs text-yellow-300 mt-1 break-words">
                                RATTRAPAGE: {new Date(session.makeupDate).toLocaleDateString('fr-FR')} à {formatTime(session.makeupTime)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
              
              {/* Indicateur de défilement */}
              {shouldAutoScroll && (
                <div className="absolute bottom-4 right-4 bg-blue-900/80 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Défilement automatique
                </div>
              )}
            </div>

            {adminMessage && (
              <div className="bg-red-600 text-white py-2 px-4 overflow-hidden relative">
                <div className="flex items-center gap-2 whitespace-nowrap animate-scroll">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-base font-semibold tracking-wide">
                      {adminMessage.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-20">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-base font-semibold tracking-wide">
                      {adminMessage.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <style>{`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              @keyframes scroll {
                0% {
                  transform: translateX(100%);
                }
                100% {
                  transform: translateX(-100%);
                }
              }
              
              .animate-scroll {
                animation: scroll 20s linear infinite;
              }
            `}</style>
          </div>
        )}
      </div>
    );
  }

  // ========== INTERFACE ADMIN ==========
  // Si on est sur le dashboard
  if (view === 'dashboard') {
    return <Dashboard sessions={sessions} onBack={() => setView('admin')} />;
  }

  // Si on est sur le tableau de discipline
  if (showDisciplineBoard) {
    return (
      <DisciplineBoard
        sessions={sessions}
        branches={branchesData}
        selectedBranch={selectedBranch}
        onBack={() => setShowDisciplineBoard(false)}
      />
    );
  }

  // Si on est sur la gestion des messages
  if (showMessageManager) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setShowMessageManager(false)}
            className="mb-6 flex items-center gap-2 text-blue-900 hover:text-blue-700 font-semibold"
          >
            <X className="w-5 h-5" />
            Retour
          </button>
          <MessageManager />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">INTELLECTION CLASSBOARD</h1>
            <p className="text-blue-200 text-sm">Interface de gestion</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBranchManager(true)}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Building2 className="w-4 h-4" />
              Gérer Filiales
            </button>
            <button
onClick={() => setShowAvailableRooms(true)}
  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all"
>
  <MapPin className="w-5 h-5" />
  Vérifier les Salles Disponibles
</button>
            <button
              onClick={() => setShowSettingsManager(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Sliders className="w-4 h-4" />
              Profs, Niveaux Profs & Niveaux Matières
            </button>
            <button
              onClick={() => setShowProfessorSettings(true)}
              className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <BookOpen className="w-4 h-4" />
              Professeurs - Cours Individuels
            </button>
            <button
              onClick={() => setShowStudentIndividualLessons(true)}
              className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Users className="w-4 h-4" />
              Étudiants - Accès Cours Individuels
            </button>

            <button
              onClick={() => setShowMessageManager(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Gestion des Messages
            </button>
            <button
              onClick={() => setView('dashboard')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setShowThermalPrint(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Ticket Thermique
            </button>
            <button
              onClick={() => setShowPDFExport(true)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <FileDown className="w-4 h-4" />
              📄 Export PDF
            </button>
            <button
              onClick={() => setShowDisciplineBoard(true)}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              📊 Discipline
            </button>
            <button
              onClick={() => setShowTimeSettings(!showTimeSettings)}
              className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Clock className="w-4 h-4" />
              Régler l'heure
            </button>
            <button
              onClick={() => {
                setView('login');
                setIsAuthenticated(false);
                setPassword('');
              }}
              className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {showTimeSettings && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Réglage de l'heure</h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Heure système: {new Date().toLocaleTimeString('fr-FR')}
              </div>
              <div className="text-sm text-gray-600">
                Heure affichée: {currentTime.toLocaleTimeString('fr-FR')}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Décalage (minutes):</label>
                <input
                  type="number"
                  value={timeOffset}
                  onChange={(e) => saveTimeOffset(parseInt(e.target.value) || 0)}
                  className="border border-gray-300 rounded px-3 py-1 w-20 text-sm"
                  placeholder="0"
                />
              </div>
              <button
                onClick={() => saveTimeOffset(0)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {!selectedBranch ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Sélectionnez une filiale</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {branches.map(branch => (
                <button
                  key={branch}
                  onClick={() => setSelectedBranch(branch)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-8 rounded-xl font-semibold text-xl transition-all transform hover:scale-105"
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedBranch('')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Changer de filiale
                </button>
                <div className="text-xl font-bold text-gray-800">{selectedBranch}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Message administratif</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Message à afficher en bas de l'écran étudiant..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => saveBranchData(selectedBranch, sessions[selectedBranch] || [])}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Emploi du temps hebdomadaire</h2>
                  <p className="text-gray-600 text-sm mt-1">Les séances se répètent chaque semaine automatiquement</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExceptionalSession(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all"
                  >
                    <Calendar className="w-5 h-5" />
                    Séance Exceptionnelle
                  </button>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all"
                  >
                    {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showAddForm ? 'Annuler' : 'Nouvelle séance'}
                  </button>
                </div>
              </div>

              {showAddForm && (
                <div className="bg-blue-50 p-6 rounded-xl mb-6 border border-blue-200">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">
                    {editingSession ? 'Modifier la séance' : 'Ajouter une séance récurrente'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Cette séance se répétera automatiquement chaque semaine
                  </p>
                  
                  {/* Sélecteur de période */}
                  <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <Moon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={periodMode !== null}
                              onChange={(e) => {
                                if (e.target.checked && availablePeriods.length > 0) {
                                  // Sélectionner automatiquement la première période
                                  setPeriodMode(availablePeriods[0].id);
                                } else {
                                  setPeriodMode(null);
                                }
                              }}
                              className="w-5 h-5 text-purple-600"
                            />
                            <span className="font-bold text-purple-900 text-lg">
                              Saisir pour une période exceptionnelle
                            </span>
                          </label>
                        </div>
                        
                        {periodMode === null ? (
                          <p className="text-sm text-purple-700">
                            📅 Mode Normal : Cette séance sera active toute l'année (sauf pendant les périodes exceptionnelles)
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-purple-900">Période :</label>
                              <select
                                value={periodMode || ''}
                                onChange={(e) => setPeriodMode(e.target.value || null)}
                                className="border-2 border-purple-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
                              >
                                {availablePeriods.map(period => (
                                  <option key={period.id} value={period.id}>
                                    {getPeriodIcon(period.type)} {period.name} ({new Date(period.startDate).toLocaleDateString('fr-FR')} → {new Date(period.endDate).toLocaleDateString('fr-FR')})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
                              <p className="text-sm text-purple-900 font-medium">
                                ✨ Cette séance sera active UNIQUEMENT pendant {getPeriodName(branchesData, periodMode)}
                              </p>
                              <p className="text-xs text-purple-700 mt-1">
                                Elle apparaîtra automatiquement aux dates définies et sera masquée le reste de l'année.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {availablePeriods.length === 0 && (
                          <p className="text-sm text-purple-600 mt-2">
                            💡 Aucune période configurée. Créez-en une dans "Gestion des Filiales" pour saisir des emplois Ramadan, vacances, etc.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jour de la semaine</label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {daysOfWeek.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {statuses.filter(s => s.value !== 'ongoing').map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <MultiLevelSelect
                        levels={levels}
                        selectedLevels={formData.levels}
                        onChange={(selectedLevels) => setFormData({ ...formData, levels: selectedLevels })}
                      />
                      {levels.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Configurez d'abord les niveaux dans les paramètres
                        </p>
                      )}
                    </div>
                    <div>
                      <SearchableSelect
                        label="Matière"
                        options={subjects}
                        value={formData.subject}
                        onChange={(value) => setFormData({ ...formData, subject: value })}
                        placeholder={subjects.length > 0 ? "Sélectionner une matière" : "Aucune matière configurée"}
                        required
                      />
                      {subjects.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Configurez d'abord les matières dans les paramètres
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Groupe <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.groupe}
                        onChange={(e) => setFormData({ ...formData, groupe: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">-- Sélectionner un groupe --</option>
                        {Array.from({ length: maxGroups }, (_, i) => (
                          <option key={i + 1} value={`G${i + 1}`}>Groupe {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <SearchableSelect
                        label="Professeur"
                        options={professors}
                        value={formData.professor}
                        onChange={(value) => setFormData({ ...formData, professor: value })}
                        placeholder={professors.length > 0 ? "Sélectionner un professeur" : "Aucun professeur configuré"}
                        required
                      />
                      {professors.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Configurez d'abord les professeurs dans les paramètres
                        </p>
                      )}
                    </div>
                    <div>
                      <SearchableSelect
                        label="Salle"
                        options={availableRooms}
                        value={formData.room}
                        onChange={(value) => setFormData({ ...formData, room: value })}
                        placeholder={availableRooms.length > 0 ? "Sélectionner une salle" : "Aucune salle configurée"}
                      />
                      {availableRooms.length === 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Configurez d'abord les salles dans les paramètres (Gérer les filiales)
                        </p>
                      )}
                    </div>

                    {formData.status === 'absent' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date rattrapage (optionnel)</label>
                          <input
                            type="date"
                            value={formData.makeupDate}
                            onChange={(e) => setFormData({ ...formData, makeupDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Heure rattrapage (optionnel)</label>
                          <input
                            type="time"
                            value={formData.makeupTime}
                            onChange={(e) => setFormData({ ...formData, makeupTime: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Détecteur de conflits */}
                  <ConflictDetector
                    sessions={sessions}
                    currentSession={{
                      ...formData,
                      id: editingSession?.id,
                      period: periodMode
                    }}
                    currentBranch={selectedBranch}
                  />

                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={addOrUpdateSession}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingSession ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                    <button
                      onClick={() => {
                        setFormData(formInitialState);
                        setEditingSession(null);
                        setShowAddForm(false);
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              
              {/* Filtres de visualisation */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  Filtres d'affichage
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtre par période */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Afficher les sessions :
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setViewPeriodFilter(null)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          viewPeriodFilter === null
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        📊 Toutes les périodes
                      </button>
                      <button
                        onClick={() => setViewPeriodFilter('normal')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          viewPeriodFilter === 'normal'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'
                        }`}
                      >
                        📅 Emploi Normal
                      </button>
                      {availablePeriods.map(period => (
                        <button
                          key={period.id}
                          onClick={() => setViewPeriodFilter(period.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            viewPeriodFilter === period.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {getPeriodIcon(period.type)} {period.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Filtre par jour */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🗓️ Filtrer par jour :
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setViewDayFilter(null)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          viewDayFilter === null
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        Tous
                      </button>
                      {daysOfWeek.map(day => (
                        <button
                          key={day.value}
                          onClick={() => setViewDayFilter(day.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            viewDayFilter === day.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {day.label.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Statistiques filtrées */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-700">
                      Sessions affichées : 
                      <span className="ml-2 text-blue-600 font-bold text-lg">
                        {(() => {
                          let filtered = sessions[selectedBranch] || [];
                          
                          // Filtre par période
                          if (viewPeriodFilter === 'normal') {
                            filtered = filtered.filter(s => !s.period || s.period === null);
                          } else if (viewPeriodFilter) {
                            filtered = filtered.filter(s => s.period === viewPeriodFilter);
                          }
                          
                          // Filtre par jour
                          if (viewDayFilter !== null) {
                            filtered = filtered.filter(s => s.dayOfWeek === viewDayFilter);
                          }
                          
                          return filtered.length;
                        })()}
                      </span>
                    </span>
                    
                    {(viewPeriodFilter !== null || viewDayFilter !== null) && (
                      <button
                        onClick={() => {
                          setViewPeriodFilter(null);
                          setViewDayFilter(null);
                        }}
                        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition-all"
                      >
                        🔄 Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                </div>
              </div>

<div className="overflow-x-auto">
                <div className="mb-4 flex gap-2 flex-wrap">
                  {daysOfWeek.map(day => {
                    const daySessionsCount = (sessions[selectedBranch] || []).filter(s => s.dayOfWeek === day.value).length;
                    return (
                      <div key={day.value} className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="font-semibold text-gray-800">{day.label}</span>
                        <span className="ml-2 text-sm text-gray-600">({daySessionsCount} séance{daySessionsCount > 1 ? 's' : ''})</span>
                      </div>
                    );
                  })}
                </div>
                
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Jour</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Horaire</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Filière</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Matière</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Professeur</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Salle</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      let filtered = sessions[selectedBranch] || [];
                      
                      // Filtre par période
                      if (viewPeriodFilter === 'normal') {
                        filtered = filtered.filter(s => !s.period || s.period === null);
                      } else if (viewPeriodFilter) {
                        filtered = filtered.filter(s => s.period === viewPeriodFilter);
                      }
                      
                      // Filtre par jour
                      if (viewDayFilter !== null) {
                        filtered = filtered.filter(s => s.dayOfWeek === viewDayFilter);
                      }
                      
                      return filtered.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
                    })().map(session => (
                      <tr 
                        key={session.id} 
                        className={`hover:bg-gray-50 ${session.isExceptional ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {session.period && (
                              <span className="text-xs font-bold bg-purple-500 text-white px-2 py-1 rounded">
                                {getPeriodIcon(availablePeriods.find(p => p.id === session.period)?.type || 'autre')} {getPeriodName(branchesData, session.period)}
                              </span>
                            )}
                            {session.isExceptional && session.specificDate && (
                              <span className="text-purple-600 font-bold text-xs bg-purple-100 px-2 py-1 rounded">
                                📅 {new Date(session.specificDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            )}
                            {!session.isExceptional && (
                              <span>{daysOfWeek.find(d => d.value === session.dayOfWeek)?.label}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </td>
                        <td className="px-4 py-3 text-sm">{session.level}</td>
                        <td className="px-4 py-3 text-sm">{session.subject}</td>
                        <td className="px-4 py-3 text-sm">{session.professor}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{session.room}</td>
                        <td className="px-4 py-3 text-sm">
                          {session.isExceptional && session.reason && (
                            <div className="mb-1">
                              <span className="text-xs font-bold bg-purple-600 text-white px-2 py-1 rounded">
                                {session.reason === 'makeup' && '🔄 RATTRAPAGE'}
                                {session.reason === 'extra' && '➕ SUPPLÉMENTAIRE'}
                                {session.reason === 'exam' && '📝 EXAMEN'}
                                {session.reason === 'makeup_student' && '👥 RATTRAPAGE'}
                                {session.reason === 'other' && '📌 EXCEPTIONNEL'}
                              </span>
                            </div>
                          )}
                          <span className={`font-semibold ${statuses.find(s => s.value === session.status)?.color}`}>
                            {statuses.find(s => s.value === session.status)?.label}
                          </span>
                          {session.status === 'absent' && session.makeupDate && (
                            <div className="text-xs text-yellow-600 mt-1">
                              Rattrapage: {new Date(session.makeupDate).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDisciplineBoard(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-all"
                              title="Pointer présence/absence"
                            >
                              📍
                            </button>
                            <button
                              onClick={() => editSession(session)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSession(session.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de gestion des paramètres */}
      {showSettingsManager && (
        <SettingsManager
          onClose={() => {
            setShowSettingsManager(false);
            loadGlobalSettings(); // Recharger après modification
          }}
        />
      )}

      {/* Modal de gestion des cours individuels pour les profs */}
      {showProfessorSettings && (
        <ProfessorSettingsManager
          professors={professors}
          onClose={() => setShowProfessorSettings(false)}
        />
      )}

      {/* Modal de gestion de l'accès aux cours individuels pour les étudiants */}
      {showStudentIndividualLessons && (
        <StudentIndividualLessonsManager
          onClose={() => setShowStudentIndividualLessons(false)}
        />
      )}

{/* Modal Test Sons */}
{showSoundTester && (
  <SoundTester onClose={() => setShowSoundTester(false)} />
)}
{showAvailableRooms && (
  <>
    {console.log('📊 Données envoyées:', { sessions, branches, branchesData })}
    <AvailableRoomsViewer
      sessions={sessions}
      branches={branches}
      branchesData={branchesData}
      onClose={() => setShowAvailableRooms(false)}
    />
  </>
)}
{/* Modal Salles Libres */}
{showAvailableRooms && (
  <AvailableRoomsViewer
    sessions={sessions}
    branches={branches}
    branchesData={branchesData}
    onClose={() => setShowAvailableRooms(false)}
  />
)}

{/* Aperçu automatique des cours à venir */}
{view === 'display' && selectedBranch && (
  <UpcomingSessionsPreview
    sessions={sessions}
    branch={selectedBranch}
    currentTime={currentTime}
  />
)}
      {/* Modal de gestion des filiales */}
      {showBranchManager && (
        <BranchManager 
          onClose={() => setShowBranchManager(false)} 
        />
      )}

      {/* Modal de séance exceptionnelle */}
      {showExceptionalSession && (
        <ExceptionalSessionManager
          selectedBranch={selectedBranch}
          professors={professors}
          levels={levels}
          subjects={subjects}
          maxGroups={maxGroups}
          onAddSession={addExceptionalSession}
          onClose={() => setShowExceptionalSession(false)}
        />
        
      )}

      {/* Modal d'impression thermique */}
      {showThermalPrint && (
        <ThermalPrintSchedule
          sessions={sessions}
          branches={branches}
          branchesData={branchesData}
          onClose={() => setShowThermalPrint(false)}
        />
      )}

      {showPDFExport && (
        <PDFExportModal
          sessions={sessions}
          branches={branches}
          branchesData={branchesData}
          onClose={() => setShowPDFExport(false)}
        />
      )}

      {/* Modal de pointage présence */}
      {showPresenceModal && presenceRecord && (
        <ProfPresenceModal
          record={presenceRecord}
          onClose={() => {
            setShowPresenceModal(false);
            setPresenceRecord(null);
          }}
          onSuccess={() => {
            setShowPresenceModal(false);
            setPresenceRecord(null);
          }}
        />
      )}

    </div>
  );
};

export default ClassBoard;