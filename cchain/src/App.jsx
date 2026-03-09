/**
 * App.jsx
 * 
 * Main application component with routing.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import ValuatorDashboard from './pages/ValuatorDashboard';
import SkillsDashboard from './pages/SkillsDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login page - entry point */}
        <Route path="/" element={<Login />} />
        
        {/* User dashboard - for general users */}
        <Route path="/dashboard" element={<UserDashboard />} />
        
        {/* Skills dashboard - tech stack proficiency */}
        <Route path="/skills" element={<SkillsDashboard />} />
        
        {/* Valuator dashboard - for valuators */}
        <Route path="/valuator" element={<ValuatorDashboard />} />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
