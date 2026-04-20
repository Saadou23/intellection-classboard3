# 🏢 Guide Complet - Disponibilité des Salles

## Vue d'ensemble

Ce guide documente le système de gestion de la disponibilité des salles par centre. Trois fichiers clés ont été créés :

1. **RoomAvailabilityService.js** - Logique métier et calculs
2. **RoomAvailabilityViewer.jsx** - Interface utilisateur complète
3. **AvailableRoomsViewer.jsx** - Interface simple existante (conservée)

---

## 📊 Analyse de la fonction actuelle

### Composant existant: `AvailableRoomsViewer.jsx`

**Fonction clé:** `getOccupyingSessions(room)`

```javascript
const getOccupyingSessions = (room) => {
  const branchSessions = sessions[selectedBranch] || [];
  
  return branchSessions.filter(session => {
    if (session.dayOfWeek !== selectedDay) return false;
    
    const normalizedRoom = normalizeRoomName(session.room);
    if (normalizedRoom !== room) return false;
    
    // Filtrer par période
    if (selectedPeriod === 'normal') {
      if (session.period) return false;
    } else {
      if (session.period !== selectedPeriod) return false;
    }
    
    return timesOverlap(startTime, endTime, session.startTime, session.endTime);
  });
};
```

**Fonctionnalité:** 
- Retourne les sessions occupant une salle à un créneau spécifique
- Gère les périodes normales et exceptionnelles
- Détecte les chevauchements temporels

**Limite:** 
- Ne montre que l'occupation pour UN créneau donné (fenêtre de temps fixe)
- Ne liste pas tous les créneaux disponibles dans la journée

---

## 🆕 Nouveau Service: `RoomAvailabilityService.js`

### Fonctions principales

#### 1. **getAvailableSlots()**
Trouve TOUS les créneaux disponibles dans une journée pour une salle.

```javascript
import { getAvailableSlots } from './RoomAvailabilityService';

const slots = getAvailableSlots(
  sessions,           // Array de sessions
  'Salle 1',         // Nom de la salle
  1,                 // dayOfWeek (0=Dimanche, 1=Lundi...)
  'normal',          // période ('normal' ou ID de période)
  90                 // durée du créneau en minutes (optionnel)
);

// Résultat:
// [
//   { start: '08:00', end: '09:30', duration: 90, available: true },
//   { start: '09:30', end: '11:00', duration: 90, available: true },
//   { start: '14:00', end: '15:30', duration: 90, available: true }
// ]
```

#### 2. **getRoomsByAvailability()**
Trie les salles par quantité de temps disponible.

```javascript
import { getRoomsByAvailability } from './RoomAvailabilityService';

const ranked = getRoomsByAvailability(
  sessions,
  rooms,            // Array: ['Salle 1', 'Salle 2', ...]
  1,                // dayOfWeek
  'normal'
);

// Résultat:
// [
//   {
//     room: 'Salle 5',
//     availableMinutes: 660,    // 11 heures libres (journée complète)
//     availableSlots: 7,
//     averageSlotDuration: 94
//   },
//   {
//     room: 'Salle 2',
//     availableMinutes: 450,    // 7h30 libres
//     availableSlots: 5,
//     averageSlotDuration: 90
//   }
// ]
```

#### 3. **getRoomAvailabilityByDay()**
Obtient l'availability complète pour toutes les salles un jour donné.

```javascript
import { getRoomAvailabilityByDay } from './RoomAvailabilityService';

const dayAvailability = getRoomAvailabilityByDay(
  sessions,
  ['Salle 1', 'Salle 2', 'Salle 3'],
  1,        // Lundi
  'normal'
);

// Résultat: Object avec {
//   'Salle 1': [ {start, end, duration} ... ],
//   'Salle 2': [ {start, end, duration} ... ],
//   'Salle 3': [ {start, end, duration} ... ]
// }
```

