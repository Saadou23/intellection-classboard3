# ⚡ Guide Rapide - Démarrage en 10 minutes

Suivez ce guide pour mettre en place le système d'absences rapidement.

---

## 📋 Étape 1: Vérifier les fichiers (2 min)

✅ **4 fichiers React créés:**
```
✓ src/ProfessorAbsenceService.js
✓ src/ProfessorAbsenceManager.jsx
✓ src/StudentAbsenceNotifications.jsx
✓ src/ProfessorAbsenceHistory.jsx
```

✅ **1 Cloud Function créée:**
```
✓ firebase/functions/expireAbsences.js
```

**Commande pour vérifier:**
```bash
ls -la src/ProfessorAbsence*
ls -la firebase/functions/expireAbsences.js
```

---

## 🔧 Étape 2: Modifier App.jsx (3 min)

### 2.1. Ajouter les imports (en haut du fichier)

Chercher où sont les imports de composants, puis ajouter:

```jsx
import ProfessorAbsenceManager from './ProfessorAbsenceManager';
import ProfessorAbsenceHistory from './ProfessorAbsenceHistory';
import StudentAbsenceNotifications from './StudentAbsenceNotifications';
```

### 2.2. Ajouter les routes Admin

Chercher la section `if (userRole === 'admin') { ... switch (...)` et ajouter:

```jsx
case 'absence-manager':
  return <ProfessorAbsenceManager />;

case 'absence-history':
  return <ProfessorAbsenceHistory />;
```

### 2.3. Ajouter la route Étudiant

Chercher la section `if (userRole === 'student') { ... switch (...)` et ajouter:

```jsx
case 'absence-notifications':
  return <StudentAbsenceNotifications 
    userLevel={userLevel}
    userCenter={userCenter}
    userGroup={userGroup}
  />;
```

### 2.4. Ajouter les boutons Admin (menu admin)

Chercher où sont les boutons du menu admin et ajouter:

```jsx
<button onClick={() => setCurrentPage('absence-manager')}>
  📋 Absences Professeurs
</button>

<button onClick={() => setCurrentPage('absence-history')}>
  📊 Historique Absences
</button>
```

### 2.5. Ajouter le bouton Étudiant (menu étudiant)

Chercher où sont les boutons du menu étudiant et ajouter:

```jsx
<button onClick={() => setCurrentPage('absence-notifications')}>
  ⚠️ Séances Annulées
</button>
```

**Total: ~30 lignes ajoutées**

---

## 🧪 Étape 3: Test rapide (3 min)

### 3.1. Démarrer l'app

```bash
npm run dev
```

### 3.2. Tester Admin

1. Connectez-vous en **admin**
2. Vous devriez voir 2 boutons:
   - 📋 Absences Professeurs
   - 📊 Historique Absences
3. Cliquez sur "📋 Absences Professeurs"
4. Sélectionnez **aujourd'hui** dans la date
5. Vous devriez voir une liste de séances
6. **Sélectionnez une séance** (elle devient bleue)
7. Cliquez **"❌ Signaler cette Absence"**
8. Message: **"✅ Absence enregistrée"**

✅ **Admin fonctionne!**

### 3.3. Tester Étudiant

1. Connectez-vous en **étudiant**
2. Vous devriez voir le bouton:
   - ⚠️ Séances Annulées
3. Cliquez dessus
4. Vous devriez voir la séance que vous avez signalée
5. Elle affiche: **"❌ Séance Annulée"**

✅ **Étudiant fonctionne!**

### 3.4. Tester Historique

1. Connectez-vous en **admin**
2. Allez à "📊 Historique Absences"
3. Vous devriez voir un tableau avec votre absence
4. Cliquez sur "📄 Exporter PDF"
5. Un PDF se télécharge

✅ **Historique fonctionne!**

---

## ☁️ Étape 4: Cloud Functions (optionnel, 2 min)

Si vous voulez l'expiration automatique des absences:

