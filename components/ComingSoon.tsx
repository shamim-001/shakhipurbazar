import React from 'react';
import { useApp } from '../src/context/AppContext';
import { SparklesIcon } from './icons';

interface ComingSoonProps {
    title?: string;
    description?: string;
    icon?: React.ElementType;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
    title,
    description,
    icon: Icon = SparklesIcon
}) => {
    const { language } = useApp();

    const defaultContent = {
        en: {
            title: "Coming Soon",
            description: "We are working hard to bring this feature to you. Stay tuned!",
        },
        bn: {
            title: "শীঘ্রই আসছে",
            description: "আমরা এই ফিচারটি আপনার কাছে নিয়ে আসার জন্য কঠোর পরিশ্রম করছি। সাথে থাকুন!",
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-tr from-rose-100 to-teal-100 dark:from-rose-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-rose-400"></div>
                <Icon className="w-10 h-10 text-rose-500 dark:text-rose-400" />
            </div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-teal-500 mb-3">
                {title || defaultContent[language].title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-lg">
                {description || defaultContent[language].description}
            </p>
        </div>
    );
};

export default ComingSoon;
