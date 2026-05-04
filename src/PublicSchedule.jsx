import React, { useState, useEffect, useMemo } from 'react';
import { getAllPeriods, getPeriodIcon } from './periodUtils';
import { sessionIncludesLevel, getSessionLevels } from './levelUtils';
import { Clock, MapPin, BookOpen, User, Home, ChevronRight, ChevronLeft, Phone } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const daysOfWeek = [
  { value: 0, label: 'Dimanche', ar: 'الأحد' },
  { value: 1, label: 'Lundi',    ar: 'الإثنين' },
  { value: 2, label: 'Mardi',    ar: 'الثلاثاء' },
  { value: 3, label: 'Mercredi', ar: 'الأربعاء' },
  { value: 4, label: 'Jeudi',    ar: 'الخميس' },
  { value: 5, label: 'Vendredi', ar: 'الجمعة' },
  { value: 6, label: 'Samedi',   ar: 'السبت' },
];

const COLORS = [
  { border: 'border-l-red-500',    badge: 'bg-red-100 text-red-800' },
  { border: 'border-l-blue-500',   badge: 'bg-blue-100 text-blue-800' },
  { border: 'border-l-green-500',  badge: 'bg-green-100 text-green-800' },
  { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-800' },
  { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-800' },
  { border: 'border-l-teal-500',   badge: 'bg-teal-100 text-teal-800' },
  { border: 'border-l-pink-500',   badge: 'bg-pink-100 text-pink-800' },
  { border: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-800' },
];

const BRANCH_INFO = {
  'Hay Salam': {
    img: '/branch-hay-salam.jpg',
    fr: 'Hay Salam, à côté du café Qualita',
    ar: 'حي السلام، بجانب مقهى كواليتا',
  },
  'Doukkali': {
    img: '/branch-doukkali.jpg',
    fr: 'Av. Chouaib Doukkali, en face clinique Sekkat',
    ar: 'ش. شعيب الدكالي، فوق جمعية محاربة السكري',
  },
  'Saada': {
    img: '/branch-saada.jpg',
    fr: 'En face école Ilyas, à côté de l\'auto école',
    ar: 'أمام مدرسة إلياس، بجانب مدرسة تعليم السياقة',
  },
};

const applyLastGroupFilter = (sessions) => {
  const byKey = {};
  sessions.forEach(s => {
    const key = `${s.branch}__${s.subject || 'Unknown'}__${s.professor || 'Unknown'}`;
    (byKey[key] = byKey[key] || []).push(s);
  });
  const result = [];
  Object.values(byKey).forEach(list => {
    const groups = [...new Set(list.map(s => s.groupe).filter(Boolean))];
    if (!groups.length) { result.push(...list); return; }
    const lastGroup = groups.sort(
      (a, b) => (parseInt(b.replace(/\D/g, '')) || 0) - (parseInt(a.replace(/\D/g, '')) || 0)
    )[0];
    list.forEach(s => { if (s.groupe === lastGroup) result.push(s); });
  });
  return result;
};

/* ── Bilingual label ─────────────────────────────────────── */
const Bi = ({ fr, ar, className = '' }) => (
  <div className={className}>
    <span className="block">{fr}</span>
    <span className="block text-right" dir="rtl" style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}>{ar}</span>
  </div>
);

/* ── Contact footer strip ────────────────────────────────── */
const ContactStrip = () => (
  <div className="mt-6 flex flex-col items-center gap-1">
    <a
      href="tel:0649698737"
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
    >
      <Phone className="w-4 h-4" />
      0649 69 87 37
    </a>
    <p className="text-white/50 text-xs" dir="rtl">للمزيد من المعلومات · Pour plus d'informations</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const PublicSchedule = () => {
  const [allSessions, setAllSessions]           = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [branches, setBranches]                 = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);

  /* wizard */
  const [showWizard, setShowWizard]   = useState(true);
  const [wizardStep, setWizardStep]   = useState(1);
  const [tempBranch, setTempBranch]   = useState(null);
  const [tempLevel, setTempLevel]     = useState(null);
  const [allLevels, setAllLevels]     = useState([]);

  /* schedule filters */
  const [filterBranch, setFilterBranch]               = useState('');
  const [filterLevel, setFilterLevel]                 = useState('');
  const [filterPeriod, setFilterPeriod]               = useState('normal');
  const [filterLastGroupOnly, setFilterLastGroupOnly] = useState(false);

  /* ── Load all data on mount ── */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'branches'));
        let branchList = [];
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          const arr  = data.branches || [];
          branchList = arr.map(b => (typeof b === 'string' ? b : b.name)).filter(Boolean);
          setAvailablePeriods(getAllPeriods(arr));
        }
        if (!branchList.length) branchList = ['Hay Salam', 'Doukkali', 'Saada'];
        setBranches(branchList);

        const results = await Promise.all(
          branchList.map(branch =>
            getDoc(doc(db, 'branches', branch)).then(snap =>
              snap.exists() ? (snap.data().sessions || []).map(s => ({ ...s, branch })) : []
            )
          )
        );
        setAllSessions(results.flat());
      } catch (e) {
        console.error('Erreur chargement:', e);
      } finally {
        setLoading(false);
      }
    };

    /* URL params → skip wizard */
    const params = new URLSearchParams(window.location.search);
    const bp = params.get('branch'), lp = params.get('level'), pp = params.get('period');
    if (bp && lp) {
      setFilterBranch(bp); setFilterLevel(lp);
      if (pp) setFilterPeriod(pp);
      setShowWizard(false);
    }

    init();
  }, []);

  /* levels for the selected branch */
  useEffect(() => {
    if (!tempBranch) return;
    const src = allSessions.filter(s => s.branch === tempBranch);
    const set = new Set();
    src.forEach(s => getSessionLevels(s).forEach(l => set.add(l)));
    setAllLevels([...set].sort());
  }, [tempBranch, allSessions]);

  /* subject → color map */
  const subjectColorMap = useMemo(() => {
    const map = {}; let ci = 0;
    allSessions.forEach(s => { if (s.subject && !map[s.subject]) map[s.subject] = COLORS[ci++ % COLORS.length]; });
    return map;
  }, [allSessions]);

  /* filtered sessions (client-side, reactive) */
  const filteredSessions = useMemo(() => {
    let list = allSessions.filter(s => s.status !== 'cancelled');
    list = filterPeriod === 'normal'
      ? list.filter(s => !s.period || s.period === null)
      : list.filter(s => s.period === filterPeriod);
    if (filterBranch) list = list.filter(s => s.branch === filterBranch);
    if (filterLevel)  list = list.filter(s => sessionIncludesLevel(s, filterLevel));
    if (filterLastGroupOnly) list = applyLastGroupFilter(list);
    list.sort((a, b) =>
      a.dayOfWeek !== b.dayOfWeek ? a.dayOfWeek - b.dayOfWeek : a.startTime.localeCompare(b.startTime)
    );
    return list;
  }, [allSessions, filterBranch, filterLevel, filterPeriod, filterLastGroupOnly]);

  const handleWizardComplete = (period) => {
    setFilterBranch(tempBranch);
    setFilterLevel(tempLevel);
    setFilterPeriod(period);
    setShowWizard(false);
  };

  const handleReset = () => {
    setShowWizard(true);
    setWizardStep(1);
    setTempBranch(null);
    setTempLevel(null);
    setFilterBranch('');
    setFilterLevel('');
    setFilterPeriod('normal');
    setFilterLastGroupOnly(false);
  };

  /* ── LOADING ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6">
        <img src="/logo-intellection.png" alt="Intellection" className="h-40 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Chargement… / جارٍ التحميل…</p>
        </div>
      </div>
    );
  }

  /* ── WIZARD ──────────────────────────────────────────────── */
  if (showWizard) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #1f1f1f 60%, #7f1d1d 100%)' }}
      >
        {/* Logo */}
        <img src="/logo-intellection.png" alt="Intellection" className="h-40 object-contain mb-6" style={{ filter: 'brightness(0) invert(1)' }} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

          {/* Red progress bar header */}
          <div className="bg-red-600 px-6 pt-5 pb-4">
            <Bi
              fr="Emploi du Temps"
              ar="جدول الدروس"
              className="text-center text-white font-bold text-lg leading-snug"
            />
            <div className="flex justify-center mt-3 gap-1.5">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s <= wizardStep ? 'bg-white w-10' : 'bg-red-400 w-4'}`} />
              ))}
            </div>
          </div>

          <div className="p-6">

            {/* ── Step 1 : Centre ── */}
            {wizardStep === 1 && (
              <div>
                <Bi
                  fr="Choisissez votre centre"
                  ar="اختر المركز الأقرب إليك"
                  className="text-center text-gray-800 font-bold text-lg mb-1"
                />
                <p className="text-center text-xs text-gray-400 mb-5">Étape 1 / 3 · الخطوة 1 من 3</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {branches.map(branch => (
                    <button
                      key={branch}
                      onClick={() => { setTempBranch(branch); setWizardStep(2); }}
                      className="rounded-xl overflow-hidden border-2 border-gray-200 hover:border-red-500 transition-all group shadow-sm hover:shadow-md"
                    >
                      {/* Photo en haut */}
                      <div className="relative w-full h-32 overflow-hidden bg-gray-200">
                        <img
                          src={BRANCH_INFO[branch]?.img}
                          alt={branch}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Overlay gradient + text */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 flex items-end">
                          <div className="w-full p-3">
                            <h3 className="font-bold text-white text-lg">{branch}</h3>
                          </div>
                        </div>
                      </div>

                      {/* Adresse en dessous */}
                      <div className="p-4 bg-white">
                        <div className="text-xs text-gray-600 leading-tight font-medium">
                          {BRANCH_INFO[branch]?.fr}
                        </div>
                        <div className="text-xs text-gray-400 leading-tight mt-2" dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>
                          {BRANCH_INFO[branch]?.ar}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2 : Niveau ── */}
            {wizardStep === 2 && (
              <div>
                <Bi
                  fr="Choisissez votre niveau"
                  ar="اختر مستواك الدراسي"
                  className="text-center text-gray-800 font-bold text-lg mb-1"
                />
                <p className="text-center text-xs text-gray-400 mb-2">Étape 2 / 3 · الخطوة 2 من 3</p>
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full font-semibold">
                    <MapPin className="w-3 h-3" /> {tempBranch}
                  </span>
                </div>

                {allLevels.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">Chargement des niveaux…</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {allLevels.map(level => (
                      <button
                        key={level}
                        onClick={() => { setTempLevel(level); setWizardStep(3); }}
                        className="p-4 border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group text-center"
                      >
                        <div className="w-10 h-10 bg-gray-100 group-hover:bg-red-100 rounded-xl mx-auto mb-2 flex items-center justify-center transition-colors">
                          <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                        </div>
                        <div className="font-bold text-gray-800 text-sm">{level}</div>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setWizardStep(1); setTempBranch(null); }}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Retour · رجوع
                </button>
              </div>
            )}

            {/* ── Step 3 : Période ── */}
            {wizardStep === 3 && (
              <div>
                <Bi
                  fr="Choisissez la période"
                  ar="اختر الفترة الزمنية"
                  className="text-center text-gray-800 font-bold text-lg mb-1"
                />
                <p className="text-center text-xs text-gray-400 mb-2">Étape 3 / 3 · الخطوة 3 من 3</p>
                <div className="flex justify-center flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full font-semibold">{tempBranch}</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-semibold">{tempLevel}</span>
                </div>

                <div className="space-y-3 mb-4">
                  <button
                    onClick={() => handleWizardComplete('normal')}
                    className="w-full flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center transition-colors">
                        <Clock className="w-5 h-5 text-blue-500 group-hover:text-red-600 transition-colors" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-800">Emploi Normal · الجدول العادي</div>
                        <div className="text-xs text-gray-400">Horaires habituels · المواعيد المعتادة</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors" />
                  </button>

                  {availablePeriods.map(period => (
                    <button
                      key={period.id}
                      onClick={() => handleWizardComplete(period.id)}
                      className="w-full flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center text-xl transition-colors">
                          {getPeriodIcon(period.type)}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-gray-800">{period.name}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(period.startDate).toLocaleDateString('fr-FR')} → {new Date(period.endDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 transition-colors" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setWizardStep(2); setTempLevel(null); }}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Retour · رجوع
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Contact */}
        <ContactStrip />
      </div>
    );
  }

  /* ── SCHEDULE VIEW ───────────────────────────────────────── */
  const periodLabel = filterPeriod !== 'normal'
    ? availablePeriods.find(p => p.id === filterPeriod)?.name
    : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <img src="/logo-intellection.png" alt="Intellection" className="h-32 object-contain" />

          {/* Branch thumbnail */}
          {BRANCH_INFO[filterBranch]?.img && (
            <div className="flex-shrink-0">
              <img
                src={BRANCH_INFO[filterBranch]?.img}
                alt={filterBranch}
                className="w-16 h-16 rounded-full object-cover border-2 border-red-500 shadow-sm"
              />
            </div>
          )}

          <div className="border-l border-gray-200 pl-4 flex-1">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Emploi du Temps · <span dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>جدول الدروس</span>
            </h1>
            <p className="text-xs text-gray-400">{filterBranch} · {filterLevel}{periodLabel ? ` · ${periodLabel}` : ''}</p>
          </div>
          <a href="tel:0649698737" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors">
            <Phone className="w-3.5 h-3.5" /> 0649 69 87 37
          </a>
        </div>
      </header>

      {/* Sub-bar: last group checkbox + count */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 mr-auto">{filteredSessions.length} cours</span>

          <label className="flex items-center gap-2 cursor-pointer bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors select-none">
            <input
              type="checkbox"
              checked={filterLastGroupOnly}
              onChange={e => setFilterLastGroupOnly(e.target.checked)}
              className="w-4 h-4 accent-orange-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-orange-800">
              Dernier groupe · <span dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>المجموعة الأخيرة فقط</span>
            </span>
          </label>
        </div>
      </div>

      {/* Sessions */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold">Aucun cours programmé</p>
            <p className="text-gray-400 text-sm" dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>لا توجد حصص مبرمجة</p>
          </div>
        ) : (
          <div className="space-y-8">
            {daysOfWeek.map(day => {
              const daySessions = filteredSessions.filter(s => s.dayOfWeek === day.value);
              if (!daySessions.length) return null;
              return (
                <section key={day.value}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 bg-gray-900 text-white pl-4 pr-3 py-1.5 rounded-full">
                      <span className="text-xs font-bold tracking-widest">{day.label.toUpperCase()}</span>
                      <span className="text-gray-400 text-xs" dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>{day.ar}</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">{daySessions.length} cours</span>
                  </div>

                  <div className="space-y-2">
                    {daySessions.map((session, idx) => {
                      const color = subjectColorMap[session.subject] || COLORS[0];
                      return (
                        <div key={idx} className={`bg-white rounded-xl border-l-4 ${color.border} shadow-sm hover:shadow-md transition-shadow`}>
                          <div className="p-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm min-w-[110px]">
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              {session.startTime?.substring(0, 5)} – {session.endTime?.substring(0, 5)}
                            </div>
                            <div className="flex-1 min-w-[130px]">
                              <div className="font-semibold text-gray-800 text-sm">{session.subject}</div>
                              {session.level && <div className="text-xs text-gray-400 mt-0.5">{session.level}</div>}
                            </div>
                            {session.groupe && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${color.badge}`}>
                                {session.groupe}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-[100px]">
                              <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              {session.professor}
                            </div>
                            {session.room && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                                <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                Salle {session.room}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-8 text-center space-y-4">
          <img src="/logo-intellection.png" alt="Intellection" className="h-28 object-contain mx-auto" />

          <a
            href="tel:0649698737"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            <Phone className="w-4 h-4" />
            0649 69 87 37 · للمزيد من المعلومات
          </a>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold transition-colors"
            >
              Modifier ma sélection · <span dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>تغيير الاختيار</span>
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Home className="w-4 h-4" /> Accueil
            </button>
          </div>
          <p className="text-xs text-gray-400">Centre de Soutien Intellection</p>
        </div>
      </main>
    </div>
  );
};

export default PublicSchedule;
