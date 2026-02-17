# INTELLECTION CLASSBOARD - Dashboard Optimisé
## Guide d'installation et de configuration

### 📋 Nouvelles fonctionnalités

1. **Dashboard Optimisé** avec analytics avancés
2. **Génération PDF** d'emplois du temps (par centre, par prof)
3. **Liens partageables** pour étudiants
4. **Pages publiques** d'affichage
5. **Export Excel** amélioré

---

## 🚀 Installation

### 1. Dépendances React

```bash
npm install react-router-dom
```

### 2. Dépendances Python (pour génération PDF)

```bash
pip install reportlab --break-system-packages
```

---

## 📁 Structure des fichiers

```
intellection-classboard/
├── src/
│   ├── App.jsx                      # App principal avec routes
│   ├── ClassBoard.jsx               # Composant principal existant
│   ├── Dashboard.jsx                # Ancien dashboard (garder pour compatibilité)
│   ├── DashboardOptimized.jsx       # Nouveau dashboard avec exports
│   ├── PublicSchedule.jsx           # Page publique emploi complet
│   ├── PublicToday.jsx              # Page publique séances du jour
│   └── firebase.js                  # Configuration Firebase
├── api/
│   └── generate-schedule-pdf.js     # API Vercel pour PDF
├── scripts/
│   └── generate_schedule_pdf.py     # Script Python génération PDF
└── package.json
```

---

## 🔧 Configuration

### 1. Modifier App.jsx

