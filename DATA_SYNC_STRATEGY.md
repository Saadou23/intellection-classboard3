# Data Synchronization Strategy - Web ↔ Mobile

**Date**: March 10, 2026
**Goal**: Perfect sync between ClassBoard Web and Mobile Agent App
**Status**: Planning Phase

---

## Current Issues

### Field Name Inconsistencies

| Concept | Web (ClassBoard) | Mobile (Agent) | Firebase | Status |
|---------|-----------------|----------------|----------|--------|
| Academic Level | `level` | `niveau` | ❌ Varies | Need sync |
| Subject | `subject` | `matiere` | ❌ Varies | Need sync |
| Professor | `professor` | `professorName` | ❌ Varies | Need sync |
| Student Group | `groupe` | `groupe` | ✅ Same | Good |
| Center/Branch | (implicit) | `filiale` | ❌ Missing | Need sync |
| Date String | `dayOfWeek` | `dateString` | ❌ Varies | Need sync |
| Agent Name | N/A | `agentName` | ✅ Present | Good |

### Data Structure Mismatches

**Web Session Format:**
```javascript
{
  dayOfWeek: 0-6,
  startTime: "19:00",
  endTime: "20:30",
  level: "1BAC",
  levels: ["1BAC", "2BAC"],
  subject: "FRANÇAIS",
  professor: "MOHAMMED EL HARTI",
  groupe: "G1",
  room: "Salle 1",
  status: "normal",
  period: null
}
```

**Mobile Attendance Format:**
```javascript
{
  dateString: "2026-03-10",
  filiale: "Hay Salam",
  niveau: "1BAC",
  matiere: "FRANÇAIS",
  groupe: "G1",
  professorName: "MOHAMMED EL HARTI",
  agentName: "Agent X",
  totalScans: 15,
  scans: [
    { matricule: "...", timestamp: "...", heure: "..." }
  ]
}
```

---

## Solution: Unified Data Model

### Standard Field Names (Canonical Form)

Adopted standard: **Use Web naming convention + add aliases**

```javascript
// CANONICAL FORM (Web format is primary)
{
  // Timing
  dayOfWeek: 0-6,              // Day of week
  dateString: "2026-03-10",    // ISO date (ADDED for mobile)
  startTime: "19:00",          // Session start
  endTime: "20:30",            // Session end

  // Academic Info
  level: "1BAC",               // Academic level (NOT niveau)
  levels: ["1BAC"],            // Multiple levels (web only)
  subject: "FRANÇAIS",         // Subject (NOT matiere)
  groupe: "G1",                // Student group
  professor: "MOHAMMED",       // Professor name (NOT professorName)

  // Organization
  filiale: "Hay Salam",        // Center/branch name (ADDED for web)
  room: "Salle 1",             // Room number (web only)

  // Status
  status: "normal",            // Session status
  period: null,                // Exceptional period

  // Agent Info
  agentName: "Agent X",        // Scanning agent (ADDED for web)

  // Attendance Data
  scans: [...],                // Student attendance records
  totalScans: 15               // Total scans count
}
```

---

## Implementation Plan

### Phase 1: Web Side Updates (ClassBoard)

#### 1.1 Add Missing Fields to Web Sessions
- Add `filiale` field (from selectedBranch)
- Add `dateString` field (computed from dayOfWeek)
- Add `agentName` field (default: null, or set by admin)

#### 1.2 Update Session Structure
```javascript
// When saving to Firebase
const sessionToSave = {
  // Existing fields
  dayOfWeek: formData.dayOfWeek,
  startTime: formData.startTime,
  endTime: formData.endTime,
  level: formData.levels.join(' + '),
  subject: formData.subject,
  groupe: formData.groupe,
  professor: formData.professor,
  room: formData.room,
  status: formData.status,
  period: periodMode,

  // NEW: Add filiale and dateString
  filiale: selectedBranch,         // 📌 ADD
  dateString: calculateDateString(), // 📌 ADD
  agentName: null                   // 📌 ADD
};
```

#### 1.3 Ensure Consistency
- Validate professor name matches database
- Validate level exists in system
- Validate subject exists in system
- Validate groupe is in valid range

### Phase 2: Mobile Side Updates (Agent App)

#### 2.1 Adopt Standard Field Names
Change mobile to use same field names as web:
- `niveau` → `level`
- `matiere` → `subject`
- `professorName` → `professor`

