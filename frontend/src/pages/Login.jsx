import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed');
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
                        Welcome back
                    </h2>
                    <p className="mt-2 text-center text-sm text-text-secondary">
                        Sign in to continue to your dashboard.
                    </p>
                </div>
                {error && <div className="bg-error/10 border border-error/20 text-error p-3 rounded-lg text-center text-sm">{error}</div>}
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Email address</label>
                            <input
                                type="email"
                                required
                                className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="appearance-none block w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-all active:scale-95"
                        >
                            Sign In
                        </button>
                    </div>
                </form>
                
                <div className="text-center mt-6">
                    <Link to="/register" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                        Don't have an account? Create one
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
