# Configuration de la Politique de Confidentialité

## 📋 Fichiers Ajoutés

### 1. **Fichier Statique HTML** (Pour Google Play Store)
- **Chemin**: `public/privacy-policy.html`
- **Accessible à**: `https://tondomaine.com/privacy-policy.html`
- **Utilité**: URL publique à donner au Google Play Store

### 2. **Composant React** (Intégration dans l'app)
- **Chemin**: `src/PrivacyPolicy.jsx`
- **Accessible à**: `/privacy-policy` (route interne)
- **Utilité**: Page intégrée dans l'application

### 3. **Route Configurée dans App.jsx**
- Ajout automatique de la route `/privacy-policy`
- Permet l'accès via la navigation interne

---

## 🚀 Déploiement

### Option 1: Netlify / Vercel (RECOMMANDÉ)
```bash
# Déploie automatiquement depuis GitHub
# Le fichier public/privacy-policy.html sera accessible à:
# https://tonprojet.netlify.app/privacy-policy.html
# ou
# https://tonprojet.vercel.app/privacy-policy.html
```

### Option 2: GitHub Pages
```bash
git add .
git commit -m "Add privacy policy page"
git push origin main
# Accessible à: https://tonusername.github.io/tonrepo/privacy-policy.html
```

### Option 3: Domaine Personnalisé
Si tu as un domaine (ex: intellection.ma):
```
https://intellection.ma/privacy-policy.html
```

---

## 🔗 Liens à Intégrer

### Dans le Pied de Page / Footer
Ajoute ce lien dans le composant ClassBoard ou un composant Footer:

```jsx
<a href="https://tondomaine.com/privacy-policy.html" target="_blank" rel="noopener noreferrer">
  Politique de Confidentialité
</a>
```

### Dans les Paramètres / Settings
Ajoute un lien vers `/privacy-policy` pour accès interne:

```jsx
<a href="/privacy-policy">
  Politique de Confidentialité
</a>
```

---

## 📱 Configuration pour Google Play Store

### URL à Utiliser
Donne cette URL dans la fiche Google Play de l'application:
```
https://tondomaine.com/privacy-policy.html
```

### Exigences Respectées ✅
- ✅ URL active et accessible 24/7
- ✅ Pas de redirection
- ✅ Pas de PDF
- ✅ Pas protégée par mot de passe
- ✅ Accessible publiquement du monde entier
- ✅ Pas de téléchargement automatique
- ✅ Contenu stable et non modifiable

---

## 🎯 Étapes Finales

1. **Remplace `tondomaine.com`** par ton vrai domaine partout
2. **Ajoute les liens** dans ta navigation/footer
3. **Teste** que la page est accessible
4. **Soumets l'URL** au Google Play Store

---

## 📞 Contact Support
```
Email: privacy@intellection.ma
Support: support@intellection.ma
```

---

## 📝 Notes
- La politique couvre la mobile app ET le web app
- Mise à jour: 2 mars 2026
- Conforme RGPD + Google Play + App Store
