# 📋 Système de Gestion des Absences - Guide d'Intégration

## 📦 Fichiers Créés

### Services
- `src/ProfessorAbsenceService.js` - Logique métier Firebase (CRUD)

### Composants React
- `src/ProfessorAbsenceManager.jsx` - Interface Admin (signaler absences + historique)
- `src/StudentAbsenceNotifications.jsx` - Notifications aux étudiants
- `src/ProfessorAbsenceHistory.jsx` - Historique détaillé pour admin

### Cloud Functions
- `firebase/functions/expireAbsences.js` - Tâches planifiées (expiration auto, notifications, rapports)

---

## 🚀 Étapes d'Intégration

### 1️⃣ Ajouter les imports dans `App.jsx`

```jsx
import ProfessorAbsenceManager from './ProfessorAbsenceManager';
import ProfessorAbsenceHistory from './ProfessorAbsenceHistory';
import StudentAbsenceNotifications from './StudentAbsenceNotifications';
```

### 2️⃣ Ajouter les routes Admin dans `App.jsx`

```jsx
// Dans le section routes Admin
case 'absence-manager':
  return <ProfessorAbsenceManager />;

case 'absence-history':
  return <ProfessorAbsenceHistory />;
```

### 3️⃣ Ajouter les routes Étudiant dans `App.jsx`

```jsx
// Dans le section routes Étudiant
case 'absence-notifications':
  return <StudentAbsenceNotifications 
    userLevel={userLevel}
    userCenter={userCenter}
    userGroup={userGroup}
  />;
```

### 4️⃣ Ajouter les boutons de navigation

**Menu Admin:**
```jsx
<button 
  onClick={() => setPage('absence-manager')}
  className="menu-button"
>
  📋 Absences Professeurs
</button>

<button 
  onClick={() => setPage('absence-history')}
  className="menu-button"
>
  📊 Historique Absences
</button>
```

**Menu Étudiant:**
```jsx
<button 
  onClick={() => setPage('absence-notifications')}
  className="menu-button"
>
  ⚠️ Séances Annulées
</button>
```

### 5️⃣ Configurer les Cloud Functions

#### a) Mettre à jour `firebase/functions/package.json`

```json
{
  "name": "intellection-classboard-functions",
  "description": "Cloud Functions for Intellection ClassBoard",
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^11.0.0",
    "firebase-functions": "^4.0.0"
  },
  "engines": {
    "node": "18"
  }
}
```

#### b) Mettre à jour `firebase/functions/index.js`

```javascript
const admin = require('firebase-admin');

admin.initializeApp();

// Importer les Cloud Functions
const { 
  expireOldAbsences, 
  notifyUpcomingMakeups, 
  generateDailyAbsenceReport 
} = require('./expireAbsences');

module.exports = {
  expireOldAbsences,
  notifyUpcomingMakeups,
  generateDailyAbsenceReport,
};
```

#### c) Déployer les Cloud Functions

```bash
# Installer les dépendances Firebase
npm install firebase-functions firebase-admin --save

# Déployer uniquement les functions
firebase deploy --only functions:expireOldAbsences,functions:notifyUpcomingMakeups,functions:generateDailyAbsenceReport

# Ou déployer tout
firebase deploy
```

