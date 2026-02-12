import React from 'react';
import ClassBoard from './ClassBoard';
import PublicSchedule from './PublicSchedule';
import ProfessorSchedule from './ProfessorSchedule';
import './App.css';

function App() {
  const path = window.location.pathname;
  
  if (path === '/emploi-du-temps') {
    return <PublicSchedule />;
  }
  
  if (path === '/mon-emploi') {
    return <ProfessorSchedule />;
  }
  
  return <ClassBoard />;
}

export default App;