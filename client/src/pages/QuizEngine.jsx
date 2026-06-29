import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const QuizEngine = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [assessment, setAssessment] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: [selectedOptions] }
    const [timeLeft, setTimeLeft] = useState(0); // seconds
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const timerRef = useRef(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/assessments/${id}/start`, { headers: { 'x-auth-token': token } });
                if (res.data.success) {
                    setAssessment(res.data.data.assessment);
                    setQuestions(res.data.data.questions);
                    setTimeLeft(res.data.data.assessment.timeLimit * 60);
                }
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || 'Failed to load assessment');
                navigate('/assessments');
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchQuiz();
    }, [id, token, navigate]);

    useEffect(() => {
        if (!loading && !result && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        autoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [loading, result, timeLeft]);

    const handleOptionSelect = (option) => {
        const q = questions[currentIndex];
        const currentAns = answers[q._id] || [];
        
        if (q.type === 'Multiple Select') {
            if (currentAns.includes(option)) {
                setAnswers({ ...answers, [q._id]: currentAns.filter(o => o !== option) });
            } else {
                setAnswers({ ...answers, [q._id]: [...currentAns, option] });
            }
        } else {
            // Single choice or True/False
            setAnswers({ ...answers, [q._id]: [option] });
        }
    };

    const submitQuiz = async (isAuto = false) => {
        if (!isAuto) {
            const confirm = window.confirm("Are you sure you want to submit? You cannot change your answers after this.");
            if (!confirm) return;
        }

        setSubmitting(true);
        clearInterval(timerRef.current);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            
            // Format answers array
            const formattedAnswers = Object.keys(answers).map(qId => ({
                questionId: qId,
                userAnswers: answers[qId]
            }));

            const timeTaken = (assessment.timeLimit * 60) - timeLeft;

            const res = await axios.post(`${API_URL}/api/assessments/${id}/submit`, {
                answers: formattedAnswers,
                timeTaken
            }, { headers: { 'x-auth-token': token } });

            if (res.data.success) {
                setResult(res.data.data);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit assessment');
        } finally {
            setSubmitting(false);
        }
    };

    const autoSubmit = () => {
        toast.warning("Time's up! Auto-submitting...");
        submitQuiz(true);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div className="text-center p-8 mt-20 text-2xl font-bold">Initializing Assessment Engine...</div>;
    if (!assessment || questions.length === 0) return null;

    if (result) {
        const { attempt, badgeAwarded, message } = result;
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <div className={`bg-white rounded-2xl shadow-2xl p-10 border-t-8 ${attempt.passed ? 'border-green-500' : 'border-red-500'}`}>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Assessment Completed</h1>
                    <p className="text-xl text-gray-600 mb-8">{message}</p>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Your Score</p>
                            <p className={`text-5xl font-black ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {attempt.percentage.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-400 mt-2">Required: {assessment.passPercentage}%</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">XP Earned</p>
                            <p className="text-5xl font-black text-purple-600">+{attempt.xpEarned}</p>
                            <p className="text-sm text-gray-400 mt-2">Points: {attempt.score}</p>
                        </div>
                    </div>

                    {badgeAwarded && (
                        <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-6 rounded-xl border border-yellow-200 mb-8 animate-pulse">
                            <div className="text-6xl mb-2">{badgeAwarded.icon}</div>
                            <h3 className="text-xl font-bold text-yellow-800">Badge Unlocked!</h3>
                            <p className="text-yellow-700 font-semibold">{badgeAwarded.name}</p>
                        </div>
                    )}

                    <button 
                        onClick={() => navigate('/assessments')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Return to Assessments
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const selectedAns = answers[currentQ._id] || [];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header & Timer */}
            <div className="bg-white rounded-xl shadow p-6 mb-6 flex justify-between items-center sticky top-4 z-10 border border-gray-200">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{assessment.title}</h2>
                    <p className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
                </div>
                <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-800'}`}>
                    ⏱ {formatTime(timeLeft)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100 min-h-[400px] flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-3 py-1 rounded">
                        {currentQ.type}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">
                        {currentQ.points} Points
                    </span>
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-8 leading-relaxed">
                    {currentQ.questionText}
                </h3>

                <div className="space-y-4 flex-1">
                    {currentQ.options.map((opt, i) => {
                        const isSelected = selectedAns.includes(opt);
                        return (
                            <label 
                                key={i} 
                                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm transform scale-[1.01]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                <input
                                    type={currentQ.type === 'Multiple Select' ? 'checkbox' : 'radio'}
                                    name={`question-${currentQ._id}`}
                                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-4"
                                    checked={isSelected}
                                    onChange={() => handleOptionSelect(opt)}
                                />
                                <span className={`text-lg ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>{opt}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border border-gray-100">
                <button 
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className={`font-bold py-3 px-6 rounded transition-colors ${currentIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                    &larr; Previous
                </button>

                {currentIndex === questions.length - 1 ? (
                    <button 
                        onClick={() => submitQuiz(false)}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded shadow-lg transition-transform hover:scale-105"
                    >
                        {submitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                ) : (
                    <button 
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow transition-colors"
                    >
                        Next &rarr;
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizEngine;
