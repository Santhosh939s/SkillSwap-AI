import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        skillsKnown: '',
        skillsWanted: '',
        securityQuestion: '',
        securityAnswer: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Process comma-separated skills into arrays before sending
            const dataToSubmit = {
                ...formData,
                skillsKnown: formData.skillsKnown.split(',').map(s => s.trim()).filter(s => s),
                skillsWanted: formData.skillsWanted.split(',').map(s => s.trim()).filter(s => s),
            };

            const API_URL = import.meta.env.VITE_API_URL;
            await axios.post(`${API_URL}/register`, dataToSubmit);
            
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-card border border-border p-8 rounded-2xl shadow-xl">
                <div>
                    <div className="w-12 h-12 mx-auto rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                        S
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary tracking-tight">
                        Join SkillSwap
                    </h2>
                    <p className="mt-2 text-center text-sm text-text-secondary">
                        Learn a new skill by teaching one of your own.
                    </p>
                </div>
                {error && <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-center text-sm">{error}</div>}
                
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" placeholder="Your Name" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Email address</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" placeholder="name@example.com" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                        <input type="password" name="password" required value={formData.password} onChange={handleChange} minLength="6" className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" placeholder="••••••••" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Skills you can teach (comma separated)</label>
                        <input type="text" name="skillsKnown" placeholder="e.g., Python, Piano, Cooking" required value={formData.skillsKnown} onChange={handleChange} className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Skills you want to learn (comma separated)</label>
                        <input type="text" name="skillsWanted" placeholder="e.g., Spanish, Guitar, CSS" required value={formData.skillsWanted} onChange={handleChange} className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Security Question</label>
                        <select name="securityQuestion" required value={formData.securityQuestion} onChange={handleChange} className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm">
                            <option value="" disabled>Select a question...</option>
                            <option value="What is your pet's name?">What is your pet's name?</option>
                            <option value="What city were you born in?">What city were you born in?</option>
                            <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Security Answer</label>
                        <input type="text" name="securityAnswer" required value={formData.securityAnswer} onChange={handleChange} className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm" placeholder="Your Answer" />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Registering...' : 'Create Account'}
                        </button>
                    </div>
                </form>
                
                <div className="text-center mt-6">
                    <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
