import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
    const { token } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full text-center space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                    Welcome to <span className="text-blue-600">SkillSwap</span> 🚀
                </h1>
                
                <p className="mt-4 text-xl text-gray-500">
                    The free, community-driven platform to learn a new skill by teaching one of your own.
                    Connect with learners and teachers from around the world.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    {!token ? (
                        <>
                            <Link 
                                to="/register" 
                                className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Get Started (Register)
                            </Link>
                            <Link 
                                to="/login" 
                                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Login
                            </Link>
                        </>
                    ) : (
                        <Link 
                            to="/dashboard" 
                            className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    )}
                    <Link 
                        to="/community" 
                        className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Explore Community
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
