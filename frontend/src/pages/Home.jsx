import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
    const { token } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans selection:bg-primary selection:text-white">
            
            {/* Navigation Bar (Mocked for Landing Page structure) */}
            <nav className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                                S
                            </div>
                            <span className="text-xl font-bold tracking-tight text-text-primary">SkillSwap</span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">How it Works</a>
                        </div>
                        <div className="flex items-center gap-4">
                            {!token ? (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                                        Sign In
                                    </Link>
                                    <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <Link to="/dashboard" className="px-4 py-2 text-sm font-medium bg-card text-text-primary border border-border rounded-lg hover:bg-card-hover transition-all">
                                    Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-20 pb-32">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border mb-8 shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                    <span className="text-xs font-medium text-text-secondary">SkillSwap AI 2.0 is Live</span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-text-primary max-w-4xl leading-[1.1]">
                    Learn new skills by <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">teaching one of your own.</span>
                </h1>
                
                <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
                    The premium, community-driven platform for peer-to-peer mentorship. 
                    Connect with experts globally, exchange knowledge, and level up your career.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    {!token ? (
                        <>
                            <Link to="/register" className="inline-flex justify-center items-center px-8 py-3.5 text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95">
                                Start Learning for Free
                            </Link>
                            <a href="#features" className="inline-flex justify-center items-center px-8 py-3.5 text-base font-medium rounded-xl text-text-primary bg-card border border-border hover:bg-card-hover hover:border-text-muted transition-all">
                                Explore Features
                            </a>
                        </>
                    ) : (
                        <Link to="/dashboard" className="inline-flex justify-center items-center px-8 py-3.5 text-base font-medium rounded-xl text-white bg-primary hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95">
                            Enter Dashboard
                        </Link>
                    )}
                </div>

                {/* Dashboard Mockup Image / Graphic */}
                <div className="mt-20 w-full max-w-5xl mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
                    <div className="rounded-2xl border border-border bg-background-secondary p-2 shadow-2xl shadow-black/50 overflow-hidden transform perspective-[2000px] rotate-x-[5deg]">
                        <div className="rounded-xl overflow-hidden bg-card border border-border aspect-video flex flex-col relative">
                            {/* Fake Window Controls */}
                            <div className="h-8 border-b border-border bg-background-secondary flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-error/80"></div>
                                <div className="w-3 h-3 rounded-full bg-warning/80"></div>
                                <div className="w-3 h-3 rounded-full bg-success/80"></div>
                            </div>
                            {/* Fake UI Content */}
                            <div className="flex-1 p-6 grid grid-cols-4 gap-6 opacity-60">
                                <div className="col-span-1 space-y-4">
                                    <div className="h-10 bg-border rounded-lg"></div>
                                    <div className="h-32 bg-border rounded-lg"></div>
                                    <div className="h-20 bg-border rounded-lg"></div>
                                </div>
                                <div className="col-span-3 space-y-4">
                                    <div className="h-32 bg-primary/20 border border-primary/30 rounded-lg"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-40 bg-border rounded-lg"></div>
                                        <div className="h-40 bg-border rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Minimal Footer */}
            <footer className="border-t border-border py-8 text-center text-sm text-text-muted">
                <p>&copy; {new Date().getFullYear()} SkillSwap AI. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
