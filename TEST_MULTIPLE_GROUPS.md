# Test: Multi-Group Session Support

## Checklist de test manuel

### 1. **Formulaire de création de séance**
- [ ] Ouvrir l'interface admin (http://localhost:5173)
- [ ] Sélectionner une filiale
- [ ] Cliquer sur "Ajouter une séance"
- [ ] Vérifier que le champ "Groupes" affiche une grille de checkboxes (G1-G6)
- [ ] Sélectionner plusieurs groupes (ex: G1, G2, G3)
- [ ] Vérifier que le texte "Sélectionnés: G1, G2, G3" apparaît sous les checkboxes

### 2. **Création de séance avec groupes multiples**
- [ ] Remplir le formulaire:
  - Jour: Lundi
  - Heure début: 19:00
  - Heure fin: 20:30
  - Niveaux: 1BAC (ou autre)
  - Matière: Français (ou autre)
  - **Groupes: G1, G2** ✅
  - Professeur: Sélectionner un professeur
  - Salle: Salle 101 (ou autre)
- [ ] Cliquer "Ajouter"
- [ ] Vérifier que la séance s'ajoute avec le texte "G1, G2" affiché

### 3. **Édition de séance avec groupes multiples**
- [ ] Trouver la séance créée
- [ ] Cliquer sur le bouton éditer
- [ ] Vérifier que les checkboxes G1 et G2 sont cochées
- [ ] Modifier en sélectionnant G2, G3, G4
- [ ] Cliquer "Mettre à jour"
- [ ] Vérifier que l'affichage montre "G2, G3, G4"

### 4. **Export PDF avec groupes**
- [ ] Cliquer sur l'option d'export PDF
- [ ] Sélectionner la filiale et générer le PDF
- [ ] Vérifier dans le PDF:
  - [ ] Une colonne "Groupes" existe
  - [ ] Elle affiche les groupes correctement (G1, G2, etc.)

### 5. **Impression thermique avec groupes**
- [ ] Cliquer sur "Impression thermique"
- [ ] Sélectionner la filiale et générer
- [ ] Vérifier dans l'aperçu d'impression:
  - [ ] Le texte affiche "Groupes: G1, G2" (plural correct)
  - [ ] Tous les groupes sélectionnés apparaissent

### 6. **Séances exceptionnelles avec groupes**
- [ ] Ouvrir le gestionnaire de séances exceptionnelles
- [ ] Créer une séance avec groupes (doivent être optionnels)
- [ ] Vérifier:
  - [ ] Les checkboxes s'affichent
  - [ ] Groupes optionnels (pas de message d'erreur si on en choisit pas)
  - [ ] La séance s'ajoute correctement

### 7. **Affichages publics (PublicSchedule, PublicToday)**
- [ ] Naviguer vers l'emploi du temps public
- [ ] Vérifier que les groupes s'affichent comme "G1, G2" (séparés par des virgules)
- [ ] Vérifier que le badge de groupe affiche tous les groupes

## Résultats attendus

✅ **Succès si:**
- Les checkboxes s'affichent correctement
- Plusieurs groupes peuvent être sélectionnés
- Les groupes s'affichent séparés par des virgules
- PDFs et impressions thermiques incluent tous les groupes
- Rétro-compatibilité: les anciennes données avec `groupe` (string) fonctionnent toujours

❌ **Échec si:**
- Erreurs JavaScript dans la console (F12)
- Groupes non affichés correctement
- PDFs/impressions manquent la colonne/ligne des groupes
- Les checkboxes ne réagissent pas

## Notes
- Date du test: 2026-06-09
- Version: 1.0.16 (Multi-group support)
- Serveur: http://localhost:5173
