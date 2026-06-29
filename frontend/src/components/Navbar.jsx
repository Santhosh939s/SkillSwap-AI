import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

const Navbar = () => {
    const { token, user, logout } = useContext(AuthContext);
    const { notifications, markAsRead } = useContext(NotificationContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();

    if (!token) return null; // Don't show navbar on public pages if not logged in (handled by Landing Page)

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
        if (unreadCount > 0) {
            markAsRead();
        }
    };

    const isActive = (path) => location.pathname === path;

    const NavLink = ({ to, children }) => (
        <Link 
            to={to} 
            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                isActive(to) 
                ? 'border-primary text-text-primary' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
        >
            {children}
        </Link>
    );

    return (
        <nav className="bg-background-secondary border-b border-border sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]">
                                S
                            </div>
                            <span className="font-bold text-xl text-text-primary tracking-tight">SkillSwap</span>
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                            <NavLink to="/dashboard">Dashboard</NavLink>
                            <NavLink to="/community">Community</NavLink>
                            <NavLink to="/chat">Chat</NavLink>
                            <NavLink to="/schedule">Schedule</NavLink>
                            <NavLink to="/tracker">Tracker</NavLink>
                            <NavLink to="/assessments">Assessments</NavLink>
                            <NavLink to="/leaderboard">Leaderboard</NavLink>
                            {user && (user.role === 'admin' || user.role === 'superadmin') && (
                                <Link to="/admin" className="text-error hover:text-error/80 inline-flex items-center px-1 pt-1 text-sm font-bold ml-4">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 relative">
                        {/* Notification Bell */}
                        <button onClick={handleBellClick} className="relative p-2 text-text-muted hover:text-text-primary focus:outline-none transition-colors">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-error ring-2 ring-background-secondary animate-pulse"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showDropdown && (
                            <div className="origin-top-right absolute top-14 right-0 mt-2 w-80 rounded-xl shadow-2xl bg-card border border-border overflow-hidden ring-1 ring-black ring-opacity-5 divide-y divide-border z-50">
                                <div className="px-4 py-3 bg-background-secondary">
                                    <p className="text-sm font-semibold text-text-primary">Notifications</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <p className="px-4 py-6 text-sm text-text-muted text-center">No new notifications</p>
                                    ) : (
                                        notifications.map((n, i) => (
                                            <div key={i} className={`px-4 py-3 text-sm transition-colors ${n.read ? 'bg-card' : 'bg-primary/5 hover:bg-primary/10'}`}>
                                                <p className="text-text-primary">{n.message}</p>
                                                <p className="text-xs text-text-muted mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* User Actions */}
                        <div className="h-6 w-px bg-border mx-2"></div>
                        <Link to="/profile" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-sm font-medium text-text-primary group-hover:border-primary transition-colors">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </Link>
                        <button onClick={logout} className="text-sm font-medium text-text-muted hover:text-error transition-colors ml-2">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
