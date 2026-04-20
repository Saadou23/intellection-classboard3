# 🔧 Guide d'Intégration - Disponibilité des Salles

## 📋 Vue d'ensemble

Ce guide montre comment intégrer le nouveau système de disponibilité des salles dans le Dashboard.js existant.

---

## 📁 Fichiers créés

```
src/
├── RoomAvailabilityService.js       ← Logique métier (15 fonctions)
├── RoomAvailabilityViewer.jsx       ← Interface utilisateur complète
├── RoomAvailabilityExamples.js      ← 10 exemples d'utilisation
├── ROOM_AVAILABILITY_GUIDE.md       ← Documentation complète
└── ROOM_AVAILABILITY_INTEGRATION.md ← Ce fichier
```

---

## 🚀 Intégration dans le Dashboard

### Étape 1: Importer le composant dans Dashboard.jsx

```jsx
// En haut du fichier Dashboard.jsx
import RoomAvailabilityViewer from './RoomAvailabilityViewer';
```

### Étape 2: Ajouter l'état pour contrôler l'affichage

```jsx
const Dashboard = () => {
  // ... autres états
  const [showRoomAvailability, setShowRoomAvailability] = useState(false);
  
  // ... rest of component
};
```

### Étape 3: Ajouter le bouton dans l'interface

**Localisation suggérée:** Zone des boutons d'action (près des autres boutons d'accès rapide)

```jsx
<div className="flex gap-2 mb-6">
  <button
    onClick={() => setShowRoomAvailability(true)}
    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
  >
    <Building2 className="w-5 h-5" />
    Disponibilité des Salles
  </button>
  
  {/* Autres boutons */}
</div>
```

> **Icône à importer:** `import { Building2 } from 'lucide-react';`

### Étape 4: Ajouter le composant modal au bas du Dashboard

```jsx
{showRoomAvailability && (
  <RoomAvailabilityViewer
    sessions={sessions}           // Object provenant du DataSyncService
    branches={branches}            // Array des noms de centres
    branchesData={branchesData}    // Array avec les configs des centres
    onClose={() => setShowRoomAvailability(false)}
  />
)}
```

---

## 📊 Exemple d'intégration complète (Dashboard.jsx)

```jsx
import React, { useState, useEffect } from 'react';
import { Building2, BarChart3 } from 'lucide-react';
import RoomAvailabilityViewer from './RoomAvailabilityViewer';

const Dashboard = () => {
  const [sessions, setSessions] = useState({});
  const [branches, setBranches] = useState([]);
  const [branchesData, setBranchesData] = useState([]);
  const [showRoomAvailability, setShowRoomAvailability] = useState(false);

  // ... autres logiques du Dashboard

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Tableau de Bord</h1>
        
        {/* Boutons d'action */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowRoomAvailability(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Building2 className="w-5 h-5" />
            Disponibilité des Salles
          </button>
          
          {/* Autres boutons */}
        </div>
      </div>

      {/* Contenu principal du Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vos cartes existantes */}
      </div>

      {/* Modal Disponibilité des Salles */}
      {showRoomAvailability && (
        <RoomAvailabilityViewer
          sessions={sessions}
          branches={branches}
          branchesData={branchesData}
          onClose={() => setShowRoomAvailability(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
```

---

## 🎯 Cas d'usage - Integration Avancée

### A. Ajouter un widget rapide au Dashboard

Afficher un aperçu des salles en urgence (les 3 plus disponibles):

```jsx
import { getRoomsByAvailability } from './RoomAvailabilityService';

const QuickRoomWidget = ({ sessions, branches, branchesData }) => {
  const today = new Date().getDay();
  const branch = branchesData[0]; // Premier centre
  const rooms = [];
  
  for (let i = 1; i <= branch.rooms; i++) {
    rooms.push(`Salle ${i}`);
  }

  const ranked = getRoomsByAvailability(
    sessions[branch.name] || [],
    rooms,
    today,
    'normal'
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold text-gray-800 mb-3">🏢 Salles disponibles</h3>
      <div className="space-y-2">
        {ranked.slice(0, 3).map((room, i) => (
          <div key={room.room} className="flex justify-between text-sm">
            <span className="text-gray-700">{room.room}</span>
            <span className="text-green-600 font-semibold">
              {Math.floor(room.availableMinutes / 60)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### B. Exporter un rapport PDF

```jsx
import { generateAvailabilityReport } from './RoomAvailabilityService';
import jsPDF from 'jspdf';

const exportReportPDF = (sessions, rooms, day, branchName) => {
  const report = generateAvailabilityReport(sessions, rooms, day, branchName);
  
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Rapport - Disponibilité des Salles`, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Centre: ${report.branch}`, 20, 40);
  doc.text(`Jour: ${report.date}`, 20, 50);
  
  let y = 70;
  report.roomsByAvailability.forEach((room, i) => {
    doc.text(
      `${i + 1}. ${room.room} - ${room.availableMinutes}min disponibles`,
      20,
      y
    );
    y += 10;
  });
  
  doc.save(`rapport-salles-${report.date}.pdf`);
};
```

### C. Intégration avec notifications temps réel

```jsx
import { useEffect } from 'react';
import { isRoomAvailable } from './RoomAvailabilityService';