```bash
# Déployer les Cloud Functions
firebase deploy --only functions
```

C'est tout! Les functions vont s'exécuter automatiquement chaque jour.

---

## 📝 Résumé des Changements

| Fichier | Type | Actions |
|---------|------|---------|
| `App.jsx` | Existant | ✏️ Ajouter 3 imports |
| `App.jsx` | Existant | ✏️ Ajouter 3 routes |
| `App.jsx` | Existant | ✏️ Ajouter 3 boutons |
| `ProfessorAbsenceManager.jsx` | NOUVEAU | ✅ Créé |
| `ProfessorAbsenceHistory.jsx` | NOUVEAU | ✅ Créé |
| `StudentAbsenceNotifications.jsx` | NOUVEAU | ✅ Créé |
| `ProfessorAbsenceService.js` | NOUVEAU | ✅ Créé |
| `expireAbsences.js` | NOUVEAU | ✅ Créé (optionnel) |

**Total modifications: ~30 lignes dans App.jsx**

---

## 🎯 Architecture Simple

```
┌─────────────────────────────────────────┐
│          ClassBoard App (App.jsx)       │
├─────────────────────────────────────────┤
│                                         │
│  Admin Routes:                          │
│  ├─ /absence-manager (signaler)         │
│  └─ /absence-history (voir historique)  │
│                                         │
│  Student Routes:                        │
│  └─ /absence-notifications (voir avis)  │
│                                         │
├─────────────────────────────────────────┤
│  ProfessorAbsenceService (Firebase)     │
├─────────────────────────────────────────┤
│          Firebase Firestore             │
│  Collection: professor_absences         │
│  Collection: absence_reports            │
└─────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting Rapide

### "Les séances n'apparaissent pas"
→ Vérifiez qu'il y a des documents dans `firestore > schedules`

### "Erreur lors de l'enregistrement"
→ Ouvrez DevTools (F12) et vérifiez le message d'erreur exact

### "Les Cloud Functions ne s'exécutent pas"
→ Exécutez: `firebase functions:log` pour voir les erreurs

### "Rien ne s'affiche"
→ Vérifiez que vous avez sauvegardé `App.jsx` après les modifications

---

## 📚 Documentation Complète

Si vous voulez plus de détails:

- **Installation détaillée:** `ABSENCE_SYSTEM_INTEGRATION.md`
- **Changements App.jsx:** `ABSENCE_SYSTEM_APP_CHANGES.md`
- **Tests complets:** `ABSENCE_SYSTEM_TEST.md`
- **Vue d'ensemble:** `ABSENCE_SYSTEM_README.md`

---

## ✅ Checklist Finale

- [ ] 4 fichiers React copiés dans `src/`
- [ ] `ProfessorAbsenceService.js` copié dans `src/`
- [ ] 3 imports ajoutés à `App.jsx`
- [ ] 3 routes ajoutées à `App.jsx`
- [ ] 3 boutons ajoutés à `App.jsx`
- [ ] `npm run dev` exécuté
- [ ] Test Admin OK (signaler absence)
- [ ] Test Étudiant OK (voir séance annulée)
- [ ] Test Historique OK (voir tableau)
- [ ] Test PDF OK (exporter)

**Bravo! 🎉 Vous êtes opérationnel!**

---

## 🚀 Prochaines Étapes (optionnel)

1. **Déployer Cloud Functions** (expiration auto)
   ```bash
   firebase deploy --only functions
   ```

2. **Ajouter les notifications email** (future amélioration)

3. **Configurer les alertes** (Slack, email admin)

4. **Analyser les rapports quotidiens** (collection `absence_reports`)

---

## 📞 Besoin d'aide?

1. Vérifiez DevTools Console (F12)
2. Vérifiez `firebase functions:log`
3. Consultez `ABSENCE_SYSTEM_TEST.md`
4. Relisez les messages d'erreur Firebase

---

**Bonne chance! 🚀**

Durée totale estimée: **10 minutes**
