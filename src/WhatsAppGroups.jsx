import React, { useState, useEffect } from 'react';
import './WhatsAppGroups.css';

function WhatsAppGroups() {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    const savedLang = localStorage.getItem('whatsappLang') || 'fr';
    setLanguage(savedLang);
    document.body.className = savedLang === 'ar' ? 'ar' : 'fr';
  }, []);

  const switchLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('whatsappLang', lang);
    document.body.className = lang === 'ar' ? 'ar' : 'fr';
  };

  const groups = [
    {
      section: 'Collège',
      sectionAr: 'الإعدادي',
      items: [
        { label: '1 AC', labelAr: 'أولى إعدادي', name: '1ère Année Collège', nameAr: 'السنة الأولى من الإعدادي', link: 'https://chat.whatsapp.com/CVwhMsbPu92Ho98xcKlzsM' },
        { label: '2 AC', labelAr: 'ثانية إعدادي', name: '2ème Année Collège', nameAr: 'السنة الثانية من الإعدادي', link: 'https://chat.whatsapp.com/CHPIU1pkXRiEKZx7l8QTag?s=sw&p=i&ilr=0&amv=2' },
        { label: '3 AC', labelAr: 'ثالثة إعدادي', name: '3ème Année Collège', nameAr: 'السنة الثالثة من الإعدادي', link: 'https://chat.whatsapp.com/G5PGjmEH4vh51K7HvVu3ed?s=sw&p=i&ilr=0&amv=2' },
      ]
    },
    {
      section: 'Lycée',
      sectionAr: 'الثانوي',
      items: [
        { label: 'TC', labelAr: 'جذع', name: 'Tronc Commun', nameAr: 'الجذع المشترك', link: 'https://chat.whatsapp.com/GFWEBVbwipqH0RUx7JNMzp?s=sw&p=i&ilr=0&amv=2' },
        { label: '1 BAC', labelAr: 'أولى باك', name: '1ère Année Baccalauréat', nameAr: 'السنة الأولى من الباكالوريا', link: 'https://chat.whatsapp.com/IeHFusDIDtvExgi4os5CVW?s=sw&p=i&ilr=0&amv=2' },
      ]
    },
    {
      section: '2ème Année Baccalauréat',
      sectionAr: 'السنة الثانية من الباكالوريا',
      items: [
        { label: '2 BAC SM', labelAr: 'ثانية باك ع.ر', name: 'Sciences Mathématiques', nameAr: 'العلوم الرياضية', link: 'https://chat.whatsapp.com/L4u3mT5MrEX0d6GPUNVNXn?s=sh&p=i&ilr=0&amv=2' },
        { label: '2 BAC SEXP', labelAr: 'ثانية باك ع.ت', name: 'Sciences Expérimentales', nameAr: 'العلوم التجريبية', link: 'https://chat.whatsapp.com/E0h8SxVnBMfLu9QdNSEfjo?s=sh&p=i&ilr=0&amv=2' },
        { label: '2 BAC ECO', labelAr: 'ثانية باك ع.ج', name: 'Économie & Gestion', nameAr: 'العلوم الاقتصادية', link: 'https://chat.whatsapp.com/GgHqcYZ3qIdABIwoAZjc0C?s=sh&p=i&ilr=0&amv=2' },
      ]
    },
    {
      section: 'Formations Supérieures',
      sectionAr: 'التعليم العالي',
      items: [
        { label: 'FSJES / ENCG 1', labelAr: 'الدراسات العليا 1', name: 'FSJES / ENCG 1', nameAr: 'كلية الاقتصاد والقانون 1', link: 'https://chat.whatsapp.com/BCHYs1NDakUFFgbh6QFHYJ' },
      ]
    },
  ];

  return (
    <div className="whatsapp-groups-container">
      <header className="whatsapp-header">
        <div className="lang-toggle">
          <button
            className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
            onClick={() => switchLanguage('fr')}
          >
            FR
          </button>
          <button
            className={`lang-btn ${language === 'ar' ? 'active' : ''}`}
            onClick={() => switchLanguage('ar')}
          >
            العربية
          </button>
        </div>

        <h1 className="main-title">
          <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>BIENVENUE À INTELLECTION</span>
          <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>أهلا وسهلا في إنتليجنشن</span>
        </h1>

        <h2 className="section-title">
          <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>Groupes WhatsApp Intellection</span>
          <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>مجموعات الواتس آب إنتليجنشن</span>
        </h2>

        <p className="subtitle">
          <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>Rejoignez les groupes WhatsApp pour les cours, infos et résumés en direct</span>
          <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>انضم إلى مجموعات الواتس آب للدروس والمعلومات والملخصات المباشرة</span>
        </p>
      </header>

      <main className="whatsapp-container">
        {groups.map((group, idx) => (
          <section key={idx} className="group-section">
            <div className="section-label">
              <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>{group.section}</span>
              <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>{group.sectionAr}</span>
            </div>
            <div className="groups-list">
              {group.items.map((item, itemIdx) => (
                <div key={itemIdx} className="group-item">
                  <span className="group-label">
                    <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>{item.label}</span>
                    <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>{item.labelAr}</span>
                  </span>
                  <span className="group-name">
                    <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>{item.name}</span>
                    <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>{item.nameAr}</span>
                  </span>
                  <a href={item.link} className="join-btn" target="_blank" rel="noopener noreferrer">
                    <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.148-.669.15-.198.297-.768.966-.941 1.165-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.565 0-3.083.516-4.335 1.458L2.05 1.863 3.64 7.049c-1.007 1.294-1.582 2.951-1.582 4.75 0 4.61 3.85 8.45 8.522 8.45 2.27 0 4.407-.824 6.052-2.223l5.243 1.587-1.207-5.541c.923-1.306 1.466-2.947 1.466-4.687 0-4.61-3.85-8.45-8.522-8.45"/>
                    </svg>
                    <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>Rejoindre</span>
                    <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>انضم</span>
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="disclaimer">
          <p>
            <span style={{ display: language === 'fr' ? 'inline' : 'none' }}>Les liens vous redirigeront directement vers les groupes WhatsApp. Assurez-vous d'avoir WhatsApp installé sur votre appareil.</span>
            <span style={{ display: language === 'ar' ? 'inline' : 'none' }}>ستوجهك الروابط مباشرة إلى مجموعات الواتس آب. تأكد من تثبيت تطبيق الواتس آب على جهازك.</span>
          </p>
        </div>
      </main>
    </div>
  );
}

export default WhatsAppGroups;