const RoomMonitor = ({ sessions, room, day, startTime, endTime }) => {
  useEffect(() => {
    const checkAvailability = () => {
      const isAvailable = isRoomAvailable(
        sessions,
        room,
        day,
        startTime,
        endTime,
        'normal'
      );

      if (isAvailable) {
        console.log(`✅ ${room} est disponible pour ${startTime}-${endTime}`);
        // Envoyer notification
      } else {
        console.log(`❌ ${room} est occupée`);
      }
    };

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkAvailability, 30000);
    checkAvailability(); // Vérification immédiate

    return () => clearInterval(interval);
  }, [sessions, room, day, startTime, endTime]);

  return null;
};
```

---

## 🔌 API REST (Firebase Cloud Functions)

Si vous voulez exposer cela via API:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const { getAvailableSlots, getRoomsByAvailability } = require('./RoomAvailabilityService');

// Endpoint: GET /api/rooms/available?branch=Centre%20Casablanca&day=1&period=normal
exports.getAvailableRooms = functions.https.onRequest((req, res) => {
  const { branch, day, period } = req.query;
  const intDay = parseInt(day);

  // Récupérer les données depuis Firebase
  admin.firestore()
    .collection('sessions')
    .where('branch', '==', branch)
    .get()
    .then(snapshot => {
      const sessions = snapshot.docs.map(doc => doc.data());
      const rooms = [];
      
      // Construire liste des salles
      for (let i = 1; i <= 5; i++) rooms.push(`Salle ${i}`);

      const ranked = getRoomsByAvailability(
        sessions,
        rooms,
        intDay,
        period || 'normal'
      );

      res.json({
        success: true,
        branch,
        day: intDay,
        period: period || 'normal',
        rooms: ranked
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Endpoint: GET /api/rooms/:roomName/slots?day=1
exports.getRoomSlots = functions.https.onRequest((req, res) => {
  const { roomName } = req.params;
  const { day, period } = req.query;

  // Logique similaire...
});
```

---

## 📱 Utilisation sur mobile

Le composant `RoomAvailabilityViewer` est déjà responsive. Sur mobile:

```jsx
// Dans le composant
<div className="max-w-6xl">  {/* Limiteur de largeur */}
  <div className="max-h-[90vh]">  {/* Hauteur responsive */}
    {/* Contenu */}
  </div>
</div>
```

Classes Tailwind utilisées:
- `md:grid-cols-2` - 1 colonne sur mobile, 2 sur tablet
- `lg:grid-cols-3` - 3 colonnes sur desktop
- `max-h-[90vh]` - Utilise 90% de la hauteur visible

---

## ⚙️ Configuration avancée

### Changer les heures de fonctionnement

Dans `RoomAvailabilityService.js`, fonction `getAvailableSlots()`:

```javascript
const dayStartMinutes = 7 * 60;  // 07:00 au lieu de 08:00
const dayEndMinutes = 20 * 60;   // 20:00 au lieu de 19:00
```

### Changer la durée des créneaux par défaut

```javascript
const slots = getAvailableSlots(
  sessions,
  'Salle 1',
  1,
  'normal',
  120  // 120 minutes au lieu de 90
);
```

### Filtrer par capacité de salle

Ajouter une propriété `capacity` à chaque salle:

```javascript
const rooms = [
  { name: 'Salle 1', capacity: 30 },
  { name: 'Salle 2', capacity: 50 },
  { name: 'Salle 3', capacity: 20 }
];

// Filtrer
const largeRooms = rooms.filter(r => r.capacity >= 40);
const availableLarge = getRoomsByAvailability(
  sessions,
  largeRooms.map(r => r.name),
  day
);
```

---

## 🧪 Tests

### Tester localement

```javascript
import {
  getAvailableSlots,
  getRoomsByAvailability
} from './RoomAvailabilityService';

// Mock data
const mockSessions = [
  {
    room: 'Salle 1',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    professor: 'Dr. Ali',
    subject: 'Math',
    level: 'L3'
  },
  // ... plus de sessions
];

const mockRooms = ['Salle 1', 'Salle 2', 'Salle 3'];

// Test
console.log('Test 1:', getAvailableSlots(mockSessions, 'Salle 1', 1));
console.log('Test 2:', getRoomsByAvailability(mockSessions, mockRooms, 1));
```

---

## 🐛 Dépannage

### Le composant ne s'affiche pas
- Vérifier que les données `sessions` ne sont pas vides
- S'assurer que `branchesData` contient le champ `rooms`
- Vérifier la console pour les erreurs d'import

### Les créneaux ne s'affichent pas correctement
- Vérifier le format HH:MM des heures
- S'assurer que `dayOfWeek` est dans [0-6]
- Vérifier que les noms de salles sont normalisés (ex: "Salle 1", pas "Room 1")

### Performance lente
- Limiter le nombre de sessions affichées
- Utiliser `selectedPeriod` pour filtrer
- Cacher les détails et afficher en expand

---

## 📞 Support & Questions

Voir `ROOM_AVAILABILITY_GUIDE.md` pour:
- Description technique détaillée
- 6+ exemples d'utilisation
- Explications des algorithmes

---

## ✅ Checklist d'intégration

- [ ] Importer `RoomAvailabilityViewer` dans Dashboard
- [ ] Importer icône `Building2` depuis lucide-react
- [ ] Ajouter état `showRoomAvailability`
- [ ] Ajouter bouton dans Dashboard
- [ ] Ajouter composant modal au bout du Dashboard
- [ ] Tester sur desktop
- [ ] Tester sur mobile/tablet
- [ ] Vérifier les données sont chargées correctement
- [ ] Tester les filtres (centre, jour, période)
- [ ] Tester les deux modes (Salles et Timeline)

---

## 🚀 Prochaines étapes

1. **Export CSV** - Ajouter bouton d'export pour rapports
2. **Notifications** - Alerter si salle devient libre/occupée
3. **Graphiques** - Utiliser Chart.js pour visualiser l'utilisation
4. **API REST** - Exposer via endpoints pour applications externes
5. **Mobile app** - Intégrer dans l'app React Native

