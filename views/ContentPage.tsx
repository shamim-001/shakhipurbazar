import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';

interface ContentPageProps {
    pageKey?: string; // Optional if we want to force a specific page
}

const ContentPage: React.FC<ContentPageProps> = ({ pageKey }) => {
    const { platformSettings, language } = useApp();
    const location = useLocation();

    // Determine key from prop or URL path (e.g. /about -> 'about')
    const key = pageKey || location.pathname.split('/').pop() || 'home';

    // Fetch content from settings
    const pageContent = platformSettings.contentPages?.[key];

    useEffect(() => {
        if (pageContent?.title) {
            document.title = `${pageContent.title} - ${platformSettings.appName}`;
        }
    }, [pageContent, platformSettings.appName]);

    if (!pageContent || !pageContent.isVisible) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl font-bold text-gray-300 dark:text-slate-600 mb-4">404</h1>
                <p className="text-gray-500 dark:text-gray-400">Page not found or not published.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                        {pageContent.title}
                    </h1>
                    <div className="w-16 h-1 bg-violet-600 mx-auto rounded-full"></div>
                    <p className="text-sm text-gray-400 mt-4">
                        Last updated: {new Date(pageContent.lastUpdated).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Content Body */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none prose-a:text-violet-600 hover:prose-a:text-violet-500"
                        dangerouslySetInnerHTML={{ __html: pageContent.content }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ContentPage;
