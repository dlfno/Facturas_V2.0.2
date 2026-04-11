import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import CompanyPage from './pages/CompanyPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dlg" element={<CompanyPage empresa="DLG" />} />
          <Route path="/smgs" element={<CompanyPage empresa="SMGS" />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
