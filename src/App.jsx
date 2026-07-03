import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CheckEmailPage from './pages/CheckEmail';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import PublicInvoice from './pages/PublicInvoice';
import TermsPage from './pages/legal/TermsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import PrivateRoute from './utils/PrivateRoute';
import AdminRoute from './utils/AdminRoute';
import { InvoiceProvider } from './context/InvoiceContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import BrandTheme from './components/BrandTheme';

const Invoices = lazy(() => import('./pages/Invoices'));
const Drafts = lazy(() => import('./pages/Drafts'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails'));
const Clients = lazy(() => import('./pages/Clients'));
const Products = lazy(() => import('./pages/Products'));
const SettingsLayout = lazy(() => import('./pages/settings/SettingsLayout'));
const SettingsIndex = lazy(() => import('./pages/settings/SettingsIndex'));
const BusinessSettingsIndex = lazy(() => import('./pages/settings/BusinessSettingsIndex'));
const CompanyProfileSettings = lazy(() => import('./pages/settings/CompanyProfileSettings'));
const AccountDetailsSettings = lazy(() => import('./pages/settings/AccountDetailsSettings'));
const BrandingSettings = lazy(() => import('./pages/settings/BrandingSettings'));
const PlanBillingSettings = lazy(() => import('./pages/settings/PlanBillingSettings'));
const TermsSettings = lazy(() => import('./pages/settings/TermsSettings'));
const PrivacySettings = lazy(() => import('./pages/settings/PrivacySettings'));
const AboutSettings = lazy(() => import('./pages/settings/AboutSettings'));
const NotificationSettings = lazy(() => import('./pages/settings/NotificationSettings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const UpgradeCallback = lazy(() => import('./pages/UpgradeCallback'));
const MonthlyStatement = lazy(() => import('./pages/MonthlyStatement'));

function AppLayout({ children }) {
    return <Layout>{children}</Layout>;
}

function LazyPage({ children }) {
    return <Suspense fallback={null}>{children}</Suspense>;
}

function AppProviders({ children }) {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (googleClientId) {
        return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
    }
    return children;
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <SettingsProvider>
                    <BrandTheme />
                    <InvoiceProvider>
                        <AppProviders>
                        <Router>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/auth/check-email" element={<CheckEmailPage />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />
                            <Route path="/verify-email/:token" element={<VerifyEmail />} />
                            <Route path="/i/:token" element={<PublicInvoice />} />
                            <Route path="/terms" element={<TermsPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />

                            <Route
                                path="/upgrade/callback"
                                element={
                                    <AppLayout>
                                        <LazyPage>
                                            <UpgradeCallback />
                                        </LazyPage>
                                    </AppLayout>
                                }
                            />

                            <Route
                                path="/*"
                                element={
                                    <AppLayout>
                                        <LazyPage>
                                        <Routes>
                                            <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
                                            <Route path="/invoices/drafts" element={<PrivateRoute><Drafts /></PrivateRoute>} />
                                            <Route path="/invoices/create" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
                                            <Route path="/invoices/edit/:id" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
                                            <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetails /></PrivateRoute>} />
                                            <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
                                            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
                                            <Route path="/settings" element={<PrivateRoute><SettingsLayout /></PrivateRoute>}>
                                                <Route index element={<SettingsIndex />} />
                                                <Route path="business" element={<BusinessSettingsIndex />} />
                                                <Route path="business/company-profile" element={<CompanyProfileSettings />} />
                                                <Route path="business/account-details" element={<AccountDetailsSettings />} />
                                                <Route path="business/branding" element={<BrandingSettings />} />
                                                <Route path="plan-billing" element={<PlanBillingSettings />} />
                                                <Route path="notifications" element={<NotificationSettings />} />
                                                <Route path="terms" element={<TermsSettings />} />
                                                <Route path="privacy" element={<PrivacySettings />} />
                                                <Route path="about" element={<AboutSettings />} />
                                                <Route path="profile" element={<Navigate to="/settings/business/company-profile" replace />} />
                                            </Route>
                                            <Route path="/statements" element={<PrivateRoute><MonthlyStatement /></PrivateRoute>} />
                                            <Route path="/upgrade" element={<PrivateRoute><Upgrade /></PrivateRoute>} />
                                            <Route path="/admin" element={<PrivateRoute><AdminRoute><AdminDashboard /></AdminRoute></PrivateRoute>} />
                                        </Routes>
                                        </LazyPage>
                                    </AppLayout>
                                }
                            />
                        </Routes>
                        </Router>
                        </AppProviders>
                    </InvoiceProvider>
                </SettingsProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
