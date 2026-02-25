import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string | { en: string; bn: string };
    description?: string | { en: string; bn: string };
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    schema?: object;
    lang?: 'en' | 'bn';
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image = "/og-image.jpg",
    url = "https://sakhipur-bazar.web.app",
    type = "website",
    schema,
    lang = 'en'
}) => {
    const siteTitle = "Sakhipur Bazar";

    const displayTitle = typeof title === 'string' ? title : title[lang];
    const displayDescription = description
        ? (typeof description === 'string' ? description : description[lang])
        : (lang === 'en'
            ? "Sakhipur's premier online marketplace. Shop local products, foods, and services effortlessly."
            : "সখিপুরের সেরা অনলাইন মার্কেটপ্লেস। স্থানীয় পণ্য, খাবার এবং সেবা সহজে কিনুন।");

    const fullTitle = displayTitle === siteTitle ? displayTitle : `${displayTitle} | ${siteTitle}`;

    return (
        <Helmet>
            {/* Standard Metrics */}
            <title>{fullTitle}</title>
            <meta name="description" content={displayDescription} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={displayDescription} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
