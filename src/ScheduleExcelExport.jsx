import React, { useState, useMemo } from 'react';
import { X, FileSpreadsheet, Building2, GraduationCap, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getSessionLevels } from './levelUtils';
import { getAllPeriods } from './periodUtils';

// Ordre d'affichage : Lundi → Dimanche (dayOfWeek suit Date.getDay())
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const COLUMNS = [
  { key: 'branch', header: 'Filiale', width: 14 },
  { key: 'day', header: 'Jour', width: 11 },
  { key: 'date', header: 'Date', width: 12 },
  { key: 'start', header: 'Début', width: 8 },
  { key: 'end', header: 'Fin', width: 8 },
  { key: 'level', header: 'Niveau(x)', width: 22 },
  { key: 'subject', header: 'Matière', width: 20 },
  { key: 'groupes', header: 'Groupe(s)', width: 14 },
  { key: 'professor', header: 'Professeur', width: 22 },
  { key: 'room', header: 'Salle', width: 8 },
];

const getGroupes = (session) =>
  session.groupes?.length > 0 ? session.groupes : (session.groupe ? [session.groupe] : []);

const isOneOff = (session) => Boolean(session.sessionDate || session.specificDate);

// Excel : 31 caractères max, pas de []:*?/\ , noms uniques
const makeSheetName = (name, used) => {
  const base = (name || 'Feuille').replace(/[[\]:*?/\\]/g, '-').slice(0, 31) || 'Feuille';
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter(v => v !== value) : [...list, value];

const ScheduleExcelExport = ({ sessions, branches, branchesData, onClose }) => {
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [levelSearch, setLevelSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('normal');
  const [sheetMode, setSheetMode] = useState('branch'); // 'single' | 'branch' | 'level'
  const [includeOneOff, setIncludeOneOff] = useState(false);

  const availablePeriods = useMemo(() => getAllPeriods(branchesData), [branchesData]);

  const branchList = useMemo(() => {
    const all = new Set([...(branches || []), ...Object.keys(sessions || {})]);
    return Array.from(all);
  }, [branches, sessions]);

  // Sessions des filiales cochées, filtrées par période (avant filtre niveau)
  const periodSessions = useMemo(() => {
    const result = [];
    selectedBranches.forEach(branch => {
      (sessions[branch] || []).forEach(session => {
        const matchesPeriod = selectedPeriod === 'normal'
          ? !session.period
          : session.period === selectedPeriod;
        if (!matchesPeriod) return;
        if (!includeOneOff && isOneOff(session)) return;
        result.push({ ...session, branch });
      });
    });
    return result;
  }, [sessions, selectedBranches, selectedPeriod, includeOneOff]);

  // Niveaux présents dans les filiales sélectionnées
  const availableLevels = useMemo(() => {
    const all = new Set();
    periodSessions.forEach(s => getSessionLevels(s).forEach(l => all.add(l)));
    return Array.from(all).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [periodSessions]);

  // Ignorer les niveaux cochés qui ne sont plus disponibles (filiale décochée…)
  const effectiveLevels = selectedLevels.filter(l => availableLevels.includes(l));

  const filteredLevels = availableLevels.filter(l =>
    l.toLowerCase().includes(levelSearch.trim().toLowerCase())
  );

  const exportSessions = useMemo(() => {
    const levelSet = new Set(effectiveLevels);
    return periodSessions.filter(s => getSessionLevels(s).some(l => levelSet.has(l)));
  }, [periodSessions, effectiveLevels]);

  const periodName = selectedPeriod === 'normal'
    ? 'Normal'
    : availablePeriods.find(p => p.id === selectedPeriod)?.name || 'Période';

  const toRow = (s) => ({
    branch: s.branch,
    day: DAY_NAMES[s.dayOfWeek] ?? '',
    date: s.sessionDate || s.specificDate || '',
    start: s.startTime || '',
    end: s.endTime || '',
    level: getSessionLevels(s).join(' + '),
    subject: s.subject || '',
    groupes: getGroupes(s).join(', '),
    professor: s.professor || '',
    room: s.room ?? '',
  });

  const sortSessions = (list) => [...list].sort((a, b) =>
    a.branch.localeCompare(b.branch, 'fr') ||
    DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek) ||
    (a.startTime || '').localeCompare(b.startTime || '') ||
    (a.room ?? '').toString().localeCompare((b.room ?? '').toString(), 'fr', { numeric: true })
  );

  const buildSheet = (list, columns) => {
    const rows = sortSessions(list).map(s => {
      const row = toRow(s);
      return columns.map(c => row[c.key]);
    });
    const ws = XLSX.utils.aoa_to_sheet([columns.map(c => c.header), ...rows]);
    ws['!cols'] = columns.map(c => ({ wch: c.width }));
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: columns.length - 1 } })
    };
    return ws;
  };

  const handleExport = () => {
    if (exportSessions.length === 0) {
      alert('Aucune séance trouvée avec ces critères');
      return;
    }

    try {
      const columns = COLUMNS.filter(c => c.key !== 'date' || includeOneOff);

      const wb = XLSX.utils.book_new();
      const usedNames = new Set();

      if (sheetMode === 'single') {
        XLSX.utils.book_append_sheet(wb, buildSheet(exportSessions, columns), makeSheetName('Emploi du temps', usedNames));
      } else if (sheetMode === 'branch') {
        const branchColumns = columns.filter(c => c.key !== 'branch');
        selectedBranches.forEach(branch => {
          const list = exportSessions.filter(s => s.branch === branch);
          if (list.length === 0) return;
          XLSX.utils.book_append_sheet(wb, buildSheet(list, branchColumns), makeSheetName(branch, usedNames));
        });
      } else {
        // Une feuille par niveau : un cours multi-niveaux apparaît dans chaque niveau concerné
        [...effectiveLevels].sort((a, b) => a.localeCompare(b, 'fr')).forEach(level => {
          const list = exportSessions.filter(s => getSessionLevels(s).includes(level));
          if (list.length === 0) return;
          XLSX.utils.book_append_sheet(wb, buildSheet(list, columns), makeSheetName(level, usedNames));
        });
      }

      const branchPart = selectedBranches.length === branchList.length
        ? 'Toutes-filiales'
        : selectedBranches.join('-');
      const periodPart = selectedPeriod === 'normal' ? '' : `_${periodName}`;
      const datePart = new Date().toISOString().split('T')[0];
      const fileName = `Emploi_${branchPart}${periodPart}_${datePart}.xlsx`.replace(/[\\/:*?"<>|\s]+/g, '_');

      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de la génération du fichier Excel');
    }
  };

  const allBranchesSelected = branchList.length > 0 && selectedBranches.length === branchList.length;
  const allFilteredLevelsSelected = filteredLevels.length > 0 && filteredLevels.every(l => effectiveLevels.includes(l));

  const toggleAllFilteredLevels = () => {
    if (allFilteredLevelsSelected) {
      setSelectedLevels(effectiveLevels.filter(l => !filteredLevels.includes(l)));
    } else {
      setSelectedLevels(Array.from(new Set([...effectiveLevels, ...filteredLevels])));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-gray-800">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Export Excel</h2>
                <p className="text-green-100 text-sm mt-1">Emploi du temps multi-filiales et multi-niveaux</p>
              </div>
            </div>
            <button onClick={onClose} className="bg-green-800 hover:bg-green-600 p-2 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Période */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📅 Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="normal">📅 Emploi Normal</option>
              {availablePeriods.map(period => (
                <option key={period.id} value={period.id}>🌙 {period.name}</option>
              ))}
            </select>
          </div>

          {/* Filiales */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Filiales ({selectedBranches.length}/{branchList.length})
              </label>
              <button
                onClick={() => setSelectedBranches(allBranchesSelected ? [] : [...branchList])}
                className="text-sm text-green-700 hover:underline"
              >
                {allBranchesSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {branchList.map(branch => (
                <label
                  key={branch}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedBranches.includes(branch) ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(branch)}
                    onChange={() => setSelectedBranches(toggleInList(selectedBranches, branch))}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="font-semibold">{branch}</span>
                  <span className="ml-auto text-xs text-gray-500">{(sessions[branch] || []).length}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Niveaux */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Niveaux ({effectiveLevels.length}/{availableLevels.length})
              </label>
              {filteredLevels.length > 0 && (
                <button onClick={toggleAllFilteredLevels} className="text-sm text-green-700 hover:underline">
                  {allFilteredLevelsSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>
            {selectedBranches.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                Sélectionnez au moins une filiale pour afficher les niveaux.
              </p>
            ) : availableLevels.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                Aucun niveau pour cette période dans les filiales sélectionnées.
              </p>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={levelSearch}
                    onChange={(e) => setLevelSearch(e.target.value)}
                    placeholder="Rechercher un niveau..."
                    className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {filteredLevels.map(level => (
                    <label
                      key={level}
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer text-sm transition-all ${
                        effectiveLevels.includes(level) ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={effectiveLevels.includes(level)}
                        onChange={() => setSelectedLevels(toggleInList(effectiveLevels, level))}
                        className="w-4 h-4 accent-green-600"
                      />
                      <span className="truncate" title={level}>{level}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Organisation du fichier */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📑 Organisation des feuilles</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'branch', label: 'Une feuille par filiale' },
                { value: 'level', label: 'Une feuille par niveau' },
                { value: 'single', label: 'Une seule feuille' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSheetMode(opt.value)}
                  className={`p-3 border-2 rounded-lg text-sm font-semibold transition-all ${
                    sheetMode === opt.value ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOneOff}
                onChange={(e) => setIncludeOneOff(e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              Inclure les séances ponctuelles (avec date précise)
            </label>
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600">
            <strong>{exportSessions.length}</strong> séance(s) à exporter
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={exportSessions.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Télécharger .xlsx
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleExcelExport;
