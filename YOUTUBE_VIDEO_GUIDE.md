# 📺 Guide des URLs Vidéo - YouTube, Vimeo & MP4

## ⚠️ Problème YouTube : CORS Bloqué

YouTube bloque les connexions directes depuis des pages web (CORS). **Solution : Utiliser les URLs d'intégration correctes**

---

## ✅ Format YouTube Correct

### ❌ Format INCORRECT (ne fonctionne pas)
```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID?autoplay=1
```

### ✅ Format CORRECT (fonctionne)
```
https://www.youtube.com/embed/VIDEO_ID
https://www.youtube-nocookie.com/embed/VIDEO_ID
```

---

## 🎬 Comment obtenir l'URL d'intégration YouTube

### Méthode 1 : Depuis YouTube directement

1. **Ouvrir la vidéo** sur youtube.com
2. **Cliquer** sur "Partager"
3. **Cliquer** sur "Intégrer"
4. **Copier** l'URL du src

```html
<!-- Vous verrez ceci -->
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  ...
```

**URL à utiliser** : `https://www.youtube.com/embed/dQw4w9WgXcQ`

### Méthode 2 : Construire manuellement

Si vous avez l'ID de la vidéo (la partie après `v=` dans l'URL):

```
Format: https://www.youtube.com/embed/[VIDEO_ID]
Exemple: https://www.youtube.com/embed/dQw4w9WgXcQ
```

---

## 🔗 Exemples de vidéos de test

### Publique (ne nécessite pas de compte)
```
✅ https://www.youtube.com/embed/dQw4w9WgXcQ (Rick Roll - classique)
✅ https://www.youtube.com/embed/jNQXAC9IVRw (YouTube test video)
```

### Options d'URL sans cookies
```
✅ https://www.youtube-nocookie.com/embed/VIDEO_ID
(Recommandé pour la vie privée)
```

---

## 🎯 Paramètres URL supportés

Vous pouvez ajouter des paramètres à l'URL YouTube :

```
https://www.youtube.com/embed/VIDEO_ID?autoplay=1&controls=1&modestbranding=1
```

**Paramètres utiles** :
- `autoplay=1` → Lance automatiquement
- `controls=1` → Affiche les contrôles
- `modestbranding=1` → Logo YouTube discret
- `rel=0` → Cache les vidéos recommandées

---

## 📱 Vimeo

### Format correct
```
✅ https://player.vimeo.com/video/VIDEO_ID
```

### Obtenir l'ID Vimeo
1. Ouvrir la vidéo sur vimeo.com
2. L'URL ressemble à : `https://vimeo.com/123456789`
3. L'ID est : `123456789`

### Exemple
```
https://vimeo.com/76979871
→ URL à utiliser : https://player.vimeo.com/video/76979871
```

---

## 📹 Fichiers MP4 directes

### Format correct
```
✅ https://example.com/video.mp4
✅ https://firebasestorage.googleapis.com/...
```

### Hébergement recommandé
- **Firebase Storage** (gratuit, intégré à Firebase)
- **AWS S3** (professionnel)
- **Bunny CDN** (performant, peu cher)
- **Votre serveur** (si accessible publiquement)

### Exemple Firebase Storage
```
https://firebasestorage.googleapis.com/v0/b/mon-projet.appspot.com/o/videos%2Fma-video.mp4?alt=media
```

---

## 🧪 Tester une URL

### Dans le navigateur
1. Copier l'URL
2. Ouvrir un nouvel onglet
3. Coller l'URL
4. **Pour YouTube/Vimeo** : Doit afficher le player
5. **Pour MP4** : Doit lancer le téléchargement ou jouer

### Exemple de test
```
Ouvrir : https://www.youtube.com/embed/dQw4w9WgXcQ
Résultat attendu : Player YouTube s'affiche
```

---

## ❌ Erreurs courantes

### Erreur : "Video unavailable"
- ❌ La vidéo est privée ou supprimée
- ✅ Solution : Rendre la vidéo publique sur YouTube

### Erreur : "Refused to connect"
- ❌ L'URL ne commence pas par `https://www.youtube.com/embed/`
- ✅ Solution : Utiliser le format d'intégration correct

### Erreur : "This video isn't available in your country"
- ❌ Restrictions géographiques
- ✅ Solution : Utiliser une VPN ou une autre vidéo

### Vidéo ne se charge pas
- ❌ CORS bloqué (mauvais format URL)
- ✅ Solution : Vérifier le format de l'URL

---

## 🚀 Bonnes pratiques

✅ **À faire :**
- Utiliser `https://` (jamais `http://`)
- Tester l'URL avant de l'ajouter
- Utiliser le format d'intégration pour YouTube
- Garder les vidéos courtes (< 2 minutes)

❌ **À éviter :**
- Ne pas mélanger `/watch?v=` avec `/embed/`
- Ne pas utiliser les URLs de partage YouTube
- Ne pas mettre des paramètres bizarres
- Ne pas utiliser des vidéos privées

---

## 📋 Checklist avant d'ajouter une vidéo

- [ ] URL commence par `https://`
- [ ] URL est correcte pour son format (embed pour YouTube)
- [ ] Vidéo est publique (YouTube/Vimeo)
- [ ] URL fonctionne dans le navigateur
- [ ] Durée entre 5 et 300 secondes
- [ ] Titre et description remplis
- [ ] Type (annonce ou publicité) sélectionné

---

## 🆘 Dépannage avancé

### Vérifier les erreurs CORS

1. **Ouvrir la console** (F12 en navigateur)
2. **Onglet "Console"**
3. Chercher les messages rouges `CORS` ou `Refused to connect`
4. L'URL affichée est souvent le problème

### Solution CORS
- ✅ YouTube/Vimeo : Utiliser les URLs d'intégration
- ✅ MP4 : Serveur doit avoir les headers CORS corrects
- ✅ Firebase : CORS activé par défaut

---

## 📚 Ressources

- **YouTube Embed API** : https://developers.google.com/youtube/iframe_api_reference
- **Vimeo Embed** : https://developer.vimeo.com/player/embed
- **Test CORS** : https://www.test-cors.org/

---

## Exemples finaux prêts à copier-coller

### YouTube
```
https://www.youtube.com/embed/dQw4w9WgXcQ
```

### Vimeo
```
https://player.vimeo.com/video/76979871
```

### MP4 Test (CloudFlare)
```
https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4
```

---

**Dernière mise à jour** : Mars 2026
**Problème CORS** : ✅ Résolu avec bons formats URL