#### 2.2 Update AttendanceService
```javascript
// BEFORE
createOrGetScanSession({
  professorName: "MOHAMMED",
  filiale: "Hay Salam",
  niveau: "1BAC",
  matiere: "FRANÇAIS",
  groupe: "G1",
  agentName: "Agent X"
})

// AFTER
createOrGetScanSession({
  professor: "MOHAMMED",     // CHANGED
  filiale: "Hay Salam",
  level: "1BAC",             // CHANGED
  subject: "FRANÇAIS",       // CHANGED
  groupe: "G1",
  agentName: "Agent X"
})
```

#### 2.3 Update Display Names
- Keep UI showing "Professeur", "Matière", "Niveau" in French
- But internally use `professor`, `subject`, `level`

### Phase 3: Firebase Sync Layer

#### 3.1 Create Data Converter
```javascript
// Convert old format to new format automatically
class DataSyncService {
  static normalizeSession(session) {
    return {
      // Map all fields to canonical names
      dayOfWeek: session.dayOfWeek || session.dayOfWeek,
      dateString: session.dateString || session.dateString,
      level: session.level || session.niveau,
      subject: session.subject || session.matiere,
      professor: session.professor || session.professorName,
      groupe: session.groupe,
      filiale: session.filiale,
      // ... etc
    };
  }
}
```

#### 3.2 Validation Rules
```javascript
// Ensure data integrity
- Every session MUST have: level, subject, professor, groupe
- Every scan MUST have: matricule, timestamp, heure, professor
- Groupe MUST be valid (G1-G6 or up to maxGroups)
- Professor MUST exist in system
```

---

## Field Mapping Reference

### Web → Mobile Conversion
```javascript
{
  level: niveau,
  subject: matiere,
  professor: professorName,
  filiale: (not used in web),
  dayOfWeek: (not used in mobile)
}
```

### Mobile → Web Conversion
```javascript
{
  niveau: level,
  matiere: subject,
  professorName: professor,
  filiale: (add to session),
  dateString: (add to session)
}
```

---

## Synchronization Checklist

### For Web (ClassBoard)

- [ ] Add `filiale` field to every session
- [ ] Add `dateString` field to every session
- [ ] Update session creation to include new fields
- [ ] Update session edit to preserve new fields
- [ ] Validate professor exists before saving
- [ ] Validate level exists before saving
- [ ] Validate subject exists before saving

### For Mobile (Agent)

- [ ] Change `niveau` → `level`
- [ ] Change `matiere` → `subject`
- [ ] Change `professorName` → `professor`
- [ ] Update AttendanceService queries
- [ ] Update display labels (keep French in UI)
- [ ] Update Firebase queries to use new field names
- [ ] Ensure backward compatibility with old data

### Integration Testing

- [ ] Web creates session → Mobile reads it correctly
- [ ] Mobile scans with standard names → Web displays correctly
- [ ] Both apps can read each other's data
- [ ] Old data still works (backward compatibility)
- [ ] No data loss during sync
- [ ] Real-time updates work both ways

---

## Backward Compatibility

### Strategy
- Keep reading both old and new field names
- Always write in new standard format
- Migration happens gradually as sessions are updated

### Implementation
```javascript
// Always try new name first, fall back to old name
const level = data.level || data.niveau || 'N/A';
const subject = data.subject || data.matiere || 'N/A';
const professor = data.professor || data.professorName || 'N/A';
```

---

## Testing Priority

🔴 **CRITICAL** - Test these scenarios:
1. Web creates session → Mobile loads it
2. Mobile scans students → Web admin sees it
3. Edit session in Web → Mobile still works
4. Delete session in Web → Mobile handles gracefully
5. Create scan in Mobile → Web displays it

---

## Benefits of This Approach

✅ Single source of truth for field names
✅ Both apps use same Firebase structure
✅ Easier to debug sync issues
✅ Consistent validation across apps
✅ Backward compatible with old data
✅ Future-proof for new features

---

## Timeline

- **Phase 1 (Web)**: 1-2 hours
- **Phase 2 (Mobile)**: 1-2 hours
- **Phase 3 (Sync Layer)**: 30 mins
- **Testing**: 1-2 hours
- **Total**: 4-6 hours for complete sync

---

## Next Steps

1. Implement Web side updates
2. Implement Mobile side updates
3. Create data conversion layer
4. Comprehensive testing
5. Deploy with monitoring
