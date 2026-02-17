# ============================================
# INSTALLATION AUTOMATIQUE - Système Alertes
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Installation Système Alertes & Sons" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifications
Write-Host "1. Vérifications..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "   ERREUR: Vous devez être dans le dossier du projet!" -ForegroundColor Red
    exit
}
Write-Host "   OK - Dossier correct" -ForegroundColor Green

# 2. Extraire les fichiers
Write-Host ""
Write-Host "2. Extraction des fichiers..." -ForegroundColor Yellow
$zipPath = "C:\Users\Ahmed\Downloads\systeme-alertes-sons.zip"
if (-not (Test-Path $zipPath)) {
    Write-Host "   ERREUR: $zipPath introuvable!" -ForegroundColor Red
    exit
}
Expand-Archive -Path $zipPath -DestinationPath "." -Force
Write-Host "   OK - Fichiers extraits" -ForegroundColor Green

# 3. Copier dans src
Write-Host ""
Write-Host "3. Copie dans src..." -ForegroundColor Yellow
Copy-Item "SoundSystem.js" -Destination "src\" -Force
Copy-Item "AvailableRoomsViewer.jsx" -Destination "src\" -Force
Copy-Item "UpcomingSessionsPreview.jsx" -Destination "src\" -Force
Copy-Item "useSessionNotifications.js" -Destination "src\" -Force
Write-Host "   OK - 4 fichiers copiés" -ForegroundColor Green

# 4. Nettoyer
Write-Host ""
Write-Host "4. Nettoyage..." -ForegroundColor Yellow
Remove-Item "SoundSystem.js", "AvailableRoomsViewer.jsx", "UpcomingSessionsPreview.jsx", "useSessionNotifications.js" -Force
Write-Host "   OK - Fichiers temporaires supprimés" -ForegroundColor Green

# 5. Modifier ClassBoard.jsx
Write-Host ""
Write-Host "5. Modification de ClassBoard.jsx..." -ForegroundColor Yellow

# Backup
Copy-Item "src\ClassBoard.jsx" -Destination "src\ClassBoard.jsx.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force

$classboard = Get-Content "src\ClassBoard.jsx" -Raw

# Ajouter imports
if ($classboard -notlike "*AvailableRoomsViewer*") {
    $classboard = $classboard -replace "(import \{ filterSessionsForDate.*\} from './sessionFilters';)", "`$1`nimport AvailableRoomsViewer from './AvailableRoomsViewer';`nimport UpcomingSessionsPreview from './UpcomingSessionsPreview';`nimport useSessionNotifications from './useSessionNotifications';`nimport SoundSystem from './SoundSystem';`nimport { Volume2, VolumeX, Eye } from 'lucide-react';"
    Write-Host "   - Imports ajoutés" -ForegroundColor Green
}

# Ajouter states
if ($classboard -notlike "*showAvailableRooms*") {
    $classboard = $classboard -replace "(const \[shouldAutoScroll, setShouldAutoScroll\] = useState\(false\);)", "`$1`n  const [showAvailableRooms, setShowAvailableRooms] = useState(false);`n  const [soundEnabled, setSoundEnabled] = useState(true);"
    Write-Host "   - States ajoutés" -ForegroundColor Green
}

# Ajouter hook
if ($classboard -notlike "*useSessionNotifications*") {
    $afterStates = $classboard.IndexOf("const daysOfWeek = [")
    if ($afterStates -gt 0) {
        $before = $classboard.Substring(0, $afterStates)
        $after = $classboard.Substring($afterStates)
        $classboard = $before + "`n  // Hook pour les notifications sonores`n  useSessionNotifications(sessions, selectedBranch, currentTime, soundEnabled);`n`n  " + $after
        Write-Host "   - Hook ajouté" -ForegroundColor Green
    }
}

# Changer 15 en 30
if ($classboard -like "*currentMinutes - 15*") {
    $classboard = $classboard -replace "currentMinutes - 15", "currentMinutes - 30"
    Write-Host "   - Délai changé (15→30 min)" -ForegroundColor Green
}

