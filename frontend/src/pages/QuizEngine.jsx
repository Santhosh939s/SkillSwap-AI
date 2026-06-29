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
                const API_URL = import.meta.env.VITE_API_URL ;
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
            const API_URL = import.meta.env.VITE_API_URL ;
            
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

    if (loading) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <div className="text-xl font-bold text-text-primary tracking-tight">Initializing Assessment Engine...</div>
        </div>
    );
    if (!assessment || questions.length === 0) return null;

    if (result) {
        const { attempt, badgeAwarded, message } = result;
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-3xl w-full text-center">
                    <div className={`bg-card rounded-3xl shadow-2xl p-10 border-t-8 border-x border-b border-border ${attempt.passed ? 'border-t-success shadow-success/10' : 'border-t-error shadow-error/10'}`}>
                        <h1 className="text-4xl font-extrabold text-text-primary mb-2 tracking-tight">Assessment Completed</h1>
                        <p className="text-xl text-text-secondary mb-10">{message}</p>
                        
                        <div className="grid grid-cols-2 gap-6 mb-10">
                            <div className="bg-background-secondary p-8 rounded-2xl border border-border">
                                <p className="text-sm text-text-muted uppercase font-bold tracking-widest mb-2">Your Score</p>
                                <p className={`text-6xl font-black ${attempt.passed ? 'text-success' : 'text-error'} drop-shadow-sm`}>
                                    {attempt.percentage.toFixed(1)}%
                                </p>
                                <p className="text-sm font-medium text-text-secondary mt-3">Required: {assessment.passPercentage}%</p>
                            </div>
                            <div className="bg-background-secondary p-8 rounded-2xl border border-border">
                                <p className="text-sm text-text-muted uppercase font-bold tracking-widest mb-2">XP Earned</p>
                                <p className="text-6xl font-black text-primary drop-shadow-sm">+{attempt.xpEarned}</p>
                                <p className="text-sm font-medium text-text-secondary mt-3">Points: {attempt.score}</p>
                            </div>
                        </div>

                        {badgeAwarded && (
                            <div className="bg-accent/10 p-8 rounded-2xl border border-accent/20 mb-10 animate-pulse-slow">
                                <div className="text-7xl mb-4 drop-shadow-md">{badgeAwarded.icon}</div>
                                <h3 className="text-2xl font-bold text-accent mb-1">Badge Unlocked!</h3>
                                <p className="text-text-primary font-bold text-lg">{badgeAwarded.name}</p>
                            </div>
                        )}

                        <button 
                            onClick={() => navigate('/assessments')}
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-lg"
                        >
                            Return to Assessments
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const selectedAns = answers[currentQ._id] || [];

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header & Timer */}
                <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-lg shadow-black/5 p-6 mb-8 flex justify-between items-center sticky top-6 z-20 border border-border">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">{assessment.title}</h2>
                        <p className="text-sm font-medium text-text-secondary mt-1">Question {currentIndex + 1} of {questions.length}</p>
                    </div>
                    <div className={`text-2xl font-mono font-bold px-5 py-2.5 rounded-xl border flex items-center gap-3 shadow-sm ${timeLeft < 60 ? 'bg-error/10 text-error border-error/30 animate-pulse' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-background-secondary rounded-full h-3 mb-10 border border-border overflow-hidden p-0.5">
                    <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Question Card */}
                <div className="bg-card rounded-2xl shadow-sm p-8 md:p-10 mb-8 border border-border min-h-[450px] flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg">
                            {currentQ.type}
                        </span>
                        <span className="text-sm font-bold text-text-muted bg-background-secondary px-3 py-1.5 rounded-lg border border-border">
                            {currentQ.points} Points
                        </span>
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-10 leading-tight">
                        {currentQ.questionText}
                    </h3>

                    <div className="space-y-4 flex-1">
                        {currentQ.options.map((opt, i) => {
                            const isSelected = selectedAns.includes(opt);
                            return (
                                <label 
                                    key={i} 
                                    className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${isSelected ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(79,70,229,0.1)] transform scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-background-secondary'}`}
                                >
                                    <div className={`w-6 h-6 rounded-md flex-shrink-0 mr-5 border flex items-center justify-center transition-colors ${currentQ.type === 'Multiple Select' ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'bg-primary border-primary' : 'bg-background-secondary border-border group-hover:border-primary/50'}`}>
                                        {isSelected && (
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        )}
                                    </div>
                                    <input
                                        type={currentQ.type === 'Multiple Select' ? 'checkbox' : 'radio'}
                                        name={`question-${currentQ._id}`}
                                        className="hidden"
                                        checked={isSelected}
                                        onChange={() => handleOptionSelect(opt)}
                                    />
                                    <span className={`text-lg leading-snug ${isSelected ? 'text-primary font-bold' : 'text-text-primary font-medium'}`}>{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border border-border">
                    <button 
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        className={`font-bold py-3.5 px-8 rounded-xl transition-all ${currentIndex === 0 ? 'bg-background-secondary text-text-muted cursor-not-allowed opacity-50' : 'bg-background-secondary text-text-primary border border-border hover:bg-card-hover'}`}
                    >
                        &larr; Previous
                    </button>

                    {currentIndex === questions.length - 1 ? (
                        <button 
                            onClick={() => submitQuiz(false)}
                            disabled={submitting}
                            className="bg-success hover:bg-green-600 text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-success/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {submitting ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                    ) : (
                        <button 
                            onClick={() => setCurrentIndex(prev => prev + 1)}
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                        >
                            Next &rarr;
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizEngine;
