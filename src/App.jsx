import React from 'react';
import ClassBoard from './ClassBoard';
import PublicSchedule from './PublicSchedule';
import './App.css';

function App() {
  const path = window.location.pathname;
  
  if (path === '/emploi-du-temps') {
    return <PublicSchedule />;
  }
  
  return <ClassBoard />;
}

export default App;