#### 4. **getWeeklyAvailability()**
Obtient l'availability pour une semaine complète.

```javascript
import { getWeeklyAvailability } from './RoomAvailabilityService';

const weeklyAvailability = getWeeklyAvailability(
  sessions,
  rooms,
  'normal'
);

// Résultat: Object avec {
//   'Dimanche': { 'Salle 1': [...], 'Salle 2': [...] },
//   'Lundi': { 'Salle 1': [...], 'Salle 2': [...] },
//   ...
//   'Samedi': { 'Salle 1': [...], 'Salle 2': [...] }
// }
```

#### 5. **isRoomAvailable()**
Vérification simple: une salle est-elle libre à un créneau donné?

```javascript
import { isRoomAvailable } from './RoomAvailabilityService';

const isFree = isRoomAvailable(
  sessions,
  'Salle 2',
  1,              // Lundi
  '14:00',        // Début
  '15:30',        // Fin
  'normal'
);

console.log(isFree); // true ou false
```

#### 6. **generateAvailabilityReport()**
Génère un rapport complet avec statistiques.

```javascript
import { generateAvailabilityReport } from './RoomAvailabilityService';

const report = generateAvailabilityReport(
  sessions,
  rooms,
  1,              // Lundi
  'Centre Casablanca'
);

// Résultat:
// {
//   branch: 'Centre Casablanca',
//   date: 'Lundi',
//   dayOfWeek: 1,
//   timestamp: '2026-04-05T...',
//   totalRooms: 5,
//   roomsByAvailability: [ { room, availableMinutes, ... } ],
//   detailledAvailability: { 'Salle 1': [...], ... },
//   summary: {
//     fullyAvailable: 2,      // 0 sessions = 0 occupation
//     partiallyAvailable: 2,  // 1+ sessions
//     unavailable: 1          // 100% occupée
//   }
// }
```

---

## 🎨 Nouveau Composant: `RoomAvailabilityViewer.jsx`

Interface professionnelle avec deux modes de visualisation.

### Utilisation

```jsx
import RoomAvailabilityViewer from './RoomAvailabilityViewer';

<RoomAvailabilityViewer
  sessions={sessions}           // Object: { 'Centre 1': [...], 'Centre 2': [...] }
  branches={['Centre 1', 'Centre 2']}
  branchesData={branchesData}   // Array avec field 'rooms' et 'exceptionalPeriods'
  onClose={() => setShowViewer(false)}
/>
```

### Fonctionnalités

#### Mode 1: Salles triées par disponibilité
- Affiche les salles classées du plus disponible au moins disponible
- Graphique de taux d'occupation
- Liste les premiers crénaux libres
- Statistiques complètes par salle

#### Mode 2: Timeline / Crénaux horaires
- Tableau de toutes les salles
- Crénaux disponibles par salle
- Temps libre total
- Durée moyenne des créneaux

### Filtres disponibles
- 🏢 Centre (Sélection du centre)
- 📆 Jour (Dimanche à Samedi)
- 📅 Période (Normal ou Périodes exceptionnelles)
- 👁️ Vue (Salles ou Timeline)

### Statistiques affichées
- Nombre de salles libres
- Nombre de salles partiellement libres
- Nombre de salles occupées
- Total de salles

---

## 📈 Exemples d'utilisation pratiques

### 1. Trouver la salle la plus disponible aujourd'hui

```javascript
const today = new Date().getDay();
const ranked = getRoomsByAvailability(sessions, rooms, today, 'normal');
const bestRoom = ranked[0]; // La plus disponible

console.log(`Meilleure salle: ${bestRoom.room} (${bestRoom.availableMinutes}min libres)`);
```

### 2. Afficher tous les créneaux disponibles pour une salle cette semaine

