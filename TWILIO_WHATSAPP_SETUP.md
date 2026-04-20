# Setup WhatsApp Automation avec Twilio

## 🚀 Guide d'installation complet

### Phase 1: Créer un compte Twilio

1. **Aller sur** https://www.twilio.com/console
2. **S'enregistrer** (gratuit, nécessite une carte bancaire pour débloquer prod)
3. **Vérifier l'email** et créer le compte
4. **Aller au Dashboard**: https://www.twilio.com/console

### Phase 2: Activer WhatsApp Sandbox

1. Dans le Dashboard, aller à **Messaging → WhatsApp**
2. Cliquer sur **Get Started**
3. Choisir **Sandbox** (pour développement/test)

#### Configuration Sandbox:
- **Twilio WhatsApp Number**: `whatsapp:+1415555261` (Twilio fournit ce numéro)
- **Sandbox Code**: Vous recevrez un code à envoyer au numéro
- **Approuver les numéros à tester**: Ajouter vos numéros personnels

#### Approuver un numéro:
1. Envoyer ce message au numéro Twilio fourni:
```
join [SANDBOX_CODE]
```
2. Exemple: `join gentle-ocean`
3. Vous recevrez une confirmation WhatsApp

### Phase 3: Récupérer vos credentials Twilio

1. Aller à **Account → API keys & tokens**
2. Copier:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. Aller à **Messaging → WhatsApp → Sandbox Settings**
4. Copier le **Twilio WhatsApp Number**: (ex: `whatsapp:+1415552671`)

### Phase 4: Configurer les variables d'environnement

Créer/modifier le fichier `.env.local` à la racine du projet:

```env
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1415552671
```

**IMPORTANT**: 
- Ces variables doivent commencer par `VITE_` pour être accessibles en frontend (Vite)
- Ne PAS committer le `.env.local` (ajouter à `.gitignore`)
- Garder ces infos secrètes!

### Phase 5: Tester la connexion

1. Aller dans **Dashboard → WhatsApp Automation** (Admin)
2. Cliquer sur **Ajouter un groupe WhatsApp**
3. Remplir:
   - **Centre**: Sélectionner un centre
   - **Niveau**: Sélectionner un niveau
   - **Numéro WhatsApp**: Votre numéro de test (ex: `+212612345678`)
4. Cliquer sur **Ajouter le groupe**
5. Cliquer sur **Test** pour envoyer un message de test

#### Résultat attendu:
- ✅ Message reçu sur WhatsApp
- ✅ Log créé automatiquement
- ❌ Si rien ne se passe: Vérifier que le numéro a joiné le sandbox

### Phase 6: Créer un horaire d'envoi automatique

1. Aller à l'onglet **⏰ Horaires**
2. Créer un nouvel horaire:
   - **Centre**: Sélectionner
   - **Niveau**: Sélectionner
   - **Jours**: Sélectionner les jours (ex: lundi, mercredi, vendredi)
   - **Heure**: Heure d'envoi (ex: 08:00)
3. Cliquer sur **Créer l'horaire**

#### Comment ça marche:
- L'horaire s'enregistre dans Firebase
- Le système vérifie chaque minute si un envoi doit être fait
- Quand c'est l'heure et le bon jour: génère le PDF + envoie à tous les groupes du Centre/Niveau
- Chaque envoi est enregistré dans les logs

---

## 📋 Configuration Firebase (Structure)

Les données sont stockées dans Firestore:

```
whatsapp_automations/
├─ groups/
│  └─ active/
│     ├─ doc1: {
│        "centreNiveau": "Marrakech-1ère Année",
│        "whatsappNumber": "+212612345678",
│        "centre": "Marrakech",
│        "niveau": "1ère Année",
│        "createdAt": timestamp,
│        "active": true,
│        "lastSentAt": timestamp (null au départ),
│        "messageCount": 0
│      }
│
├─ schedules/
│  └─ active/
│     ├─ doc2: {
│        "centre": "Marrakech",
│        "niveau": "1ère Année",
│        "days": ["lundi", "mercredi", "vendredi"],
│        "time": "08:00",
│        "enabled": true,
│        "createdAt": timestamp,
│        "lastRun": null,
│        "nextRun": timestamp
│      }
│
└─ logs/
   └─ active/
      ├─ doc3: {
         "scheduleId": "doc2",
         "groupId": "doc1",
         "centre": "Marrakech",
         "niveau": "1ère Année",
         "status": "success",
         "messageId": "SM1234567890",
         "timestamp": timestamp
      }
```

---

## 🔐 Sécurité & Bonnes pratiques

### JAMAIS exposer en production:
- ❌ Auth Token dans le code source
- ❌ Variables d'env en client (Vite expose tout)
- ❌ Credentials en commentaires

### Pour la production (recommandé):
1. **Créer un backend Node.js** avec Express:
   - Stocker les credentials de manière sécurisée
   - Exposer une API `/api/send-whatsapp` (authentifiée)
   - Appeler Twilio depuis le backend

2. **Utiliser Cloud Functions Firebase**:
   - Déclencher automatiquement les envois
   - Gérer les credentials dans environment variables Firebase

3. **Exemple fonction Firebase** (à créer):
```javascript
// functions/index.js
const functions = require('firebase-functions');
const twilio = require('twilio');

exports.sendScheduledEmploi = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    // Vérifier les horaires
    // Générer les PDFs
    // Envoyer via Twilio
  });
```

---

## 💬 Coûts Twilio WhatsApp

### Pricing (au moment de ce guide):
- **Sandbox**: GRATUIT (messages limités à numéros approuvés)
- **Production**: ~0.0063$ par message entrant
- **100 premiers messages**: GRATUIT

### Exemple budget:
- 10 groupes × 5 jours/semaine × 4 semaines = 200 messages
- Coût: ~$1.26/mois (vraiment pas cher!)

---

## 🐛 Dépannage

### "Erreur Twilio: Invalid From number"
→ Vérifier le format du `VITE_TWILIO_WHATSAPP_NUMBER` (doit être `whatsapp:+...`)

### "Message non reçu"
→ Vérifier que le numéro a bien joiné le sandbox (via WhatsApp)

### "Erreur 401: Unauthorized"
→ Vérifier les credentials Twilio (Account SID, Auth Token)

### "CORS error"
→ Normal en dev Vite. En prod, passer par un backend

---

## 🚀 Déploiement en Production

### Option 1: Cloud Functions Firebase + Cloud Scheduler

```javascript
// firebase/functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

exports.sendScheduledEmploi = functions.pubsub
  .schedule('* * * * *') // Chaque minute
  .onRun(async (context) => {
    const db = admin.firestore();
    const schedules = await db.collection('whatsapp_automations').collection('schedules').where('enabled', '==', true).get();
    
    // Pour chaque schedule, vérifier l'heure et envoyer
    // ...
  });
```

### Option 2: Backend Node.js dédié

```javascript
// server.js
const express = require('express');
const cron = require('node-cron');
const twilio = require('twilio');

const app = express();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Cron job - tous les jours à 8h
cron.schedule('0 8 * * *', async () => {
  // Générer PDFs et envoyer
});
```

---

## 📞 Support

**Documentation Twilio**: https://www.twilio.com/docs/whatsapp
**WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/cloud-api
**Forum Twilio**: https://stackoverflow.com/questions/tagged/twilio
