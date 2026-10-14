# 🧪 Guide de Test - Système de Gestion des Absences

Ce guide vous aide à tester chaque fonctionnalité du système.

---

## ✅ Tests Préalables

### 1. Vérifier que les fichiers sont présents

```bash
ls -la src/ProfessorAbsence*.jsx
ls -la src/ProfessorAbsenceService.js
```

### 2. Vérifier les imports dans App.jsx

```bash
grep -n "ProfessorAbsence" src/App.jsx
```

Vous devriez voir 3 imports.

---

## 🧪 Tests Fonctionnels

### Test 1: Admin - Signaler une absence

**Étapes:**
1. Connectez-vous en tant qu'admin
2. Cliquez sur "📋 Signaler une Absence"
3. Sélectionnez aujourd'hui dans "Date de la séance"
4. Vous devriez voir une liste de séances

**Expected:**
- ✅ Au minimum 1-2 séances s'affichent
- ✅ Chaque séance montre le professeur, la matière, l'horaire

**Si vide:**
- Vérifier qu'il y a des séances dans Firebase (`schedules` collection)
- Vérifier les champs: `startTime`, `professorName`, `subject`/`matiere`

**Continuer:**
1. Sélectionnez une séance (cliquer dessus)
2. Elle s'affiche en bleu
3. (Optionnel) Ajoutez une date de rattrapage
4. Cliquez "❌ Signaler cette Absence"

**Expected:**
- ✅ Message "✅ Absence enregistrée"
- ✅ La séance disparaît de la liste
- ✅ Une nouvelle absence apparaît dans "Historique"

---

### Test 2: Admin - Voir l'historique

**Étapes:**
1. Cliquez sur "📊 Historique"
2. Vous devriez voir la séance que vous avez signalée

**Expected:**
- ✅ Tableau avec les colonnes: Professeur, Matière, Date, Statut, Rattrapage
- ✅ Statut: "❌ Absent"
- ✅ Les 4 statistiques en haut:
  - Total d'absences
  - Non planifiés
  - Rattrapages planifiés
  - Complétés

**Tester les filtres:**
1. Changez "Statut" en "Absent"
2. L'enregistrement doit rester visible
3. Changez en "Complété"
4. L'enregistrement doit disparaître

---

### Test 3: Admin - Planifier un rattrapage

**Étapes:**
1. Dans "Historique", trouvez une absence avec statut "❌ Absent"
2. Cliquez sur le bouton "📅" (crayon)
3. Une boîte de dialogue demande la date
4. Entrez une date: `2026-10-20T14:30`
5. Appuyez OK

**Expected:**
- ✅ Message "✅ Rattrapage planifié"
- ✅ Le statut change en "📅 Rattrapage planifié"
- ✅ La colonne "Rattrapage" affiche la date

---

### Test 4: Admin - Marquer comme complété

**Étapes:**
1. Trouvez une absence avec statut "📅 Rattrapage planifié"
2. Cliquez sur le bouton "✅"

**Expected:**
- ✅ Message "✅ Rattrapage marqué comme complété"
- ✅ Le statut change en "✅ Complété"

---

### Test 5: Admin - Supprimer une absence

**Étapes:**
1. Cliquez sur le bouton "🗑️" d'une absence
2. Confirmez la suppression

**Expected:**
- ✅ Message "✅ Absence supprimée"
- ✅ L'enregistrement disparaît du tableau

---

### Test 6: Admin - Export PDF

**Étapes:**
1. Dans "Historique", cliquez "📄 Exporter PDF"
2. Un fichier PDF doit se télécharger

**Expected:**
- ✅ Fichier nommé `absences-professeurs-[timestamp].pdf`
- ✅ Contient un tableau avec les données filtrées
- ✅ Header: "📊 Historique des Absences Professeurs"
- ✅ Tableau formaté lisible

**Vérifier le contenu:**
```bash
# Sur macOS/Linux
file absences-professeurs-*.pdf

# Vérifier dans le lecteur PDF
```

---

### Test 7: Étudiant - Voir les séances annulées

**Étapes:**
1. Connectez-vous en tant qu'étudiant
2. Allez à "⚠️ Séances Annulées"

**Expected:**
- ✅ Vous voyez l'absence que vous avez signalée (si elle correspond à votre niveau/groupe)
- ✅ Affichage en orange/rouge
- ✅ Shows: Matière, Professeur, Horaire, Centre, Niveau, Groupe

**Si vous ne voyez rien:**
- Vérifier que l'absence a les bonnes valeurs:
  - `niveau` correspond à votre level
  - `groupe` correspond à votre group
  - `center` correspond à votre center

