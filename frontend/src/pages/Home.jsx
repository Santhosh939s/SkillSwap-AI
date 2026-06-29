import { Link } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
    const { token } = useContext(AuthContext);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Helper for easy SVG icons
    const Icon = ({ path, className = "w-6 h-6" }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={path} />
        </svg>
    );

    return (
        <div className="min-h-screen bg-background text-text-primary font-sans selection:bg-primary selection:text-white">
            
            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-lg border-b border-border py-3 shadow-lg shadow-black/20' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                                S
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-text-primary">SkillSwap<span className="text-primary">AI</span></span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8 bg-background-secondary/50 backdrop-blur-md px-6 py-2 rounded-full border border-border">
                            <a href="#features" className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">How it Works</a>
                            <a href="#faq" className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">FAQ</a>
                        </div>
                        <div className="flex items-center gap-4">
                            {!token ? (
                                <>
                                    <Link to="/login" className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors hidden sm:block">
                                        Sign In
                                    </Link>
                                    <Link to="/register" className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all active:scale-95 border border-primary/50">
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <Link to="/dashboard" className="px-5 py-2.5 text-sm font-bold bg-card text-text-primary border border-border rounded-xl hover:bg-card-hover transition-all shadow-sm">
                                    Go to Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-4">
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-md animate-[fade-in-up_0.8s_ease-out_forwards] opacity-0">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-sm font-bold text-primary tracking-wide">SkillSwap AI 2.0 is Live</span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-text-primary max-w-5xl mx-auto leading-[1.1] mb-8 animate-[fade-in-up_0.8s_ease-out_forwards] opacity-0" style={{ animationDelay: '100ms' }}>
                        Master new skills by <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:300%_auto] animate-[gradient_8s_linear_infinite]">teaching your own.</span>
                    </h1>
                    
                    <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-[fade-in-up_0.8s_ease-out_forwards] opacity-0" style={{ animationDelay: '200ms' }}>
                        The premier AI-driven network for peer-to-peer mentorship. Trade your expertise for the skills you want to learn, verified by intelligent assessments.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fade-in-up_0.8s_ease-out_forwards] opacity-0" style={{ animationDelay: '300ms' }}>
                        {!token ? (
                            <>
                                <Link to="/register" className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 active:scale-95 border border-primary/50 group">
                                    Start Learning for Free
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Link>
                                <a href="#how-it-works" className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-xl text-text-primary bg-card border border-border hover:bg-card-hover hover:border-text-muted transition-all hover:-translate-y-1">
                                    See How it Works
                                </a>
                            </>
                        ) : (
                            <Link to="/dashboard" className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 active:scale-95 border border-primary/50">
                                Enter Dashboard
                            </Link>
                        )}
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-16 pt-10 border-t border-border/50 max-w-3xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-16 animate-[fade-in-up_0.8s_ease-out_forwards] opacity-0" style={{ animationDelay: '400ms' }}>
                        <div>
                            <p className="text-3xl font-black text-text-primary">10k+</p>
                            <p className="text-sm font-bold text-text-muted uppercase tracking-wider mt-1">Active Learners</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-text-primary">50k+</p>
                            <p className="text-sm font-bold text-text-muted uppercase tracking-wider mt-1">Hours Swapped</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-text-primary">4.9/5</p>
                            <p className="text-sm font-bold text-text-muted uppercase tracking-wider mt-1">Average Rating</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Mockup / Screenshot */}
                <div className="mt-20 w-full max-w-6xl mx-auto relative px-4 animate-[fade-in-up_0.8s_ease-out_forwards] opacity-0" style={{ animationDelay: '500ms' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 top-1/2"></div>
                    <div className="rounded-2xl border border-border bg-background p-2 shadow-2xl shadow-black/50 overflow-hidden transform perspective-[2000px] rotate-x-[4deg] hover:rotate-x-0 transition-transform duration-700 ease-out">
                        <div className="rounded-xl overflow-hidden bg-card border border-border aspect-video flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {/* Fake Window Controls */}
                            <div className="h-10 border-b border-border bg-background-secondary flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-error/80"></div>
                                <div className="w-3 h-3 rounded-full bg-warning/80"></div>
                                <div className="w-3 h-3 rounded-full bg-success/80"></div>
                                <div className="mx-auto bg-background border border-border px-4 py-1 rounded-md text-xs text-text-muted font-mono">skillswap-app.com/dashboard</div>
                            </div>
                            {/* Fake UI Content */}
                            <div className="flex-1 flex">
                                {/* Sidebar mock */}
                                <div className="w-48 border-r border-border bg-background/50 p-4 hidden sm:block">
                                    <div className="h-8 bg-border rounded-md mb-6"></div>
                                    <div className="space-y-3">
                                        <div className="h-5 bg-primary/20 rounded-md"></div>
                                        <div className="h-5 bg-border rounded-md w-3/4"></div>
                                        <div className="h-5 bg-border rounded-md w-5/6"></div>
                                        <div className="h-5 bg-border rounded-md w-2/3"></div>
                                    </div>
                                </div>
                                {/* Main content mock */}
                                <div className="flex-1 p-6 flex flex-col gap-6">
                                    <div className="flex justify-between">
                                        <div className="h-8 bg-border rounded-md w-48"></div>
                                        <div className="h-8 bg-primary rounded-md w-32"></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="h-24 bg-background-secondary border border-border rounded-xl"></div>
                                        <div className="h-24 bg-background-secondary border border-border rounded-xl"></div>
                                        <div className="h-24 bg-background-secondary border border-border rounded-xl"></div>
                                    </div>
                                    <div className="flex-1 bg-background-secondary border border-border rounded-xl flex items-center justify-center">
                                        {/* Chart mockup */}
                                        <div className="w-full max-w-md h-32 flex items-end justify-between px-8 gap-2">
                                            {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                                                <div key={i} className="w-full bg-primary/80 rounded-t-sm transition-all duration-1000 ease-out" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY SKILLSWAP SECTION */}
            <section id="why-us" className="py-24 bg-background-secondary relative border-y border-border overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight mb-4">Why SkillSwap AI?</h2>
                        <p className="text-text-secondary text-lg">Traditional learning is isolated and expensive. We built a platform that relies on human connection, powered by artificial intelligence.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors group">
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Learn Faster Together</h3>
                            <p className="text-text-secondary leading-relaxed">1-on-1 video mentorship accelerates learning by 400% compared to pre-recorded video courses. Get real-time feedback from real humans.</p>
                        </div>
                        <div className="bg-card p-8 rounded-2xl border border-border hover:border-accent/50 transition-colors group">
                            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Icon path="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" className="w-7 h-7 text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">AI-Verified Expertise</h3>
                            <p className="text-text-secondary leading-relaxed">Ensure your mentors know their stuff. Our AI Assessment engine verifies skills and issues badges before users can teach them to others.</p>
                        </div>
                        <div className="bg-card p-8 rounded-2xl border border-border hover:border-success/50 transition-colors group">
                            <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-7 h-7 text-success" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Cost-Free Upskilling</h3>
                            <p className="text-text-secondary leading-relaxed">Don't pay thousands for bootcamps. Trade an hour of teaching a skill you know for an hour of learning a skill you want. Zero money involved.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2 block">The Process</span>
                        <h2 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight">How it works</h2>
                    </div>

                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            {/* Step 1 */}
                            <div className="bg-card border border-border p-8 rounded-2xl relative shadow-lg text-center hover:-translate-y-2 transition-transform">
                                <div className="w-14 h-14 bg-primary rounded-full text-white font-black text-xl flex items-center justify-center absolute -top-7 left-1/2 -translate-x-1/2 border-4 border-background shadow-lg shadow-primary/30">1</div>
                                <h3 className="text-xl font-bold text-text-primary mt-6 mb-2">Prove Your Skill</h3>
                                <p className="text-text-secondary text-sm">Take our AI-generated assessment to prove you know a topic. Earn a verified badge.</p>
                            </div>
                            {/* Step 2 */}
                            <div className="bg-card border border-border p-8 rounded-2xl relative shadow-lg text-center hover:-translate-y-2 transition-transform">
                                <div className="w-14 h-14 bg-accent rounded-full text-white font-black text-xl flex items-center justify-center absolute -top-7 left-1/2 -translate-x-1/2 border-4 border-background shadow-lg shadow-accent/30">2</div>
                                <h3 className="text-xl font-bold text-text-primary mt-6 mb-2">Match & Schedule</h3>
                                <p className="text-text-secondary text-sm">Find someone who wants to learn your skill and has a skill you want. Book a time on the calendar.</p>
                            </div>
                            {/* Step 3 */}
                            <div className="bg-card border border-border p-8 rounded-2xl relative shadow-lg text-center hover:-translate-y-2 transition-transform">
                                <div className="w-14 h-14 bg-success rounded-full text-white font-black text-xl flex items-center justify-center absolute -top-7 left-1/2 -translate-x-1/2 border-4 border-background shadow-lg shadow-success/30">3</div>
                                <h3 className="text-xl font-bold text-text-primary mt-6 mb-2">Video Swap</h3>
                                <p className="text-text-secondary text-sm">Jump into our custom WebRTC room. Teach for 30 mins, learn for 30 mins. Earn XP!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES BENTO GRID */}
            <section id="features" className="py-24 bg-background-secondary border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight mb-4">Everything you need <br />to level up.</h2>
                        <p className="text-text-secondary text-lg max-w-2xl">A complete ecosystem designed to make peer-to-peer learning frictionless.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        {/* Large Feature 1 */}
                        <div className="md:col-span-2 bg-card rounded-3xl border border-border p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                            <h3 className="text-2xl font-bold text-text-primary mb-2">Integrated Video Calling</h3>
                            <p className="text-text-secondary max-w-md">No need for external links. Our built-in WebRTC video rooms feature live chat, shared markdown notes, and file attachments.</p>
                            <div className="absolute -bottom-10 -right-10 w-3/4 h-48 bg-background-secondary border border-border rounded-tl-2xl shadow-2xl p-4 transform group-hover:-translate-x-2 group-hover:-translate-y-2 transition-transform">
                                <div className="flex gap-2 mb-2">
                                    <div className="w-1/2 h-24 bg-card border border-border rounded-lg relative overflow-hidden">
                                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                            <Icon path="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" className="w-6 h-6 text-text-muted" />
                                        </div>
                                    </div>
                                    <div className="w-1/2 h-24 bg-card border border-border rounded-lg relative overflow-hidden">
                                        <div className="absolute bottom-2 right-2 w-8 h-8 bg-primary rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Feature 2 */}
                        <div className="bg-card rounded-3xl border border-border p-8 relative overflow-hidden group hover:border-accent/50 transition-colors">
                            <h3 className="text-xl font-bold text-text-primary mb-2">AI Assessments</h3>
                            <p className="text-text-secondary text-sm">Dynamic quizzes generated on the fly to verify your expertise.</p>
                            <div className="absolute -bottom-4 -right-4 w-40 h-40 bg-accent/10 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                <Icon path="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" className="w-16 h-16 text-accent" />
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-card rounded-3xl border border-border p-8 relative overflow-hidden group hover:border-success/50 transition-colors">
                            <h3 className="text-xl font-bold text-text-primary mb-2">Learning Tracker</h3>
                            <p className="text-text-secondary text-sm">Visualize your growth. Track hours logged, streaks, and XP gained.</p>
                            <div className="mt-6 flex items-end gap-2 h-20 opacity-80 group-hover:opacity-100 transition-opacity">
                                <div className="w-1/4 bg-success rounded-t-sm h-[40%] hover:h-[50%] transition-all"></div>
                                <div className="w-1/4 bg-success rounded-t-sm h-[70%] hover:h-[80%] transition-all"></div>
                                <div className="w-1/4 bg-success rounded-t-sm h-[50%] hover:h-[60%] transition-all"></div>
                                <div className="w-1/4 bg-success rounded-t-sm h-[100%]"></div>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="md:col-span-2 bg-card rounded-3xl border border-border p-8 relative overflow-hidden hover:border-border transition-colors flex flex-col justify-center text-center">
                            <h3 className="text-3xl font-black text-text-primary mb-4">Enterprise-Ready Infrastructure</h3>
                            <p className="text-text-secondary max-w-xl mx-auto mb-6">Built on a highly scalable MERN stack with JWT security, WebSockets for real-time signaling, and an advanced Admin Dashboard for platform metrics.</p>
                            <div className="flex flex-wrap justify-center gap-4 text-text-muted">
                                <span className="font-mono text-sm bg-background-secondary px-3 py-1 rounded-md border border-border">React</span>
                                <span className="font-mono text-sm bg-background-secondary px-3 py-1 rounded-md border border-border">Node.js</span>
                                <span className="font-mono text-sm bg-background-secondary px-3 py-1 rounded-md border border-border">MongoDB</span>
                                <span className="font-mono text-sm bg-background-secondary px-3 py-1 rounded-md border border-border">WebRTC</span>
                                <span className="font-mono text-sm bg-background-secondary px-3 py-1 rounded-md border border-border">Tailwind</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-24 max-w-3xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-4">
                    {[
                        { q: "Is SkillSwap AI completely free?", a: "Yes. Our core philosophy is exchanging knowledge. You pay with your time by teaching others, not with money." },
                        { q: "How do the AI Assessments work?", a: "Before you can list yourself as a teacher for a skill, you must pass a dynamically generated multiple-choice quiz on that topic. This ensures high-quality mentorship." },
                        { q: "Do I need to download a video client?", a: "No! SkillSwap AI has a custom WebRTC video room built directly into your browser, completely secure and peer-to-peer." },
                        { q: "What is XP and why do I want it?", a: "XP (Experience Points) and badges are awarded for teaching sessions and passing assessments. High XP puts you on the global leaderboard, giving you priority access to top-tier mentors." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
                            <h3 className="text-lg font-bold text-text-primary mb-2">{faq.q}</h3>
                            <p className="text-text-secondary leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* BOTTOM CTA */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-1/2 bg-primary/20 blur-[100px] -z-10"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-text-primary tracking-tight mb-6">Ready to accelerate your career?</h2>
                    <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">Join thousands of developers, designers, and creators trading knowledge every day.</p>
                    {!token ? (
                        <Link to="/register" className="inline-flex justify-center items-center px-10 py-5 text-xl font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/40 transition-all hover:-translate-y-1 active:scale-95 border border-primary/50">
                            Create Free Account
                        </Link>
                    ) : (
                        <Link to="/dashboard" className="inline-flex justify-center items-center px-10 py-5 text-xl font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-2xl shadow-primary/40 transition-all hover:-translate-y-1 active:scale-95 border border-primary/50">
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-border bg-background pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/30">
                                    S
                                </div>
                                <span className="text-xl font-bold tracking-tight text-text-primary">SkillSwap<span className="text-primary">AI</span></span>
                            </div>
                            <p className="text-text-secondary text-sm max-w-xs leading-relaxed">The intelligent peer-to-peer knowledge exchange platform for modern professionals.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-primary mb-4 uppercase text-xs tracking-wider">Product</h4>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a></li>
                                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-primary mb-4 uppercase text-xs tracking-wider">Legal</h4>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-text-muted text-sm">&copy; {new Date().getFullYear()} SkillSwap AI. All rights reserved.</p>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all cursor-pointer">𝕏</div>
                            <div className="w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all cursor-pointer">in</div>
                            <div className="w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all cursor-pointer">GH</div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
