import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Trash2, Edit2, Eye, Save, X, Upload, Image as ImageIcon, FileText, BarChart3 } from 'lucide-react';
import ProfessorDashboard from './ProfessorDashboard';
import FormulaEditor from './FormulaEditor';
import MathFormula from './MathFormula';

const ProfessorExamCreator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [professor, setProfessor] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'register' | 'pending'
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', subjects: [], levels: [], password: '', confirmPassword: ''
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  
  const [myExams, setMyExams] = useState([]);
  const [view, setView] = useState('list');
  const [currentExam, setCurrentExam] = useState(null);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState({
    levels: ['TC', '1BAC', '2BAC', 'Universitaire'],
    subjects: ['MATHS', 'PHYSIQUE', 'SVT', 'PC', 'FRANÇAIS', 'ANGLAIS'],
    examTypes: ['Test de niveau', 'Contrôle continu', 'Examen blanc', 'Évaluation']
  });
  
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    subject: '',
    level: '',
    examType: 'Test de niveau',
    duration: 30,
    passingScore: 60,
    totalPoints: 0,
    randomizeQuestions: false,
    active: false
  });

  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState({
    type: 'multiple_choice',
    question: '',
    imageUrl: null,
    formulaLatex: '',
    options: [
      { id: 'a', text: '', imageUrl: null },
      { id: 'b', text: '', imageUrl: null },
      { id: 'c', text: '', imageUrl: null },
      { id: 'd', text: '', imageUrl: null }
    ],
    correctAnswer: '',
    points: 1,
    explanation: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (professor) {
      loadMyExams();
      loadSystemSettings();
    }
  }, [professor]);

  const loadSystemSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'exam-settings', 'config'));
      if (settingsDoc.exists()) {
        setSystemSettings(settingsDoc.data());
      }
    } catch (error) {
      console.log('Paramètres par défaut utilisés');
    }
  };

  const loadMyExams = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'exams'));
      const exams = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(exam => exam.createdBy === professor.id);
      
      setMyExams(exams);
    } catch (error) {
      console.error('Erreur chargement examens:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const q = query(
        collection(db, 'exam-professors'),
        where('email', '==', loginForm.email),
        where('password', '==', loginForm.password),
        where('active', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('❌ Email ou mot de passe incorrect');
        return;
      }

      const profData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      setProfessor(profData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Erreur connexion:', error);
      alert('❌ Erreur de connexion');
    }
  };

  const handleRegister = async () => {
    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      alert('⚠️ Nom, email et mot de passe sont obligatoires');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('⚠️ Les mots de passe ne correspondent pas');
      return;
    }
    if (registerForm.password.length < 6) {
      alert('⚠️ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setRegisterLoading(true);
    try {
      // Vérifier si email déjà utilisé
      const q = query(collection(db, 'exam-professors'), where('email', '==', registerForm.email));
      const existing = await getDocs(q);
      if (!existing.empty) {
        alert('❌ Cet email est déjà utilisé');
        setRegisterLoading(false);
        return;
      }
      // Vérifier aussi dans les demandes en attente
      const qPending = query(collection(db, 'professor-requests'), where('email', '==', registerForm.email));
      const existingPending = await getDocs(qPending);
      if (!existingPending.empty) {
        alert('⚠️ Une demande avec cet email est déjà en attente de validation');
        setRegisterLoading(false);
        return;
      }
      const reqRef = doc(collection(db, 'professor-requests'));
      await setDoc(reqRef, {
        ...registerForm,
        status: 'pending', // pending | approved | rejected
        createdAt: new Date(),
        active: false
      });
      setAuthPage('pending');
    } catch (error) {
      console.error('Erreur inscription:', error);
      alert('❌ Erreur lors de l\'envoi de la demande');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleImportQuestionImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `exam-images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      // Mettre l'image dans la question et pré-remplir le texte
      setQuestionForm(prev => ({
        ...prev,
        imageUrl: url,
        question: prev.question || 'Question basée sur l\'image ci-dessous :'
      }));
      alert('✅ Image importée ! Complétez la question et les options.');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors de l\'import de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `exam-images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors de l\'upload de l\'image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddQuestion = () => {
    if (!questionForm.question.trim()) {
      alert('⚠️ Veuillez saisir une question');
      return;
    }

    if (questionForm.type === 'multiple_choice' && !questionForm.correctAnswer) {
      alert('⚠️ Veuillez sélectionner la bonne réponse');
      return;
    }

    const newQuestion = {
      id: `q${questions.length + 1}`,
      ...questionForm
    };

    setQuestions([...questions, newQuestion]);
    
    const totalPoints = [...questions, newQuestion].reduce((sum, q) => sum + Number(q.points), 0);
    setExamForm({...examForm, totalPoints});

    setQuestionForm({
      type: 'multiple_choice',
      question: '',
      imageUrl: null,
      formulaLatex: '',
      options: [
        { id: 'a', text: '', imageUrl: null },
        { id: 'b', text: '', imageUrl: null },
        { id: 'c', text: '', imageUrl: null },
        { id: 'd', text: '', imageUrl: null }
      ],
      correctAnswer: '',
      points: 1,
      explanation: ''
    });
  };

  const handleSaveExam = async () => {
    if (!examForm.title || !examForm.subject || !examForm.level) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (questions.length === 0) {
      alert('⚠️ Ajoutez au moins une question');
      return;
    }

    try {
      const examData = {
        ...examForm,
        questions,
        createdBy: professor.id,
        createdByName: professor.name,
        createdAt: currentExam ? currentExam.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        statistics: currentExam?.statistics || {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0
        }
      };

      if (currentExam) {
        await updateDoc(doc(db, 'exams', currentExam.id), examData);
        alert('✅ Examen mis à jour !');
      } else {
        const examRef = doc(collection(db, 'exams'));
        await setDoc(examRef, examData);
        alert('✅ Examen créé avec succès !');
      }

      setView('list');
      setCurrentExam(null);
      resetForms();
      loadMyExams();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleEditExam = (exam) => {
    setCurrentExam(exam);
    setExamForm({
      title: exam.title,
      description: exam.description || '',
      subject: exam.subject,
      level: exam.level,
      examType: exam.examType || 'Test de niveau',
      duration: exam.duration,
      passingScore: exam.passingScore,
      totalPoints: exam.totalPoints,
      randomizeQuestions: exam.randomizeQuestions || false,
      active: exam.active
    });
    setQuestions(exam.questions || []);
    setView('create');
  };

  const handleDeleteExam = async (examId, examTitle) => {
    if (!confirm(`Supprimer "${examTitle}" ?`)) return;

    try {
      await deleteDoc(doc(db, 'exams', examId));
      alert('✅ Examen supprimé');
      loadMyExams();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (examId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'exams', examId), { active: !currentStatus });
      loadMyExams();
    } catch (error) {
      console.error('Erreur toggle:', error);
    }
  };

  const resetForms = () => {
    setExamForm({
      title: '',
      description: '',
      subject: '',
      level: '',
      examType: 'Test de niveau',
      duration: 30,
      passingScore: 60,
      totalPoints: 0,
      randomizeQuestions: false,
      active: false
    });
    setQuestions([]);
    setCurrentExam(null);
  };

  // PAGES AUTH
  if (!isLoggedIn) {
    const allSubjectsReg = ['MATHS', 'PHYSIQUE', 'SVT', 'PC', 'FRANÇAIS', 'ANGLAIS', 'ARABE', 'PHILOSOPHIE', 'HISTOIRE-GEO', 'ÉCONOMIE'];
    const allLevelsReg   = ['TC', '1BAC', '2BAC', 'Universitaire'];

    // Page demande envoyée
    if (authPage === 'pending') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-t-4 border-green-500 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Demande envoyée !</h1>
            <p className="text-gray-600 mb-6">
              Votre demande a été soumise. L'administrateur va l'examiner et vous notifier par email.
            </p>
            <p className="text-sm text-gray-500 mb-6 bg-gray-50 rounded-lg p-3">
              📧 Email: <strong>{registerForm.email}</strong>
            </p>
            <button
              onClick={() => { setAuthPage('login'); setRegisterForm({ name:'', email:'', phone:'', subjects:[], levels:[], password:'', confirmPassword:'' }); }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold"
            >
              ← Retour à la connexion
            </button>
          </div>
        </div>
      );
    }

    // Page inscription
    if (authPage === 'register') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full border-t-4 border-purple-600">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setAuthPage('login')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Créer un compte Professeur</h1>
                <p className="text-gray-600 text-sm">Votre demande sera validée par l'administrateur</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={e => setRegisterForm({...registerForm, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                  placeholder="Ex: Ahmed BENALI"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={e => setRegisterForm({...registerForm, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                  placeholder="06XXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                  placeholder="Min 6 caractères"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirmer mot de passe *</label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={e => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600"
                  placeholder="Répéter le mot de passe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Matières enseignées</label>
                <div className="border-2 border-gray-300 rounded-lg p-3 grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {allSubjectsReg.map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={registerForm.subjects.includes(s)}
                        onChange={e => {
                          const upd = e.target.checked
                            ? [...registerForm.subjects, s]
                            : registerForm.subjects.filter(x => x !== s);
                          setRegisterForm({...registerForm, subjects: upd});
                        }}
                        className="w-4 h-4"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Niveaux</label>
                <div className="border-2 border-gray-300 rounded-lg p-3 grid grid-cols-2 gap-1">
                  {allLevelsReg.map(l => (
                    <label key={l} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={registerForm.levels.includes(l)}
                        onChange={e => {
                          const upd = e.target.checked
                            ? [...registerForm.levels, l]
                            : registerForm.levels.filter(x => x !== l);
                          setRegisterForm({...registerForm, levels: upd});
                        }}
                        className="w-4 h-4"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setAuthPage('login')}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRegister}
                disabled={registerLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:shadow-lg disabled:opacity-50"
              >
                {registerLoading ? '⏳ Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Page login (défaut)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-t-4 border-blue-600">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Espace Professeur</h1>
            <p className="text-gray-600 mt-2">Créez vos examens QCM</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                placeholder="votre.email@intellection.ma"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:shadow-lg"
            >
              Se connecter
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white px-3 text-gray-500">ou</span></div>
            </div>

            <button
              onClick={() => setAuthPage('register')}
              className="w-full border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-bold hover:bg-purple-50 transition-all"
            >
              ✏️ Créer un compte professeur
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VUE RÉSULTATS
  if (view === 'results') {
    return (
      <div>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium transition-all"
          >
            ← Retour à mes examens
          </button>
        </div>
        <ProfessorDashboard 
          professorId={professor.id}
          professorName={professor.name}
        />
      </div>
    );
  }

  // VUE LISTE EXAMENS
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Mes Examens</h1>
                <p className="text-blue-100 mt-1">Professeur: {professor.name}</p>
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setProfessor(null);
                }}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg"
              >
                Déconnexion
              </button>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  resetForms();
                  setView('create');
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-5 h-5" />
                Créer un Examen
              </button>

              <button
                onClick={() => setView('results')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-blue-700 hover:bg-blue-800 text-white"
              >
                <BarChart3 className="w-5 h-5" />
                📊 Mes Résultats
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {myExams.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun examen</h3>
              <p className="text-gray-600 mb-6">Créez votre premier examen QCM</p>
              <button
                onClick={() => setView('create')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Créer un Examen
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {myExams.map(exam => (
                <div
                  key={exam.id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                    exam.active ? 'border-green-500' : 'border-gray-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          exam.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </div>

                      {exam.description && (
                        <p className="text-gray-600 mb-3">{exam.description}</p>
                      )}

                      <div className="flex gap-6 text-sm text-gray-600 mb-3">
                        <span>📚 {exam.level}</span>
                        <span>📖 {exam.subject}</span>
                        <span>📝 {exam.questions?.length || 0} questions</span>
                        <span>⏱️ {exam.duration} min</span>
                        <span>💯 {exam.totalPoints} pts</span>
                      </div>

                      {exam.statistics && exam.statistics.totalAttempts > 0 && (
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>📊 {exam.statistics.totalAttempts} passages</span>
                          <span>✅ {exam.statistics.passRate}% réussite</span>
                          <span>📈 {exam.statistics.averageScore}% moyenne</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(exam.id, exam.active)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          exam.active
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {exam.active ? 'Désactiver' : 'Activer'}
                      </button>

                      <button
                        onClick={() => handleEditExam(exam)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // VUE CRÉATION/ÉDITION
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">
                {currentExam ? 'Modifier l\'Examen' : 'Créer un Examen'}
              </h1>
              <button
                onClick={() => {
                  setView('list');
                  resetForms();
                }}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Informations de l'Examen</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Titre de l'examen *
                </label>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                  placeholder="Ex: Contrôle Algèbre 1BAC"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm({...examForm, description: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                  rows={3}
                  placeholder="Décrivez le contenu de l'examen..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type d'examen *
                </label>
                <select
                  value={examForm.examType}
                  onChange={(e) => setExamForm({...examForm, examType: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                >
                  {systemSettings.examTypes?.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Matière *
                </label>
                <select
                  value={examForm.subject}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      const newSubject = prompt('Nom de la nouvelle matière (en MAJUSCULES) :');
                      if (newSubject && newSubject.trim()) {
                        const subjectUpper = newSubject.trim().toUpperCase();
                        setSystemSettings({
                          ...systemSettings,
                          subjects: [...(systemSettings.subjects || []), subjectUpper]
                        });
                        setExamForm({...examForm, subject: subjectUpper});
                        
                        const settingsRef = doc(db, 'exam-settings', 'config');
                        updateDoc(settingsRef, {
                          subjects: [...(systemSettings.subjects || []), subjectUpper]
                        }).catch(err => console.log('Sera sauvegardé par admin'));
                      }
                    } else {
                      setExamForm({...examForm, subject: e.target.value});
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                >
                  <option value="">-- Sélectionner --</option>
                  {systemSettings.subjects?.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                  <option value="ADD_NEW" className="bg-green-50 text-green-700 font-bold">
                    ➕ Ajouter une nouvelle matière...
                  </option>
                </select>
                
                {examForm.subject && !systemSettings.subjects?.includes(examForm.subject) && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Nouvelle matière - sera ajoutée aux paramètres système
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Niveau *
                </label>
                <select
                  value={examForm.level}
                  onChange={(e) => setExamForm({...examForm, level: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                >
                  <option value="">-- Sélectionner --</option>
                  {systemSettings.levels?.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Durée (minutes) *
                </label>
                <input
                  type="number"
                  value={examForm.duration}
                  onChange={(e) => setExamForm({...examForm, duration: Number(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Note de passage (%) *
                </label>
                <input
                  type="number"
                  value={examForm.passingScore}
                  onChange={(e) => setExamForm({...examForm, passingScore: Number(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                  min={0}
                  max={100}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examForm.active}
                    onChange={(e) => setExamForm({...examForm, active: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded"
                  />
                  <span className="font-medium text-gray-700">
                    Activer cet examen (visible aux étudiants)
                  </span>
                </label>
              </div>

              <div className="md:col-span-2 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Total de points:</span>
                  <span className="text-2xl font-bold text-blue-600">{examForm.totalPoints}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste Questions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Questions ({questions.length})
            </h2>

            {questions.map((q, index) => (
              <div key={q.id} className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <h3 className="font-bold text-gray-800">{q.question}</h3>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                        {q.points} pt(s)
                      </span>
                    </div>

                    {q.formulaLatex && (
                      <div className="bg-white p-2 rounded border mb-2 font-mono text-sm">
                        {q.formulaLatex}
                      </div>
                    )}

                    {q.imageUrl && (
                      <div className="mb-2">
                        <img src={q.imageUrl} alt="Question" className="max-w-xs rounded border-2 border-gray-300" />
                      </div>
                    )}

                    {q.type === 'multiple_choice' && (
                      <div className="space-y-1 text-sm">
                        {q.options.map(opt => (
                          <div key={opt.id} className={`flex items-center gap-2 ${
                            opt.id === q.correctAnswer ? 'font-bold text-green-600' : 'text-gray-600'
                          }`}>
                            {opt.id === q.correctAnswer ? '✓' : '○'} {opt.id.toUpperCase()}. {opt.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const newQuestions = questions.filter(quest => quest.id !== q.id);
                      setQuestions(newQuestions);
                      const totalPoints = newQuestions.reduce((sum, quest) => sum + Number(quest.points), 0);
                      setExamForm({...examForm, totalPoints});
                    }}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire Ajout Question */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Ajouter une Question</h2>
              
              {/* Import depuis image */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all text-sm">
                  <ImageIcon className="w-4 h-4" />
                  📥 Créer depuis une image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files[0] && handleImportQuestionImage(e.target.files[0])}
                    disabled={uploadingImage}
                  />
                </label>
                {uploadingImage && <span className="text-sm text-orange-600 animate-pulse">⏳ Import...</span>}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type de question
                </label>
                <select
                  value={questionForm.type}
                  onChange={(e) => setQuestionForm({...questionForm, type: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                >
                  <option value="multiple_choice">QCM (4 choix)</option>
                  <option value="true_false">Vrai/Faux</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Question *
                </label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                  rows={3}
                  placeholder="Tapez votre question ici... ou importez une image →"
                />
              </div>

              {/* Image Question - NOUVEAU */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📷 Image pour la question (optionnel)
                </label>
                
                {questionForm.imageUrl ? (
                  <div className="relative inline-block">
                    <img 
                      src={questionForm.imageUrl} 
                      alt="Question" 
                      className="max-w-md max-h-60 rounded border-2 border-gray-300" 
                    />
                    <button
                      type="button"
                      onClick={() => setQuestionForm({...questionForm, imageUrl: null})}
                      className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full hover:bg-red-700 flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files[0]) {
                          setUploadingImage(true);
                          const url = await handleImageUpload(e.target.files[0]);
                          if (url) {
                            setQuestionForm({...questionForm, imageUrl: url});
                          }
                          setUploadingImage(false);
                        }
                      }}
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <span className="text-sm text-green-600 animate-pulse">⏳ Upload...</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés: JPG, PNG, GIF (max 5MB)
                </p>
              </div>

              {/* Éditeur Formules */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Formule Mathématique (optionnel)
                </label>
                
                {questionForm.formulaLatex && (
                  <div className="mb-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-xs text-blue-800 font-bold mb-2">Aperçu formule :</p>
                    <MathFormula formula={questionForm.formulaLatex} inline={false} />
                    <p className="text-xs text-gray-500 mt-2">Code LaTeX : {questionForm.formulaLatex}</p>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowFormulaEditor(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  📐 Ouvrir l'Éditeur de Formules
                </button>
              </div>

              {/* Options QCM */}
              {questionForm.type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Options de réponse
                  </label>
                  <div className="space-y-4">
                    {questionForm.options.map((option, idx) => (
                      <div key={option.id} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex gap-3 items-start mb-3">
                          <span className="w-8 h-10 flex items-center justify-center bg-blue-600 text-white rounded font-bold">
                            {option.id.toUpperCase()}
                          </span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => {
                              const newOptions = [...questionForm.options];
                              newOptions[idx].text = e.target.value;
                              setQuestionForm({...questionForm, options: newOptions});
                            }}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                            placeholder={`Option ${option.id.toUpperCase()}`}
                          />
                          <label className="flex items-center gap-2 whitespace-nowrap">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={questionForm.correctAnswer === option.id}
                              onChange={() => setQuestionForm({...questionForm, correctAnswer: option.id})}
                              className="w-5 h-5 text-green-600"
                            />
                            <span className="text-sm text-gray-600">Correcte</span>
                          </label>
                        </div>

                        {/* IMAGE OPTION - NOUVEAU */}
                        <div className="ml-11">
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            📷 Image pour cette option (optionnel)
                          </label>
                          
                          {option.imageUrl ? (
                            <div className="relative inline-block">
                              <img 
                                src={option.imageUrl} 
                                alt={`Option ${option.id}`} 
                                className="max-w-xs max-h-40 rounded border-2 border-gray-300" 
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = [...questionForm.options];
                                  newOptions[idx].imageUrl = null;
                                  setQuestionForm({...questionForm, options: newOptions});
                                }}
                                className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full hover:bg-red-700 flex items-center justify-center text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  if (e.target.files[0]) {
                                    setUploadingImage(true);
                                    const url = await handleImageUpload(e.target.files[0]);
                                    if (url) {
                                      const newOptions = [...questionForm.options];
                                      newOptions[idx].imageUrl = url;
                                      setQuestionForm({...questionForm, options: newOptions});
                                    }
                                    setUploadingImage(false);
                                  }
                                }}
                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                disabled={uploadingImage}
                              />
                              {uploadingImage && (
                                <span className="text-sm text-blue-600 animate-pulse">⏳ Upload...</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vrai/Faux */}
              {questionForm.type === 'true_false' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Réponse correcte
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={questionForm.correctAnswer === 'true'}
                        onChange={() => setQuestionForm({...questionForm, correctAnswer: 'true'})}
                        className="w-5 h-5 text-green-600"
                      />
                      <span className="font-medium">Vrai</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={questionForm.correctAnswer === 'false'}
                        onChange={() => setQuestionForm({...questionForm, correctAnswer: 'false'})}
                        className="w-5 h-5 text-red-600"
                      />
                      <span className="font-medium">Faux</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre de points
                </label>
                <input
                  type="number"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({...questionForm, points: Number(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600"
                  min={1}
                />
              </div>

              <button
                onClick={handleAddQuestion}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-bold"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Ajouter la Question
              </button>
            </div>
          </div>

          {/* Boutons Sauvegarde */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setView('list');
                resetForms();
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveExam}
              disabled={questions.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
            >
              <Save className="w-5 h-5 inline mr-2" />
              {currentExam ? 'Mettre à Jour' : 'Sauvegarder l\'Examen'}
            </button>
          </div>
        </div>

        {/* Modal Éditeur Formules */}
        {showFormulaEditor && (
          <FormulaEditor
            value={questionForm.formulaLatex}
            onChange={(latex) => setQuestionForm({...questionForm, formulaLatex: latex})}
            onClose={() => setShowFormulaEditor(false)}
          />
        )}
      </div>
    );
  }

  return null;
};

export default ProfessorExamCreator;