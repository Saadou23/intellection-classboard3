import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { X, Copy } from 'lucide-react';
import { sessionIncludesLevel, getSessionLevels } from './levelUtils';

// Champs propres à une séance ponctuelle / rattrapage : non copiés
const NON_RECURRING_FIELDS = ['id', 'status', 'makeupDate', 'makeupTime', 'delayedStartTime', 'specificDate', 'isExceptional'];

// Clé d'identité d'une séance, pour éviter de copier deux fois la même
const sessionKey = (s) => [
  s.dayOfWeek,
  s.startTime,
  s.endTime,
  [...getSessionLevels(s)].sort().join('+'),
  (s.groupes || []).slice().sort().join('+'),
  s.subject || '',
  s.professor || ''
].join('|');

const CopyNormalToPeriodModal = ({ branchName, sessions, periodId, periodName, onClose, onCopy }) => {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  // On mémorise les séances décochées : tout le reste est coché par défaut
  const [excludedIds, setExcludedIds] = useState(new Set());

  // Catégories de niveaux (même source que le sélecteur de niveau)
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'levelCategories'));
        setCategories(snap.exists() ? (snap.data().categories || {}) : {});
      } catch (error) {
        console.error('Erreur chargement catégories:', error);
        setCategories({});
      }
    };
    load();
  }, []);

  // Séances normales (hors période) de la filiale
  const normalSessions = useMemo(
    () => (sessions || []).filter(s => !s.period),
    [sessions]
  );

  // Niveaux présents dans les séances normales
  const allLevels = useMemo(() => {
    const set = new Set();
    normalSessions.forEach(s => getSessionLevels(s).forEach(l => set.add(l)));
    return [...set];
  }, [normalSessions]);

  const levelsOfCategory = useMemo(() => (
    selectedCategory
      ? (categories[selectedCategory] || []).filter(l => allLevels.includes(l))
      : allLevels
  ), [selectedCategory, categories, allLevels]);

  // Séances à proposer selon catégorie / niveau choisis
  const candidates = useMemo(() => {
    return normalSessions.filter(s => {
      if (selectedLevel) return sessionIncludesLevel(s, selectedLevel);
      if (selectedCategory) return levelsOfCategory.some(l => sessionIncludesLevel(s, l));
      return true;
    });
  }, [normalSessions, selectedCategory, selectedLevel, levelsOfCategory]);

  // Séances déjà présentes dans la période : pour ne pas les dupliquer
  const existingKeys = useMemo(() => {
    const keys = new Set();
    (sessions || []).filter(s => s.period === periodId).forEach(s => keys.add(sessionKey(s)));
    return keys;
  }, [sessions, periodId]);

  // Coché = pas décoché et pas déjà présent dans la période
  const isChecked = (s) => !excludedIds.has(s.id) && !existingKeys.has(sessionKey(s));
  const selectedCount = candidates.filter(isChecked).length;

  const toggle = (id) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = () => {
    const toCopy = candidates
      .filter(isChecked)
      .map((s, idx) => {
        const copy = {};
        Object.keys(s).forEach(k => {
          if (!NON_RECURRING_FIELDS.includes(k)) copy[k] = s[k];
        });
        return {
          ...copy,
          status: 'normal',
          filiale: branchName,
          period: periodId,
          copiedFrom: s.id,
          id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`
        };
      });

    if (toCopy.length === 0) {
      alert('Aucune séance sélectionnée.');
      return;
    }
    onCopy(toCopy);
  };

  const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Copier les horaires du normal</h3>
            <p className="text-purple-100 text-sm">Vers : {periodName} ({branchName})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setSelectedLevel(''); }}
                className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
              >
                <option value="">Toutes les catégories</option>
                {Object.keys(categories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Niveau</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-600"
              >
                <option value="">Tous les niveaux{selectedCategory ? ' de la catégorie' : ''}</option>
                {levelsOfCategory.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold">
                Séances trouvées : {candidates.length} — sélectionnées : {selectedCount}
              </p>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setExcludedIds(new Set())}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Tout cocher
                </button>
                <button
                  onClick={() => setExcludedIds(new Set(candidates.map(s => s.id)))}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed rounded-lg p-6 text-center text-gray-500">
                Aucune séance normale pour ce choix.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {candidates.map(s => {
                  const alreadyThere = existingKeys.has(sessionKey(s));
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${alreadyThere ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-gray-300 hover:bg-purple-50 cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        disabled={alreadyThere}
                        checked={isChecked(s)}
                        onChange={() => toggle(s.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-bold">
                          {dayLabels[s.dayOfWeek]} {s.startTime} → {s.endTime} · {s.subject}
                        </div>
                        <div className="text-gray-600">
                          {getSessionLevels(s).join(' + ')} · {(s.groupes || []).join(', ') || '-'} · {s.professor || '-'} · {s.room || '-'}
                        </div>
                      </div>
                      {alreadyThere && <span className="text-xs text-gray-500">déjà dans la période</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleCopy}
              disabled={selectedCount === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400"
            >
              <Copy className="w-5 h-5" />
              Copier {selectedCount} séance(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyNormalToPeriodModal;
