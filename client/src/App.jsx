import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { useContext } from 'react';

// Temporary placeholder for dashboard until we build it
const DashboardPlaceholder = () => (
    <div className="p-8">
        <h1 className="text-2xl font-bold">Dashboard Placeholder</h1>
        <p>Login successful.</p>
    </div>
);

const AppRoutes = () => {
    const { token, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={token ? <DashboardPlaceholder /> : <Navigate to="/login" />} />
            {/* Redirect everything else to login for now in phase 1 */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
