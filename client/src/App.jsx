import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import VideoCall from './pages/VideoCall';
import { useContext } from 'react';

const AppRoutes = () => {
    const { token, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/community" element={token ? <Community /> : <Navigate to="/login" />} />
            <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/video-call" element={token ? <VideoCall /> : <Navigate to="/login" />} />
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