```javascript
import { getWeeklyAvailability } from './RoomAvailabilityService';

const weekly = getWeeklyAvailability(sessions, ['Salle 1'], 'normal');

Object.entries(weekly).forEach(([day, dayData]) => {
  console.log(`\n=== ${day} ===`);
  const slots = dayData['Salle 1'];
  slots.forEach(slot => {
    console.log(`  ✓ ${slot.start} - ${slot.end}`);
  });
});

// Résultat:
// === Lundi ===
//   ✓ 08:00 - 09:30
//   ✓ 10:00 - 11:30
//   ✓ 14:00 - 15:30
// === Mardi ===
//   ✓ 08:00 - 10:00
//   ...
```

### 3. Analyser l'utilisation d'un centre complet

```javascript
const report = generateAvailabilityReport(sessions, rooms, 1, 'Centre Rabat');

console.log(`
📊 Rapport - ${report.branch} (${report.date})
─────────────────────────────
✅ ${report.summary.fullyAvailable} salles entièrement libres
⚠️  ${report.summary.partiallyAvailable} salles partiellement libres
❌ ${report.summary.unavailable} salles occupées

Top 3 salles les plus disponibles:
${report.roomsByAvailability
  .slice(0, 3)
  .map((r, i) => `${i+1}. ${r.room}: ${r.availableMinutes}min`)
  .join('\n')}
`);
```

### 4. Trouver un créneau spécifique (ex: 14:00-15:30) disponible

```javascript
import { isRoomAvailable, getAllRoomsForBranch } from './RoomAvailabilityService';

const branch = branchesData.find(b => b.name === 'Centre Marrakech');
const allRooms = getAllRoomsForBranch(branch);
const sessions = sessionsByBranch['Centre Marrakech'];

const availableAt14h = allRooms.filter(room =>
  isRoomAvailable(sessions, room, 1, '14:00', '15:30', 'normal')
);

console.log(`Salles disponibles lundi 14:00-15:30:`, availableAt14h);
// Résultat: ['Salle 1', 'Salle 3', 'Salle 5']
```

---

## 🔧 Intégration dans la codebase

### Ajouter le bouton dans Dashboard

```jsx
import RoomAvailabilityViewer from './RoomAvailabilityViewer';

const Dashboard = () => {
  const [showAvailability, setShowAvailability] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowAvailability(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        <Building2Icon className="w-4 h-4" />
        Disponibilité des Salles
      </button>

      {showAvailability && (
        <RoomAvailabilityViewer
          sessions={sessions}
          branches={branches}
          branchesData={branchesData}
          onClose={() => setShowAvailability(false)}
        />
      )}
    </>
  );
};
```

---

## 📝 Notes Techniques

### Normalization des noms de salles
Le service normalise automatiquement les noms de salles:
- `"Salle 1"` → `"Salle 1"`
- `"Room 1"` → `"Salle 1"`
- `"1"` → `"Salle 1"`

### Détection de chevauchements
Utilise une comparaison en minutes:
```
Chevauchement: début1 < fin2 AND fin1 > début2
```

### Heures de fonctionnement
Par défaut: **08:00 à 19:00** (11 heures)
Modifiable dans `getAvailableSlots()`: `dayStartMinutes`, `dayEndMinutes`

### Performance
- O(n*m) où n = sessions, m = salles
- Optimisé pour affichage temps réel
- Pas de requêtes Firebase asynchrones

---

## 🚀 Améliorations futures possibles

1. **Export en CSV/Excel** - Rapports pour direction
2. **Notifications** - Alerte si salle bloquée/libérée
3. **Prédictions** - Salles probablement libres demain
4. **Historique** - Graphiques d'utilisation sur 30j
5. **Suggestions** - Recommander meilleur jour/salle pour un créneau
6. **API REST** - Endpoint pour intégrations externes

---

## 📞 Support

Pour toute question ou amélioration, consultez les commentaires du code dans:
- `RoomAvailabilityService.js` (logique métier)
- `RoomAvailabilityViewer.jsx` (interface)
