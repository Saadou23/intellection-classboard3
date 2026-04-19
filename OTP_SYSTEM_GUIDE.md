# Guide Complet — Système de Pointage OTP (TOTP)

## 📋 Vue d'ensemble

ClassBoard intègre désormais un **système sécurisé de pointage basé sur OTP** (One-Time Password TOTP — Time-based One-Time Password) compatible **Google Authenticator**. 

**Acteurs :**
- 👨‍💼 **Admin** : Crée les profils (agents + directeurs), configure la zone GPS, consulte l'historique
- 🕵️ **Agent** : Valide la présence d'un directeur via OTP
- 👔 **Directeur** : Génère le code OTP via Google Authenticator

---

## 🔐 Sécurité

### Mécanismes de sécurité intégrés

1. **TOTP RFC 6238** — Compatible Google Authenticator, code à 6 chiffres valide 30 secondes
2. **Validation côté client** — Basée sur la clé secrète (jamais transmise au réseau)
3. **Géolocalisation GPS obligatoire** — Refus du pointage en dehors de la zone définie
4. **Enregistrement horodaté** — Chaque pointage inclut date, heure, GPS, ID agent/directeur
5. **Clés secrètes uniques** — Une clé par directeur, jamais réaffichée après création

### Architecture sécurité

```
Admin créer directeur
    ↓
OTPService.generateSecret() → clé base32 aléatoire
    ↓
generateOTPAuthURL() → otpauth://totp/... URI
    ↓
qrcode.toDataURL() → PNG local (pas de serveur tiers)
    ↓
Directeur scanne QR → Google Authenticator
```

**Agent valide la présence :**
```
Agent saisit OTP directeur
    ↓
OTPService.validateOTP(secretKey, token)
    ↓
TOTP.validate({ token, window: 1 }) → ±30s tolérance
    ↓
OTPPointagePanel.recordPointage() → Firestore
```

---

## 🚀 Démarrage Rapide

### Étape 1 : Admin crée les profils

1. Ouvrir **ClassBoard** (localhost:5173 ou prod)
2. Connexion admin : mot de passe `NIZAR123@`
3. Cliquer sur **"Gestion OTP"** (bouton teal dans la toolbar)

#### Tab "Utilisateurs"

**Créer un directeur :**
- Nom : "Mohammed Alami"
- Rôle : **Directeur**
- Email : (optionnel, à titre informatif)
- Cliquer **"Créer l'utilisateur"**

**Affichage du QR Code :**
- Un modal s'ouvre avec le **QR Code**
- ⚠️ **Important** : La clé secrète s'affiche une seule fois
- Transmettre le QR Code au directeur (ou la clé secrète)

**Directeur scanne le QR :**
1. Télécharger **Google Authenticator** (iOS / Android)
2. Ouvrir l'app → bouton `+` → **"Scanner un code QR"**
3. Scanner le code fourni par l'admin
4. Google Authenticator affiche un code à **6 chiffres** qui change toutes les 30 secondes

#### Tab "Paramètres Zone"

**Configurer la zone autorisée (GPS) :**
- **Latitude du centre** : ex. `33.5731` (Casablanca)
- **Longitude du centre** : ex. `-7.5898`
- **Rayon autorisé** : `200` mètres (modifier selon besoin)
- **Heure début travail** : `09:00` (pour calcul des retards)

**Obtenir votre position :**
- Cliquer **"Obtenir ma position actuelle"** depuis l'endroit d'où les agents pointent
- Les coordonnées se remplissent automatiquement
- Cliquer **"Sauvegarder les paramètres"**

---

### Étape 2 : Agent valide la présence

#### Accès à l'interface de pointage

**Option A : Par URL (recommandé pour agents)**
- Naviguer sur `https://app.example.com/pointage` (sans authentification)
- Ou cliquer dans ClassBoard (pour admin) : depuis la toolbar, il n'y a pas de bouton direct, mais c'est accessible via la route

**Option B : Depuis ClassBoard admin**
- Pas de bouton dans la toolbar (réservé aux admin pour supervision)
- Les agents accèdent directement via `/pointage`

#### Flux de pointage (3 étapes)

