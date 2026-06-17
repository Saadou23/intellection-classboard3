import React, { useState, useEffect } from 'react';
import { Upload, Download, Check, X, AlertCircle, Users } from 'lucide-react';
import { db } from './firebase';
import { doc, writeBatch, getDoc, collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const StudentDataImporter = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  // Charger le nombre d'étudiants au montage
  useEffect(() => {
    const loadStudentCount = async () => {
      try {
        const studentsCollection = collection(db, 'students');
        const snapshot = await getDocs(studentsCollection);
        setTotalStudents(snapshot.size);
      } catch (error) {
        console.error('Erreur chargement du nombre d\'étudiants:', error);
      } finally {
        setLoadingCount(false);
      }
    };

    loadStudentCount();
  }, []);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Matricule', 'Nom', 'Prénom'],
      ['14564546', 'Es-sabbar', 'Hajar'],
      ['14564547', 'Dupont', 'Jean'],
      ['14564548', 'Martin', 'Marie'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Étudiants');
    XLSX.writeFile(wb, 'template_etudiants.xlsx');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setResults(null);
    }
  };

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const students = [];
          const errors = [];

          // Skip header row
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[0] && !row[1] && !row[2]) continue; // Skip empty rows

            const matricule = String(row[0] || '').trim();
            const nom = String(row[1] || '').trim();
            const prenom = String(row[2] || '').trim();

            if (!matricule) {
              errors.push(`Ligne ${i + 1}: Matricule manquant`);
              continue;
            }
            if (!nom) {
              errors.push(`Ligne ${i + 1}: Nom manquant`);
              continue;
            }
            if (!prenom) {
              errors.push(`Ligne ${i + 1}: Prénom manquant`);
              continue;
            }

            students.push({
              matricule,
              nom,
              prenom,
              fullName: `${prenom} ${nom}`,
            });
          }

          resolve({ students, errors });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handlePreview = async () => {
    if (!file) {
      alert('Sélectionne un fichier Excel');
      return;
    }

    setLoading(true);
    try {
      const { students, errors: parseErrors } = await parseExcelFile(file);

      if (parseErrors.length > 0) {
        setErrors(parseErrors);
      }

      if (students.length === 0) {
        alert('Aucun étudiant valide');
        setLoading(false);
        return;
      }

      // Vérifier les doublons/mises à jour
      let newCount = 0;
      let updateCount = 0;
      const duplicates = [];

      for (const student of students) {
        const docRef = doc(db, 'students', student.matricule);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          updateCount++;
        } else {
          newCount++;
        }
      }

      setPreview({
        total: students.length,
        new: newCount,
        update: updateCount,
        students,
        parseErrors,
      });
    } catch (error) {
      console.error('Erreur preview:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    setProgress(0);
    setResults(null);

    try {
      const totalStudents = preview.students.length;
      let imported = 0;
      let batchSize = 100;

      for (let i = 0; i < preview.students.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = preview.students.slice(i, i + batchSize);

        chunk.forEach((student) => {
          const docRef = doc(db, 'students', student.matricule);
          batch.set(docRef, {
            matricule: student.matricule,
            nom: student.nom,
            prenom: student.prenom,
            fullName: student.fullName,
            importedAt: new Date(),
          }, { merge: true });
        });

        await batch.commit();
        imported += chunk.length;
        setProgress(Math.round((imported / totalStudents) * 100));
      }

      setResults({
        success: true,
        imported: preview.new,
        updated: preview.update,
        total: preview.total,
      });
      setPreview(null);
      setFile(null);

      // Mettre à jour le compteur
      setTotalStudents(prev => prev + preview.new);
    } catch (error) {
      console.error('Erreur import:', error);
      alert(`❌ Erreur lors de l'import: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Importer les Données Étudiants</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Statistics */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-3 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Étudiants actuellement importés</p>
                  {loadingCount ? (
                    <p className="text-2xl font-bold text-blue-600 animate-pulse">⏳</p>
                  ) : (
                    <p className="text-3xl font-bold text-blue-600">{totalStudents.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Base de données Firebase</p>
                <p className="text-sm text-gray-700 mt-1">
                  {loadingCount ? 'Chargement...' : `${totalStudents} étudiant(s)`}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-bold text-blue-900 mb-2">📋 Format du fichier Excel</h3>
            <p className="text-sm text-blue-800 mb-3">
              Le fichier doit contenir 3 colonnes:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>📌 <strong>Colonne A:</strong> Matricule (ex: 14564546)</li>
              <li>📌 <strong>Colonne B:</strong> Nom (ex: Es-sabbar)</li>
              <li>📌 <strong>Colonne C:</strong> Prénom (ex: Hajar)</li>
            </ul>
          </div>

          {/* Download Template */}
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg transition font-semibold"
          >
            <Download className="w-4 h-4" />
            Télécharger le template Excel
          </button>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sélectionner le fichier Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-3"
            />
            {file && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {file.name}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {loading && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Importation en cours...</span>
                <span className="text-sm font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900">📊 Résumé de l'import</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-xs text-gray-600">Total à importer</p>
                  <p className="text-2xl font-bold text-blue-600">{preview.total}</p>
                </div>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600">✨ Nouveaux</p>
                  <p className="text-2xl font-bold text-green-600">{preview.new}</p>
                </div>
                <div className="bg-white p-3 rounded border border-orange-200">
                  <p className="text-xs text-gray-600">🔄 Mises à jour</p>
                  <p className="text-2xl font-bold text-orange-600">{preview.update}</p>
                </div>
              </div>
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Pas de doublons:</strong> Les matricules existants seront simplement mis à jour
              </p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-900">✅ Import réussi!</h3>
              </div>
              <p className="text-sm text-green-800">
                <strong>{results.imported}</strong> nouveau(x) étudiant(s) créé(s)
              </p>
              {results.updated > 0 && (
                <p className="text-sm text-green-800 mt-1">
                  <strong>{results.updated}</strong> étudiant(s) mis à jour
                </p>
              )}
              <p className="text-xs text-gray-600 mt-2">
                Total traité: {results.total}
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-900">⚠️ Erreurs détectées</h3>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {errors.map((error, idx) => (
                  <p key={idx} className="text-sm text-red-800">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Button */}
          {!preview && (
            <button
              onClick={handlePreview}
              disabled={!file || loading}
              className={`w-full px-4 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
                loading || !file
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Vérification...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Prévisualiser
                </>
              )}
            </button>
          )}

          {/* Import Button */}
          {preview && (
            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold transition"
              >
                Retour
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Confirmer l'import
                  </>
                )}
              </button>
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 space-y-2">
            <p>
              💾 <strong>Stockage:</strong> Les données seront sauvegardées dans Firebase sous <code className="bg-gray-200 px-2 py-1 rounded">students/</code>
            </p>
            <p>
              🔍 <strong>Utilisation:</strong> Lors d'un scan, le nom complet (prénom + nom) s'affichera automatiquement
            </p>
            <p>
              ⚡ <strong>Performance:</strong> Import par batch de 100 pour éviter les surcharges
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDataImporter;
