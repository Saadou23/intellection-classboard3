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
    const key = `${s.branch}__${s.subject || 'Unknown'}`;
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

/* ── WhatsApp icon ───────────────────────────────────────── */
const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
  const [isGeneratingPDF, setIsGeneratingPDF]         = useState(false);

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
  const generatePDFBlob = async () => {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, margin = 14, cw = W - margin * 2;
    const periodLbl = filterPeriod !== 'normal'
      ? availablePeriods.find(p => p.id === filterPeriod)?.name || ''
      : 'Emploi Normal';
    let y = 16;

    /* ── Header ── */
    pdf.setFillColor(220, 38, 38);
    pdf.rect(0, 0, W, 28, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
    pdf.text('INTELLECTION', margin, 12);
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
    pdf.text(`${filterBranch || 'Tous les centres'}  ·  ${filterLevel || 'Tous les niveaux'}  ·  ${periodLbl}`, margin, 21);
    y = 36;

    /* ── Sessions by day ── */
    for (const day of daysOfWeek) {
      const daySessions = filteredSessions.filter(s => s.dayOfWeek === day.value);
      if (!daySessions.length) continue;

      if (y > 262) { pdf.addPage(); y = 16; }

      /* day header */
      pdf.setFillColor(30, 30, 30);
      pdf.roundedRect(margin, y - 4, cw, 9, 1, 1, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
      pdf.text(day.label.toUpperCase(), margin + 3, y + 2);
      y += 11;
      pdf.setTextColor(30, 30, 30);

      for (const s of daySessions) {
        if (y > 268) { pdf.addPage(); y = 16; }

        /* left accent bar */
        pdf.setFillColor(220, 38, 38);
        pdf.rect(margin, y - 3, 1.5, 10, 'F');

        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
        pdf.text(`${s.startTime?.substring(0,5)} – ${s.endTime?.substring(0,5)}`, margin + 4, y + 3);

        pdf.setFont('helvetica', 'normal');
        pdf.text(s.subject || '', margin + 38, y + 3);

        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        if (s.groupe) pdf.text(s.groupe, margin + 100, y + 3);
        pdf.text(s.professor || '', margin + 118, y + 3);
        if (s.room)   pdf.text(`Salle ${s.room}`, margin + 160, y + 3);
        pdf.setTextColor(30, 30, 30);

        y += 10;
        pdf.setDrawColor(230, 230, 230);
        pdf.line(margin + 4, y - 1, W - margin, y - 1);
      }
      y += 5;
    }

    /* ── Footer ── */
    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8); pdf.setTextColor(160);
      pdf.text(
        `Centre de Soutien Intellection  ·  0649 69 87 37  ·  ${new Date().toLocaleDateString('fr-FR')}`,
        margin, 290
      );
      pdf.text(`Page ${i}/${pages}`, W - margin, 290, { align: 'right' });
    }

    return pdf.output('blob');
  };

  const handleWhatsAppShare = async () => {
    setIsGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob();
      const fileName = `emploi-${(filterBranch || 'intellection').replace(/\s/g,'-')}-${(filterLevel || 'tous').replace(/\s/g,'-')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      /* Mobile : Web Share API → feuille de partage native (WhatsApp, etc.) */
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Emploi du Temps - Intellection',
          text: `جدول الدروس · ${filterBranch} · ${filterLevel}\nCentre de Soutien Intellection`,
        });
        return;
      }

      /* Desktop fallback : téléchargement + ouvrir WhatsApp */
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      setTimeout(() => {
        const text =
          `📚 *Emploi du Temps - Intellection*\n` +
          `📍 ${filterBranch || ''} · ${filterLevel || ''}\n\n` +
          `📎 Le PDF vient d'être téléchargé — envoyez-le ici !\n\n` +
          `جدول الدروس مرفق كـ PDF 📄`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }, 800);
    } catch (e) {
      if (e.name !== 'AbortError') console.error('PDF share error:', e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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

      {/* Sub-bar: last group checkbox + whatsapp + count */}
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

          <button
            onClick={handleWhatsAppShare}
            disabled={isGeneratingPDF}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-green-300 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            {isGeneratingPDF
              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <WhatsAppIcon size={14} />
            }
            <span dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>
              {isGeneratingPDF ? '...' : 'شارك PDF'}
            </span>
          </button>
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

          {/* WhatsApp share — big CTA */}
          <button
            onClick={handleWhatsAppShare}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-green-300 text-white px-6 py-3.5 rounded-2xl font-bold text-base transition-colors shadow-lg w-full max-w-sm justify-center"
          >
            {isGeneratingPDF
              ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <WhatsAppIcon size={22} />
            }
            <span dir="rtl" style={{ fontFamily: "'Cairo','Segoe UI',sans-serif" }}>
              {isGeneratingPDF ? 'جارٍ إنشاء PDF...' : 'شارك جدول الزمن مع أصدقاءك'}
            </span>
          </button>

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
