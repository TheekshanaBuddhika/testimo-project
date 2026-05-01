import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import FormsPage from './pages/FormsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import WidgetBuilderPage from './pages/WidgetBuilderPage';
import PricingPage from './pages/PricingPage';
import CollectPage from './pages/CollectPage';
import WidgetPage from './pages/WidgetPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import { Toaster } from 'react-hot-toast';

/**
 * App.tsx — Route definitions
 */
export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* ── Authenticated shell ── */}
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="workspaces/:id" element={<WorkspacePage />} />
            <Route path="workspaces/:id/forms" element={<FormsPage />} />
            <Route path="workspaces/:id/integrations" element={<IntegrationsPage />} />
            <Route path="workspaces/:id/widgets/new" element={<WidgetBuilderPage />} />
            <Route path="workspaces/:id/pricing" element={<PricingPage />} />
          </Route>

          {/* ── Public routes ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/collect/:formId" element={<CollectPage />} />
          <Route path="/widget/:workspaceId" element={<WidgetPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
