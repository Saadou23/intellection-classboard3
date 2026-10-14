# 📝 Changements à Apporter à App.jsx

Ce fichier documente exactement où ajouter le système de gestion des absences dans votre `App.jsx`.

---

## 1️⃣ Ajouter les Imports en haut du fichier

```jsx
// Ajouter après les autres imports de composants
import ProfessorAbsenceManager from './ProfessorAbsenceManager';
import ProfessorAbsenceHistory from './ProfessorAbsenceHistory';
import StudentAbsenceNotifications from './StudentAbsenceNotifications';
```

**Exemple complet (extrait):**
```jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import ClassBoard from './ClassBoard';
import Dashboard from './Dashboard';
// ... autres imports ...

// ✅ AJOUTER CES IMPORTS
import ProfessorAbsenceManager from './ProfessorAbsenceManager';
import ProfessorAbsenceHistory from './ProfessorAbsenceHistory';
import StudentAbsenceNotifications from './StudentAbsenceNotifications';
```

---

## 2️⃣ Ajouter les Routes Admin

Trouver la section qui gère les pages admin et ajouter :

```jsx
// Rechercher: if (userRole === 'admin') { ... }

// Ajouter dans le switch/conditions des pages admin:
case 'absence-manager':
  return <ProfessorAbsenceManager />;

case 'absence-history':
  return <ProfessorAbsenceHistory />;
```

**Exemple complet:**
```jsx
if (userRole === 'admin') {
  switch (currentPage) {
    case 'dashboard':
      return <AdminDashboard />;
    
    case 'classboard':
      return <ClassBoard />;
    
    // ✅ AJOUTER CES ROUTES
    case 'absence-manager':
      return <ProfessorAbsenceManager />;
    
    case 'absence-history':
      return <ProfessorAbsenceHistory />;
    
    // ... autres routes admin ...
  }
}
```

---

## 3️⃣ Ajouter les Routes Étudiant

Trouver la section qui gère les pages étudiants et ajouter :

```jsx
case 'absence-notifications':
  return <StudentAbsenceNotifications 
    userLevel={userLevel}
    userCenter={userCenter}
    userGroup={userGroup}
  />;
```

**Exemple complet:**
```jsx
if (userRole === 'student') {
  switch (currentPage) {
    case 'schedule':
      return <StudentScheduleView />;
    
    // ✅ AJOUTER CETTE ROUTE
    case 'absence-notifications':
      return <StudentAbsenceNotifications 
        userLevel={userLevel}
        userCenter={userCenter}
        userGroup={userGroup}
      />;
    
    case 'exams':
      return <StudentExamPortal />;
    
    // ... autres routes étudiant ...
  }
}
```

---

## 4️⃣ Ajouter les Boutons de Navigation Admin

Trouver le menu/navigation admin et ajouter :

```jsx
<button 
  onClick={() => setCurrentPage('absence-manager')}
  className="menu-button" // ou votre classe CSS
>
  📋 Absences Professeurs
</button>

<button 
  onClick={() => setCurrentPage('absence-history')}
  className="menu-button"
>
  📊 Historique Absences
</button>
```

**Exemple avec Tailwind CSS:**
```jsx
<div className="flex flex-col gap-2 p-4">
  {/* Autres boutons */}
  
  {/* ✅ AJOUTER CES BOUTONS */}
  <button
    onClick={() => setCurrentPage('absence-manager')}
    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all text-left"
  >
    📋 Signaler une Absence
  </button>

  <button
    onClick={() => setCurrentPage('absence-history')}
    className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all text-left"
  >
    📊 Historique Absences
  </button>
</div>
```

---

## 5️⃣ Ajouter les Boutons de Navigation Étudiant

Trouver le menu/navigation étudiant et ajouter :

```jsx
<button 
  onClick={() => setCurrentPage('absence-notifications')}
  className="menu-button"
>
  ⚠️ Séances Annulées
</button>
```

**Exemple avec Tailwind CSS:**
```jsx
<div className="flex flex-col gap-2 p-4">
  {/* Autres boutons */}
  
  {/* ✅ AJOUTER CE BOUTON */}
  <button
    onClick={() => setCurrentPage('absence-notifications')}
    className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all text-left"
  >
    ⚠️ Séances Annulées
  </button>
</div>
```

---

## 📋 Résumé des Changements

| Fichier | Action | Lignes |
|---------|--------|-------|
| App.jsx | Ajouter 3 imports | Début du fichier |
| App.jsx | Ajouter 2 routes admin | Dans la section admin |
| App.jsx | Ajouter 1 route étudiant | Dans la section étudiant |
| App.jsx | Ajouter 2 boutons admin | Menu admin |
| App.jsx | Ajouter 1 bouton étudiant | Menu étudiant |

**Total: ~30 lignes de code à ajouter**

---

## 🧪 Test Rapide

Après les changements:

1. Démarrer l'app: `npm run dev`
2. Connectez-vous en tant qu'admin
3. Vous devriez voir "📋 Signaler une Absence" et "📊 Historique Absences"
4. Cliquez et testez la saisie d'une absence
5. Connectez-vous en tant qu'étudiant
6. Vous devriez voir "⚠️ Séances Annulées"

---

## 💡 Conseil

Pour faciliter l'intégration:
1. Chercher "case 'dashboard':" dans App.jsx
2. Vous verrez le pattern des routes
3. Ajouter vos nouvelles routes à côté

Pour la navigation:
1. Chercher "setCurrentPage(" dans App.jsx
2. Vous verrez le pattern des boutons
3. Ajouter vos nouveaux boutons à côté

---

## ❓ Questions Fréquentes

**Q: Où exactement ajouter les imports?**
R: Tout en haut du fichier App.jsx, après les autres imports de composants.

**Q: Et si je n'ai pas de variable `userRole` ou `userLevel`?**
R: Ajustez les noms des variables selon votre implémentation. Cherchez comment vous déterminez si l'utilisateur est admin ou étudiant.

**Q: Je n'ai pas de CSS `menu-button`?**
R: Utilisez votre propre classe CSS ou utilisez Tailwind comme dans les exemples ci-dessus.

**Q: Puis-je tester sans Cloud Functions?**
R: Oui! Les Cloud Functions ne sont nécessaires que pour l'expiration automatique. Le système fonctionne sans.
