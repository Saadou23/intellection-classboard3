# 📊 Système de Suivi de Discipline des Professeurs

## Vue d'ensemble

Le système de discipline permet aux administrateurs de ClassBoard de suivre la présence et le respect des horaires des professeurs. Le système enregistre:
- Les arrivées et départs réels
- Les retards
- Le volume de cours réellement dispensé
- Les anomalies détectées
- Un score de discipline pour chaque professeur

## Architecture

### 1. **disciplineService.js** (Service Firebase)

Fichier principal contenant toutes les opérations Firebase et les calculs de discipline.

**Fonctions principales:**

```javascript
// Créer un record de discipline pour une séance
createDisciplineRecord(session, branch, date)

// Marquer un professeur comme présent (arrivée)
markProfPresent(recordId, actualStartTime)

// Marquer le départ d'un professeur
markProfDeparture(recordId, actualEndTime)

// Marquer un professeur comme absent
markProfAbsent(recordId)

// Charger les records d'aujourd'hui
loadTodayRecords(branch)

// Charger les stats d'un professeur
loadProfessorStats(profName, startDate, endDate)

// Charger tous les records d'une filiale
loadBranchRecords(branch, startDate, endDate)

// Détecter les anomalies
detectAnomalies(record)

// Calculer le score de discipline
calculateDisciplineScore(records)
```

### 2. **ProfPresenceModal.jsx** (Composant Modal)

Modal pour marquer l'arrivée/départ d'un professeur.

**Fonctionnalités:**
- Affiche les informations de la séance (prof, matière, niveau, date)
- Mode "Arrivée": enregistre l'heure d'arrivée et calcule le retard
- Mode "Départ": enregistre l'heure de départ et calcule le volume
- Affiche des badges visuels pour le retard:
  - 🟢 ≤ 5 min
  - 🟡 6-15 min
  - 🔴 > 15 min
- Option pour marquer un professeur comme absent

### 3. **DisciplineBoard.jsx** (Dashboard Principal)

Interface complète avec deux onglets.

**Onglet "Aujourd'hui":**
- Liste toutes les séances du jour pour la filiale sélectionnée
- Tableau avec:
  - Heure prévue
  - Nom du professeur
  - Matière et niveau
  - Heure d'arrivée réelle
  - Retard (en minutes)
  - Volume (%)
  - Statut (Planifié, Présent, Terminé, Absent)
  - Bouton 📍 pour pointer
- Met à jour en temps réel

**Onglet "Statistiques":**
- Sélection d'un professeur et d'une période (Semaine/Mois/Semestre)
- Cartes résumé du professeur sélectionné:
  - Score de discipline (0-100)
  - Séances (planifiées/complétées/absences)
  - Volume (heures prévues vs réelles + %)
  - Retard moyen
- Tableau de classement de tous les professeurs par score
- Statuts visuels:
  - 🏆 Score ≥ 90: Excellent
  - ✅ Score 70-89: Bon
  - ⚠️ Score 50-69: Moyen
  - 🚨 Score < 50: Problématique

### 4. **Intégration dans ClassBoard.jsx**

Modifications apportées:
- Bouton "📊 Discipline" dans la barre de navigation (rouge)
- Bouton "📍" sur chaque séance du tableau pour accéder directement au pointage
- Rendu conditionnel du DisciplineBoard

## Structure Firebase

Collection `discipline_records`:

