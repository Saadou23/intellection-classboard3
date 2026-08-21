# 📢 Système de Gestion des Promotions

## Vue d'ensemble

Le système de gestion des promotions permet aux administrateurs de créer, configurer et gérer des annonces personnalisées qui s'affichent aux étudiants sur la page d'affichage de l'emploi du temps.

## Caractéristiques

### 1. **Gestion Complète (Admin)**

#### Accès
- Interface Admin → Communications → 📢 Gestion des Promotions

#### Fonctionnalités
- ✅ **Créer** des promotions avec image, titre et description
- ✅ **Modifier** les promotions existantes
- ✅ **Supprimer** les promotions
- ✅ **Activer/Désactiver** les promotions (sans suppression)
- ✅ **Tracker** le nombre d'affichages

### 2. **Configuration des Promotions**

Chaque promotion peut être configurée avec:

| Paramètre | Options | Description |
|-----------|---------|-------------|
| **Titre** | Texte libre | Nom de la promotion |
| **Description** | Texte libre | Détails additionnels |
| **Image** | Upload fichier | Photo/bannière de la promotion |
| **Type** | app, branding, concours, languages, custom | Catégorie de promotion |
| **Fréquence d'apparition** | always, daily, weekly, custom | À quelle fréquence afficher |
| **Durée d'affichage** | 5-60 secondes | Combien de temps afficher |
| **Nombre max/jour** | 1-10 (si custom) | Limite d'affichages par jour |
| **Audience cible** | all, students, admins | Qui doit voir la promotion |
| **Date début** | Date | Quand commencer |
| **Date fin** | Date (optionnel) | Quand terminer |
| **Statut** | Actif/Inactif | Activer ou désactiver |

### 3. **Fréquences d'Apparition**

#### Always
- S'affiche à chaque visite de l'étudiant
- Idéal pour les annonces urgentes

#### Daily
- S'affiche une seule fois par jour
- Stockage local: `${promotionId}-${date}`

#### Weekly
- S'affiche une seule fois par semaine
- Basé sur le numéro de semaine ISO

#### Custom
- S'affiche X fois par jour (configurable)
- Permet un contrôle fin de la fréquence

### 4. **Affichage Côté Client**

#### Comportement
1. **Chargement**: Les promotions actives et valides (date) sont chargées
2. **Vérification**: Vérification de la fréquence et du nombre d'affichages
3. **Affichage**: Modal centré avec image + titre + description
4. **Durée**: Affichage automatique pendant X secondes (configurable)
5. **Fermeture**: Fermeture automatique ou manuelle (bouton X)
6. **Tracking**: Enregistrement de chaque affichage dans Firebase

#### Localisation
- Page d'affichage de l'emploi du temps étudiant
- Après la sélection de filiale/niveau/groupe

### 5. **Stockage des Données**

#### Structure Firebase
```
promotions/
├── {promotion-id}
│   ├── title: string
│   ├── description: string
│   ├── imageUrl: string (base64 ou URL)
│   ├── type: string
│   ├── frequency: string
│   ├── displayDuration: number
│   ├── enabled: boolean
│   ├── startDate: string (YYYY-MM-DD)
│   ├── endDate: string (YYYY-MM-DD)
│   ├── maxShowsPerDay: number
│   ├── targetAudience: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── showCount: number (total affichages)
│   └── lastShown: timestamp
```

#### Stockage Local
- Clé: `${promotionId}-${date}` (pour frequency: daily)
- Clé: `${promotionId}-week-${weekNumber}` (pour frequency: weekly)
- Clé: `${promotionId}-${date}` (compteur pour frequency: custom)

### 6. **Architecture**

#### Fichiers
- **PromotionManager.jsx** - Interface d'administration
- **PromotionDisplay.jsx** - Composant d'affichage côté client
- **PublicSchedule.jsx** - Intégration dans la page étudiante
- **ClassBoard.jsx** - Menu admin

#### Flux de Données
```
Admin → PromotionManager → Firebase (promotions collection)
                         ↓
                    PromotionDisplay
                         ↓
                      Student View
```

### 7. **Cas d'Utilisation**

#### 1. Promouvoir l'App Mobile
- Type: `app`
- Fréquence: `always`
- Durée: 15s
- Audience: `students`
- Dates: Du jour au jour + X mois

#### 2. Affichage de Branding
- Type: `branding`
- Fréquence: `daily`
- Durée: 8s
- Audience: `all`

#### 3. Annonces de Cours
- Type: `languages`
- Fréquence: `weekly`
- Durée: 20s
- Audience: `students`

#### 4. Promotions Urgentes
- Type: `custom`
- Fréquence: `always`
- Durée: 30s
- Audience: `all`
- Dates: Date début aujourd'hui

### 8. **Exemple d'Utilisation**

#### Créer une Promotion
1. Aller à: Admin → Communications → 📢 Gestion des Promotions
2. Cliquer: "Ajouter une promotion"
3. Remplir:
   - Titre: "Téléchargez l'App INTELLECTION"
   - Type: App
   - Image: Upload bannière
   - Fréquence: Always
   - Durée: 15s
   - Audience: Students
4. Cliquer: "Sauvegarder"
5. Promotion s'affiche immédiatement aux étudiants ✅

#### Modifier une Promotion
1. Sur la liste, cliquer: "Modifier"
2. Éditer les champs
3. Cliquer: "Sauvegarder"

#### Désactiver une Promotion
1. Cliquer le bouton de statut (Actif/Inactif)
2. La promotion disparaît des affichages immédiatement

#### Supprimer une Promotion
1. Cliquer: "Supprimer"
2. Confirmer
3. Promotion supprimée définitivement

### 9. **Tracking et Analytics**

Chaque promotion enregistre:
- **showCount**: Nombre total d'affichages
- **lastShown**: Timestamp du dernier affichage
- **createdAt**: Quand la promotion a été créée
- **updatedAt**: Quand la promotion a été modifiée

Utile pour:
- Mesurer l'engagement
- Identifier les meilleures promotions
- Analyser les tendances

### 10. **Sécurité**

- **Accès Admin**: Seulement les administrateurs peuvent gérer
- **Validation**: Vérification des dates et fréquences côté client
- **Storage**: Images encodées en base64 (ou URL sécurisées)
- **Audience**: Filtrage par type d'utilisateur

### 11. **Performance**

- Chargement: Une seule requête Firebase pour toutes les promotions
- Affichage: Déterministe basé sur fréquence et date locale
- Stockage Local: Utilise JavaScript `Map` (en mémoire)
- Pas de polling: Charge une seule fois au démarrage

## Prochaines Étapes

### Optionnel
- [ ] Ajouter analytics dashboard
- [ ] Support vidéos au lieu d'images
- [ ] A/B testing (variantes)
- [ ] Ciblage par niveau/groupe
- [ ] Statistiques d'engagement en temps réel
- [ ] Export de rapports

## Support

Pour toute question ou besoin d'amélioration, contactez l'équipe de développement.

---
**Dernière mise à jour**: 2026-08-21
**Version**: 1.0
