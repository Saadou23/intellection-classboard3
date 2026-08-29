import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { BookOpen, Users, Building2, Clock, Search, Download } from 'lucide-react';

const ProfessorsCatalog = () => {
  const [professorsData, setProfessorsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'by-subject', 'by-professor'
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Charger les branches
        const branchesRef = doc(db, 'settings', 'branches');
        const branchesSnap = await getDoc(branchesRef);

        let branchNames = ['Hay Salam', 'Doukkali', 'Saada'];
        if (branchesSnap.exists()) {
          const branchesArray = branchesSnap.data().branches || [];
          branchNames = branchesArray.map(b => b.name);
        }
        setBranches(branchNames);
        if (branchNames.length > 0) {
          setSelectedBranch(branchNames[0]);
        }

        // Charger les sessions et extraire les infos des professeurs
        const allProfessorsData = {};

        for (const branch of branchNames) {
          const docRef = doc(db, 'branches', branch);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const sessions = docSnap.data().sessions || [];

            sessions.forEach(session => {
              const professor = session.professor;
              if (!professor) return;

              if (!allProfessorsData[professor]) {
                allProfessorsData[professor] = {
                  name: professor,
                  subjects: new Set(),
                  levels: new Set(),
                  branches: new Set(),
                  sessions: []
                };
              }

              if (session.subject) {
                allProfessorsData[professor].subjects.add(session.subject);
              }
              if (session.level) {
                allProfessorsData[professor].levels.add(session.level);
              }
              allProfessorsData[professor].branches.add(branch);
              allProfessorsData[professor].sessions.push({
                branch,
                subject: session.subject,
                level: session.level,
                dayOfWeek: session.dayOfWeek,
                startTime: session.startTime,
                endTime: session.endTime
              });
            });
          }
        }

        // Convertir les Sets en Arrays
        Object.keys(allProfessorsData).forEach(prof => {
          allProfessorsData[prof].subjects = Array.from(allProfessorsData[prof].subjects).sort();
          allProfessorsData[prof].levels = Array.from(allProfessorsData[prof].levels).sort();
          allProfessorsData[prof].branches = Array.from(allProfessorsData[prof].branches).sort();
        });

        setProfessorsData(allProfessorsData);
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Titre
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Catalogue des Professeurs', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Résumé
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Total: ${filteredProfessors.length} professeur(s) | ${new Set(filteredProfessors.flatMap(p => p.subjects)).size} matière(s)`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 8;

      // Ligne de séparation
      doc.setDrawColor(0, 102, 204);
      doc.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 8;

      // Pour chaque professeur
      filteredProfessors.forEach((prof, idx) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        // Nom du professeur
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(prof.name, 15, yPosition);
        yPosition += 6;

        // Matières
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Matières: ${prof.subjects.join(', ')}`, 15, yPosition);
        yPosition += 5;

        // Niveaux
        doc.text(`Niveaux: ${prof.levels.join(', ')}`, 15, yPosition);
        yPosition += 5;

        // Branches
        doc.text(`Branches: ${prof.branches.join(', ')}`, 15, yPosition);
        yPosition += 5;

        // Séances
        doc.text(`Séances: ${prof.sessions.length}`, 15, yPosition);
        yPosition += 6;

        // Ligne de séparation
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 6;
      });

      // Sauvegarder
      const filename = `Catalogue_Professeurs_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      alert(`✅ PDF généré : ${filename}`);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredProfessors = Object.values(professorsData)
    .filter(prof => {
      const matchesSearch = prof.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = !selectedBranch || prof.branches.includes(selectedBranch);
      return matchesSearch && matchesBranch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Grouper par matière
  const bySubject = {};
  filteredProfessors.forEach(prof => {
    prof.subjects.forEach(subject => {
      if (!bySubject[subject]) {
        bySubject[subject] = [];
      }
      bySubject[subject].push(prof);
    });
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 font-semibold">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">👨‍🏫 Catalogue des Professeurs</h1>
            <p className="text-gray-600">Explorez les matières enseignées par professeur</p>
          </div>

          {/* Contrôles */}
          <div className="space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un professeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection branche */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏛️ Filtre par branche
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Toutes les branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode d'affichage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📊 Mode d'affichage
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Par Prof
                  </button>
                  <button
                    onClick={() => setViewMode('by-subject')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'by-subject'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Par Matière
                  </button>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{filteredProfessors.length}</div>
                <div className="text-sm text-blue-700 font-semibold">Professeurs</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">
                  {new Set(filteredProfessors.flatMap(p => p.subjects)).size}
                </div>
                <div className="text-sm text-green-700 font-semibold">Matières distinctes</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-600">
                  {new Set(filteredProfessors.flatMap(p => p.levels)).size}
                </div>
                <div className="text-sm text-purple-700 font-semibold">Niveaux couverts</div>
              </div>
            </div>

            {/* Bouton d'export */}
            <div className="pt-4 text-center">
              <button
                onClick={exportToPDF}
                disabled={isExporting || filteredProfessors.length === 0}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Génération...' : 'Télécharger PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Affichage par professeur */}
        {viewMode === 'all' && (
          <div className="space-y-4">
            {filteredProfessors.length > 0 ? (
              filteredProfessors.map(prof => (
                <div
                  key={prof.name}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <h2 className="text-2xl font-bold mb-2">{prof.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        <span>{prof.subjects.length} matière(s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>{prof.levels.length} niveau(x)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        <span>{prof.branches.length} branche(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Matières */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        Matières enseignées
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {prof.subjects.map(subject => (
                          <span
                            key={subject}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Niveaux */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        Niveaux
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {prof.levels.map(level => (
                          <span
                            key={level}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Branches */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        Branches / Centres
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {prof.branches.map(branch => (
                          <span
                            key={branch}
                            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold"
                          >
                            {branch}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Nombre de séances */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">{prof.sessions.length}</span> séance(s) programmée(s)
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun professeur trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Affichage par matière */}
        {viewMode === 'by-subject' && (
          <div className="space-y-4">
            {Object.keys(bySubject)
              .sort()
              .map(subject => (
                <div key={subject} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <BookOpen className="w-6 h-6" />
                      {subject}
                    </h2>
                    <p className="text-green-100 text-sm mt-2">
                      {bySubject[subject].length} professeur(s) enseigne(nt) cette matière
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bySubject[subject].map(prof => (
                        <div
                          key={prof.name}
                          className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="font-bold text-gray-800 mb-2">{prof.name}</div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>
                              <span className="font-semibold">Niveaux:</span>{' '}
                              {prof.levels.join(', ')}
                            </div>
                            <div>
                              <span className="font-semibold">Branches:</span>{' '}
                              {prof.branches.join(', ')}
                            </div>
                            <div>
                              <span className="font-semibold">Séances:</span> {prof.sessions.filter(s => s.subject === subject).length}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessorsCatalog;