```javascript
{
  id: "disc_1708937400123",

  // Informations de la séance
  sessionId: "session_abc123",
  professorName: "Ahmed Bennani",
  branch: "Hay Salam",
  subject: "Mathématiques",
  level: "L1",
  date: "2026-02-26",
  dayOfWeek: 4,  // 0=Dimanche, 4=Jeudi

  // Horaires et volumes prévus
  startTime_planned: "19:00",
  endTime_planned: "20:30",
  volumePlanned: 90,  // minutes

  // Horaires et volumes réels (null jusqu'au pointage)
  startTime_actual: "19:12",
  endTime_actual: "20:25",
  volumeActual: 73,

  // Calculs automatiques
  retardMinutes: 12,
  earlyEndMinutes: 5,
  volumePercentage: 81,

  // Statut de la séance
  status: "COMPLETED",  // PLANNED | PRESENT | COMPLETED | ABSENT

  // Anomalies détectées
  anomalies: [
    {
      type: "RETARD_MOYEN",
      value: "12 min",
      severity: "MOYEN"
    },
    {
      type: "FIN_ANTICIPÉE",
      value: "5 min avant la fin",
      severity: "MOYEN"
    }
  ],

  // Métadonnées
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Règles et Calculs

### Score de Discipline (0-100)

Base: 100 points

**Pénalités:**
- Absence non justifiée: -15
- Retard grave (> 30 min): -7
- Retard moyen (15-30 min): -5
- Retard léger (5-15 min): -3
- Fin anticipée (> 10 min): -10
- Volume insuffisant (< 80% du prévu): -8

**Exemple:**
```
Score initial: 100
- 1 retard moyen: -5
- 1 fin anticipée: -10
Score final: 85 ✅ (Bon)
```

### Détection d'Anomalies

| Anomalie | Seuil | Sévérité |
|---|---|---|
| RETARD_LEGER | > 5 min | FAIBLE |
| RETARD_MOYEN | > 15 min | MOYEN |
| RETARD_GRAVE | > 30 min | ÉLEVÉ |
| FIN_ANTICIPÉE | > 10 min avant | MOYEN |
| VOLUME_INSUFFISANT | < 80% prévu | ÉLEVÉ |
| ABSENCE | Non pointé | ÉLEVÉ |

## Guide d'Utilisation

### Pour l'Administrateur

#### Accéder au Tableau de Discipline

1. Ouvrir ClassBoard
2. Authentifier en tant qu'administrateur
3. Sélectionner une filiale
4. Cliquer sur le bouton **"📊 Discipline"** dans la barre de navigation

#### Pointer une Arrivée

**Méthode 1: Via le bouton rapide dans le tableau**
1. Localiser la séance dans le tableau de l'horaire
2. Cliquer sur le bouton **"📍"** à droite
3. Accéder au Tableau de Discipline qui s'ouvre
4. Onglet "Aujourd'hui" → Cliquer le bouton **"📍"** de la séance
5. Modal s'ouvre → Sélectionner "📍 Arrivée"
6. Vérifier/corriger l'heure (pré-remplie avec l'heure actuelle)
7. Observer le retard affiché en direct
8. Cliquer **"✅ Confirmer arrivée"**

**Méthode 2: Via le Tableau de Discipline**
1. Cliquer **"📊 Discipline"** dans la nav
2. Vérifier l'onglet "Aujourd'hui" pour la filiale
3. Localiser la séance dans le tableau
4. Cliquer le bouton **"📍"** dans la colonne "Action"

#### Pointer un Départ

1. Onglet "Aujourd'hui" → Tableau
2. Localiser une séance avec statut "✅ Présent"
3. Cliquer **"📍"** → Modal s'ouvre
4. Sélectionner **"🚪 Départ"** (le bouton se déverrouille automatiquement)
5. Vérifier/corriger l'heure de départ
6. Cliquer **"✅ Confirmer départ"**
7. Le système calcule automatiquement:
   - Volume réel (minutes)
   - Pourcentage par rapport au prévu
   - Anomalies (fin anticipée, volume insuffisant)

#### Marquer un Professeur Absent

1. Cliquer le bouton **"📍"** de la séance
2. Modal s'ouvre
3. Cliquer **"🚫 Marquer absent"**
4. Confirmer dans la boîte de dialogue
5. Le système enregistre une absence (score -15)

#### Consulter les Statistiques

1. Onglet **"📈 Statistiques"**
2. Sélectionner un professeur dans le dropdown
3. Choisir une période: Semaine / Mois / Semestre
4. Observer:
   - Score de discipline avec icône
   - Nombre de séances (planifiées/complétées/absences)
   - Volume (en heures et %)
   - Retard moyen
5. Tableau de classement en bas: tous les profs avec scores
6. Cliquer sur une ligne du classement pour voir ses détails

## Badges et Indicateurs

### Retard
- 🟢 **Vert** (≤ 5 min): Acceptable
- 🟡 **Jaune** (6-15 min): À surveiller
- 🔴 **Rouge** (> 15 min): Problématique
- ⚫ **Gris** (Non confirmé): En attente de pointage

### Statut de Séance
- ⏳ **Planifié**: En attente de confirmation d'arrivée
- ✅ **Présent**: Arrivée confirmée, en attente du départ
- ✅ **Terminé**: Séance complète
- 🚫 **Absent**: Non pointé/Absent justifié

### Score de Discipline
- 🏆 **≥ 90**: Excellent (vert)
- ✅ **70-89**: Bon (bleu)
- ⚠️ **50-69**: Moyen (jaune)
- 🚨 **< 50**: Problématique (rouge)

## Scénarios d'Utilisation

### Scénario 1: Professeur en Retard

```
18:55 - Séance prévue à 19:00
19:12 - Professeur arrive
       → Retard détecté: 12 min
       → Badge: 🟡 12 min
       → Anomalie: RETARD_MOYEN (sévérité MOYEN)
