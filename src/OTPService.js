import { db } from './firebase';
import {
  collection, doc, addDoc, getDoc, getDocs,
  query, where, orderBy, Timestamp, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import * as OTPAuth from 'otpauth';

// ============================================================================
// TOTP Secret Generation and Validation
// ============================================================================

export function generateSecret() {
  const totp = new OTPAuth.TOTP({
    issuer: 'Intellection',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  return totp.secret.base32;
}

export function generateOTPAuthURL(secret, accountName) {
  const totp = new OTPAuth.TOTP({
    issuer: 'Intellection',
    label: encodeURIComponent(accountName || 'OTP User'),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  });
  return totp.toString();
}

export function validateOTP(secret, token) {
  try {
    if (!secret || !token) {
      console.error('❌ Secret ou token manquant:', { secret: !!secret, token: !!token });
      return false;
    }

    // Ensure token is a string and pad with zeros if needed
    const paddedToken = String(token).padStart(6, '0');

    console.log('🔐 Validation OTP:');
    console.log('  Secret length:', secret.length);
    console.log('  Token:', paddedToken);

    const totp = new OTPAuth.TOTP({
      issuer: 'Intellection',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });

    // Increase window to 3 to account for time sync issues (accepts codes from -90s to +90s)
    const delta = totp.validate({ token: paddedToken, window: 3 });
    console.log('  Delta:', delta, 'Result:', delta !== null);
    return delta !== null;
  } catch (e) {
    console.error('❌ OTP validation error:', e.message);
    return false;
  }
}

// ============================================================================
// User Management (OTP Users)
// ============================================================================

export async function createOTPUser({ name, role, email }) {
  if (!name || !role) throw new Error('Nom et rôle requis');
  const otpSecret = generateSecret();
  const docRef = await addDoc(collection(db, 'otp_users'), {
    name,
    role,
    email,
    otpSecret,
    isActive: true,
    createdAt: Timestamp.now()
  });
  await updateDoc(docRef, { id: docRef.id });
  return {
    id: docRef.id,
    name,
    role,
    email,
    otpSecret,
    isActive: true,
    createdAt: new Date()
  };
}

export async function getOTPUsers() {
  const snap = await getDocs(collection(db, 'otp_users'));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || new Date()
  }));
}

export async function getDirecteurs() {
  const q = query(
    collection(db, 'otp_users'),
    where('role', '==', 'directeur'),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || new Date()
  }));
}

export async function getAgents() {
  const q = query(
    collection(db, 'otp_users'),
    where('role', '==', 'agent'),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || new Date()
  }));
}

export async function toggleUserActive(userId, isActive) {
  await updateDoc(doc(db, 'otp_users', userId), { isActive });
}

export async function deleteOTPUser(userId) {
  await deleteDoc(doc(db, 'otp_users', userId));
}

export async function getOTPUser(userId) {
  const snap = await getDoc(doc(db, 'otp_users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ============================================================================
// Pointage Recording and Querying
// ============================================================================

export async function getLastPointage(directeurId) {
  const q = query(
    collection(db, 'pointages'),
    where('directeurId', '==', directeurId),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    ...data,
    timestamp: data.timestamp?.toDate?.() || new Date()
  };
}

export async function detectPointageType(directeurId) {
  const last = await getLastPointage(directeurId);
  if (!last) return 'entrée';

  const lastDate = last.timestamp;
  const today = new Date();

  const sameDay =
    lastDate.getFullYear() === today.getFullYear() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getDate() === today.getDate();

  if (!sameDay) return 'entrée';
  return last.type === 'entrée' ? 'sortie' : 'entrée';
}

export async function recordPointage({ directeurId, directeurName, agentId, agentName, type, zone, commentaire, computerId }) {
  const docRef = await addDoc(collection(db, 'pointages'), {
    directeurId,
    directeurName,
    validatedBy: agentId,
    agentName,
    type,
    zone: zone || '',
    commentaire: commentaire || '',
    timestamp: Timestamp.now(),
    computerId: computerId || '',
    isValid: true
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function getPointages({ startDate, endDate, directeurId } = {}) {
  let constraints = [];

  if (directeurId) {
    constraints.push(where('directeurId', '==', directeurId));
  }
  if (startDate) {
    const start = new Date(startDate);
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(start)));
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(end)));
  }

  constraints.push(orderBy('timestamp', 'desc'));

  const q = query(collection(db, 'pointages'), ...constraints);
  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toDate?.() || new Date()
  }));
}

