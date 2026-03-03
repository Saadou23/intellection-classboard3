# 🔐 Règles Firestore pour les Vidéos

## Configuration de sécurité

Ajoutez ces règles à votre Firestore pour autoriser l'accès aux vidéos :

### Règles complètes

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Collections existantes
    match /branches/{branchId} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }

    match /discipline_records/{recordId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && isAdmin();
    }

    // ✨ NOUVELLE COLLECTION - Videos
    match /videos/{videoId} {
      // Lecture publique (l'écran public peut les afficher)
      allow read: if true;

      // Écriture/suppression : Admin uniquement
      allow create, update, delete: if request.auth != null && isAdmin();
    }

    // Fonction helper pour vérifier admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Explication

| Permission | Condition | Raison |
|-----------|-----------|--------|
| **read** | `true` | PublicToday doit pouvoir lire les vidéos sans authentification |
| **create** | Admin seulement | Seuls les administrateurs ajoutent des vidéos |
| **update** | Admin seulement | Seuls les administrateurs modifient les vidéos |
| **delete** | Admin seulement | Seuls les administrateurs suppriment les vidéos |

## Avantages de cette approche

✅ **Lecture publique** : L'écran d'affichage public peut afficher les vidéos sans token
✅ **Sécurité** : Seuls les admins peuvent ajouter/modifier/supprimer
✅ **Performance** : Pas de requêtes d'authentification pour les clients publics
✅ **Flexibilité** : Peut être étendu pour d'autres rôles

## Déploiement

1. Allez dans **Firebase Console** → **Firestore Database**
2. Cliquez sur l'onglet **Rules**
3. Remplacez le contenu par les règles ci-dessus
4. Cliquez **Publish**

## Vérification

Pour tester les règles :

```javascript
// Test 1 : Lecture publique (doit réussir)
const videos = await getDocs(collection(db, 'videos'));
console.log('✅ Lecture publique OK:', videos.size);

// Test 2 : Écriture sans auth (doit échouer)
try {
  await addDoc(collection(db, 'videos'), { title: 'Test' });
  console.log('❌ ERREUR: Écriture non-authentifiée réussie!');
} catch (e) {
  console.log('✅ Écriture non-authentifiée bloquée (expected)');
}
```

## Alternative : Lectures limitées par date

Si vous voulez que les vidéos soient affichées seulement pendant une certaine période :

```javascript
match /videos/{videoId} {
  allow read: if isVideoActive(resource.data);
  allow create, update, delete: if request.auth != null && isAdmin();
}

function isVideoActive(video) {
  let now = request.time;
  let startDate = timestamp.value(video.startDate);
  let endDate = timestamp.value(video.endDate);
  return now >= startDate && now <= endDate;
}
```

---

**Dernière mise à jour :** Mars 2026
