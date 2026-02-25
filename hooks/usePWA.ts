import { useState, useEffect } from 'react';

export const usePWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!isStandaloneMatch);

        // Check platform
        const ua = window.navigator.userAgent;
        const isIOSMatch = /iPhone|iPad|iPod/.test(ua);
        setIsIOS(isIOSMatch);

        // Check dismissal
        const dismissedDate = localStorage.getItem('pwa-dismissed');
        if (dismissedDate) {
            const now = new Date();
            const lastDismissed = new Date(dismissedDate);
            const daysSinceDismissed = (now.getTime() - lastDismissed.getTime()) / (1000 * 3600 * 24);
            if (daysSinceDismissed < 30) {
                setIsDismissed(true);
            }
        }

        // Handle Android/Chrome prompt
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
        }
    };

    const dismiss = () => {
        localStorage.setItem('pwa-dismissed', new Date().toISOString());
        setIsDismissed(true);
    };

    return {
        isInstallable,
        isIOS,
        isStandalone,
        isDismissed,
        install,
        dismiss
    };
};