// ============================================================================
// OTP Settings (geolocation config by branch/zone)
// ============================================================================

export async function loadOTPSettings() {
  try {
    const snap = await getDoc(doc(db, 'otp_settings', 'zones'));
    if (!snap.exists()) {
      return {
        'Hay Salam': { centerLat: 33.5731, centerLng: -7.5898, radiusMeters: 200 },
        'Doukkali': { centerLat: 33.5731, centerLng: -7.5898, radiusMeters: 200 },
        'Saada': { centerLat: 33.5731, centerLng: -7.5898, radiusMeters: 200 },
        workStartTime: '09:00'
      };
    }
    return snap.data();
  } catch (e) {
    console.error('Error loading OTP settings:', e);
    return {
      'Hay Salam': { centerLat: 33.5731, centerLng: -7.5898, radiusMeters: 200 },
      'Doukkali': { centerLat: 33.5731, centerLng: -7.5898, radiusMeters: 200 },
      'Saada': { centerLat: 33.5731, centerLng: -7.5898, radiusMeters: 200 },
      workStartTime: '09:00'
    };
  }
}

export async function saveOTPSettings(settings) {
  await setDoc(doc(db, 'otp_settings', 'zones'), {
    ...settings,
    updatedAt: Timestamp.now()
  });
}

// ============================================================================
// Work Hours Calculation
// ============================================================================

export function calculateWorkHours(pointagesList) {
  const byDirDay = {};

  pointagesList.forEach(p => {
    const d = p.timestamp;
    const dateKey = d.toISOString().split('T')[0];
    const key = `${p.directeurId}__${dateKey}`;

    if (!byDirDay[key]) {
      byDirDay[key] = {
        directeurId: p.directeurId,
        directeurName: p.directeurName,
        date: dateKey,
        records: []
      };
    }
    byDirDay[key].records.push(p);
  });

  return Object.values(byDirDay).map(({ directeurId, directeurName, date, records }) => {
    records.sort((a, b) => a.timestamp - b.timestamp);

    let totalMinutes = 0;
    let entreeTime = null;

    records.forEach(r => {
      if (r.type === 'entrée') {
        entreeTime = r.timestamp;
      } else if (r.type === 'sortie' && entreeTime) {
        totalMinutes += (r.timestamp - entreeTime) / 60000;
        entreeTime = null;
      }
    });

    const firstEntree = records.find(r => r.type === 'entrée');
    let retardMinutes = 0;

    if (firstEntree) {
      const t = firstEntree.timestamp;
      const work = new Date(date + 'T09:00:00');
      retardMinutes = Math.max(0, Math.round((t - work) / 60000));
    }

    return {
      directeurId,
      directeurName,
      date,
      heuresTravaillees: Math.round((totalMinutes / 60) * 10) / 10,
      retardMinutes,
      records
    };
  });
}

// ============================================================================
// Supervision Schedules
// ============================================================================

export async function createSupervisionSchedule({ directeurId, directeurName, centre, jours, heuresMin }) {
  const docRef = await addDoc(collection(db, 'supervision_schedules'), {
    directeurId,
    directeurName,
    centre,
    jours,
    heuresMin,
    createdAt: Timestamp.now()
  });
  await updateDoc(docRef, { id: docRef.id });
  return {
    id: docRef.id,
    directeurId,
    directeurName,
    centre,
    jours,
    heuresMin,
    createdAt: new Date()
  };
}

export async function getSupervisionSchedules() {
  const snap = await getDocs(collection(db, 'supervision_schedules'));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || new Date()
  }));
}

export async function deleteSupervisionSchedule(id) {
  await deleteDoc(doc(db, 'supervision_schedules', id));
}

export async function getPointagesForWeek(startDate, endDate) {
  const q = query(
    collection(db, 'pointages'),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate))
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toDate?.() || new Date()
  }));
}

// ============================================================================
// Device Fingerprinting (Computer Authentication)
// ============================================================================

