import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import VideoCall from './pages/VideoCall';
import Schedule from './pages/Schedule';
import LearningTracker from './pages/LearningTracker';
import Assessments from './pages/Assessments';
import QuizEngine from './pages/QuizEngine';
import { useContext } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppRoutes = () => {
    const { token, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1">
                <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/community" element={token ? <Community /> : <Navigate to="/login" />} />
            <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/video-call" element={token ? <VideoCall /> : <Navigate to="/login" />} />
            <Route path="/schedule" element={token ? <Schedule /> : <Navigate to="/login" />} />
            <Route path="/tracker" element={token ? <LearningTracker /> : <Navigate to="/login" />} />
            <Route path="/assessments" element={token ? <Assessments /> : <Navigate to="/login" />} />
            <Route path="/assessments/:id" element={token ? <QuizEngine /> : <Navigate to="/login" />} />
            {/* Redirect everything else to login for now in phase 1 */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
            </div>
            <ToastContainer position="bottom-right" />
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <AppRoutes />
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
