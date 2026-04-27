import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import BocanasDashboard from './pages/BocanasDashboard';
import NuevaApuesta from './pages/NuevaApuesta';
import Bocanas from './pages/Bocanas';
import NuevaBocana from './pages/NuevaBocana';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/bocanas-dashboard" replace />} />
          <Route path="nueva-apuesta" element={<NuevaApuesta />} />
          <Route path="bocanas-dashboard" element={<BocanasDashboard />} />
          <Route path="bocanas" element={<Bocanas />} />
          <Route path="nueva-bocana" element={<NuevaBocana />} />
          <Route path="*" element={<Navigate to="/bocanas-dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
