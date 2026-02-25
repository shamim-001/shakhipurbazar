
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <h1 className="text-9xl font-extrabold text-gray-200">404</h1>
            <p className="text-2xl font-bold text-gray-800 mt-4">Page Not Found</p>
            <p className="text-gray-500 mt-2 mb-8 text-center max-w-md">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-[#2c3e50] text-white rounded-xl font-bold hover:bg-[#34495e] transition-colors shadow-lg"
            >
                Go Back Home
            </button>
        </div>
    );
};

export default NotFoundPage;
