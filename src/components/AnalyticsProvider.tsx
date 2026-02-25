import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

declare global {
    interface Window {
        dataLayer: any[];
    }
}

const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { platformSettings } = useApp();
    const location = useLocation();

    // Initialize Data Layer
    useEffect(() => {
        if (!window.dataLayer) {
            window.dataLayer = [];
        }
    }, []);

    // Track Page Views
    useEffect(() => {
        if (platformSettings.analytics?.enabled && platformSettings.analytics?.gtmId) {
            window.dataLayer.push({
                event: 'page_view',
                page_path: location.pathname + location.search,
                page_title: document.title
            });
        }
    }, [location, platformSettings.analytics]);

    // Inject GTM Scripts
    useEffect(() => {
        const { gtmId, enabled } = platformSettings.analytics || {};

        if (enabled && gtmId) {
            // Check if already injected
            if (document.getElementById('gtm-script')) return;

            // 1. Head Script
            const script = document.createElement('script');
            script.id = 'gtm-script';
            script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');`;
            document.head.appendChild(script);

            // 2. Body NoScript (Optional, but good for completeness)
            const noscript = document.createElement('noscript');
            noscript.id = 'gtm-noscript';
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
            iframe.height = '0';
            iframe.width = '0';
            iframe.style.display = 'none';
            iframe.style.visibility = 'hidden';
            noscript.appendChild(iframe);
            document.body.insertBefore(noscript, document.body.firstChild);
        }
    }, [platformSettings.analytics]);

    return <>{children}</>;
};

export default AnalyticsProvider;