**Étape 1 : Sélection**
```
Directeur : [Dropdown ▼] ← sélectionner le directeur
Votre nom (Agent) : [Dropdown ▼] ← sélectionner vous-même
                    [Suivant] →
```
- Les données se chargent depuis Firestore
- GPS vérifié automatiquement (doit être ≤ 200m du centre)
- Type détecté auto (entrée/sortie selon dernier pointage)

**Étape 2 : Saisie OTP**
```
Demandez le code OTP au directeur Mohammed Alami

[Détection type : 🟢 ENTRÉE] ou [🟠 SORTIE]

Code OTP (6 chiffres) : [000000]  ← gros digits centrés
                        [Retour] [Valider] →
```
- Directeur vous montre Google Authenticator
- Vous entrez le code à 6 chiffres
- ✅ Validé immédiatement (TOTP côté client)

**Étape 3 : Confirmation**
```
        ✅ Pointage validé!

Directeur : Mohammed Alami
Agent : Khalid Saada
Type : ENTRÉE
Heure : 08:45:32

[Nouveau pointage]
```

---

### Étape 3 : Admin consulte l'historique

**Bouton "Pointages"** dans la toolbar admin

#### Tab "Historique"

**Filtres :**
- Directeur : dropdown
- Date début / fin : calendriers
- Bouton **"Filtrer"** + **"Export Excel"** 🔗

**Tableau :**
| Date | Heure | Directeur | Agent | Type | GPS |
|---|---|---|---|---|---|
| 2026-04-19 | 08:45:32 | Mohammed Alami | Khalid Saada | Entrée | 33.5731, -7.5898 |
| 2026-04-19 | 17:30:15 | Mohammed Alami | Khalid Saada | Sortie | 33.5731, -7.5899 |

#### Tab "Statistiques"

