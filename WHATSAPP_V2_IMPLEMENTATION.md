# 🚀 WhatsApp Automation V2 - Implémentation Complète

## 📅 Date: April 11, 2026
## 🎯 Version: 2.0 - Envoi aux groupes WhatsApp existants

---

## ✨ Changements Majeurs

### Avant (V1 - Abandonnée)
- ❌ Twilio (impossible d'envoyer aux groupes)
- ❌ Schéma complexe (groupes par centre/niveau)
- ❌ Pas de PDFs

### Après (V2 - Actuelle)
- ✅ whatsapp-web.js (accès direct aux groupes WhatsApp)
- ✅ Scan QR code (connexion au propre compte WhatsApp)
- ✅ Envoi de PDFs
- ✅ Interface intuitive et complète

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│   ClassBoard Frontend            │
│ (React + Firebase)              │
│                                 │
│ - Upload PDF → Firebase Storage  │
│ - Créer jobs (Firestore)         │
│ - Tester envois                  │
│ - Voir logs                      │
└────────────┬────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │  Firebase          │
    │ ┌────────────────┐ │
    │ │ Firestore:     │ │
    │ │ - jobs/        │ │
    │ │ - logs/        │ │
    │ └────────────────┘ │
    │ ┌────────────────┐ │
    │ │ Storage:       │ │
    │ │ - PDFs         │ │
    │ └────────────────┘ │
    └────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │  Bot Node.js       │
    │  (localhost:3001)  │
    │                    │
    │ - whatsapp-web.js  │
    │ - Express API      │
    │ - node-cron        │
    └────────────┬───────┘
                 │
                 ↓
         ┌──────────────┐
         │  WhatsApp    │
         │  (groupes)   │
         └──────────────┘
```

---

## 📦 Fichiers Créés

### Backend (nouveau projet)
```
intellection-whatsapp-bot/
├── index.js              (400+ lignes) ← Cœur du bot
├── package.json
├── .env.example
├── README.md
└── sessions/             (auto-généré)
```

### Frontend (modifications)
```
src/
├── WhatsAppAutomationService.js  ← Réécrit (nouveau schéma)
├── WhatsAppAutomationAdmin.jsx   ← Réécrit (4 onglets)
└── (autres fichiers inchangés)
```

### Documentation
```
WHATSAPP_V2_IMPLEMENTATION.md  ← Ce fichier
```

---

## 🚀 Installation & Démarrage

### ÉTAPE 1: Installer le backend

```bash
# Windows PowerShell/CMD
cd C:\Users\Ahmed\Downloads\intellection-whatsapp-bot
npm install
```

### ÉTAPE 2: Configurer Firebase

1. Aller à: https://console.firebase.google.com/
2. Projet → Paramètres → Comptes de service
3. "Générer une nouvelle clé privée"
4. Sauvegarder dans `intellection-whatsapp-bot/serviceAccountKey.json`

### ÉTAPE 3: Lancer le bot

```bash
npm start
```

Vous verrez:
```
📱 Scannez ce code QR avec WhatsApp:
[QR CODE DISPLAYED]
```

### ÉTAPE 4: Scanner le QR code

- Prendre le téléphone
- WhatsApp → Paramètres → Appareils connectés
- Cliquer "Connecter un appareil"
- Scanner le QR code affiché

### ÉTAPE 5: Garder le bot actif

Laissez le terminal ouvert. Le bot tourne en continu et:
- Vérifie les jobs toutes les minutes
- Envoie les PDFs à l'heure programmée
- Enregistre les logs automatiquement

---

## 📱 Utilisation (ClassBoard)

### Créer un emploi du temps:

1. **Dashboard** → Bouton vert "WhatsApp Auto"
2. **Tab "⚙️ Statut"** → Vérifier que le bot est "Connecté ✅"
3. **Tab "➕ Nouveau Job"**:
   ```
   • Nom: "S2 Eco - Matin"
   • PDF: Uploader l'emploi du temps
   • Message: (optionnel)
   • Groupes: Sélectionner 3 groupes WhatsApp
   • Jours: Lundi, Mercredi, Vendredi
   • Heure: 08:00
   • Cliquer "Créer le job"
   ```

### Tester l'envoi:

1. **Tab "📋 Emplois"**
2. Trouver le job
3. Cliquer "Test" → PDF envoyé immédiatement

### Voir les logs:

1. **Tab "📊 Logs"**
2. Voir tous les envois (✅ succès ou ❌ erreur)
3. Voir les timestamps et groupes

### Modifier un job:

1. **Tab "📋 Emplois"**
2. Cliquer "Activer/Désactiver" pour le mettre en pause
3. Cliquer "Supprimer" pour supprimer

---

## 🔄 Flux d'exécution automatique

**Chaque minute, le bot fait:**

```javascript
1. Récupérer tous les jobs actifs de Firestore
2. Pour chaque job:
   a. Vérifier si jour actuel = un des jours du job
   b. Vérifier si heure actuelle = heure du job
   c. Si oui:
      - Télécharger le PDF
      - Pour chaque groupe:
        * Envoyer le PDF
        * Enregistrer succès/erreur dans les logs
      - Mettre à jour lastRun dans Firestore
```

**Exemple:**
```
🚀 Lundi à 08:00:00 exactement
  → Exécution du job "S2 Eco"
  ✅ PDF envoyé au groupe 1
  ✅ PDF envoyé au groupe 2
  ✅ PDF envoyé au groupe 3
  ✅ Job complété
```

---

## 📊 Firestore Schema

### Collection: `whatsapp_automations/jobs/`

```javascript
{
  id: "auto-generated",
  name: "S2 Eco",
  pdfUrl: "https://storage.googleapis.com/...",
  pdfName: "S2_eco.pdf",
  groupIds: ["259@g.us", "333@g.us", "444@g.us"],
  groupNames: ["Groupe S2 - Bloc 1", "Groupe S2 - Bloc 2", "Groupe S2 - Backup"],
  caption: "Employé du temps S2 - Matin",
  days: ["lundi", "mercredi", "vendredi"],
  time: "08:00",
  enabled: true,
  createdAt: timestamp,
  lastRun: timestamp | null,
  updatedAt: timestamp | null
}
```

### Collection: `whatsapp_automations/logs/`

```javascript
{
  id: "auto-generated",
  jobId: "...",
  jobName: "S2 Eco",
  status: "success" | "error",
  groupId: "259@g.us",
  groupName: "Groupe S2 - Bloc 1",
  error: null | "Connection timeout",
  timestamp: timestamp
}
```

---

## ✅ Checklist de Vérification

- [ ] Node.js installé (vérifier: `node --version`)
- [ ] Dossier `intellection-whatsapp-bot/` existe
- [ ] `npm install` exécuté
- [ ] `serviceAccountKey.json` téléchargé et placé
- [ ] `npm start` lancé
- [ ] QR code scanné avec WhatsApp
- [ ] Terminal affiche "✅ Client WhatsApp connecté et prêt!"
- [ ] ClassBoard Dashboard: "Connecté ✅" s'affiche
- [ ] Créer un test job
- [ ] Test d'envoi réussi
- [ ] PDF reçu dans le groupe WhatsApp
- [ ] Log visible dans ClassBoard (Tab "📊 Logs")

---

## 🔐 Sécurité

### ⚠️ Fichiers à PROTÉGER:

```
intellection-whatsapp-bot/serviceAccountKey.json  ← NE PAS partager
.claude/                                          ← Configuration privée
.wwebjs_auth/                                     ← Session WhatsApp
```

### ✅ Sûr à partager:

```
Code source (index.js)
Documentation
Configuration template (.env.example)
```

---

## 🐛 Dépannage Courant

### "Client WhatsApp pas prêt"
```
✓ Le bot n'est pas lancé
Solution: npm start
```

### "Aucun groupe trouvé"
```
✓ Le bot est connecté mais aucun groupe WhatsApp
Solution: Vérifiez être membre d'au moins 1 groupe
```

### "Erreur lors de l'envoi"
```
✓ Vérifiez les logs dans ClassBoard (Tab "📊 Logs")
Solution: Voir le message d'erreur exact
```

### "PDF télécharger très lentement"
```
✓ Problème de connexion internet
Solution: Vérifiez la connexion, réessayez
```

---

## 📈 Cas d'Usage Réels

### Scénario 1: Envoi quotidien avant les cours
```
• Nom: "Emploi du jour"
• Groupes: Tous les niveaux
• Jours: Lun-Ven
• Heure: 07:30
```

### Scénario 2: Envoi hebdomadaire
```
• Nom: "Semaine S2"
• Groupes: Groupes S2 seulement
• Jours: Lundi
• Heure: 08:00
```

### Scénario 3: Envoi double (matin + soir)
```
Job 1:
• Nom: "Emploi - Matin"
• Jours: Lun-Ven
• Heure: 08:00

Job 2:
• Nom: "Emploi - Soir"
• Jours: Lun-Ven
• Heure: 15:00
```

---

## 💾 Sauvegarde & Récupération

### Données sauvegardées:
- ✅ Jobs (Firestore)
- ✅ Logs (Firestore)
- ✅ PDFs (Firebase Storage)

### Données locales (peuvent être supprimées):
- `.wwebjs_auth/` - Session WhatsApp (regénéré au QR scan)
- `node_modules/` - Dépendances (regénéré par `npm install`)

### Récupération en cas de problème:
```bash
# Supprimer les données locales
rm -rf .wwebjs_auth
rm -rf node_modules

# Réinstaller
npm install

# Relancer
npm start
# Scanner à nouveau le QR code
```

---

## 🚀 Améliorations Futures (Optionnel)

- [ ] Interface de modification des jobs
- [ ] Envois groupés (plusieurs jobs à la fois)
- [ ] Modèles de message customisés
- [ ] Notifications d'erreur par email/WhatsApp
- [ ] Dashboard analytics
- [ ] Export des logs en CSV
- [ ] Planification via interface (pas via fichier)
- [ ] Support des images dans les messages
- [ ] Déploiement sur cloud (AWS, Heroku, etc.)

---

## 📞 Support

### Pour les erreurs du bot:
```
1. Vérifiez les logs dans le terminal
2. Vérifiez les logs dans ClassBoard (Tab "📊 Logs")
3. Consultez le README.md du bot
4. Regardez le guide "⚙️ Statut" dans ClassBoard
```

### Pour les erreurs de ClassBoard:
```
1. Vérifiez que le bot est lancé
2. Vérifiez la connexion Firebase
3. Consultez la console du navigateur (F12)
4. Vérifiez que le PDF upload est complet
```

---

## 🎉 Résumé

Vous avez maintenant un **système complet et automatisé** pour:
1. ✅ Uploader des emplois du temps (PDFs)
2. ✅ Les lier à des groupes WhatsApp
3. ✅ Les envoyer automatiquement selon un calendrier
4. ✅ Suivre tous les envois dans les logs
5. ✅ Tester les envois manuellement

**Le système tourne 24/7** et exécute les envois automatiquement. Vous n'avez qu'à configurer une fois et c'est bon! 🚀

---

## 📝 Fichiers Importants

| Fichier | Rôle |
|---------|------|
| `intellection-whatsapp-bot/index.js` | Cœur du bot (whatsapp-web.js + node-cron) |
| `src/WhatsAppAutomationService.js` | Accès Firebase + upload PDF |
| `src/WhatsAppAutomationAdmin.jsx` | Interface admin (4 onglets) |
| `src/ClassBoard.jsx` | Point d'entrée (contient le bouton) |
| `intellection-whatsapp-bot/README.md` | Guide du bot |

---

**Prêt à lancer?** 🚀

```bash
cd C:\Users\Ahmed\Downloads\intellection-whatsapp-bot
npm install
npm start
```

Bon courage! 💪
