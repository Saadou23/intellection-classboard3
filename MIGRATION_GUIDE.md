# 🎓 INTELLECTION CLASSBOARD v2.0 - GUIDE DE MIGRATION

## 📋 Changements dans votre projet

Votre projet a été mis à jour de la v1.0 vers la v2.0 avec les nouvelles fonctionnalités suivantes :

### ✨ Nouvelles fonctionnalités ajoutées

1. **Dashboard Optimisé** avec analytics avancés
2. **Export PDF** (par centre et par professeur)
3. **Liens publics partageables** pour étudiants
4. **Pages publiques** d'affichage des emplois du temps
5. **Export Excel** amélioré

---

## 🚀 INSTALLATION - ÉTAPES SIMPLES

### Étape 1 : Sauvegarder votre ancien projet

```bash
# Créer une copie de sauvegarde
cp -r intellection-classboard2-main intellection-classboard2-main-backup
```

### Étape 2 : Remplacer les fichiers

Dans le ZIP que vous avez téléchargé, vous trouverez le dossier complet mis à jour.

**Fichiers modifiés :**
- ✅ `src/App.jsx` - Maintenant avec React Router
- ✅ `src/ClassBoard.jsx` - Votre ancien App.jsx renommé (utilise DashboardOptimized)
- ✅ `package.json` - Ajout de react-router-dom

**Nouveaux fichiers :**
- 🆕 `src/DashboardOptimized.jsx` - Nouveau dashboard
- 🆕 `src/PublicSchedule.jsx` - Page publique emploi complet
- 🆕 `src/PublicToday.jsx` - Page publique séances du jour
- 🆕 `scripts/generate_schedule_pdf.py` - Génération PDF
- 🆕 `api/generate-schedule-pdf.js` - API Vercel (optionnel)

### Étape 3 : Installer les dépendances

```bash
cd intellection-classboard2-main
npm install
```

Cela va automatiquement installer `react-router-dom` qui est maintenant dans le package.json.

### Étape 4 : Installer Python reportlab (optionnel - pour PDF)

```bash
pip install reportlab --break-system-packages
```

**Note :** Cette étape est optionnelle. Les pages publiques ont déjà une fonction d'impression optimisée qui crée des PDFs via le navigateur.

### Étape 5 : Tester localement

```bash
npm run dev
```

Ouvrez http://localhost:5173 et testez :

1. ✅ Connexion admin
2. ✅ Dashboard avec nouveaux boutons (Export PDF, Liens Publics, Excel)
3. ✅ Affichage étudiant (comme avant)

### Étape 6 : Tester les pages publiques

Dans votre navigateur, testez ces URLs :

```
http://localhost:5173/public/schedule
http://localhost:5173/public/schedule?branch=Hay%20Salam
http://localhost:5173/public/schedule?level=1ère%20année
http://localhost:5173/public/today
http://localhost:5173/public/today?branch=Doukkali
```

### Étape 7 : Déployer sur Vercel

```bash
npm run build
vercel --prod
```

---

## 📂 Structure du projet mis à jour

```
intellection-classboard2-main/
├── src/
│   ├── App.jsx                      ← MODIFIÉ (avec routes)
│   ├── ClassBoard.jsx               ← NOUVEAU (ancien App.jsx)
│   ├── Dashboard.jsx                ← CONSERVÉ (ancien dashboard)
│   ├── DashboardOptimized.jsx       ← NOUVEAU
│   ├── PublicSchedule.jsx           ← NOUVEAU
│   ├── PublicToday.jsx              ← NOUVEAU
│   ├── firebase.js                  ← INCHANGÉ
│   ├── App.css                      ← INCHANGÉ
│   ├── index.css                    ← INCHANGÉ
│   └── main.jsx                     ← INCHANGÉ
├── api/
│   └── generate-schedule-pdf.js     ← NOUVEAU (optionnel)
├── scripts/
│   └── generate_schedule_pdf.py     ← NOUVEAU (optionnel)
├── public/                          ← INCHANGÉ
├── package.json                     ← MODIFIÉ (+ react-router-dom)
├── package-lock.json                ← Se régénère automatiquement
├── vite.config.js                   ← INCHANGÉ
├── tailwind.config.js               ← INCHANGÉ
├── postcss.config.js                ← INCHANGÉ
└── index.html                       ← INCHANGÉ
```

---

## 🎯 Comment utiliser les nouvelles fonctionnalités

### 1. Dashboard Optimisé

**Accès :** Login Admin → Cliquer sur "Dashboard"

**Nouvelles options disponibles :**

#### A. Export PDF
Cliquez sur "Export PDF" → Menu déroulant :
- **Par Centre** : Génère un PDF pour chaque filiale (Hay Salam, Doukkali, Saada)
- **Par Professeur** : Génère un PDF avec l'emploi du temps d'un prof spécifique

**Note :** Si vous n'avez pas installé Python reportlab, utilisez plutôt les pages publiques (elles ont un bouton "Imprimer" qui génère des PDFs via le navigateur).

#### B. Liens Publics
Cliquez sur "Liens Publics" → Menu avec 3 sections :
1. **Séances du jour** - Lien par filiale
2. **Par Filiale** - Emploi complet d'une filiale
3. **Par Niveau** - Emploi filtré par niveau

