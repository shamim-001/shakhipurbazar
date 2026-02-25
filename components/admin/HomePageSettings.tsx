
import React, { useState, useEffect } from 'react';
import { useApp } from '../../src/context/AppContext';
import Modal from '../common/Modal';

const HomePageSettings: React.FC = () => {
    const { language, platformSettings, updatePlatformSettings, heroSlides, updateHeroSlides } = useApp();
    const [activeTab, setActiveTab] = useState<'hero' | 'announcement' | 'sections'>('hero');

    // Hero Text State (from previous implementation)
    const [localHero, setLocalHero] = useState(platformSettings.homepageSections.hero);
    const [hasHeroChanges, setHasHeroChanges] = useState(false);

    // Hero Slides State
    const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
    const [newSlide, setNewSlide] = useState({ titleEn: '', titleBn: '', subtitleEn: '', subtitleBn: '', image: '', link: '' });

    useEffect(() => {
        setLocalHero(platformSettings.homepageSections.hero);
        setHasHeroChanges(false);
    }, [platformSettings.homepageSections.hero]);

    // Handle Hero Text Changes
    const handleHeroChange = (key: keyof typeof localHero, lang: 'en' | 'bn', value: string) => {
        if (key === 'show') return;
        setLocalHero(prev => ({
            ...prev,
            [key]: { ...(prev[key] as any), [lang]: value }
        }));
        setHasHeroChanges(true);
    };

    const handleToggleHeroShow = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalHero(prev => ({ ...prev, show: e.target.checked }));
        setHasHeroChanges(true);
    };

    const saveHeroSettings = () => {
        updatePlatformSettings({
            ...platformSettings,
            homepageSections: {
                ...platformSettings.homepageSections,
                hero: localHero
            }
        });
        setHasHeroChanges(false);
        alert("Hero Settings saved!");
    };

    // Slides Management
    const handleAddSlide = () => {
        if (!newSlide.titleEn || !newSlide.image) {
            alert('Please fill required fields (Title EN and Image)');
            return;
        }
        const slide = {
            id: Date.now().toString(),
            active: true,
            image: newSlide.image,
            title: { en: newSlide.titleEn, bn: newSlide.titleBn || newSlide.titleEn },
            subtitle: { en: newSlide.subtitleEn, bn: newSlide.subtitleBn || newSlide.subtitleEn },
            link: newSlide.link
        };
        const updatedSlides = [...heroSlides, slide];
        if (updateHeroSlides) updateHeroSlides(updatedSlides);
        setNewSlide({ titleEn: '', titleBn: '', subtitleEn: '', subtitleBn: '', image: '', link: '' });
        setIsSlideModalOpen(false);
    };

    const handleDeleteSlide = (index: number) => {
        if (confirm('Delete this slide?')) {
            const updatedSlides = heroSlides.filter((_, i) => i !== index);
            if (updateHeroSlides) updateHeroSlides(updatedSlides);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow min-h-[600px]">
            {/* Tabs Header */}
            <div className="flex border-b dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('hero')}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'hero' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-slate-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    Hero Section
                </button>
                <button
                    onClick={() => setActiveTab('announcement')}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'announcement' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-slate-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    Announcement Bar
                </button>
                <button
                    onClick={() => setActiveTab('sections')}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'sections' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-slate-700/50' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    Page Content
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'hero' && (
                    <div className="space-y-8">
                        {/* Hero Visibility & Text */}
                        <div className="border-b dark:border-slate-700 pb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hero Text & Visibility</h3>
                                {hasHeroChanges && (
                                    <button
                                        onClick={saveHeroSettings}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
                                    >
                                        Save Changes
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mb-6">
                                <input
                                    type="checkbox"
                                    checked={localHero.show}
                                    onChange={handleToggleHeroShow}
                                    id="hero-show"
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <label htmlFor="hero-show" className="font-medium text-gray-700 dark:text-gray-300">
                                    Show Hero Section
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Main Title (EN)</label>
                                    <input
                                        type="text"
                                        value={localHero.title.en}
                                        onChange={(e) => handleHeroChange('title', 'en', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Main Title (BN)</label>
                                    <input
                                        type="text"
                                        value={localHero.title.bn}
                                        onChange={(e) => handleHeroChange('title', 'bn', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle (EN)</label>
                                    <textarea
                                        rows={2}
                                        value={localHero.subtitle.en}
                                        onChange={(e) => handleHeroChange('subtitle', 'en', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle (BN)</label>
                                    <textarea
                                        rows={2}
                                        value={localHero.subtitle.bn}
                                        onChange={(e) => handleHeroChange('subtitle', 'bn', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Placeholder (EN)</label>
                                    <input
                                        type="text"
                                        value={localHero.placeholder.en}
                                        onChange={(e) => handleHeroChange('placeholder', 'en', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Placeholder (BN)</label>
                                    <input
                                        type="text"
                                        value={localHero.placeholder.bn}
                                        onChange={(e) => handleHeroChange('placeholder', 'bn', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hero Slides */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hero Slides</h3>
                                <button onClick={() => setIsSlideModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    + Add New Slide
                                </button>
                            </div>
                            <div className="space-y-4">
                                {heroSlides.map((slide, idx) => (
                                    <div key={idx} className="border dark:border-slate-700 rounded-lg p-4 flex items-center gap-4 bg-gray-50 dark:bg-slate-900">
                                        <img src={slide.image} alt={slide.title[language]} className="w-24 h-24 object-cover rounded" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{slide.title[language]}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{slide.subtitle[language]}</p>
                                        </div>
                                        <button onClick={() => handleDeleteSlide(idx)} className="text-red-600 hover:text-red-900 px-3 py-1 border border-red-200 rounded hover:bg-red-50">
                                            Delete
                                        </button>
                                    </div>
                                ))}
                                {heroSlides.length === 0 && <p className="text-center text-gray-500 py-4">No slides added yet.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'announcement' && (
                    <div className="max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Announcement Bar</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={platformSettings.announcement?.show || false}
                                    onChange={(e) => updatePlatformSettings({
                                        ...platformSettings,
                                        announcement: { ...platformSettings.announcement, show: e.target.checked }
                                    })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-700 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message (English)</label>
                                <input
                                    type="text"
                                    value={platformSettings.announcement?.message?.en || ''}
                                    onChange={(e) => updatePlatformSettings({
                                        ...platformSettings,
                                        announcement: {
                                            ...platformSettings.announcement,
                                            message: { ...platformSettings.announcement.message, en: e.target.value }
                                        }
                                    })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message (Bengali)</label>
                                <input
                                    type="text"
                                    value={platformSettings.announcement?.message?.bn || ''}
                                    onChange={(e) => updatePlatformSettings({
                                        ...platformSettings,
                                        announcement: {
                                            ...platformSettings.announcement,
                                            message: { ...platformSettings.announcement.message, bn: e.target.value }
                                        }
                                    })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link (Optional)</label>
                                <input
                                    type="text"
                                    value={platformSettings.announcement?.link || ''}
                                    onChange={(e) => updatePlatformSettings({
                                        ...platformSettings,
                                        announcement: { ...platformSettings.announcement, link: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="/products/promo"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sections' && (
                    <div className="max-w-2xl space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-700">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Promotions Section</h3>
                                <p className="text-sm text-gray-500">Show the "Promotions" block on homepage</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={platformSettings.showPromotionsSection}
                                    onChange={(e) => updatePlatformSettings({ ...platformSettings, showPromotionsSection: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-700 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b dark:border-slate-700">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Featured Vendors</h3>
                                <p className="text-sm text-gray-500">Show the "Featured Shops" block on homepage</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={platformSettings.showFeaturedSection}
                                    onChange={(e) => updatePlatformSettings({ ...platformSettings, showFeaturedSection: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-700 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for adding slides */}
            <Modal
                isOpen={isSlideModalOpen}
                onClose={() => setIsSlideModalOpen(false)}
                title="Add New Hero Slide"
                size='lg'
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (EN) *</label>
                            <input
                                type="text"
                                value={newSlide.titleEn}
                                onChange={(e) => setNewSlide({ ...newSlide, titleEn: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (BN)</label>
                            <input
                                type="text"
                                value={newSlide.titleBn}
                                onChange={(e) => setNewSlide({ ...newSlide, titleBn: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle (EN)</label>
                            <input
                                type="text"
                                value={newSlide.subtitleEn}
                                onChange={(e) => setNewSlide({ ...newSlide, subtitleEn: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle (BN)</label>
                            <input
                                type="text"
                                value={newSlide.subtitleBn}
                                onChange={(e) => setNewSlide({ ...newSlide, subtitleBn: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL *</label>
                        <input
                            type="url"
                            value={newSlide.image}
                            onChange={(e) => setNewSlide({ ...newSlide, image: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link (optional)</label>
                        <input
                            type="url"
                            value={newSlide.link}
                            onChange={(e) => setNewSlide({ ...newSlide, link: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 border-t pt-4 dark:border-slate-700">
                        <button
                            onClick={() => setIsSlideModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddSlide}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Add Slide
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default HomePageSettings;
