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
    if (!secret || !token) return false;

    // Ensure token is a string and pad with zeros if needed
    const paddedToken = String(token).padStart(6, '0');

    const totp = new OTPAuth.TOTP({
      issuer: 'Intellection',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });

    // Increase window to 2 to account for time sync issues (accepts codes from -60s to +60s)
    const delta = totp.validate({ token: paddedToken, window: 2 });
    return delta !== null;
  } catch (e) {
    console.error('OTP validation error:', e);
    return false;
  }
}

// ============================================================================
// User Management (OTP Users)
// ============================================================================

export async function createOTPUser({ name, role, email }) {
  if (!name || !role) throw new Error('Nom et rôle requis');
  const secretKey = generateSecret();
  const docRef = await addDoc(collection(db, 'otp_users'), {
    name,
    role,
    email,
    secretKey,
    isActive: true,
    createdAt: Timestamp.now()
  });
  await updateDoc(docRef, { id: docRef.id });
  return {
    id: docRef.id,
    name,
    role,
    email,
    secretKey,
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
  await updateDoc(doc(db, 'otp_users', userId), { isActive: false });
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

export async function recordPointage({ directeurId, directeurName, agentId, agentName, type, zone, commentaire }) {
  const docRef = await addDoc(collection(db, 'pointages'), {
    directeurId,
    directeurName,
    validatedBy: agentId,
    agentName,
    type,
    zone: zone || '',
    commentaire: commentaire || '',
    timestamp: Timestamp.now(),
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
