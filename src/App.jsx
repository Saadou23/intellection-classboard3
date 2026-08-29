import React from 'react';
import ClassBoard from './ClassBoard';
import PublicSchedule from './PublicSchedule';
import ProfessorSchedule from './ProfessorSchedule';
import ProfessorPublicSchedule from './ProfessorPublicSchedule';
import PublicRoomAvailability from './PublicRoomAvailability';
import ProfessorsCatalog from './ProfessorsCatalog';
import StudentExamPortal from './StudentExamPortal';
import ExamAdmin from './ExamAdmin';
import ProfessorExamCreator from './ProfessorExamCreator';
import PrivacyPolicy from './PrivacyPolicy';
import Dashboard from './Dashboard';
import OTPPointagePanel from './OTPPointagePanel';
import ProfessorSalaryCollection from './ProfessorSalaryCollection';
import WhatsAppGroups from './WhatsAppGroups';
import SubjectScheduleMatrix from './SubjectScheduleMatrix';
import './App.css';

function App() {
  const path = window.location.pathname;

  let pageComponent;

  if (path === '/emploi-du-temps') {
    pageComponent = <PublicSchedule />;
  } else if (path === '/emploi-profs') {
    pageComponent = <ProfessorPublicSchedule />;
  } else if (path === '/salles-dispo') {
    pageComponent = <PublicRoomAvailability />;
  } else if (path === '/catalogue-profs') {
    pageComponent = <ProfessorsCatalog />;
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
  } else if (path === '/pointage') {
    pageComponent = <OTPPointagePanel />;
  } else if (path === '/salaire-collecte') {
    pageComponent = <ProfessorSalaryCollection />;
  } else if (path === '/groupes-whatsapp') {
    pageComponent = <WhatsAppGroups />;
  } else if (path === '/matrice-horaires') {
    pageComponent = <SubjectScheduleMatrix />;
  } else {
    pageComponent = <ClassBoard />;
  }

  return pageComponent;
}

export default App;