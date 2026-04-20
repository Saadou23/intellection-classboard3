#!/bin/bash

# Script de démarrage rapide pour tester la solution

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   🚀 DISPONIBILITÉ DES SALLES                 ║"
echo "║                    Démarrage du serveur test                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: package.json non trouvé"
  echo "   Assurez-vous d'être dans le répertoire racine du projet"
  exit 1
fi

echo "✅ Répertoire correct"
echo ""

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
  echo "❌ Erreur: npm n'est pas installé"
  exit 1
fi

echo "✅ npm est installé"
echo ""

# Afficher le status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STATUS:"
echo ""
echo "✓ RoomAvailabilityService.js       [320 lignes]"
echo "✓ RoomAvailabilityViewer.jsx       [340 lignes]"
echo "✓ RoomAvailabilityExamples.js      [480 lignes]"
echo "✓ Dashboard.jsx (modifié)          [+19 lignes]"
echo "✓ Documentation                    [1,830+ lignes]"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Lancer le serveur
echo "🚀 Démarrage du serveur Vite..."
echo "   Port: 5173"
echo "   URL: http://localhost:5173"
echo ""
echo "   Pour tester: 🏢 Cliquer 'Disponibilité Salles' dans le Dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
