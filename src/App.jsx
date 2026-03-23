import React from 'react';
import ClassBoard from './ClassBoard';
import PublicSchedule from './PublicSchedule';
import ProfessorSchedule from './ProfessorSchedule';
import StudentExamPortal from './StudentExamPortal';
import ExamAdmin from './ExamAdmin';
import ProfessorExamCreator from './ProfessorExamCreator';
import PrivacyPolicy from './PrivacyPolicy';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const path = window.location.pathname;

  let pageComponent;

  if (path === '/emploi-du-temps') {
    pageComponent = <PublicSchedule />;
  } else if (path === '/mon-emploi') {
    pageComponent = <ProfessorSchedule />;
  } else if (path === '/test-niveau') {
    pageComponent = <StudentExamPortal />;
  } else if (path === '/exams/admin') {
    pageComponent = <ExamAdmin />;
  } else if (path === '/exams/professeur') {
    pageComponent = <ProfessorExamCreator />;
  } else if (path === '/privacy-policy') {
    pageComponent = <PrivacyPolicy />;
  } else if (path === '/dashboard' || path === '/admin/dashboard') {
    pageComponent = <Dashboard sessions={{}} />;
  } else {
    pageComponent = <ClassBoard />;
  }

  return pageComponent;
}

export default App;