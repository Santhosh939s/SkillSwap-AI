import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Assessments = () => {
    const { token } = useContext(AuthContext);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            if (!token) return;
            try {
                const API_URL = import.meta.env.VITE_API_URL ;
                const res = await axios.get(`${API_URL}/api/assessments`, { headers: { 'x-auth-token': token } });
                if (res.data.success) {
                    setAssessments(res.data.data);
                }
            } catch (err) {
                console.error('Failed to load assessments', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssessments();
    }, [token]);

    const getDifficultyColor = (diff) => {
        if (diff === 'Easy') return 'text-success bg-success/10 border border-success/20';
        if (diff === 'Medium') return 'text-warning bg-warning/10 border border-warning/20';
        return 'text-error bg-error/10 border border-error/20';
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-text-primary mb-4 tracking-tight">Skill Assessments</h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Take tests, prove your knowledge, and earn verified badges to display on your profile.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {assessments.map(a => (
                        <div key={a._id} className="bg-card rounded-2xl shadow-sm hover:border-primary/50 transition-colors overflow-hidden flex flex-col border border-border">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1 rounded-lg font-bold uppercase tracking-wider">
                                        {a.skill}
                                    </span>
                                    <span className={`text-xs px-3 py-1 rounded-lg font-bold uppercase tracking-wider ${getDifficultyColor(a.difficulty)}`}>
                                        {a.difficulty}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-text-primary mb-3">{a.title}</h2>
                                <p className="text-text-secondary mb-6 line-clamp-3">{a.description}</p>
                                
                                <div className="flex items-center text-sm text-text-muted space-x-6 mb-2">
                                    <span className="flex items-center bg-background-secondary px-3 py-1.5 rounded-lg border border-border">
                                        <svg className="w-4 h-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="font-medium">{a.timeLimit} mins</span>
                                    </span>
                                    <span className="flex items-center bg-background-secondary px-3 py-1.5 rounded-lg border border-border">
                                        <svg className="w-4 h-4 mr-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="font-medium">Pass: {a.passPercentage}%</span>
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 bg-background-secondary border-t border-border mt-auto">
                                <Link 
                                    to={`/assessments/${a._id}`}
                                    className="block w-full text-center bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    Start Assessment
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
                {assessments.length === 0 && (
                    <div className="text-center text-text-muted mt-12 bg-card p-16 rounded-2xl border border-border border-dashed">
                        <svg className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h3 className="text-xl font-bold mb-2 text-text-primary">No Assessments Available</h3>
                        <p>Check back later for new skill tests.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Assessments;