**Par jour :**
- Cards : "Mohammed Alami — 2026-04-19"
  - Heures travaillées: **8.9h** (vert)
  - Retard: **0 min** (si ponctuel, ne s'affiche pas)
  - Status: **Présent**

**Récap mensuel :**
- Avril 2026
  - Mohammed Alami : **180h** (22 jours)
  - Hassan Bennani : **176h** (22 jours)

---

## 📊 Données Firestore

### Collection `otp_users`

```json
{
  "id": "doc-id",
  "name": "Mohammed Alami",
  "role": "directeur",
  "email": "m.alami@example.com",
  "secretKey": "JBSWY3DPEBLW64TMMQ6RQJQCM======",
  "isActive": true,
  "createdAt": "2026-04-19T10:30:00Z"
}
```

### Collection `pointages`

```json
{
  "id": "doc-id",
  "directeurId": "user-id",
  "directeurName": "Mohammed Alami",
  "validatedBy": "agent-id",
  "agentName": "Khalid Saada",
  "type": "entrée",
  "timestamp": "2026-04-19T08:45:32Z",
  "location": {
    "lat": 33.5731,
    "lng": -7.5898
  },
  "isValid": true
}
```

### Collection `otp_settings/config`

```json
{
  "centerLat": 33.5731,
  "centerLng": -7.5898,
  "radiusMeters": 200,
  "workStartTime": "09:00",
  "updatedAt": "2026-04-19T10:30:00Z"
}
```

---

## 🎯 Calcul des heures

### Algorithme

1. **Grouper par directeur + jour** (date ISO)
2. **Appareiller entrée/sortie** du même jour
3. **Calculer** : `minutes = (heure_sortie - heure_entrée) / 60`
4. **Retard** : si première entrée > 09:00, `retard = (entrée - 09:00)`
5. **Présence** : si > 0 heures travaillées = "Présent"

### Exemples

```
2026-04-19 - Mohammed Alami
Entrée : 08:45
Sortie : 17:30
Heures : 8h 45 min = 8.75h
Retard : 0 min (avant 09:00)

2026-04-20 - Mohammed Alami
Entrée : 09:15
Sortie : 17:45
Heures : 8h 30 min = 8.5h
Retard : 15 min (après 09:00)
```

---

## ⚙️ Configuration Avancée

### Modifier les paramètres de zone (GPS)

1. Admin → "Gestion OTP" → Tab "Paramètres Zone"
2. Modifier lat/lng/rayon
3. Cliquer "Obtenir ma position actuelle" depuis le lieu de pointage
4. Sauvegarder

### Réinitialiser une clé secrète (directeur perdu son téléphone)

⚠️ **Actuellement non implémenté** — nécessite soft-delete + recréation :
1. Désactiver le directeur (bouton œil fermé dans la table)
2. Recréer un nouveau profil avec le même nom
3. Fournir le nouveau QR Code

---

## 🐛 Dépannage

### "Code OTP invalide ou expiré"

**Causes possibles :**
- ❌ Code mal saisi (mauvais chiffre)
- ❌ Dépassement de 60 sec (la tolérance ±30s a expiré)
- ❌ Horloge du téléphone décalée

**Solutions :**
- Demander un nouveau code (attendre 30s)
- Vérifier l'heure du téléphone du directeur
- Vérifier l'heure du serveur (ClassBoard tab "Régler l'heure")

### "Vous êtes à XXXm du centre autorisé"

**Cause :** Agent trop loin de la zone

**Solution :**
- Se rapprocher du centre (200m par défaut)
- Ou admin augmente le rayon dans "Paramètres Zone"

### "Géolocalisation non disponible"

**Causes :**
- ❌ Géolocalisation bloquée dans le navigateur
- ❌ HTTP (pas HTTPS) sur certains navigateurs

**Solutions :**
- Autoriser géolocalisation du site
- Utiliser HTTPS en production
- Vérifier that navigator.geolocation est disponible

### Tableau pointages vide

**Cause :** Aucun pointage enregistré ou filtres trop strictes

**Solutions :**
- Désélectionner le filtre "Directeur"
- Étendre la plage de dates
- Vérifier Firestore collection `pointages` manuellement

---

## 📱 Déploiement en Production

### Pré-requis

- ✅ `otpauth` npm package (installé)
- ✅ `qrcode` npm package (existant)
- ✅ `xlsx` pour export (existant)
- ✅ Firebase Firestore configuré

### Variables d'environnement

Aucune variable d'environnement supplémentaire requise. Les identifiants Firebase sont déjà configurés dans `src/firebase.js`.

### Build

```bash
npm run build
```

### Vérifier le déploiement

1. Ouvrir prod URL
2. Tester `/pointage` (agent)
3. Tester "Gestion OTP" (admin)
4. Vérifier Firestore collections crées automatiquement

---

## 📝 Notes Techniques

### Validation OTP côté client

La clé secrète est **récupérée depuis Firestore** uniquement au moment de la validation, sans être stockée en localStorage ou state persistant. 

**Risque :** Un acteur avec accès à Firestore peut lire toutes les clés. 

**Mitigation :** Utilisez les **Firestore Security Rules** :

```javascript
match /otp_users/{docId} {
  allow read, write: if request.auth.uid != null && request.auth.token.admin == true;
}
```

(À configurer si Firebase Auth est ajouté ultérieurement.)

### Formats de date/heure

- **Firestore Timestamp** → converti en `Date` JS automatiquement
- **Affichage** : `toLocaleString('fr-FR')` pour format français
- **Stockage** : ISO 8601 dans Firestore (YYYY-MM-DD)

### Tolérance TOTP

- **Fenêtre** : ±1 pas (±30 secondes)
- **Période** : 30 secondes (standard Google Authenticator)
- **Chiffres** : 6 (standard)

---

## 🔄 Flux Complet (Diagramme)

```
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN                                 │
│  ClassBoard → "Gestion OTP" → Créer Directeur → QR Code     │
│  "Paramètres Zone" → Configurer GPS center + radius          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Transmettre QR Code
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     DIRECTEUR                                 │
│  Google Authenticator ← scanner QR                            │
│  Obtient code 6 chiffres qui change/30s                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   Montrer code à l'agent
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       AGENT                                   │
│  /pointage → Sélectionner Directeur + soi-même              │
│  GPS vérification → Voir si entrée/sortie auto              │
│  Saisir OTP → Validation → ✅ Pointage enregistré           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      Firestore
                (pointages collection)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN                                  │
│  "Pointages" → Historique table + Stats → Export Excel       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📞 Support

Consulter les logs navigateur (F12 → Console) pour déboguer les erreurs.

**Fichiers clés :**
- `src/OTPService.js` — Logique TOTP + Firestore
- `src/OTPSystemAdmin.jsx` — UI admin
- `src/OTPPointagePanel.jsx` — UI agent
- `src/OTPDashboard.jsx` — Dashboard stats
