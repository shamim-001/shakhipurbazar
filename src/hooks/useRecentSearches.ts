import { useState, useEffect } from 'react';

const MAX_RECENT_SEARCHES = 10;
const STORAGE_KEY = 'recentSearches';

export const useRecentSearches = () => {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse recent searches", e);
                setRecentSearches([]);
            }
        }
    }, []);

    const addSearchTerm = (term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;

        setRecentSearches(prev => {
            // Remove if exists to move to top, and limit size
            const filtered = prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase());
            const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const removeSearchTerm = (term: string) => {
        setRecentSearches(prev => {
            const updated = prev.filter(t => t !== term);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearHistory = () => {
        setRecentSearches([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return {
        recentSearches,
        addSearchTerm,
        removeSearchTerm,
        clearHistory
    };
};
