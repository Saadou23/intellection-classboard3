# 🚀 WhatsApp Automation - Guide Démarrage Rapide

⏱️ **Temps estimé: 15 minutes**

---

## ✅ Étape 1: Créer compte Twilio (2 min)

```
1. Aller à: https://www.twilio.com/console
2. S'enregistrer (gratuit)
3. Vérifier email
4. ✅ Compte créé!
```

---

## ✅ Étape 2: Activer WhatsApp Sandbox (3 min)

```
1. Dashboard Twilio → Messaging → WhatsApp
2. Cliquer "Get Started"
3. Choisir "Sandbox"
4. Recevoir le code (ex: "gentle-ocean")
5. Envoyer un WhatsApp au numéro Twilio fourni:
   Message: "join gentle-ocean"
6. ✅ Confirmé!
```

---

## ✅ Étape 3: Copier les Credentials (2 min)

### Account SID:
```
1. Twilio Console → Account → API keys & tokens
2. Copier: ACxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Auth Token:
```
1. Même page
2. Copier: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### WhatsApp Number:
```
1. Dashboard → Messaging → WhatsApp
2. Copier le numéro (ex: whatsapp:+1415552671)
```

---

## ✅ Étape 4: Configurer .env.local (2 min)

1. **Ouvrir** la racine du projet
2. **Créer** un fichier `.env.local` (ou copier `.env.example`)
3. **Remplir**:

```env
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1415552671
```

4. **Sauvegarder**

---

## ✅ Étape 5: Redémarrer le serveur (1 min)

```bash
# Dans le terminal, arrêter le serveur (Ctrl+C)
# Puis redémarrer:
npm run dev
```

---

## ✅ Étape 6: Tester dans l'App (5 min)

### 1. Ouvrir Dashboard
```
Aller à: http://localhost:5173/dashboard
```

### 2. Trouver le bouton WhatsApp
```
Menu admin → Bouton vert "WhatsApp Auto"
```

### 3. Ajouter un groupe
```
Tab "👥 Groupes" → "Ajouter un groupe"
  • Centre: Sélectionner
  • Niveau: Sélectionner
  • Numéro: Votre numéro WhatsApp (+212612345678)
  • Cliquer "Ajouter"
```

### 4. Tester l'envoi
```
Bouton "Test" → Attendre 10 secondes
✅ Vous recevrez un message WhatsApp!
```

---

## ✅ Étape 7: Créer un Horaire (2 min)

### 1. Aller à l'onglet "⏰ Horaires"

### 2. "Créer un horaire"
```
• Centre: Marrakech (exemple)
• Niveau: 1ère Année (exemple)
• Jours: Sélectionner (lundi, mercredi, vendredi)
• Heure: 08:00
• Cliquer "Créer"
```

### 3. ✅ C'est fait!
```
Les emplois s'enverront automatiquement:
- Lundi à 08:00
- Mercredi à 08:00
- Vendredi à 08:00
```

---

## 📊 Vérifier les Envois

```
Tab "📊 Logs" → Voir tous les envois
  ✅ Succès = Envoi réussi
  ❌ Erreur = Problème à corriger
```

---

## 🐛 Ça ne marche pas?

### "Message non reçu"
```
→ Vérifier que votre numéro a bien joiné le sandbox
→ Vérifier que vous avez le bon numéro WhatsApp
```

### "Erreur 401"
```
→ Vérifier les credentials Twilio
→ Redémarrer le serveur dev
```

### "Aucun groupe"
```
→ Vérifier que vous avez ajouté un groupe
→ Vérifier que le Centre/Niveau existent
```

---

## 📞 Besoin d'aide?

1. Lire le guide complet: `TWILIO_WHATSAPP_SETUP.md`
2. Consulter: `WHATSAPP_AUTOMATION_IMPLEMENTATION.md`
3. Vérifier les logs dans l'interface admin

---

## 💡 Cas d'Utilisation Courants

### Envoi quotidien à 8h
```
Jours: Lundi, Mardi, Mercredi, Jeudi, Vendredi
Heure: 08:00
```

### Envoi avant les cours (14h)
```
Jours: Lundi, Mardi, Mercredi, Jeudi, Vendredi
Heure: 14:00
```

### Envoi deux fois par jour
```
Créer 2 horaires:
1. Heure 08:00
2. Heure 14:00
Mêmes jours et centre/niveau
```

---

## 📈 Monitoring

Chaque jour, vous pouvez:
1. Vérifier les logs
2. Voir le nombre de messages envoyés
3. Identifier les erreurs
4. Activer/désactiver les horaires

---

## 🎉 C'est tout!

Vous pouvez maintenant envoyer automatiquement les emplois du temps à vos groupes WhatsApp!

**Prochaines étapes optionnelles:**
- Ajouter plus de groupes (pour chaque centre/niveau)
- Créer des horaires différents
- Générer des PDFs au lieu de texte