async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateDeviceFingerprint() {
  try {
    const components = [
      // Browser info
      navigator.userAgent,
      navigator.language,
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',

      // Screen info
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      window.screen.pixelDepth,

      // Timezone & locale
      new Date().getTimezoneOffset(),

      // Canvas fingerprint
      getCanvasFingerprint(),

      // WebGL info
      getWebGLFingerprint()
    ].join('|');

    return await hashData(components);
  } catch (e) {
    console.error('Error generating fingerprint:', e);
    return null;
  }
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const text = 'Browser fingerprint';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText(text, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(text, 4, 17);
    return canvas.toDataURL().substring(0, 50);
  } catch (e) {
    return 'canvas-error';
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'webgl-unavailable';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    return 'webgl-available';
  } catch (e) {
    return 'webgl-error';
  }
}

export async function registerComputerFingerprint({ name, centreZone }) {
  if (!name || !centreZone) throw new Error('Nom et zone requis');

  const fingerprint = await generateDeviceFingerprint();
  if (!fingerprint) throw new Error('Impossible de générer l\'empreinte de l\'ordinateur');

  const docRef = await addDoc(collection(db, 'registered_computers'), {
    name,
    centreZone,
    fingerprint,
    isActive: true,
    createdAt: Timestamp.now(),
    lastUsedAt: null,
    computerId: generateRandomToken()
  });

  await updateDoc(docRef, { id: docRef.id });

  return {
    id: docRef.id,
    name,
    centreZone,
    fingerprint,
    isActive: true,
    createdAt: new Date(),
    lastUsedAt: null
  };
}

export async function getRegisteredComputers() {
  const snap = await getDocs(collection(db, 'registered_computers'));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || new Date(),
    lastUsedAt: d.data().lastUsedAt?.toDate?.() || null
  }));
}

export async function verifyComputerFingerprint() {
  try {
    const currentFingerprint = await generateDeviceFingerprint();
    if (!currentFingerprint) return { valid: false, computer: null };

    const q = query(
      collection(db, 'registered_computers'),
      where('fingerprint', '==', currentFingerprint),
      where('isActive', '==', true)
    );

    const snap = await getDocs(q);
    if (snap.empty) return { valid: false, computer: null };

    const computer = snap.docs[0];
    const computerData = computer.data();

    await updateDoc(doc(db, 'registered_computers', computer.id), {
      lastUsedAt: Timestamp.now()
    });

    return {
      valid: true,
      computer: {
        id: computer.id,
        ...computerData,
        createdAt: computerData.createdAt?.toDate?.() || new Date(),
        lastUsedAt: computerData.lastUsedAt?.toDate?.() || null
      }
    };
  } catch (e) {
    console.error('Computer verification error:', e);
    return { valid: false, computer: null };
  }
}

export async function revokeComputer(computerId) {
  await updateDoc(doc(db, 'registered_computers', computerId), { isActive: false });
}

function generateRandomToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
}


// ============================================================================
// Agent Pointage
// ============================================================================

export async function getLastAgentPointage(agentId) {
  const q = query(
    collection(db, 'agent_pointages'),
    where('agentId', '==', agentId),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    ...data,
    timestamp: data.timestamp?.toDate?.() || new Date()
  };
}

export async function detectAgentPointageType(agentId) {
  const last = await getLastAgentPointage(agentId);
  if (!last) return 'entrée';

  const lastDate = last.timestamp;
  const today = new Date();

  const sameDay =
    lastDate.getFullYear() === today.getFullYear() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getDate() === today.getDate();

  if (!sameDay) return 'entrée';
  return last.type === 'entrée' ? 'sortie' : 'entrée';
}

