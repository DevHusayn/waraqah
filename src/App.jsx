import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Drafts from './pages/Drafts';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetails from './pages/InvoiceDetails';
import Clients from './pages/Clients';
import Products from './pages/Products';
import SettingsLayout from './pages/settings/SettingsLayout';
import SettingsIndex from './pages/settings/SettingsIndex';
import BusinessSettingsIndex from './pages/settings/BusinessSettingsIndex';
import CompanyProfileSettings from './pages/settings/CompanyProfileSettings';
import AccountDetailsSettings from './pages/settings/AccountDetailsSettings';
import BrandingSettings from './pages/settings/BrandingSettings';
import PlanBillingSettings from './pages/settings/PlanBillingSettings';
import TermsSettings from './pages/settings/TermsSettings';
import AboutSettings from './pages/settings/AboutSettings';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import PrivateRoute from './utils/PrivateRoute';
import AdminRoute from './utils/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import Upgrade from './pages/Upgrade';
import UpgradeCallback from './pages/UpgradeCallback';
import MonthlyStatement from './pages/MonthlyStatement';
import { InvoiceProvider } from './context/InvoiceContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import BrandTheme from './components/BrandTheme';

function AppLayout({ children }) {
    return <Layout>{children}</Layout>;
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <SettingsProvider>
                    <BrandTheme />
                    <InvoiceProvider>
                        <Router>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />

                            {/* Public so Paystack redirect always loads the app (verify needs login) */}
                            <Route
                                path="/upgrade/callback"
                                element={
                                    <AppLayout>
                                        <UpgradeCallback />
                                    </AppLayout>
                                }
                            />

                            <Route
                                path="/*"
                                element={
                                    <AppLayout>
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
                                                <Route path="terms" element={<TermsSettings />} />
                                                <Route path="about" element={<AboutSettings />} />
                                                <Route path="profile" element={<Navigate to="/settings/business/company-profile" replace />} />
                                            </Route>
                                            <Route path="/statements" element={<PrivateRoute><MonthlyStatement /></PrivateRoute>} />
                                            <Route path="/upgrade" element={<PrivateRoute><Upgrade /></PrivateRoute>} />
                                            <Route path="/admin" element={<PrivateRoute><AdminRoute><AdminDashboard /></AdminRoute></PrivateRoute>} />
                                        </Routes>
                                    </AppLayout>
                                }
                            />
                        </Routes>
                        </Router>
                    </InvoiceProvider>
                </SettingsProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
