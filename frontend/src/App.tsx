import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MissionsPage from './pages/Missions';
import CargoPage from './pages/Cargo';
import InventoryPage from './pages/Inventory';
import AssetsPage from './pages/Assets';
import PersonnelPage from './pages/Personnel';
import StationsPage from './pages/Stations';
import ImpactAnalysis from './pages/ImpactAnalysis';
import ScenarioLab from './pages/ScenarioLab';
import RecoveryPlans from './pages/Recovery';
import AlertsPage from './pages/Alerts';
import ReportsPage from './pages/Reports';
import EmergencyPage from './pages/Emergency';

const ProtectedRoute: React.FC = () => {
  const user = localStorage.getItem('polarops_user') || localStorage.getItem('polaris_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/cargo" element={<CargoPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/impact" element={<ImpactAnalysis />} />
          <Route path="/scenario-lab" element={<ScenarioLab />} />
          <Route path="/recovery" element={<RecoveryPlans />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
