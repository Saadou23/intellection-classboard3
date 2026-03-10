# Groupe Mandatory Update - ClassBoard Web & Mobile

**Date**: March 10, 2026
**Status**: Implementation Complete

## Problem Statement

The **Groupe** (student group) field was:
- **Web (ClassBoard)**: Optional - labeled as "(optionnel)" with "-- Aucun groupe --" option
- **Mobile (Agent App)**: Not properly loaded or displayed - groups were hardcoded, not synced with web data

**Solution**: Made groupe **MANDATORY** in both apps and synced data structure.

---

## Changes Made

### 1. ClassBoard Web - Made Groupe Mandatory

**File**: `src/ClassBoard.jsx`

#### Change 1: UI Label Update (Line 1231)
```jsx
BEFORE: <span className="text-gray-400 text-xs">(optionnel)</span>
AFTER:  <span className="text-red-500">*</span>
```

#### Change 2: Select Option (Line 1238)
```jsx
BEFORE: <option value="">-- Aucun groupe --</option>
AFTER:  <option value="">-- Sélectionner un groupe --</option>
```

#### Change 3: HTML Attribute (Line 1235)
```jsx
ADDED: required
```

#### Change 4: Validation Logic (After Line 351)
```javascript
// NEW: Vérifier que le groupe est sélectionné (OBLIGATOIRE)
if (!formData.groupe || formData.groupe.trim() === '') {
  alert('⚠️ Veuillez sélectionner un groupe');
  return;
}
```

**Impact**: Users cannot save a session without selecting a groupe. Form will alert them if they try.

---

### 2. Mobile App - Load Groupes Dynamically

**File**: `screens/AgentScannerScreen.js`

#### Change 1: Import Firebase Functions (Line 26)
```javascript
BEFORE: import { getFirestore, collection, getDocs } from 'firebase/firestore';
AFTER:  import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
```

#### Change 2: Add maxGroups State (Line 41)
```javascript
ADDED: const [maxGroups, setMaxGroups] = useState(6);
```

#### Change 3: Rewrite loadGroupsForSubject() Function
```javascript
// BEFORE: Tried to extract groups from branch sessions
// AFTER: Load maxGroups from Firebase settings/global and generate G1, G2, G3...

const loadGroupsForSubject = async (subject) => {
  try {
    setLoading(true);
    const db = getFirestore();

    // Load maxGroups from settings/global
    const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
    let groupCount = 6; // Default
    if (settingsDoc.exists()) {
      groupCount = settingsDoc.data().maxGroups || 6;
    }

    setMaxGroups(groupCount);

    // Generate groups: G1, G2, G3, ... until maxGroups
    const generatedGroups = Array.from({ length: groupCount }, (_, i) => `G${i + 1}`);

    setGroups(generatedGroups);
    setSelectedGroup(null);
    setProfessors([]);
    setSelectedProfessor(null);
  } catch (error) {
    console.error('Erreur chargement groupes:', error);
    // Use default groups if error
    setGroups(Array.from({ length: maxGroups }, (_, i) => `G${i + 1}`));
  } finally {
    setLoading(false);
  }
};
```

**Impact**:
- Groups are now dynamically loaded from Firebase `settings/global`
- Groupe count matches web configuration (e.g., if admin sets maxGroups=8, mobile will show G1-G8)
- Fallback to default 6 groups if settings not found
- No hardcoded group values in mobile app

---

## Data Structure Alignment

### Firebase Structure
```
/settings/global
  ├─ maxGroups: 6        (or custom value set in web admin)
  ├─ professors: [...]
  ├─ levels: [...]
  └─ subjects: [...]

/branches/{branchName}
  └─ sessions: [
      {
        groupe: "G1",    ← Now MANDATORY
        professor: "Ahmed Bennani",
        subject: "Mathematics",
        level: "2BAC",
        ...
      }
    ]
```

### Sync Between Apps
- **Web (Admin)**: Sets `maxGroups` in `settings/global` + creates sessions with `groupe` field
- **Mobile (Agent)**: Reads `maxGroups` from same location + displays available groupes dynamically

---

## Groupe Display in Mobile App

**File**: `screens/AgentProfileScreen.js` (Already updated)

Scans now display:
```
Centre: Hay Salam
Niveau: 2ème Année
Matière: Mathématiques
Groupe: G1  ← Shows here
Professeur: Ahmed Bennani
Time: 10:45
```

---

## Testing Checklist

### Web (ClassBoard)
- [ ] Try to save session without selecting groupe → Shows alert
- [ ] Select groupe G1 → Can save successfully
- [ ] Change groupe after creating session → Updates correctly
- [ ] Check Firebase shows groupe field in session data

### Mobile (Agent)
- [ ] Open scanner → Select Centre/Niveau/Matière
- [ ] Verify groups G1, G2, ... appear in groupe selection
- [ ] If maxGroups=8 in web, verify mobile shows G1-G8
- [ ] Scan students in group G1
- [ ] Check agent profile → Groupe G1 displays correctly

---

## Backward Compatibility

**Old sessions without groupe field**:
- Web: Still displays, but cannot be edited without adding groupe
- Mobile: Shows "N/A" for groupe in scan history

**Migration path**:
1. Admin updates existing sessions in web to add groupe
2. Or create new sessions with groupe mandatory
3. Mobile automatically syncs new data

---

## Firebase Settings Requirement

Ensure `settings/global` exists with:
```json
{
  "maxGroups": 6,
  "professors": [...],
  "levels": [...],
  "subjects": [...]
}
```

If missing, mobile defaults to 6 groups (G1-G6).

---

## Next Steps

1. **Test**: Verify both apps handle groupe correctly
2. **Update Admin**: Notify admins that groupe is now required
3. **Migration**: Update existing sessions to include groupe (if needed)
4. **Documentation**: Update user guides to reflect mandatory groupe

---

## Version Updates Needed

- **Web**: Update version/changelog
- **Mobile**: v1.0.10 already includes these changes

**Files Modified**:
- Web: `src/ClassBoard.jsx` (3 lines changed + 4-line validation added)
- Mobile: `screens/AgentScannerScreen.js` (1 import added + function rewritten)
