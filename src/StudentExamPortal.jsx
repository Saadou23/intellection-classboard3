import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { BookOpen, Clock, Award, Download, ChevronRight, User, MapPin, Phone, Mail } from 'lucide-react';
import QRCode from 'qrcode';
import MathFormula from './MathFormula';

const StudentExamPortal = () => {
  const [step, setStep] = useState('form');
  const [studentInfo, setStudentInfo] = useState({
    fullName: '',
    phone: '',
    parentPhone: '',
    city: '',
    email: '',
    isIntellectionStudent: false,
    wantsOffers: false
  });

  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableProfessors, setAvailableProfessors] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStartTime, setExamStartTime] = useState(null);
  
  const [result, setResult] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const cities = ['El Jadida', 'Casablanca', 'Marrakech', 'Rabat', 'Agadir', 'Tanger', 'Fès', 'Meknès', 'Autre'];

  // Vérifier lien direct
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('exam');
    const profId = urlParams.get('prof');
    
    if (examId && profId) {
      loadDirectExam(examId, profId);
    } else {
      loadSystemSettings();
    }
  }, []);

  const loadSystemSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'exam-settings', 'config'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        setAvailableLevels(settings.levels || ['TC', '1BAC', '2BAC', 'Universitaire']);
      }
    } catch (error) {
      console.log('Paramètres par défaut');
      setAvailableLevels(['TC', '1BAC', '2BAC', 'Universitaire']);
    }
  };

  const loadDirectExam = async (examId, profId) => {
    try {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists() && examDoc.data().active) {
        const examData = { id: examDoc.id, ...examDoc.data() };
        setSelectedExam(examData);
        // Reste sur formulaire pour infos étudiant
      }
    } catch (error) {
      console.error('Erreur chargement examen:', error);
    }
  };

  const handleFormSubmit = () => {
    if (!studentInfo.fullName || !studentInfo.phone) {
      alert('⚠️ Veuillez remplir les champs obligatoires');
      return;
    }

    const phoneRegex = /^0[567]\d{8}$/;
    if (!phoneRegex.test(studentInfo.phone)) {
      alert('⚠️ Numéro de téléphone invalide (format: 06XXXXXXXX)');
      return;
    }

    // Si lien direct, aller directement à l'examen
    if (selectedExam) {
      startExam(selectedExam);
    } else {
      setStep('select-level');
    }
  };

  const handleLevelSelect = async (level) => {
    setSelectedLevel(level);
    
    // Charger les matières disponibles pour ce niveau
    try {
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const examsForLevel = examsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.level === level && e.active);
      
      const subjects = [...new Set(examsForLevel.map(e => e.subject))];
      setAvailableSubjects(subjects);
      setStep('select-subject');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubjectSelect = async (subject) => {
    setSelectedSubject(subject);
    
    // Charger les professeurs pour ce niveau + matière
    try {
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const examsForLevelSubject = examsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => e.level === selectedLevel && e.subject === subject && e.active);
      
      // Extraire les profs uniques
      const profIds = [...new Set(examsForLevelSubject.map(e => e.createdBy))];
      
      // Charger infos profs
      const profsData = await Promise.all(
        profIds.map(async (profId) => {
          const profDoc = await getDoc(doc(db, 'exam-professors', profId));
          if (profDoc.exists()) {
            const examCount = examsForLevelSubject.filter(e => e.createdBy === profId).length;
            return { 
              id: profId, 
              ...profDoc.data(),
              examCount 
            };
          }
          return null;
        })
      );
      
      setAvailableProfessors(profsData.filter(p => p !== null));
      setStep('select-professor');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleProfessorSelect = async (professor) => {
    setSelectedProfessor(professor);
    
    // Charger les examens de ce prof
    try {
      const examsSnapshot = await getDocs(collection(db, 'exams'));
      const examsForProf = examsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(e => 
          e.level === selectedLevel && 
          e.subject === selectedSubject && 
          e.createdBy === professor.id &&
          e.active
        );
      
      setAvailableExams(examsForProf);
      setStep('select-exam');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const startExam = (exam) => {
    setSelectedExam(exam);
    setTimeLeft(exam.duration * 60);
    setExamStartTime(Date.now());
    setCurrentQuestionIndex(0);
    setAnswers({});
    setStep('exam');
  };

  useEffect(() => {
    if (step === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmitExam = async () => {
    const duration = Math.floor((Date.now() - examStartTime) / 1000);
    
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    selectedExam.questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
        score += question.points;
      } else {
        wrongAnswers++;
      }
    });

    const totalPoints = selectedExam.totalPoints;
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= selectedExam.passingScore;

    const verificationCode = `INT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const resultData = {
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      examType: selectedExam.examType || 'Test de niveau',
      studentInfo,
      level: selectedExam.level,
      subject: selectedExam.subject,
      answers,
      score,
      totalPoints,
      percentage,
      passed,
      correctAnswers,
      wrongAnswers,
      startedAt: new Date(examStartTime),
      submittedAt: new Date(),
      duration,
      verificationCode,
      verified: false
    };

    try {
      const attemptRef = doc(collection(db, 'exam-attempts'));
      await setDoc(attemptRef, resultData);
      
      // Générer QR Code
      const qrData = JSON.stringify({
        code: verificationCode,
        name: studentInfo.fullName,
        score: percentage,
        level: selectedExam.level,
        subject: selectedExam.subject,
        exam: selectedExam.title,
        date: new Date().toLocaleDateString('fr-FR')
      });
      
      const qr = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#DC2626', light: '#FFFFFF' }
      });
      
      setQrCodeUrl(qr);
      setResult(resultData);
      setStep('result');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const downloadResult = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // Fond blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 1000);

    // Header rouge
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, 0, 800, 150);

    // Logo/Titre
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INTELLECTION', 400, 70);
    ctx.font = '24px Arial';
    ctx.fillText('Résultat Test de Niveau', 400, 110);

    // Infos étudiant
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Nom: ${studentInfo.fullName}`, 50, 220);
    ctx.font = '20px Arial';
    ctx.fillText(`${selectedExam.level} - ${selectedExam.subject}`, 50, 260);
    ctx.fillText(`${selectedExam.examType || 'Test de niveau'}`, 50, 290);

    // Score
    ctx.fillStyle = result.passed ? '#10B981' : '#DC2626';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${result.percentage}%`, 400, 400);

    ctx.fillStyle = '#1F2937';
    ctx.font = '24px Arial';
    ctx.fillText(result.passed ? '✓ RÉUSSI' : '✗ ÉCHOUÉ', 400, 450);

    ctx.font = '20px Arial';
    ctx.fillText(`${result.correctAnswers} / ${result.correctAnswers + result.wrongAnswers} réponses correctes`, 400, 500);
    ctx.fillText(`Score: ${result.score} / ${result.totalPoints} points`, 400, 530);

    // QR Code
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 250, 580, 300, 300);

      // Code vérification
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(result.verificationCode, 400, 920);

      // Footer
      ctx.font = '14px Arial';
      ctx.fillText('INTELLECTION - El Jadida', 400, 950);
      ctx.fillText(new Date().toLocaleDateString('fr-FR'), 400, 970);

      // Télécharger
      const link = document.createElement('a');
      link.download = `Resultat_${studentInfo.fullName.replace(/ /g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = qrCodeUrl;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // FORMULAIRE
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-600">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-8 text-center">
              <h1 className="text-4xl font-bold mb-2">🎓 INTELLECTION</h1>
              <p className="text-xl text-red-100">Test de Niveau en Ligne</p>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Nom Complet *
                </label>
                <input
                  type="text"
                  value={studentInfo.fullName}
                  onChange={(e) => setStudentInfo({...studentInfo, fullName: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:ring focus:ring-red-200"
                  placeholder="Votre nom complet"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={studentInfo.phone}
                    onChange={(e) => setStudentInfo({...studentInfo, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                    placeholder="06XXXXXXXX"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Tél. Parent
                  </label>
                  <input
                    type="tel"
                    value={studentInfo.parentPhone}
                    onChange={(e) => setStudentInfo({...studentInfo, parentPhone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                    placeholder="06XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  Ville *
                </label>
                <select
                  value={studentInfo.city}
                  onChange={(e) => setStudentInfo({...studentInfo, city: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                >
                  <option value="">-- Sélectionner --</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={studentInfo.email}
                  onChange={(e) => setStudentInfo({...studentInfo, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600"
                  placeholder="votre.email@exemple.com"
                />
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentInfo.isIntellectionStudent}
                    onChange={(e) => setStudentInfo({...studentInfo, isIntellectionStudent: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <span className="text-gray-700">Je suis étudiant(e) INTELLECTION</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentInfo.wantsOffers}
                    onChange={(e) => setStudentInfo({...studentInfo, wantsOffers: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <span className="text-gray-700">Je souhaite recevoir les offres INTELLECTION</span>
                </label>
              </div>

              <button
                onClick={handleFormSubmit}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Continuer
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SÉLECTION NIVEAU
  if (step === 'select-level') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Sélectionnez votre niveau</h2>
            <p className="text-gray-600 text-center mb-8">Choisissez le niveau scolaire correspondant</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableLevels.map((level, index) => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 hover:border-red-600 rounded-xl p-6 transition-all hover:shadow-lg hover:scale-105 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-4xl mb-3">
                    {index === 0 ? '📚' : index === 1 ? '📖' : index === 2 ? '🎓' : '🎯'}
                  </div>
                  <div className="text-xl font-bold text-gray-800 group-hover:text-red-600">
                    {level}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SÉLECTION MATIÈRE
  if (step === 'select-subject') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-2">Vous avez choisi :</p>
              <h2 className="text-3xl font-bold text-red-600">{selectedLevel}</h2>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-6">Choisissez la matière</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableSubjects.map((subject, index) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 hover:border-blue-600 rounded-xl p-6 transition-all hover:shadow-lg hover:scale-105"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-3xl mb-2">📖</div>
                  <div className="text-lg font-bold text-gray-800">{subject}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('select-level')}
              className="mt-6 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SÉLECTION PROFESSEUR
  if (step === 'select-professor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-2">Vous avez choisi :</p>
              <h2 className="text-3xl font-bold text-red-600">{selectedLevel} - {selectedSubject}</h2>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-6">Sélectionnez votre professeur</h3>

            <div className="space-y-4">
              {availableProfessors.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => handleProfessorSelect(prof)}
                  className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 hover:border-purple-600 rounded-xl p-6 transition-all hover:shadow-lg text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {prof.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-800 group-hover:text-purple-600">
                            {prof.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {prof.examCount} examen{prof.examCount > 1 ? 's' : ''} disponible{prof.examCount > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-purple-600" />
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('select-subject')}
              className="mt-6 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SÉLECTION EXAMEN
  if (step === 'select-exam') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-2">Professeur :</p>
              <h2 className="text-3xl font-bold text-purple-600">{selectedProfessor.name}</h2>
              <p className="text-gray-600">{selectedLevel} - {selectedSubject}</p>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-6">Examens disponibles</h3>

            <div className="space-y-4">
              {availableExams.map(exam => (
                <div
                  key={exam.id}
                  className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6"
                >
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{exam.title}</h4>
                  {exam.description && (
                    <p className="text-gray-600 mb-3">{exam.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exam.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {exam.questions?.length} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {exam.passingScore}% requis
                    </span>
                  </div>

                  <button
                    onClick={() => startExam(exam)}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                  >
                    Commencer →
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('select-professor')}
              className="mt-6 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PASSAGE EXAMEN
  if (step === 'exam' && selectedExam) {
    const currentQuestion = selectedExam.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedExam.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
        {/* Header fixe */}
        <div className="bg-white shadow-lg border-b-2 border-red-600 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">{selectedExam.title}</h2>
              <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                <Clock className="w-6 h-6 inline mr-2" />
                {formatTime(timeLeft)}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Question {currentQuestionIndex + 1} / {selectedExam.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                {currentQuestionIndex + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentQuestion.question}</h3>
                
                {currentQuestion.formulaLatex && (
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 mb-4">
                    <MathFormula formula={currentQuestion.formulaLatex} inline={false} />
                  </div>
                )}
                
                {currentQuestion.imageUrl && (
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question"
                    className="max-w-full rounded-lg mb-4"
                  />
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple_choice' ? (
                currentQuestion.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      answers[currentQuestion.id] === option.id
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                        answers[currentQuestion.id] === option.id
                          ? 'border-red-600 bg-red-600'
                          : 'border-gray-400'
                      }`}>
                        {answers[currentQuestion.id] === option.id && (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-700">{option.id.toUpperCase()}.</span>
                          <span className="text-gray-800">{option.text}</span>
                        </div>
                        {option.imageUrl && (
                          <img 
                            src={option.imageUrl} 
                            alt={`Option ${option.id}`}
                            className="max-w-sm max-h-40 rounded border-2 border-gray-200 mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => handleAnswerSelect(currentQuestion.id, 'true')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      answers[currentQuestion.id] === 'true'
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <span className="text-lg font-bold text-green-600">✓ Vrai</span>
                  </button>
                  <button
                    onClick={() => handleAnswerSelect(currentQuestion.id, 'false')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      answers[currentQuestion.id] === 'false'
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-300 hover:border-red-400'
                    }`}
                  >
                    <span className="text-lg font-bold text-red-600">✗ Faux</span>
                  </button>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100"
                >
                  ← Précédent
                </button>
              )}
              
              {currentQuestionIndex < selectedExam.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  onClick={handleSubmitExam}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700"
                >
                  ✓ Soumettre l'Examen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RÉSULTAT
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className={`p-8 text-center ${result.passed ? 'bg-green-600' : 'bg-red-600'} text-white`}>
              <div className="text-6xl mb-4">
                {result.passed ? '✓' : '✗'}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {result.passed ? 'RÉUSSI !' : 'NON RÉUSSI'}
              </h2>
              <p className="text-xl">{selectedExam.title}</p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className={`text-7xl font-bold mb-4 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.percentage}%
                </div>
                <div className="flex justify-center gap-8 text-gray-600">
                  <div>
                    <div className="text-3xl font-bold text-gray-800">{result.correctAnswers}</div>
                    <div className="text-sm">Correctes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">{result.wrongAnswers}</div>
                    <div className="text-sm">Incorrectes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-800">{Math.floor(result.duration / 60)}</div>
                    <div className="text-sm">Minutes</div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Code de Vérification</h3>
                <div className="flex justify-center mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-center font-mono text-sm text-gray-600 mb-2">{result.verificationCode}</p>
                <p className="text-xs text-gray-500 text-center">
                  Présentez ce QR Code pour valider votre résultat
                </p>
              </div>

              {/* Boutons */}
              <div className="space-y-3">
                <button
                  onClick={downloadResult}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Télécharger le Résultat
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-lg font-bold"
                >
                  Passer un Autre Test
                </button>
              </div>

              {result.passed && (
                <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium">
                    🎉 Félicitations ! Vous pouvez présenter ce résultat à INTELLECTION
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentExamPortal;