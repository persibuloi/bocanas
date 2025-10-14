import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BocanasDashboard from './pages/BocanasDashboard';
import NuevaApuesta from './pages/NuevaApuesta';
import Apostadores from './pages/Apostadores';
import Historial from './pages/Historial';
import Estadisticas from './pages/Estadisticas';
import Bocanas from './pages/Bocanas';
import NuevaBocana from './pages/NuevaBocana';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nueva-apuesta" element={<NuevaApuesta />} />
          <Route path="apostadores" element={<Apostadores />} />
          <Route path="historial" element={<Historial />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="bocanas-dashboard" element={<BocanasDashboard />} />
          <Route path="bocanas" element={<Bocanas />} />
          <Route path="nueva-bocana" element={<NuevaBocana />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;