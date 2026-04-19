# Mise à Jour — Support des 3 Zones (Hay Salam, Doukkali, Saada)

## 📍 Changements Apportés

Le système OTP supporte maintenant **3 zones GPS distinctes** au lieu d'une seule :

### ✅ **Zone 1: Hay Salam**
- Coordinates: configurables
- Rayon autorisé: configurable

### ✅ **Zone 2: Doukkali**
- Coordinates: configurables
- Rayon autorisé: configurable

### ✅ **Zone 3: Saada**
- Coordinates: configurables
- Rayon autorisé: configurable

---

## 🔧 Fichiers Modifiés

### 1. **OTPService.js**
- Modificatin `loadOTPSettings()` : récupère les 3 zones depuis Firestore
- Structure Firestore :
```javascript
{
  'Hay Salam': { centerLat, centerLng, radiusMeters },
  'Doukkali': { centerLat, centerLng, radiusMeters },
  'Saada': { centerLat, centerLng, radiusMeters },
  workStartTime: '09:00'
}
```

### 2. **OTPSystemAdmin.jsx**
- **Tab "Paramètres Zone"** : 3 boutons pour sélectionner la zone
- Configuration individuelle par zone
- Bouton "Obtenir position actuelle" met à jour la zone sélectionnée
- Sauvegarde unique de toutes les 3 zones

**UI :**
```
[Hay Salam] [Doukkali] [Saada]

Zone : Hay Salam
  Latitude : 33.5731
  Longitude : -7.5898
  Rayon : 200m
  Heure début : 09:00
  
[Obtenir position actuelle pour Hay Salam]
[Sauvegarder tous les paramètres]
```

### 3. **OTPPointagePanel.jsx**
- **Étape 1** : Ajout d'une sélection de zone **avant** directeur + agent
- La validation GPS utilise la zone sélectionnée
- Message d'erreur inclut le nom de la zone

**UI Étape 1 :**
```
🏢 Zone : [Hay Salam ▼]
👔 Directeur : [Dropdown]
👤 Agent : [Dropdown]
        [Suivant →]
```

---

## 📊 Firestore Collection Structure

### `otp_settings/zones`

```json
{
  "Hay Salam": {
    "centerLat": 33.5731,
    "centerLng": -7.5898,
    "radiusMeters": 200
  },
  "Doukkali": {
    "centerLat": 33.5731,
    "centerLng": -7.5898,
    "radiusMeters": 200
  },
  "Saada": {
    "centerLat": 33.5731,
    "centerLng": -7.5898,
    "radiusMeters": 200
  },
  "workStartTime": "09:00",
  "updatedAt": "2026-04-19T10:30:00Z"
}
```

**Ancienne structure (document `config`) → Automatiquement remplacée par `zones`**

---

## 🚀 Utilisation

### Admin : Configurer les 3 zones

1. ClassBoard → **"Gestion OTP"** → **"Paramètres Zone"**
2. Sélectionner une zone (boutons teal)
3. Configurer latitude/longitude/rayon pour cette zone
4. **Obtenir ma position actuelle** depuis le lieu de pointage de cette zone
5. Répéter pour les 3 zones
6. **Sauvegarder tous les paramètres** (sauvegarde les 3 en une seule opération)

### Agent : Pointer avec sélection de zone

1. Ouvrir `/pointage`
2. **Sélectionner la zone** (Hay Salam / Doukkali / Saada)
3. Sélectionner directeur + son propre nom
4. Cliquer **"Suivant"**
5. GPS vérifié par rapport à cette zone
6. Saisir OTP et valider

**Exemple flux :**
```
Agent arrive à Hay Salam
→ Ouvre /pointage
→ Sélectionne zone "Hay Salam"
→ Sélectionne directeur "Mohammed"
→ Sélectionne lui-même "Khalid"
→ Clic Suivant
→ GPS vérifié : est-il ≤ 200m du centre de Hay Salam ?
→ Oui → Passe à l'OTP
→ Saisit code OTP
→ ✅ Enregistré
```

---

## ✨ Avantages

✅ **Flexibilité géographique** — Chaque zone a son propre périmètre  
✅ **Configuration centralisée** — Admin gère les 3 zones d'un seul endroit  
✅ **Validation contextuelle** — L'agent choisit sa zone, le GPS est vérifié pour cette zone  
✅ **Historique par zone** — Les pointages enregistrent la zone implicitement (via directeur qui a une zone attribuée)  

---

## 🔄 Migration depuis Ancienne Version

Si vous aviez un document `otp_settings/config` avec une seule zone :

**Ancien :**
```json
{
  "centerLat": 33.5731,
  "centerLng": -7.5898,
  "radiusMeters": 200,
  "workStartTime": "09:00"
}
```

**Nouveau :** Les 3 zones se créent automatiquement au chargement si le document `zones` n'existe pas. Aucune action requise.

---

## 🧪 Test Rapide

```bash
# Lancer le dev
npm run dev
```

1. **Admin configuration :**
   - ClassBoard → "Gestion OTP" → "Paramètres Zone"
   - Sélectionner "Hay Salam"
   - Cliquer "Obtenir position actuelle" depuis Hay Salam
   - Sélectionner "Doukkali"
   - Cliquer "Obtenir position actuelle" depuis Doukkali
   - Idem "Saada"
   - Sauvegarder

2. **Agent pointage :**
   - `/pointage`
   - Sélectionner zone "Hay Salam"
   - Sélectionner directeur
   - Sélectionner agent
   - Cliquer "Suivant" → GPS vérifié pour Hay Salam
   - Saisir OTP → ✅ Pointage

---

## 📝 Notes

- **Heure début travail** : Unique pour toutes les zones (09:00 par défaut)
- **Directeurs/Agents** : Non associés à une zone spécifique (l'agent choisit à chaque pointage)
- **Historique** : Aucun changement dans `pointages` collection (zone implicite via sélection)
- **Calcul heures** : Non affecté par les zones

---

## ⚠️ Limitations Connues

- L'agent doit être dans la zone pour pointer (rejet GPS si hors limites)
- Impossible de pointer pour une autre zone que celle où on se trouve
- Rayon de 200m peut être trop grand/petit selon les zones — à adapter selon besoin

---

## 🚀 Production

Build :
```bash
npm run build
```

→ Déployer sur Vercel comme d'habitude. Les 3 zones fonctionnent out-of-the-box.
