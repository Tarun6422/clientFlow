import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import PrototypesPage from './pages/PrototypesPage';
import ClientProfile from './pages/ClientProfile';
import ThemesPage from './pages/ThemesPage';
import SettingsPage from './pages/SettingsPage';
import WizardPage from './pages/wizard/WizardPage';
import GenerateFlow from './pages/GenerateFlow';
import PrototypeWorkspace from './pages/PrototypeWorkspace';
import ClientPreview from './pages/ClientPreview';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname, search]);
  return null;
}

function EditRoute() {
  const { id } = useParams<{ id: string }>();
  return <WizardPage key={id} clientId={id} />;
}

function PrototypeRoute() {
  const { id } = useParams<{ id: string }>();
  return <PrototypeWorkspace key={id} />;
}

function GenerateRoute() {
  const { id } = useParams<{ id: string }>();
  return <GenerateFlow key={id} />;
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/prototypes" element={<PrototypesPage />} />
            <Route path="/clients/new" element={<WizardPage />} />
            <Route path="/clients/:id/edit" element={<EditRoute />} />
            <Route path="/clients/:id" element={<ClientProfile />} />
            <Route path="/themes" element={<ThemesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* ClientFlow 2.0 — focused flows outside the dashboard shell */}
          <Route path="/clients/:id/generate" element={<GenerateRoute />} />
          <Route path="/clients/:id/prototype" element={<PrototypeRoute />} />
          <Route path="/clients/:id/preview" element={<ClientPreview />} />
          <Route path="/preview/:projectId" element={<ClientPreview />} />
        </Routes>
        <ToastContainer />
      </HashRouter>
    </AppProvider>
  );
}