### 6️⃣ Configurer Firebase Firestore Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Absences - Admin seulement
    match /professor_absences/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Rapports d'absence - Admin seulement
    match /absence_reports/{document=**} {
      allow read: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

---

## 🎯 Fonctionnalités

### Pour l'Admin

**ProfessorAbsenceManager:**
- 📝 Signaler une absence
  - Sélectionner la date
  - Choisir la séance parmi celles du jour
  - Ajouter une note (optionnel)
  - Planifier la date de rattrapage
  
- 📊 Historique des absences
  - Filtrer par statut (Absent, Planifié, Complété)
  - Voir tous les enregistrements
  - Mettre à jour le statut
  - Supprimer un enregistrement

**ProfessorAbsenceHistory:**
- 📈 Vue détaillée avec statistiques
  - Total des absences
  - Absences non planifiées
  - Rattrapages planifiés
  - Complétés
- 🔍 Filtres avancés
  - Par plage de dates
  - Par professeur
  - Par centre
  - Par statut
- 📄 Export PDF

### Pour les Étudiants

**StudentAbsenceNotifications:**
- ⚠️ Affichage des séances annulées
- 📅 Date de rattrapage (si planifiée)
- 👨‍🏫 Informations du professeur
- 🕐 Horaire original
- 📍 Centre et niveau
- Auto-suppression après 24h

### Cloud Functions (Automatisées)

1. **Expiration des absences** (Chaque jour à minuit)
   - Supprime les absences non planifiées après 24h
   - Crée l'effet "éphémère"

2. **Notifications de rattrapages** (Chaque jour à 8h)
   - Notifie les absences avec rattrapage prévu dans les 2 jours
   - (À compléter avec logique d'email/SMS)

3. **Rapport quotidien** (Chaque jour à 17h)
   - Génère un résumé des absences du jour
   - Sauvegarde dans `absence_reports`

---

## 📊 Structure Firebase

```
firestore/
├── professor_absences/{id}
│   ├── sessionId: string
│   ├── professorId: string
│   ├── professorName: string
│   ├── date: timestamp (jour de la séance)
│   ├── center: string
│   ├── niveau: string
│   ├── matiere: string
│   ├── groupe: string
│   ├── makeupDate: timestamp (optionnel)
│   ├── status: "absent" | "scheduled_makeup" | "completed"
│   ├── notes: string (optionnel)
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── absence_reports/{YYYY-MM-DD}
│   ├── date: timestamp
│   ├── stats: {
│   │   total: number,
│   │   absent: number,
│   │   scheduled_makeup: number,
│   │   completed: number
│   │ }
│   └── generatedAt: timestamp
```

---

## 🔄 Flux de Données

### Scénario 1: Absence sans rattrapage

1. Admin signale absence → Status: `absent` (éphémère)
2. ✅ Étudiants voient la séance comme "Annulée"
3. ⏰ Après 24h → Supprimée automatiquement
4. 📊 Admin peut quand même voir l'historique

### Scénario 2: Absence avec rattrapage planifié

1. Admin signale absence et planifie date → Status: `scheduled_makeup`
2. ✅ Étudiants voient la date de rattrapage
3. ⏰ L'absence reste visible jusqu'à marquage comme "complété"
4. ✅ Admin marque comme "Complété" → Status: `completed`
5. 📊 Historique conservé indéfiniment

---

## 🛠️ Maintenance

### Vérifier les Cloud Functions

```bash
# Voir les logs
firebase functions:log

# Vérifier le statut
firebase functions:list

# Redéployer
firebase deploy --only functions
```

### Nettoyer les absences anciennes

Si vous avez besoin de nettoyer les anciennes absences:

```javascript
// Dans la console Firebase Firestore
db.collection('professor_absences')
  .where('status', '==', 'absent')
  .where('date', '<', new Date(Date.now() - 30*24*60*60*1000))
  .get()
  .then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  });
```

---

## ✅ Checklist d'Implémentation

- [ ] Copier les 3 fichiers React dans `src/`
- [ ] Créer `firebase/functions/expireAbsences.js`
- [ ] Mettre à jour `firebase/functions/index.js`
- [ ] Ajouter les imports et routes dans `App.jsx`
- [ ] Ajouter les boutons de navigation
- [ ] Configurer les Firestore Rules
- [ ] Installer les dépendances Firebase
- [ ] Déployer les Cloud Functions
- [ ] Tester la saisie d'une absence
- [ ] Vérifier l'affichage côté étudiant
- [ ] Vérifier l'historique
- [ ] Tester l'export PDF
- [ ] Vérifier les Cloud Functions dans la console Firebase

---

## 🐛 Dépannage

### Les séances n'apparaissent pas
- Vérifier que la collection `schedules` existe
- S'assurer que les champs `startTime`, `professorName`, etc. existent

### Les Cloud Functions ne s'exécutent pas
- Vérifier les logs: `firebase functions:log`
- Vérifier que `firebase deploy --only functions` a réussi
- Vérifier le fuseau horaire (actuellement "Africa/Casablanca")

### Les absences ne disparaissent pas après 24h
- Vérifier que `expireOldAbsences` est déployée
- Vérifier les logs de la fonction

---

## 📞 Support

Pour toute question, consultez:
- 📖 [Documentation Firebase Functions](https://firebase.google.com/docs/functions)
- 🔥 [Firestore Documentation](https://firebase.google.com/docs/firestore)
- 🚀 [Deployment Guide](https://firebase.google.com/docs/functions/manage-functions)