**Action :** Un clic copie le lien dans le presse-papiers. Vous pouvez ensuite le partager via WhatsApp, email, etc.

#### C. Export Excel
Cliquez sur "Excel" → Téléchargement automatique d'un fichier CSV avec :
- Résumé par filiale
- Détails par jour
- Opportunités d'optimisation

### 2. Pages Publiques pour Étudiants

#### A. Emploi du temps complet
**URL :** `https://votre-site.vercel.app/public/schedule`

**Filtres disponibles :**
- Par filiale : `?branch=Hay%20Salam`
- Par niveau : `?level=1ère%20année`
- Les deux : `?level=1ère%20année&branch=Hay%20Salam`

**Fonctionnalités :**
- Affichage responsive (mobile, tablette, desktop)
- Filtrage dynamique par niveau
- Bouton "Imprimer / PDF" pour générer un PDF
- Statuts en temps réel (annulé, retardé, etc.)

#### B. Séances du jour
**URL :** `https://votre-site.vercel.app/public/today`

**Filtres disponibles :**
- Par filiale : `?branch=Doukkali`

**Fonctionnalités :**
- Mise à jour en temps réel avec Firebase
- Horloge en direct
- Highlight des séances en cours (en vert)
- Parfait pour affichage sur TV/tablette
- Bouton "Imprimer" pour générer un PDF

---

## 🔄 Différences par rapport à la v1.0

| Fonctionnalité | v1.0 | v2.0 |
|----------------|------|------|
| **Structure fichiers** | Un seul App.jsx | App.jsx (routes) + ClassBoard.jsx |
| **Dashboard** | Basique avec analytics | Optimisé avec exports |
| **Partage étudiants** | Pas de solution | Liens publics automatiques |
| **PDF** | Pas disponible | Export pro + impression navigateur |
| **Pages publiques** | Non | 2 pages dédiées |
| **Excel** | Export simple | Export détaillé avec analytics |
| **Routing** | Aucun | React Router |

---

## ⚡ Quick Start (résumé)

```bash
# 1. Extraire le nouveau projet
unzip intellection-classboard-v2.zip

# 2. Aller dans le dossier
cd intellection-classboard-v2

# 3. Installer les dépendances
npm install

# 4. (Optionnel) Installer reportlab pour PDF
pip install reportlab --break-system-packages

# 5. Lancer en dev
npm run dev

# 6. Tester
# - http://localhost:5173 (admin)
# - http://localhost:5173/public/schedule (public)
# - http://localhost:5173/public/today (aujourd'hui)

# 7. Build et deploy
npm run build
vercel --prod
```

---

## 🔐 Configuration Firebase (IMPORTANT)

Pour que les pages publiques fonctionnent, vos règles Firestore doivent autoriser la lecture publique :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /branches/{branch} {
      // ✅ Lecture publique (pour pages publiques)
      allow read: if true;
      
      // 🔒 Écriture seulement pour admins
      allow write: if request.auth != null;
    }
    
    match /settings/{setting} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Comment mettre à jour les règles :**
1. Aller sur https://console.firebase.google.com
2. Sélectionner votre projet
3. Firestore Database → Rules
4. Copier-coller les règles ci-dessus
5. Publier

---

## 🎨 Personnalisation

### Modifier les filiales

Dans `ClassBoard.jsx` et `DashboardOptimized.jsx`, cherchez :
```javascript
const branches = ['Hay Salam', 'Doukkali', 'Saada'];
```

### Modifier les horaires d'ouverture

Dans `DashboardOptimized.jsx`, cherchez :
```javascript
const openingHours = {
  0: { start: 9, end: 22, hours: 13 },  // Dimanche
  1: { start: 16, end: 22, hours: 6 },  // Lundi
  // ...
};
```

### Modifier le nombre de salles par filiale

Dans `DashboardOptimized.jsx`, cherchez :
```javascript
const branchConfig = {
  'Hay Salam': { rooms: 8, color: 'blue' },
  'Doukkali': { rooms: 4, color: 'green' },
  'Saada': { rooms: 4, color: 'purple' }
};
```

---

## 🆘 Dépannage

### Problème : "react-router-dom not found"

```bash
npm install react-router-dom
```

### Problème : Les routes ne fonctionnent pas sur Vercel

Créer un fichier `vercel.json` à la racine :
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Problème : Firebase ne se connecte pas

Vérifier `src/firebase.js` et les règles Firestore (voir section Configuration Firebase).

### Problème : Le PDF ne se génère pas

**Solution simple :** Utilisez le bouton "Imprimer / PDF" des pages publiques. C'est plus simple et ça fonctionne sans Python.

**Solution avancée :** Installer reportlab : `pip install reportlab --break-system-packages`

---

## 📞 Support

**Documentation complète :** Voir `README.md` dans le projet

**Vérifications de base :**
1. Console navigateur (F12) pour voir les erreurs
2. Firebase Console pour vérifier les données
3. Logs Vercel pour le déploiement

---

## 🎉 C'est tout !

Votre projet est maintenant mis à jour avec toutes les nouvelles fonctionnalités.

**Prochaine étape :** Testez localement avec `npm run dev` puis déployez sur Vercel avec `vercel --prod`.

---

**Version 2.0** • Janvier 2025 • Made with ❤️ for INTELLECTION 🇲🇦
