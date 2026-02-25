import React, { useState, useEffect } from 'react';
import { useApp } from '../../src/context/AppContext';
import { PageContent } from '../../types';

const PAGES = [
    { key: 'about', label: 'About Us' },
    { key: 'contact', label: 'Contact Us' },
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms of Service' }
];

const CMSPagesTab: React.FC = () => {
    const { platformSettings, updatePlatformSettings, language } = useApp();
    const [selectedPage, setSelectedPage] = useState('about');
    const [editData, setEditData] = useState<PageContent>({
        title: '',
        content: '',
        lastUpdated: new Date().toISOString(),
        isVisible: false
    });
    const [previewMode, setPreviewMode] = useState(false);

    // Load data when page selection changes or settings load
    useEffect(() => {
        const currentContent = platformSettings.contentPages?.[selectedPage];
        if (currentContent) {
            setEditData(currentContent);
        } else {
            // Default boilerplate
            setEditData({
                title: PAGES.find(p => p.key === selectedPage)?.label || 'New Page',
                content: '<p>Start writing your content here...</p>',
                lastUpdated: new Date().toISOString(),
                isVisible: false
            });
        }
    }, [selectedPage, platformSettings.contentPages]);

    const handleSave = async () => {
        const updatedPages = {
            ...platformSettings.contentPages,
            [selectedPage]: {
                ...editData,
                lastUpdated: new Date().toISOString()
            }
        };

        await updatePlatformSettings({
            ...platformSettings,
            contentPages: updatedPages
        });

        alert('Page saved successfully!');
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Content Management</h2>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                        {PAGES.map(page => (
                            <button
                                key={page.key}
                                onClick={() => { setSelectedPage(page.key); setPreviewMode(false); }}
                                className={`w-full text-left px-4 py-3 border-l-4 transition-all ${selectedPage === page.key
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-slate-700 font-medium text-indigo-700 dark:text-indigo-300'
                                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {page.label}
                                {platformSettings.contentPages?.[page.key]?.isVisible &&
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Live</span>
                                }
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-grow bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold dark:text-white">Editing: {PAGES.find(p => p.key === selectedPage)?.label}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${previewMode
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'
                                    }`}
                            >
                                {previewMode ? 'Back to Edit' : 'Preview'}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {!previewMode ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Page Title (H1)
                                </label>
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editData.isVisible}
                                        onChange={(e) => setEditData({ ...editData, isVisible: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Publish Page (Make Visible)
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Content (HTML/Markdown supported)
                                </label>
                                <div className="mb-2 text-xs text-gray-500">
                                    Tip: Use &lt;h2&gt; for subtitles, &lt;p&gt; for paragraphs. Tailwind classes work here!
                                </div>
                                <textarea
                                    value={editData.content}
                                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                                    rows={15}
                                    className="w-full px-4 py-2 border rounded-lg font-mono text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-8 bg-gray-50 dark:bg-slate-900 min-h-[400px]">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6 border-b pb-4">
                                {editData.title}
                            </h1>
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: editData.content }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CMSPagesTab;
