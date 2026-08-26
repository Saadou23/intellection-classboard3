import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronDown, ChevronUp, Clock, Users, BookOpen, Building2, ArrowLeft, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SubjectScheduleMatrix = ({ onClose }) => {
  const [data, setData] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(true);

  // Branches disponibles
  const branches = ['Hay Salam', 'Doukkali', 'Saada'];

  // Mapper des jours
  const dayNames = {
    0: 'Dimanche',
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi'
  };

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const matrix = {};

        for (const branch of branches) {
          try {
            const docRef = doc(db, 'branches', branch);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) {
              console.log(`Aucune donnée pour ${branch}`);
              matrix[branch] = {};
              continue;
            }

            const branchData = {};
            const sessions = snapshot.data().sessions || [];

            sessions.forEach(session => {
              const levels = Array.isArray(session.levels) ? session.levels : [session.level];

              levels.forEach(level => {
                if (!branchData[level]) {
                  branchData[level] = {};
                }

                const subject = session.subject || 'Sans matière';

                if (!branchData[level][subject]) {
                  branchData[level][subject] = [];
                }

                branchData[level][subject].push({
                  professor: session.professor || 'Non assigné',
                  startTime: session.startTime,
                  endTime: session.endTime,
                  dayOfWeek: session.dayOfWeek,
                  room: session.room || 'Non assignée',
                  groups: session.groupes || []
                });
              });
            });

            matrix[branch] = branchData;
          } catch (branchError) {
            console.error(`Erreur pour ${branch}:`, branchError);
            matrix[branch] = {};
          }
        }

        setData(matrix);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const generatePDF = (branch) => {
    const branchData = data[branch] || {};
    const levels = Object.keys(branchData).sort();

    const doc = new jsPDF();
    let yPosition = 20;

    // En-tête
    doc.setFontSize(16);
    doc.text(`Matrice des Horaires - ${branch}`, 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPosition);
    yPosition += 15;

    // Pour chaque niveau
    levels.forEach((level, levelIndex) => {
      const levelData = branchData[level];
      const subjects = Object.keys(levelData).sort();

      // Vérifier si nous avons besoin d'une nouvelle page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Titre du niveau
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Niveau: ${level}`, 14, yPosition);
      yPosition += 8;

      // Tableau pour ce niveau
      const tableData = [];

      subjects.forEach(subject => {
        const sessions = levelData[subject];
        const professors = [...new Set(sessions.map(s => s.professor))];

        professors.forEach((professor, profIdx) => {
          const profSessions = sessions.filter(s => s.professor === professor);

          profSessions.forEach((session, sessionIdx) => {
            tableData.push([
              subject,
              professor,
              dayNames[session.dayOfWeek],
              `${session.startTime} - ${session.endTime}`,
              session.room,
              session.groups.join(', ') || '-'
            ]);
          });
        });
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Matière', 'Professeur', 'Jour', 'Horaire', 'Salle', 'Groupes']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 90, 160],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 28 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 }
        },
        margin: 14
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    });

    // Télécharger le PDF
    doc.save(`Matrice_Horaires_${branch.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec bouton fermeture */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-400" />
              Matrice des Horaires
            </h1>
            <p className="text-gray-400">Vue complète des matières, professeurs et horaires par centre et niveau</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          )}
        </div>

        {/* Branches */}
        <div className="space-y-6">
          {branches.map(branch => {
            const branchData = data[branch] || {};
            const levels = Object.keys(branchData).sort();
            const hasSessions = levels.length > 0;

            return (
              <div key={branch} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50">
                {/* En-tête du centre */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  <h2 className="text-xl font-bold flex-1">{branch}</h2>
                  <button
                    onClick={() => generatePDF(branch)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded flex items-center gap-1 text-sm transition-colors"
                    disabled={levels.length === 0}
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <span className="text-sm bg-blue-500 px-3 py-1 rounded">
                    {levels.length} niveaux
                  </span>
                </div>

                {!hasSessions ? (
                  <div className="p-6 text-center text-gray-400">
                    Aucune matière programmée
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {/* Niveaux */}
                    {levels.map(level => {
                      const levelData = branchData[level];
                      const subjects = Object.keys(levelData).sort();
                      const sectionKey = `${branch}-${level}`;
                      const isExpanded = expandedSections[sectionKey];

                      return (
                        <div key={level} className="bg-gray-800/30">
                          {/* En-tête du niveau */}
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="w-full p-4 flex items-center gap-3 hover:bg-gray-700/50 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-blue-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="font-semibold text-lg flex-1 text-left">{level}</span>
                            <span className="text-sm bg-gray-700 px-3 py-1 rounded">
                              {subjects.length} matière(s)
                            </span>
                          </button>

                          {/* Contenu du niveau */}
                          {isExpanded && (
                            <div className="divide-y divide-gray-700 bg-gray-900/50 p-4 space-y-4">
                              {subjects.map(subject => {
                                const sessions = levelData[subject];
                                const professors = [...new Set(sessions.map(s => s.professor))];

                                return (
                                  <div key={subject} className="bg-gray-800 rounded-lg p-4">
                                    {/* Matière */}
                                    <h4 className="font-semibold text-blue-300 mb-4 flex items-center gap-2">
                                      <BookOpen className="w-4 h-4" />
                                      {subject}
                                    </h4>

                                    {/* Professeurs et horaires */}
                                    <div className="space-y-3">
                                      {professors.map(professor => {
                                        const profSessions = sessions.filter(
                                          s => s.professor === professor
                                        );

                                        return (
                                          <div
                                            key={professor}
                                            className="bg-gray-700 rounded p-3 border-l-4 border-green-500"
                                          >
                                            {/* Nom du professeur */}
                                            <div className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                                              <Users className="w-4 h-4" />
                                              {professor}
                                            </div>

                                            {/* Horaires */}
                                            <div className="space-y-2 ml-6">
                                              {profSessions.map((session, idx) => (
                                                <div
                                                  key={idx}
                                                  className="text-sm bg-gray-600 rounded p-2 flex items-start gap-2"
                                                >
                                                  <Clock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                                  <div className="flex-1">
                                                    <div className="text-gray-200">
                                                      <span className="font-semibold">
                                                        {dayNames[session.dayOfWeek]}
                                                      </span>
                                                      {' '}
                                                      <span className="text-yellow-300">
                                                        {session.startTime} - {session.endTime}
                                                      </span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                      Salle: <span className="text-gray-300">{session.room}</span>
                                                      {session.groups.length > 0 && (
                                                        <>
                                                          {' | Groupes: '}
                                                          <span className="text-gray-300">
                                                            {session.groups.join(', ')}
                                                          </span>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubjectScheduleMatrix;