---

### Test 8: Étudiant - Rattrapage affiché

**Étapes:**
1. Connectez-vous en tant qu'étudiant
2. Allez à "⚠️ Séances Annulées"
3. Trouvez une séance avec rattrapage planifié

**Expected:**
- ✅ Vous voyez "📅 Rattrapage Planifié"
- ✅ La date du rattrapage s'affiche

---

### Test 9: Expiration après 24h (Cloud Functions)

**Étapes:**
1. Signalez une absence sans rattrapage (status: "absent")
2. Attendez le jour suivant à minuit
3. Vérifiez dans l'historique

**Expected:**
- ✅ L'absence est supprimée automatiquement
- ✅ Elle n'apparaît plus chez les étudiants
- ⚠️ Remarque: Le test real prend du temps. Pour tester rapidement:
  - Modifier `firebase/functions/expireAbsences.js`
  - Changer `where('date', '<', ...)` en `where('date', '<', ...}`
  - Redéployer

**Si rien ne se passe:**
- Vérifier les logs: `firebase functions:log`
- Vérifier que la fonction est déployée: `firebase deploy --only functions`

---

## 🐛 Debugging

### Les séances n'apparaissent pas

**Vérifier 1: Collection existe**
```javascript
// Dans Firebase Console → Firestore
// Allez à Data > schedules
// Vérifier qu'il y a des documents
```

**Vérifier 2: Champs corrects**
```javascript
// Chaque document doit avoir:
- startTime (timestamp)
- professorName (string)
- matiere OR subject (string)
- groupe OR group (string)
- center (string)
- niveau OR level (string)
```

**Vérifier 3: Console du navigateur**
```javascript
// Ouvrir DevTools (F12)
// Chercher des erreurs en rouge
// Vérifier que Firebase est initialisé
```

---

### Les absences ne s'enregistrent pas

**Erreur: "Veuillez sélectionner une séance"**
- Sélectionnez une séance d'abord

**Erreur: "Erreur lors de l'enregistrement"**
1. Ouvrir DevTools Console
2. Chercher le message d'erreur complet
3. Vérifier les Firestore Rules (elle autorise les admins?)

---

### Les Cloud Functions ne s'exécutent pas

```bash
# Vérifier les logs
firebase functions:log

# Vérifier la liste des fonctions
firebase functions:list

# Redéployer
firebase deploy --only functions

# Vérifier l'état en ligne
firebase functions:describe expireOldAbsences
```

---

## 📊 Vérification des Données Firebase

### Voir toutes les absences

```javascript
// Dans Firebase Console → Firestore Shell (ou via SDK)
db.collection('professor_absences').get().then(snap => {
  console.log(`Total: ${snap.size} absence(s)`);
  snap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
});
```

### Compter par statut

```javascript
db.collection('professor_absences')
  .where('status', '==', 'absent')
  .get()
  .then(snap => console.log(`Absents: ${snap.size}`));
```

### Voir les rapports quotidiens

```javascript
// Dans Firebase Console → Firestore
// Allez à Data > absence_reports
// Vérifier les documents générés
```

---

## ✅ Checklist de Test Complet

- [ ] Test 1: Signaler absence ✓
- [ ] Test 2: Voir historique ✓
- [ ] Test 3: Planifier rattrapage ✓
- [ ] Test 4: Marquer complété ✓
- [ ] Test 5: Supprimer absence ✓
- [ ] Test 6: Export PDF ✓
- [ ] Test 7: Étudiant voit séance annulée ✓
- [ ] Test 8: Étudiant voit rattrapage ✓
- [ ] Test 9: Expiration après 24h (optionnel)
- [ ] Vérifier Firebase (collections, documents)
- [ ] Vérifier Firestore Rules
- [ ] Vérifier Cloud Functions logs

---

## 🚀 Performance

### Requêtes optimisées
Le service utilise des index Firestore appropriés:
- `professor_absences`: Index sur `status` + `date`
- Évite les requêtes full-collection

### Cache
`StudentAbsenceNotifications` recharge chaque heure:
```javascript
const interval = setInterval(() => {
  loadCancelledSessions();
}, 60 * 60 * 1000); // 1 heure
```

Vous pouvez ajuster si nécessaire.

---

## 📞 Support

Si un test échoue:
1. Vérifiez les logs: `firebase functions:log`
2. Vérifiez les erreurs DevTools: F12 → Console
3. Vérifiez Firestore Rules
4. Vérifier Firebase est correctement initialisé

Bonne chance ! 🎉
