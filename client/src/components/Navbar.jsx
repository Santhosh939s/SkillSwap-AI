import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';

const Navbar = () => {
    const { token, logout } = useContext(AuthContext);
    const { notifications, markAsRead } = useContext(NotificationContext);
    const [showDropdown, setShowDropdown] = useState(false);

    if (!token) return null; // Don't show navbar if not logged in

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
        if (unreadCount > 0) {
            markAsRead();
        }
    };

    return (
        <nav className="bg-white shadow-md relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                            <span className="font-bold text-xl text-blue-600">SkillSwap</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to="/dashboard" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium">Dashboard</Link>
                            <Link to="/community" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium">Community</Link>
                            <Link to="/chat" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium">Chat</Link>
                            <Link to="/schedule" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500 text-sm font-medium">Schedule</Link>
                            <Link to="/tracker" className="text-purple-600 hover:text-purple-800 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 text-sm font-bold">Tracker</Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 relative">
                        {/* Notification Bell */}
                        <button onClick={handleBellClick} className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showDropdown && (
                            <div className="origin-top-right absolute top-14 right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100">
                                <div className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900">Notifications</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <p className="px-4 py-3 text-sm text-gray-500">No notifications.</p>
                                    ) : (
                                        notifications.map((n, i) => (
                                            <div key={i} className={`px-4 py-3 text-sm ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                                                <p className="text-gray-800">{n.message}</p>
                                                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* User Actions */}
                        <Link to="/profile" className="text-gray-500 hover:text-gray-900">Profile</Link>
                        <button onClick={logout} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200">Logout</button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
