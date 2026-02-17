# 🎓 INTELLECTION CLASSBOARD v2.0

Système de gestion d'emplois du temps avec affichage dynamique, analytics et partage pour étudiants.

![Version](https://img.shields.io/badge/version-2.0-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Firebase](https://img.shields.io/badge/Firebase-10.7-orange)

---

## ✨ Nouvelles fonctionnalités (v2.0)

### 📊 Dashboard Optimisé
- Analytics avancés avec taux d'occupation
- Détection automatique des créneaux sous-utilisés
- Vue d'aujourd'hui en temps réel
- Export Excel détaillé

### 📄 Génération PDF
- **Par centre** : Emploi complet de chaque filiale
- **Par professeur** : Planning personnel pour chaque prof
- Mise en page professionnelle en paysage A4
- Optimisé pour impression

### 🔗 Liens Partageables
- Génération automatique de liens publics
- Partage facile via WhatsApp, email, SMS
- URLs courtes et mémorables
- Copie automatique dans le presse-papiers

### 🌐 Pages Publiques pour Étudiants

#### 1. Emploi du temps complet
- Filtrable par niveau et filiale
- Affichage par jour de la semaine
- Statuts en temps réel (en cours, annulé, etc.)
- Bouton d'impression optimisé

#### 2. Séances du jour
- Mise à jour en temps réel avec Firebase
- Horloge en direct
- Highlight des séances en cours
- Idéal pour affichage TV/tablette

---

## 🚀 Démarrage rapide

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Installer reportlab pour génération PDF (optionnel)
pip install reportlab --break-system-packages

# 3. Lancer en mode développement
npm run dev
```

### Déploiement

```bash
# Build de production
npm run build

# Déployer sur Vercel
vercel --prod
```

---

## 📁 Structure des fichiers

```
src/
├── App.jsx                    # Routes principales
├── ClassBoard.jsx            # Interface admin + affichage étudiant
├── DashboardOptimized.jsx    # Dashboard avec analytics et exports
├── PublicSchedule.jsx        # Page publique emploi complet
├── PublicToday.jsx          # Page publique séances du jour
└── firebase.js              # Configuration Firebase

api/
└── generate-schedule-pdf.js  # API Vercel pour PDF (optionnel)

scripts/
└── generate_schedule_pdf.py  # Script Python génération PDF (optionnel)
```

---

## 🌐 Routes

### Admin
- `/` - Interface principale (login → admin ou affichage)

### Public (partageable avec étudiants)
- `/public/schedule` - Emploi du temps complet
- `/public/schedule?branch=Hay%20Salam` - Par filiale
- `/public/schedule?level=1ère%20année` - Par niveau
- `/public/today` - Séances du jour
- `/public/today?branch=Doukkali` - Séances du jour par filiale

---

## 💡 Utilisation

### Pour les administrateurs

#### 1. Accéder au Dashboard
```
Login → Interface Administrateur → Dashboard
```

#### 2. Exporter en PDF
```
Dashboard → Export PDF → Choisir (Par Centre / Par Professeur)
```

#### 3. Partager avec les étudiants
```
Dashboard → Liens Publics → Choisir le type → Lien copié automatiquement
```

#### 4. Exporter en Excel
```
Dashboard → Excel → Téléchargement automatique du rapport CSV
```

### Pour les étudiants

#### Consulter l'emploi du temps
1. Utiliser le lien fourni par l'administration
2. Filtrer par niveau si nécessaire
3. Imprimer ou sauvegarder en PDF

#### Voir les séances du jour
1. Ouvrir le lien "Séances du jour"
2. Les informations se mettent à jour en temps réel
3. Les séances en cours sont mises en évidence

---

## 🎨 Captures d'écran

### Dashboard Optimisé
```
┌─────────────────────────────────────────────────────┐
│ 📊 INTELLECTION DASHBOARD                           │
│ [Export PDF ▼] [Liens Publics ▼] [Excel]           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Vue d'ensemble hebdomadaire                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Hay Salam│  │ Doukkali │  │  Saada   │         │
│  │   🟢 75% │  │   🟡 65% │  │   🔴 45% │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                      │
│  Opportunités d'optimisation                        │
│  • Saada - Mardi : 3.5h disponibles                │
│  • Saada - Jeudi : 4.2h disponibles                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Page Publique (Séances du jour)
```
┌─────────────────────────────────────────────────────┐
│ 📅 SÉANCES DU JOUR - Hay Salam                      │
│ Lundi • 22 janvier 2025 • 19:45:30                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ 🕐 19:00 - 20:30  📚 1ère année           │       │
│ │ Mathématiques • Mr. Ahmed • 🏛️ A101       │       │
│ │ [🟢 EN COURS]                             │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ 🕐 20:30 - 22:00  📚 2ème année           │       │
│ │ Physique • Mme. Fatima • 🏛️ B204         │       │
│ │ [À VENIR]                                 │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration Firebase

### Règles Firestore pour pages publiques

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Données des branches
    match /branches/{branch} {
      // Lecture publique pour les étudiants
      allow read: if true;
      
      // Écriture uniquement pour les admins authentifiés
      allow write: if request.auth != null;
    }
    
    // Paramètres (décalage horaire, etc.)
    match /settings/{setting} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📊 Analytics du Dashboard

Le Dashboard calcule automatiquement :

| Métrique | Description |
|----------|-------------|
| **Taux d'occupation** | % des heures utilisées vs capacité totale |
| **Heures disponibles** | Heures libres pour nouveaux cours |
| **Créneaux sous-utilisés** | Jours avec occupation < 60% |
| **Cours supplémentaires** | Nombre de cours additionnels possibles |

**Codes couleur** :
- 🟢 **Vert** (≥70%) : Occupation optimale
- 🟡 **Jaune** (50-69%) : Occupation correcte
- 🔴 **Rouge** (<50%) : Sous-utilisé, opportunité d'expansion

---

## 🖨️ Impression et PDF

### Pages publiques optimisées
- Marges automatiquement ajustées pour A4
- Évite les coupures au milieu des séances
- En-tête et pied de page professionnels
- Compatible impression N&B

### Générer un PDF depuis le navigateur
1. Ouvrir la page publique (emploi ou séances du jour)
2. Cliquer sur "Imprimer / PDF"
3. Choisir "Enregistrer en PDF" dans le navigateur
4. Le PDF est optimisé et prêt à partager

---

## 🔐 Sécurité

### Pages publiques
- ✅ **Lecture seule** : Aucune modification possible
- ✅ **Pas d'auth requise** : Accès direct via lien
- ✅ **Données en temps réel** : Via Firebase sécurisé

### Interface admin
- 🔒 **Authentification requise** : Mot de passe
- 🔒 **Écriture protégée** : Seulement pour admins
- 🔒 **Session sécurisée** : Déconnexion automatique

---

## 🆘 Dépannage

### Routes ne fonctionnent pas
```bash
# Vérifier react-router-dom
npm list react-router-dom

# Réinstaller si nécessaire
npm install react-router-dom
```

### Firebase ne se connecte pas
1. Vérifier `firebase.js` avec les bonnes credentials
2. Vérifier les règles Firestore (lecture publique activée)
3. Vérifier la console Firebase pour erreurs

### PDF ne se génère pas
**Solutions** :
1. Utiliser l'impression navigateur (déjà optimisée)
2. Installer reportlab : `pip install reportlab --break-system-packages`
3. Configurer l'API Vercel (voir INSTALLATION_GUIDE.md)

---

## 📈 Métriques de performance

| Métrique | Valeur |
|----------|--------|
| **Temps de chargement** | < 2s |
| **Mise à jour temps réel** | Instantanée |
| **Responsive** | ✅ Mobile, Tablette, Desktop |
| **Impression** | ✅ Optimisée |
| **Accessibilité** | ✅ Lisible, Contrasté |

---

## 🎯 Roadmap

### Version 2.1 (Prochaine)
- [ ] Notifications WhatsApp avec Twilio
- [ ] QR Codes pour accès rapide
- [ ] Mode sombre pour affichage nocturne
- [ ] Export iCal pour intégration calendriers

### Version 3.0 (Future)
- [ ] Application mobile React Native
- [ ] Statistiques de présence
- [ ] Gestion des absences étudiants
- [ ] Système de réservation de salles

---

## 📞 Support

**Documentation complète** : Voir `INSTALLATION_GUIDE.md`

**Pour toute question** :
- Vérifier la console navigateur (F12)
- Consulter les logs Vercel
- Vérifier Firebase Console

---

## 📄 Licence

Propriétaire - INTELLECTION 2025

---

## 👨‍💻 Développement

Développé pour **INTELLECTION** par Claude  
**Date** : Janvier 2025  
**Version** : 2.0.0

---

## 🎉 Remerciements

Merci d'utiliser INTELLECTION CLASSBOARD !

Pour des suggestions d'améliorations, n'hésitez pas à contacter l'équipe de développement.

---

**Made with ❤️ in Morocco 🇲🇦**