# Ajouter boutons
if ($classboard -notlike "*Salles Libres*") {
    $classboard = $classboard -replace "(<button[^>]*onClick=\{\(\) => setView\('dashboard'\)\}[^>]*>[\s\S]*?Dashboard[\s\S]*?</button>)", "`$1`n            <button`n              onClick={() => setShowAvailableRooms(true)}`n              className=`"bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm`"`n            >`n              <Eye className=`"w-4 h-4`" />`n              Salles Libres`n            </button>`n            <button`n              onClick={() => {`n                const newState = SoundSystem.toggle();`n                setSoundEnabled(newState);`n              }}`n              className={``px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all `${soundEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-400 hover:bg-gray-500 text-white'}``}`n            >`n              {soundEnabled ? <Volume2 className=`"w-4 h-4`" /> : <VolumeX className=`"w-4 h-4`" />}`n              {soundEnabled ? 'Son ON' : 'Son OFF'}`n            </button>"
    Write-Host "   - Boutons ajoutés" -ForegroundColor Green
}

# Ajouter modals avant dernier }
if ($classboard -notlike "*AvailableRoomsViewer*sessions*") {
    $lastBrace = $classboard.LastIndexOf("};")
    if ($lastBrace -gt 0) {
        $before = $classboard.Substring(0, $lastBrace)
        $after = $classboard.Substring($lastBrace)
        $classboard = $before + "`n`n      {/* Modal Salles Libres */}`n      {showAvailableRooms && (`n        <AvailableRoomsViewer`n          sessions={sessions}`n          branches={branches}`n          onClose={() => setShowAvailableRooms(false)}`n        />`n      )}`n`n      {/* Aperçu automatique des cours à venir */}`n      {view === 'display' && selectedBranch && (`n        <UpcomingSessionsPreview`n          sessions={sessions}`n          branch={selectedBranch}`n          currentTime={currentTime}`n        />`n      )}`n    " + $after
        Write-Host "   - Modals ajoutés" -ForegroundColor Green
    }
}

Set-Content -Path "src\ClassBoard.jsx" -Value $classboard -Force
Write-Host "   OK - ClassBoard.jsx modifié" -ForegroundColor Green

# 6. Modifier index.css
Write-Host ""
Write-Host "6. Ajout CSS..." -ForegroundColor Yellow
$css = Get-Content "src\index.css" -Raw
if ($css -notlike "*animate-fade-in*") {
    $newCss = @"

/* Animations pour aperçu automatique */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-20px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
"@
    Add-Content -Path "src\index.css" -Value $newCss
    Write-Host "   OK - CSS ajouté" -ForegroundColor Green
} else {
    Write-Host "   - CSS déjà présent" -ForegroundColor Yellow
}

# 7. Vérifications finales
Write-Host ""
Write-Host "7. Vérifications finales..." -ForegroundColor Yellow
$files = @(
    "src\SoundSystem.js",
    "src\AvailableRoomsViewer.jsx",
    "src\UpcomingSessionsPreview.jsx",
    "src\useSessionNotifications.js",
    "src\ClassBoard.jsx",
    "src\index.css"
)
$allGood = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   OK - $file" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR - $file manquant!" -ForegroundColor Red
        $allGood = $false
    }
}

# Résumé
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  INSTALLATION TERMINÉE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

if ($allGood) {
    Write-Host "PROCHAINES ÉTAPES:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Lancer le serveur:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Tester:" -ForegroundColor White
    Write-Host "   - Interface admin: boutons 'Salles Libres' et 'Son ON'" -ForegroundColor Cyan
    Write-Host "   - Affichage public: aperçu après 30 secondes" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Déployer:" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Cyan
    Write-Host '   git commit -m "Feature: Sons + Aperçu + Salles"' -ForegroundColor Cyan
    Write-Host "   git push origin main" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "ERREUR: Installation incomplète!" -ForegroundColor Red
}

Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
