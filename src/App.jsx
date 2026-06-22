import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetails from './pages/InvoiceDetails';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Settings from './pages/Settings';
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
import BrandTheme from './components/BrandTheme';

function AppLayout({ children }) {
    return <Layout>{children}</Layout>;
}

function App() {
    return (
        <ToastProvider>
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
                                            <Route path="/invoices/create" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
                                            <Route path="/invoices/edit/:id" element={<PrivateRoute><CreateInvoice /></PrivateRoute>} />
                                            <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetails /></PrivateRoute>} />
                                            <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
                                            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
                                            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                                            <Route path="/statements" element={<PrivateRoute><MonthlyStatement /></PrivateRoute>} />
                                            <Route path="/upgrade" element={<PrivateRoute><Upgrade /></PrivateRoute>} />
                                            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                                        </Routes>
                                    </AppLayout>
                                }
                            />
                        </Routes>
                    </Router>
                </InvoiceProvider>
            </SettingsProvider>
        </ToastProvider>
    );
}

export default App;
