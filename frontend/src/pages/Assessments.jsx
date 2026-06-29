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
        if (diff === 'Easy') return 'text-green-600 bg-green-100';
        if (diff === 'Medium') return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    if (loading) return <div className="text-center p-8">Loading Assessments...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Skill Assessments</h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    Take tests, prove your knowledge, and earn verified badges to display on your profile.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {assessments.map(a => (
                    <div key={a._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden flex flex-col border border-gray-100">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
                                    {a.skill}
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${getDifficultyColor(a.difficulty)}`}>
                                    {a.difficulty}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{a.title}</h2>
                            <p className="text-gray-600 mb-6">{a.description}</p>
                            
                            <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {a.timeLimit} mins
                                </span>
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Pass: {a.passPercentage}%
                                </span>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <Link 
                                to={`/assessments/${a._id}`}
                                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
                            >
                                Start Assessment
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            {assessments.length === 0 && (
                <div className="text-center text-gray-500 mt-12 bg-gray-50 p-12 rounded-xl border border-gray-200">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="text-xl font-bold mb-2">No Assessments Available</h3>
                    <p>Check back later for new skill tests.</p>
                </div>
            )}
        </div>
    );
};

export default Assessments;
