# 🚀 Démarrage Rapide - Carrousel Vidéo

## En 5 minutes

### 1️⃣ Créer la collection Firebase (2 min)

**Firestore Console** → Créer collection `videos`

Ajouter un document exemple :

```javascript
{
  id: "video_welcome",
  title: "Bienvenue sur Intellection ClassBoard",
  description: "Découvrez la plateforme",
  url: "https://example.com/welcome.mp4",
  type: "announcement",
  duration: 45,
  enabled: true,
  order: 1
}
```

### 2️⃣ Ajouter les règles Firestore (1 min)

**Firestore** → **Rules** :

```javascript
match /videos/{videoId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null && isAdmin();
}
```

### 3️⃣ Tester localement (2 min)

```bash
cd "C:\Users\Ahmed\Downloads\intellection-classboard3-main (11)\intellection-classboard3-main"
npm run dev
```

Visiter : `http://localhost:5173/?branch=Hay+Salam`

Attendre :
- 🎥 2 minutes (screensaver) → Vidéo s'affiche
- 📱 QR codes visibles avec logos PlayStore/AppStore
- ❌ Bouton X pour fermer

---

## Types de vidéos

### Announcement (Annonces)
```javascript
{
  type: "announcement",
  title: "Bienvenue sur Intellection",
  duration: 45,
  enabled: true
}
```

### Advertisement (Publicités)
```javascript
{
  type: "advertisement",
  title: "Téléchargez l'app mobile",
  duration: 30,
  enabled: true
}
```

---

## URLs supportées

```
✅ MP4: https://example.com/video.mp4
✅ YouTube: https://www.youtube.com/embed/VIDEO_ID
✅ Vimeo: https://player.vimeo.com/video/VIDEO_ID
✅ Firebase Storage: https://firebasestorage.googleapis.com/...
```

---

## Comportement

| Situation | Délai | Action |
|-----------|-------|--------|
| Pas de séances | 2 min | Screensaver vidéo |
| Avec séances | 10 min | Publicité vidéo |
| Fermeture | - | Bouton X |

---

## Personnalisation rapide

### Changer délai screensaver

**PublicToday.jsx** ligne 71 :
```javascript
}, 2 * 60 * 1000);  // Changer 2 à 5 pour 5 minutes
```

### Changer délai publicité

**PublicToday.jsx** ligne 79 :
```javascript
}, 10 * 60 * 1000);  // Changer 10 à 15 pour 15 minutes
```

### Changer couleurs PlayStore

**VideoCarousel.jsx** ligne 75 :
```javascript
className="bg-gradient-to-r from-blue-500 to-cyan-500"
// Essayer: from-purple-500 to-pink-500
```

---

## Exemple de configuration complète

```javascript
// Ajouter 3 vidéos à Firebase:

// 1. Bienvenue
{
  id: "video_1",
  title: "Bienvenue Intellection",
  description: "La plateforme collaborative pour l'apprentissage",
  url: "https://example.com/intro.mp4",
  type: "announcement",
  duration: 45,
  enabled: true,
  order: 1
}

// 2. App Mobile
{
  id: "video_2",
  title: "Téléchargez l'app mobile",
  description: "Accédez à votre emploi du temps partout",
  url: "https://example.com/app-promo.mp4",
  type: "advertisement",
  duration: 30,
  enabled: true,
  order: 2
}

// 3. Fonctionnalités
{
  id: "video_3",
  title: "Découvrez les fonctionnalités",
  description: "Tout ce que vous pouvez faire avec ClassBoard",
  url: "https://example.com/features.mp4",
  type: "announcement",
  duration: 60,
  enabled: true,
  order: 3
}
```

---

## QR Codes (Auto-généré)

- 🟦 **PlayStore** : `https://play.google.com/store/apps/details?id=com.intellection.mobile`
- 🖤 **AppStore** : `https://apps.apple.com/ma/app/intellection-classboard/id6758705463?l=ar`

Les QR codes s'affichent automatiquement avec logos officiels ✨

---

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `VideoCarousel.jsx` | Composant principal vidéo |
| `QRCodeGenerator.jsx` | Générateur QR codes |
| `videoService.js` | Service Firebase |
| `PublicToday.jsx` | Intégration écran public |
| `VIDEO_CAROUSEL_SETUP.md` | Configuration détaillée |
| `FIRESTORE_VIDEO_RULES.md` | Règles de sécurité |

---

## Vérification rapide

```javascript
// Dans la console navigateur:

// ✅ Charger les vidéos
const videos = await getVideos();
console.log('Vidéos trouvées:', videos.length);

// ✅ Vérifier une vidéo
console.log(videos[0]);
// Output: {id, title, url, type, enabled, ...}

// ✅ Forcer l'affichage du carrousel
localStorage.setItem('testVideoCarousel', 'true');
location.reload();
```

---

## Problèmes courants

### ❌ Les vidéos ne s'affichent pas
1. Créer collection `videos` dans Firestore
2. Ajouter au moins une vidéo avec `enabled: true`
3. Mettre à jour les règles Firestore
4. Recharger la page
5. Attendre 2 minutes (screensaver) ou 10 minutes (publicité)

### ❌ Les QR codes ne scannent pas
1. Vérifier connexion internet
2. Réessayer avec une autre app scan
3. Vérifier le code en haut à droite pour erreurs

### ❌ La vidéo se coupe
1. Réduire la durée (max 120s)
2. Compresser le fichier MP4
3. Utiliser une URL CORS-compatible

---

## Production

```bash
# Build
npm run build

# Les vidéos se chargeront depuis Firebase automatiquement ✅
# Aucun secret/API key nécessaire (lecture publique)
```

---

✅ **Prêt à l'emploi** | 📺 **Professionnel** | 📱 **Mobile-Friendly**

Besoin d'aide ? Voir `VIDEO_CAROUSEL_SETUP.md`

---

**Dernière mise à jour** : Mars 2026