export async function recordAgentPointage({ agentId, agentName, type, zone, commentaire, computerId }) {
  const docRef = await addDoc(collection(db, 'agent_pointages'), {
    agentId,
    agentName,
    type,
    zone: zone || '',
    commentaire: commentaire || '',
    timestamp: Timestamp.now(),
    computerId: computerId || '',
    isValid: true
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function getAgentPointages({ startDate, endDate, agentId } = {}) {
  try {
    let constraints = [];

    if (agentId) {
      constraints.push(where('agentId', '==', agentId));
    }

    constraints.push(orderBy('timestamp', 'desc'));

    const q = query(collection(db, 'agent_pointages'), ...constraints);
    let snap = await getDocs(q);

    let records = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.() || new Date()
    }));

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() + 86400000 : Date.now();

      records = records.filter(r => {
        const t = r.timestamp.getTime();
        return t >= start && t <= end;
      });
    }

    return records;
  } catch (e) {
    console.error('Error getting agent pointages:', e);
    return [];
  }
}

export function calculateAgentWorkHours(pointagesList) {
  const byAgentDay = {};

  pointagesList.forEach(p => {
    const d = p.timestamp;
    const dateKey = d.toISOString().split('T')[0];
    const key = `${p.agentId}__${dateKey}`;

    if (!byAgentDay[key]) {
      byAgentDay[key] = {
        agentId: p.agentId,
        agentName: p.agentName,
        date: dateKey,
        records: []
      };
    }
    byAgentDay[key].records.push(p);
  });

  return Object.values(byAgentDay).map(({ agentId, agentName, date, records }) => {
    records.sort((a, b) => a.timestamp - b.timestamp);

    let totalMinutes = 0;
    let entreeTime = null;

    records.forEach(r => {
      if (r.type === 'entrée') {
        entreeTime = r.timestamp;
      } else if (r.type === 'sortie' && entreeTime) {
        totalMinutes += (r.timestamp - entreeTime) / 60000;
        entreeTime = null;
      }
    });

    const firstEntree = records.find(r => r.type === 'entrée');
    let retardMinutes = 0;

    if (firstEntree) {
      const t = firstEntree.timestamp;
      const work = new Date(date + 'T09:00:00');
      retardMinutes = Math.max(0, Math.round((t - work) / 60000));
    }

    return {
      agentId,
      agentName,
      date,
      heuresTravaillees: Math.round((totalMinutes / 60) * 10) / 10,
      retardMinutes,
      records
    };
  });
}

// ============================================================================
// Agent Work Schedules (Horaires de travail)
// ============================================================================

export async function saveAgentSchedule(agentId, schedule) {
  const scheduleDocRef = doc(db, 'agent_schedules', agentId);
  await setDoc(scheduleDocRef, {
    agentId,
    schedule,
    updatedAt: Timestamp.now()
  });
}

export async function getAgentSchedule(agentId) {
  const snap = await getDoc(doc(db, 'agent_schedules', agentId));
  if (!snap.exists()) {
    return {
      Monday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
      Tuesday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
      Wednesday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
      Thursday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
      Friday: { start: '09:00', end: '17:00', enabled: true, centre: 'Hay Salam' },
      Saturday: { start: '09:00', end: '17:00', enabled: false, centre: 'Hay Salam' },
      Sunday: { start: '09:00', end: '17:00', enabled: false, centre: 'Hay Salam' }
    };
  }
  return snap.data().schedule || {};
}

export async function getAllAgentSchedules() {
  const snap = await getDocs(collection(db, 'agent_schedules'));
  return snap.docs.map(d => ({
    agentId: d.id,
    ...d.data()
  }));
}

// ============================================================================
// Checkout Questions Management
// ============================================================================

export async function saveCheckoutQuestions(questions) {
  await setDoc(doc(db, 'otp_settings', 'checkout_questions'), {
    questions,
    updatedAt: Timestamp.now()
  });
}

export async function getCheckoutQuestions() {
  try {
    const snap = await getDoc(doc(db, 'otp_settings', 'checkout_questions'));
    if (!snap.exists()) return [];
    return snap.data().questions || [];
  } catch (e) {
    console.error('Error loading checkout questions:', e);
    return [];
  }
}