Remplacer votre `App.jsx` actuel par le contenu de `App-with-routes.jsx` :

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClassBoard from './ClassBoard';
import PublicSchedule from './PublicSchedule';
import PublicToday from './PublicToday';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClassBoard />} />
        <Route path="/public/schedule" element={<PublicSchedule />} />
        <Route path="/public/today" element={<PublicToday />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### 2. Modifier ClassBoard.jsx

Dans votre fichier `ClassBoard.jsx`, remplacer l'import du Dashboard :

```jsx
// Ancien
import Dashboard from './Dashboard';

// Nouveau
import Dashboard from './DashboardOptimized';
```

### 3. Configurer l'API Vercel (optionnel pour PDF)

Si vous voulez la génération PDF côté serveur :

1. Créer le dossier `api/` à la racine du projet
2. Placer `generate-schedule-pdf.js` dedans
3. Créer le dossier `scripts/` et y placer `generate_schedule_pdf.py`

---

## 🌐 Routes publiques

### URLs générées automatiquement :

#### 1. Séances du jour
- **Format** : `/public/today?branch=NOM_FILIALE`
- **Exemples** :
  - `https://votre-domaine.vercel.app/public/today?branch=Hay%20Salam`
  - `https://votre-domaine.vercel.app/public/today?branch=Doukkali`
  - `https://votre-domaine.vercel.app/public/today?branch=Saada`

#### 2. Emploi complet par filiale
- **Format** : `/public/schedule?branch=NOM_FILIALE`
- **Exemples** :
  - `https://votre-domaine.vercel.app/public/schedule?branch=Hay%20Salam`

#### 3. Emploi par niveau
- **Format** : `/public/schedule?level=NOM_NIVEAU`
- **Exemple** :
  - `https://votre-domaine.vercel.app/public/schedule?level=1ère%20année`

#### 4. Emploi par niveau ET filiale
- **Format** : `/public/schedule?level=NOM_NIVEAU&branch=NOM_FILIALE`
- **Exemple** :
  - `https://votre-domaine.vercel.app/public/schedule?level=1ère%20année&branch=Hay%20Salam`

---

## 🎨 Fonctionnalités du Dashboard Optimisé

### 1. Export PDF

**Bouton "Export PDF"** → Menu déroulant avec :
- **Par Centre** : Génère un PDF de l'emploi complet pour chaque filiale
- **Par Professeur** : Génère un PDF avec toutes les séances d'un prof

**Format du PDF** :
- Paysage A4 pour lisibilité maximale
- Organisé par jour de la semaine
- Tableaux professionnels avec codes couleur
- En-tête et pied de page branded

### 2. Liens Publics

**Bouton "Liens Publics"** → Menu avec :
- **Séances du jour** : Lien par filiale pour afficher les cours d'aujourd'hui
- **Par Filiale** : Lien vers l'emploi complet
- **Par Niveau** : Lien filtré pour un niveau spécifique

**Action** : Clic → Copie automatique du lien dans le presse-papiers

### 3. Export Excel

Génère un fichier CSV avec :
- Résumé par filiale
- Détails par jour et filiale
- Opportunités d'optimisation détectées

---

## 📱 Pages publiques

### PublicSchedule

**Fonctionnalités** :
- Affichage responsive de l'emploi du temps
- Filtrage dynamique par niveau
- Bouton d'impression optimisé
- Design étudiant-friendly

**Statuts affichés** :
- ✅ À venir (bleu)
- 🟢 En cours (vert)
- ⏸️ Terminée (gris)
- ❌ Annulée (rouge)
- ⚠️ Retardée (orange)
- 👤 Prof absent (rouge avec info rattrapage)

### PublicToday

**Fonctionnalités** :
- Mise à jour en temps réel avec Firebase
- Horloge en direct
- Détection automatique des séances en cours
- Highlight des séances actuelles
- Optimisé pour écrans TV/tablettes

**Auto-refresh** : Connexion Firebase en temps réel

---

## 🎯 Utilisation

### Pour les administrateurs

1. **Accéder au Dashboard** :
   - Connexion admin → Dashboard
   
2. **Générer des PDF** :
   - Cliquer sur "Export PDF"
   - Choisir par Centre ou par Professeur
   - Le PDF se télécharge automatiquement

3. **Partager avec les étudiants** :
   - Cliquer sur "Liens Publics"
   - Choisir le type de lien
   - Le lien est copié automatiquement
   - Partager via WhatsApp, email, etc.

### Pour les étudiants

1. **Consulter les séances du jour** :
   - Utiliser le lien fourni par l'admin
   - Voir les séances en temps réel
   - Imprimer si nécessaire

2. **Consulter l'emploi complet** :
   - Utiliser le lien fourni
   - Filtrer par niveau si nécessaire
   - Imprimer pour garder une copie

---

## 🖨️ Impression optimisée

Les pages publiques sont optimisées pour l'impression :

- **Marges** : Automatiquement ajustées
- **Couleurs** : Optimisées pour impression N&B
- **Pagination** : Évite les coupures au milieu des séances
- **En-tête/Pied de page** : Branded INTELLECTION
- **Format** : A4 portrait

**Astuce** : Utiliser "Imprimer" puis "Enregistrer en PDF" dans le navigateur pour créer un PDF depuis la page publique.

---

## 🔐 Sécurité

### Pages publiques
- **Lecture seule** : Aucune modification possible
- **Pas d'authentification** : Accessible à tous (comme prévu)
- **Données en temps réel** : Via Firebase (règles déjà configurées)

### Dashboard admin
- **Authentification requise** : Comme actuellement
- **Génération PDF** : Côté serveur pour sécurité

---

## 📊 Analytics du Dashboard

Le Dashboard Optimisé calcule automatiquement :

1. **Taux d'occupation** par filiale et par jour
2. **Heures disponibles** pour nouveaux cours
3. **Créneaux sous-utilisés** (<60% occupation)
4. **Nombre de cours supplémentaires possibles**
5. **Vue d'aujourd'hui** avec détails

**Codes couleur** :
- 🟢 Vert : ≥70% occupation (optimal)
- 🟡 Jaune : 50-69% occupation (correct)
- 🔴 Rouge : <50% occupation (sous-utilisé)

---

## 🚀 Déploiement Vercel

### Mise à jour du déploiement actuel

```bash
# 1. Installer les nouvelles dépendances
npm install react-router-dom

# 2. Copier les nouveaux fichiers
# - DashboardOptimized.jsx → src/
# - PublicSchedule.jsx → src/
# - PublicToday.jsx → src/
# - Modifier App.jsx et ClassBoard.jsx

# 3. Déployer
vercel --prod
```

### Configuration Vercel (pour PDF)

Si vous activez la génération PDF :

**vercel.json** :
```json
{
  "functions": {
    "api/generate-schedule-pdf.js": {
      "maxDuration": 30
    }
  },
  "builds": [
    {
      "src": "scripts/generate_schedule_pdf.py",
      "use": "@vercel/python"
    }
  ]
}
```

---

## 🎉 Résumé des améliorations

| Fonctionnalité | Avant | Après |
|---|---|---|
| **Dashboard** | Analytics basiques | Analytics + Export PDF + Liens |
| **Partage** | Manuel | Liens automatiques |
| **Emploi étudiants** | PDF manuel | Page web dynamique |
| **Séances du jour** | Écran admin seulement | Page publique dédiée |
| **Impression** | Basique | Optimisée professionnelle |
| **Export données** | CSV simple | CSV détaillé + PDF |

---

## 💡 Prochaines étapes suggérées

1. **Notifications WhatsApp** : Intégrer Twilio pour rappels automatiques
2. **Application mobile** : React Native pour étudiants
3. **QR Codes** : Générer des QR codes pour accès rapide
4. **Statistiques avancées** : Taux de présence, prof les plus sollicités
5. **Mode sombre** : Pour les écrans d'affichage nocturnes

---

## 🆘 Dépannage

### Problème : Les routes ne fonctionnent pas

**Solution** : Vérifier que `react-router-dom` est installé :
```bash
npm list react-router-dom
```

### Problème : Firebase ne se connecte pas

**Solution** : Vérifier `firebase.js` et les règles Firestore :
```javascript
// Firestore Rules pour lecture publique
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /branches/{branch} {
      allow read: if true;  // Lecture publique
      allow write: if request.auth != null;  // Écriture authentifiée
    }
  }
}
```

### Problème : PDF ne se génère pas

**Solution** : La génération PDF nécessite une configuration serveur. Alternatives :
1. Utiliser l'impression du navigateur (fonctionnalité déjà incluse)
2. Configurer l'API Vercel avec Python runtime
3. Utiliser une bibliothèque PDF côté client (jsPDF)

---

## 📞 Support

Pour toute question ou problème, vérifier :
1. Console du navigateur (F12)
2. Logs Vercel
3. Firebase Console

---

**Version** : 2.0  
**Date** : Janvier 2025  
**Auteur** : Claude pour INTELLECTION
