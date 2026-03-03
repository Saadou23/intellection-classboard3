# 📺 Configuration du Carrousel Vidéo Publicitaire

## Vue d'ensemble

Le système de carrousel vidéo affiche automatiquement des vidéos sur l'écran d'affichage public (PublicToday) de manière professionnelle avec :
- QR Codes pour télécharger l'application (PlayStore + AppStore)
- Logos officiels Google Play et Apple App Store
- Gestion automatique du screensaver et des publicités
- Transition fluide entre les vidéos

## Installation

### 1. Dépendances (déjà installées)
- `react` - Pour les composants
- `lucide-react` - Pour les icônes
- Firebase (Firestore) - Pour stocker les vidéos

### 2. Composants créés

```
src/
├── VideoCarousel.jsx          # Composant principal de lecture vidéo
├── QRCodeGenerator.jsx         # Générateur de QR codes
├── videoService.js             # Service Firebase pour les vidéos
└── PublicToday.jsx             # Intégration (modifié)
```

## Configuration Firestore

### Collection `videos`

Créez une collection `videos` dans Firestore avec la structure suivante :

```javascript
{
  id: "video_1",
  title: "Bienvenue sur Intellection ClassBoard",
  description: "Découvrez la plateforme collaborative pour l'apprentissage",
  url: "https://link-to-video.mp4",           // URL MP4, YouTube, etc.
  type: "announcement",                        // "announcement" | "advertisement"
  duration: 60,                                // Durée en secondes
  enabled: true,                               // Actif/Inactif
  order: 1,                                    // Ordre d'affichage
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### Exemple complet

```json
{
  "video_1": {
    "title": "Bienvenue sur Intellection ClassBoard",
    "description": "Découvrez la plateforme collaborative pour l'apprentissage",
    "url": "https://example.com/videos/welcome.mp4",
    "type": "announcement",
    "duration": 45,
    "enabled": true,
    "order": 1
  },
  "video_2": {
    "title": "Téléchargez l'application mobile",
    "description": "Accédez à votre emploi du temps n'importe où, n'importe quand",
    "url": "https://example.com/videos/app-promo.mp4",
    "type": "advertisement",
    "duration": 30,
    "enabled": true,
    "order": 2
  },
  "video_3": {
    "title": "Fonctionnalités principales",
    "description": "Découvrez tous les outils de ClassBoard",
    "url": "https://example.com/videos/features.mp4",
    "type": "announcement",
    "duration": 60,
    "enabled": true,
    "order": 3
  }
}
```

## Types d'URLs supportées

### ✅ Formats supportés

1. **Fichiers MP4 hébergés**
   ```
   https://example.com/videos/my-video.mp4
   ```

2. **YouTube (embed)**
   ```
   https://www.youtube.com/embed/VIDEO_ID
   ```

3. **Vimeo (embed)**
   ```
   https://player.vimeo.com/video/VIDEO_ID
   ```

4. **Vidéos Firebase Storage**
   ```
   https://firebasestorage.googleapis.com/v0/b/...
   ```

## Comportement d'affichage

### Mode Screensaver
- ⏱️ **Trigger** : 2 minutes d'inactivité (pas de séances actives)
- 📹 **Effet** : Affiche automatiquement le carrousel en plein écran
- 🔄 **Boucle** : Répète toutes les vidéos

### Mode Publicité
- ⏱️ **Trigger** : Tous les 10 minutes (si des séances sont affichées)
- 📹 **Effet** : Interruption de 30-60 secondes
- ✅ **Fermeture** : Bouton X en haut à droite

### QR Codes
- 📱 **PlayStore** : Lien vers `https://play.google.com/store/apps/details?id=com.intellection.mobile`
- 📱 **AppStore** : Lien vers `https://apps.apple.com/ma/app/intellection-classboard/id6758705463?l=ar`
- 🔗 **Génération** : Via API QR Server (auto)

## Ajout de vidéos via Firebase Console

1. Allez dans **Firestore Database**
2. Créez une collection `videos`
3. Ajoutez des documents avec la structure ci-dessus
4. Les vidéos doivent avoir `enabled: true` pour apparaître

## Ajout de vidéos via code

```javascript
import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

async function addVideo() {
  const videosRef = collection(db, 'videos');
  await addDoc(videosRef, {
    title: "Ma nouvelle vidéo",
    description: "Description...",
    url: "https://example.com/video.mp4",
    type: "announcement",
    duration: 60,
    enabled: true,
    order: 4,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}
```

## Personnalisation

### Changer les délais d'affichage

Dans `PublicToday.jsx`, modifiez :

```javascript
// Mode screensaver (actuellement 2 minutes)
inactivityTimerRef.current = setTimeout(() => {
  setShowVideoCarousel(true);
}, 2 * 60 * 1000); // 2 * 60 * 1000 = 2 minutes

// Mode publicité (actuellement 10 minutes)
advertisementTimerRef.current = setTimeout(() => {
  setShowVideoCarousel(true);
}, 10 * 60 * 1000); // 10 * 60 * 1000 = 10 minutes
```

### Changer les couleurs de fond

Dans `VideoCarousel.jsx` :
```javascript
<div className="bg-gradient-to-t from-black via-black/80 to-transparent">
  {/* Personnalisez les couleurs ici */}
</div>
```

## Dépannage

### Les vidéos ne s'affichent pas
- ✅ Vérifier que la collection `videos` existe dans Firestore
- ✅ Vérifier que au moins une vidéo a `enabled: true`
- ✅ Vérifier la console navigateur pour les erreurs
- ✅ S'assurer que l'URL de la vidéo est valide

### Les QR codes ne s'affichent pas
- ✅ Vérifier la connexion internet
- ✅ L'API QR Server doit être accessible
- ✅ Vérifier la taille (actuellement 180x180px)

### Les logos ne sont pas visibles
- ✅ Vérifier que CSS tailwind est chargé
- ✅ Les SVGs doivent avoir `fill="currentColor"`

### Les vidéos se coupent ou sautent
- ✅ Vérifier que l'URL de la vidéo est accessible
- ✅ Essayer avec une URL CORS-compatible
- ✅ Réduire la durée de la vidéo (max 120 secondes recommandé)

## Bonnes pratiques

✅ **À faire :**
- Utiliser des vidéos courtes (30-60 secondes)
- Compresser les vidéos pour une lecture rapide
- Utiliser des URLs stables et hébergées
- Tester les URLs avant d'ajouter
- Avoir au moins 2-3 vidéos en rotation

❌ **À éviter :**
- Vidéos trop longues (> 2 minutes)
- URLs non fiables ou qui changent
- Vidéos sans description
- Désactiver les vidéos au lieu de les supprimer

## Analytics (optionnel)

Pour tracker les vues, vous pouvez ajouter :

```javascript
// Dans VideoCarousel.jsx
const trackVideoView = async (videoId) => {
  await addDoc(collection(db, 'video_analytics'), {
    videoId,
    timestamp: Timestamp.now(),
    duration: video.duration,
    completed: progress === 100
  });
};
```

## Support

Pour des questions ou problèmes :
- 📧 Consultez le fichier de logs navigateur
- 📧 Vérifiez les règles de sécurité Firestore
- 📧 Testez avec les vidéos d'exemple

---

**Dernière mise à jour :** Mars 2026
**Version :** 1.0