export async function saveCheckoutResponse(directeurId, directeurName, responses) {
  const docRef = await addDoc(collection(db, 'checkout_responses'), {
    directeurId,
    directeurName,
    responses,
    timestamp: Timestamp.now()
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

// ============================================================================
// Professor Salary Management
// ============================================================================

export async function saveProfessorSalary(professorId, professorName, month, amount) {
  try {
    const docRef = await addDoc(collection(db, 'professor_salaries'), {
      professorId,
      professorName,
      month,
      amount,
      status: 'pending',
      createdAt: Timestamp.now()
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (e) {
    console.error('Error saving professor salary:', e);
    throw e;
  }
}

export async function getProfessorSalariesByMonth(month) {
  try {
    // First try with index
    try {
      const q = query(
        collection(db, 'professor_salaries'),
        where('month', '==', month),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      console.log('✅ Salaires chargés avec index Firestore:', snap.docs.length);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (indexError) {
      // If index is missing, load all and filter in JavaScript
      console.log('⚠️ Index manquant, chargement alternatif...');
      const q = query(collection(db, 'professor_salaries'));
      const snap = await getDocs(q);
      const allSalaries = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter by month and sort
      const filtered = allSalaries
        .filter(s => s.month === month)
        .sort((a, b) => (b.createdAt?.toDate?.() || new Date(0)) - (a.createdAt?.toDate?.() || new Date(0)));

      console.log(`✅ Salaires filtrés pour ${month}:`, filtered.length);
      return filtered;
    }
  } catch (e) {
    console.error('❌ Erreur complète lors du chargement des salaires:', e);
    return [];
  }
}

export async function getProfessorPendingSalaries(professorId) {
  try {
    // First try with index
    try {
      const q = query(
        collection(db, 'professor_salaries'),
        where('professorId', '==', professorId),
        where('status', '==', 'pending'),
        orderBy('month', 'desc')
      );
      const snap = await getDocs(q);
      console.log('✅ Salaires en attente chargés avec index:', snap.docs.length);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (indexError) {
      // If index is missing, load all and filter in JavaScript
      console.log('⚠️ Index manquant, chargement alternatif...');
      const q = query(
        collection(db, 'professor_salaries'),
        where('professorId', '==', professorId)
      );
      const snap = await getDocs(q);
      const allSalaries = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter by status and sort
      const filtered = allSalaries
        .filter(s => s.status === 'pending')
        .sort((a, b) => b.month.localeCompare(a.month));

      console.log(`✅ Salaires en attente filtrés pour ${professorId}:`, filtered.length, filtered);
      return filtered;
    }
  } catch (e) {
    console.error('❌ Erreur complète lors du chargement des salaires en attente:', e);
    return [];
  }
}

export async function getProfessorSalaryById(salaryId) {
  try {
    const docRef = doc(db, 'professor_salaries', salaryId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.error('Error loading salary:', e);
    return null;
  }
}

export async function confirmSalaryCollection(salaryId, otpUser, comment = '') {
  try {
    const docRef = doc(db, 'professor_salaries', salaryId);
    await updateDoc(docRef, {
      status: 'collected',
      collectedAt: Timestamp.now(),
      collectedBy: otpUser,
      ...(comment && { comment })
    });
    return true;
  } catch (e) {
    console.error('Error confirming salary collection:', e);
    throw e;
  }
}

export async function getProfessorSalaryStats(professorId, year) {
  try {
    const q = query(
      collection(db, 'professor_salaries'),
      where('professorId', '==', professorId)
    );
    const snap = await getDocs(q);
    const salaries = snap.docs.map(d => d.data());

    const monthlyStats = {};
    salaries.forEach(s => {
      const [y, m] = s.month.split('-');
      if (y === year) {
        monthlyStats[m] = {
          amount: s.amount,
          status: s.status,
          collectedAt: s.collectedAt
        };
      }
    });

    return monthlyStats;
  } catch (e) {
    console.error('Error loading salary stats:', e);
    return {};
  }
}

export async function getProfessors() {
  try {
    const q = query(
      collection(db, 'otp_users'),
      where('role', '==', 'professor'),
      where('isActive', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() || new Date()
    }));
  } catch (e) {
    console.error('Error loading professors:', e);
    return [];
  }
}

export async function getOTPUserBySecret(otpInput) {
  try {
    const allUsers = await getOTPUsers();
    const validUsers = [];

    for (const user of allUsers) {
      if (validateOTP(user.otpSecret, otpInput)) {
        validUsers.push(user);
      }
    }

    return validUsers;
  } catch (e) {
    console.error('Error validating OTP:', e);
    return [];
  }
}