20:30 - Professeur part à l'heure
       → Volume: 100% (73 min / 90 min)
       → Score: -5 (retard moyen)
```

### Scénario 2: Professeur Absent

```
19:00 - Séance prévue
19:15 - Admin ouvre le tableau, professeur n'est pas venu
       → Cliquer "🚫 Marquer absent"
       → Statut: ABSENT
       → Anomalie: ABSENCE (sévérité ÉLEVÉ)
       → Score: -15
```

### Scénario 3: Professeur qui Part Tôt

```
19:00 - Professeur arrive (retard: 0)
20:10 - Professeur part (10 min avant la fin)
       → Volume: 70 min / 90 min = 78%
       → Anomalies:
         * FIN_ANTICIPÉE (10 min, sévérité MOYEN)
         * VOLUME_INSUFFISANT (78%, sévérité ÉLEVÉ)
       → Score: -8 (volume insuffisant) + -10 (fin anticipée) = -18
```

## Intégration Mobile (Futur)

Le système est conçu pour accueillir ultérieurement le scan QR mobile:
- Structure Firebase identique (`discipline_records`)
- Professeurs via l'app mobile pour scanner QR à l'arrivée/départ
- Mêmes calculs et anomalies
- Données synchronisées automatiquement

## Faq / Troubleshooting

**Q: Où se trouvent les données de discipline?**
A: Collection Firebase: `discipline_records`

**Q: Comment modifier un pointage?**
A: Ouvrir le record directement dans Firestore et éditer. Actuellement pas d'interface de modification.

**Q: Les records se créent-ils automatiquement?**
A: Oui, au premier accès au Tableau de Discipline pour une séance.

**Q: Un professeur disparu du classement, pourquoi?**
A: Probablement pas de record pour la période sélectionnée. Vérifier les dates.

**Q: Comment réinitialiser un score?**
A: Supprimer le record de discipline_records dans Firebase.

**Q: Le score est négatif?**
A: Le minimum est 0 (le score est clamped à 0-100).

## Prochaines Améliorations

- [ ] Interface de modification des records
- [ ] Export CSV/PDF des statistiques
- [ ] Graphiques temporels des scores
- [ ] Alertes automatiques si retard > 20 min
- [ ] Historique des anomalies par professeur
- [ ] Intégration scan QR mobile
- [ ] Validation par email des absences justifiées
- [ ] Rapport mensuel automatique

---

**Dernière mise à jour:** 26 février 2026
**Version:** 1.0
