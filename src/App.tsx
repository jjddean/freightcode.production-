import React, { useEffect, Suspense, lazy } from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  ClerkProvider,
  useAuth,
  useUser
} from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Routes, Route, Navigate, useLocation, BrowserRouter, Outlet } from 'react-router-dom';
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Toaster } from 'sonner';

// Components
import { AIAssistant } from './components/ai/AIAssistant';
import AdminLayout from './components/layout/admin/AdminLayout';
import ClientSidebar from './components/layout/ClientSidebar';
import { useRole } from './hooks/useRole';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import PublicLayout from './components/layout/PublicLayout';

// Pages - Lazy Loaded
const HomePage = lazy(() => import('./pages/HomePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage')); // Assuming this existed based on imports
const PlatformPage = lazy(() => import('./pages/PlatformPage')); // Assuming this existed
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const CompliancePage = lazy(() => import('./pages/CompliancePage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ClientQuotesPage = lazy(() => import('./pages/client/ClientQuotesPage'));
const ClientBookingsPage = lazy(() => import('./pages/client/ClientBookingsPage'));
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));
const CurrencyPage = lazy(() => import('./pages/tools/CurrencyPage'));
const HSCodePage = lazy(() => import('./pages/tools/HSCodePage'));
const IntelligencePage = lazy(() => import('./pages/IntelligencePage'));
const ForwarderFinderPage = lazy(() => import('./pages/ForwarderFinderPage'));
const SharedDocumentPage = lazy(() => import('./pages/SharedDocumentPage'));
const DocusignCallbackPage = lazy(() => import('./pages/DocusignCallbackPage'));
const DocumentPrintPage = lazy(() => import('./pages/DocumentPrintPage'));
const TestDashboardPage = lazy(() => import('./pages/TestDashboardPage'));
const HmrcCallbackPage = lazy(() => import('./pages/HmrcCallbackPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminApprovalsPage = lazy(() => import('./pages/admin/AdminApprovalsPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));
const AdminFinancePage = lazy(() => import('./pages/admin/AdminFinancePage'));
const AdminWaitlistPage = lazy(() => import('./pages/admin/AdminWaitlistPage'));
const AdminAuditPage = lazy(() => import('./pages/admin/AdminAuditPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/AdminCustomersPage'));
const AdminShipmentsPage = lazy(() => import('./pages/admin/AdminShipmentsPage'));
const AdminCarriersPage = lazy(() => import('./pages/admin/AdminCarriersPage'));
const AdminDocumentsPage = lazy(() => import('./pages/admin/AdminDocumentsPage'));
const AdminCompliancePage = lazy(() => import('./pages/admin/AdminCompliancePage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminMessagesPage = lazy(() => import('./pages/admin/AdminMessagesPage'));
const AdminCustomsPage = lazy(() => import('./pages/admin/AdminCustomsPage'));


// --- Helper Components ---

interface LayoutProps {
  children: React.ReactNode;
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

function Layout({ children }: LayoutProps) {
  useEffect(() => {
    // Service Worker registration moved to main.tsx
  }, []);

  return (
    <>
      <AIAssistant />
      <Toaster richColors position="bottom-right" style={{ zIndex: 99999 }} />
      <main className="min-h-screen">
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Authentication disabled per user request to remove Clerk layer
  return <>{children}</>;
}

// Admin Route Wrapper - Role-based permissions
function AdminRoute({ children }: { children: React.ReactNode }) {
  // Admin logic disabled per user request to remove Clerk layer
  return <>{children}</>;
}

// --- Main App Component ---

export default function App() {
  // Setup view if key is placeholder
  if (PUBLISHABLE_KEY === 'pk_test_placeholder_key') {
    return <div className="p-20"><h1>Please update your .env with a real Clerk Key</h1></div>;
  }

  return (
    <BrowserRouter future={{
      v7_relativeSplatPath: true
    }}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <Layout>
            <Routes>
              {/* Public Routes with Navbar */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/platform" element={<PlatformPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/shared/:token" element={<SharedDocumentPage />} />
                <Route path="/api/docusign/callback" element={<DocusignCallbackPage />} />
                <Route path="/auth/hmrc/callback" element={<HmrcCallbackPage />} />
              </Route>

              {/* Standalone Pages */}
              <Route path="/test-dashboard" element={<TestDashboardPage />} />
              <Route path="/documents/print/:documentId" element={<DocumentPrintPage />} />

              {/* Admin Routes (Wrapped in ProtectedRoute & AdminRoute & AdminLayout) */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <Outlet />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboardPage />} />
                <Route path="reports" element={<AdminDashboardPage />} />
                <Route path="messages" element={<AdminMessagesPage />} />
                <Route path="approvals" element={<AdminApprovalsPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="payments" element={<AdminFinancePage />} />
                <Route path="waitlist" element={<AdminWaitlistPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="shipments" element={<AdminShipmentsPage />} />
                <Route path="carriers" element={<AdminCarriersPage />} />
                <Route path="documents" element={<AdminDocumentsPage />} />
                <Route path="compliance" element={<AdminCompliancePage />} />
                <Route path="customs" element={<AdminCustomsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Protected Client Routes (Wrapped in ProtectedRoute & ClientSidebar) */}
              <Route element={
                <ProtectedRoute>
                  <ClientSidebar>
                    <Outlet />
                  </ClientSidebar>
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/intelligence" element={<IntelligencePage />} />
                <Route path="/intelligence/forwarders" element={<ForwarderFinderPage />} />
                <Route path="/shipments" element={<ShipmentsPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/quotes" element={<ClientQuotesPage />} />
                <Route path="/bookings" element={<ClientBookingsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/api" element={<ApiDocsPage />} />
                <Route path="/tools/currency-converter" element={<CurrencyPage />} />
                <Route path="/tools/hscode-lookup" element={<HSCodePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </BrowserRouter>
  );
}  
