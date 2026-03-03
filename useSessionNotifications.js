// useSessionNotifications.js - Hook pour détecter les changements et jouer des sons

import { useEffect, useRef } from 'react';
import SoundSystem from './SoundSystem';

const useSessionNotifications = (sessions, branch, currentTime, soundEnabled = true) => {
  const previousSessionsRef = useRef({});
  const previousStatusesRef = useRef({});
  const lastCheckRef = useRef(0);
  const lastMinuteRef = useRef(-1);
  const soundCooldownRef = useRef({});

  useEffect(() => {
    if (!soundEnabled || !branch) return;

    const now = Date.now();
    const currentMinute = currentTime.getHours() * 60 + currentTime.getMinutes();

    // Vérifier seulement une fois par minute (pas à chaque seconde)
    if (currentMinute === lastMinuteRef.current) return;
    lastMinuteRef.current = currentMinute;

    const branchSessions = sessions[branch] || [];

    // Détecter les changements de statut
    branchSessions.forEach(session => {
      const sessionKey = `${session.dayOfWeek}-${session.startTime}-${session.room}`;
      const previousStatus = previousStatusesRef.current[sessionKey];
      const currentStatus = session.status || 'normal';

      if (previousStatus && previousStatus !== currentStatus) {
        // Vérifier cooldown pour éviter les sons répétés rapides (oscillation)
        const soundKey = `${sessionKey}-${currentStatus}`;
        const lastSoundTime = soundCooldownRef.current[soundKey] || 0;
        const now = Date.now();

        // Ne rejouer le son que si 5 secondes se sont écoulées depuis la dernière fois
        if (now - lastSoundTime > 5000) {
          console.log(`🔔 Changement de statut détecté: ${previousStatus} → ${currentStatus}`, session);

          // Jouer le son correspondant
          switch (currentStatus) {
            case 'delayed':
              console.log('🎵 Playing delay sound');
              SoundSystem.playDelay();
              break;
            case 'absent':
              console.log('🎵 Playing absence sound');
              SoundSystem.playAbsence();
              break;
            case 'cancelled':
              console.log('🎵 Playing cancellation sound');
              SoundSystem.playCancellation();
              break;
            case 'ongoing':
              console.log('🎵 Playing notification sound');
              SoundSystem.playNotification();
              break;
            default:
              break;
          }

          soundCooldownRef.current[soundKey] = now;
        }
      }

      // Sauvegarder le statut actuel
      previousStatusesRef.current[sessionKey] = currentStatus;
    });

    // Détecter les nouvelles séances (30 min avant)
    branchSessions.forEach(session => {
      const [startHour, startMin] = session.startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const minutesUntil = startMinutes - currentMinute;

      // Si le cours est exactement à 30 min (entre 29.5 et 30.5 min)
      if (minutesUntil >= 29.5 && minutesUntil <= 30.5) {
        const sessionId = `${session.dayOfWeek}-${session.startTime}-${session.room}-${session.subject}`;
        const wasNotified = previousSessionsRef.current[`notified-${sessionId}`];

        if (!wasNotified) {
          console.log('🆕 Nouvelle séance dans 30 min:', session.subject);
          SoundSystem.playNewSession();
          previousSessionsRef.current[`notified-${sessionId}`] = true;
        }
      }
    });

    // Sauvegarder les séances actuelles
    previousSessionsRef.current[branch] = branchSessions;

  }, [sessions, branch, currentTime, soundEnabled]);

  return null;
};

export default useSessionNotifications;
