import React from 'react';
import ClassBoard from './ClassBoard';
import PublicSchedule from './PublicSchedule';
import ProfessorSchedule from './ProfessorSchedule';
import StudentExamPortal from './StudentExamPortal';
import ExamAdmin from './ExamAdmin';
import ProfessorExamCreator from './ProfessorExamCreator';
import './App.css';

function App() {
  const path = window.location.pathname;
  
  if (path === '/emploi-du-temps') {
    return <PublicSchedule />;
  }
  
  if (path === '/mon-emploi') {
    return <ProfessorSchedule />;
  }
  
  if (path === '/test-niveau') {
    return <StudentExamPortal />;
  }
  
  if (path === '/exams/admin') {
    return <ExamAdmin />;
  }
  
  if (path === '/exams/professeur') {
    return <ProfessorExamCreator />;
  }
  
  return <ClassBoard />;
}

export default App;