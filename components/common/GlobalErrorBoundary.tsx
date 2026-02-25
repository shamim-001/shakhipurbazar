import React, { ErrorInfo, ReactNode } from 'react';
import { ActivityService } from '../../src/services/activityService';
import { ExclamationTriangleIcon, ArrowPathIcon } from '../icons';

interface Props {
    children: ReactNode;
    userId?: string;
    userEmail?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Detect Chunk loading errors/Dynamic import failures
        const isChunkError =
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('ChunkLoadError') ||
            error.name === 'ChunkLoadError';

        if (isChunkError) {
            const hasReloaded = sessionStorage.getItem('chunk_error_reloaded');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk_error_reloaded', 'true');
                console.warn('Chunk load error detected. Attempting auto-reload for latest version...');
                window.location.reload();
                return;
            }
        }

        this.logErrorToFirestore(error, errorInfo);
    }

    private logErrorToFirestore = async (error: Error, errorInfo?: ErrorInfo) => {
        try {
            const { userId, userEmail } = this.props;
            await ActivityService.log(
                { id: userId || 'anonymous', email: userEmail || 'unknown' },
                'system.crash',
                'system',
                'frontend',
                'critical',
                {
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo?.componentStack,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                }
            );
        } catch (logError) {
            console.error('Failed to log error to Firestore:', logError);
        }
    };

    public componentDidMount() {
        window.addEventListener('error', this.handleGlobalError);
        window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    }

    public componentWillUnmount() {
        window.removeEventListener('error', this.handleGlobalError);
        window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    }

    private handleGlobalError = (event: ErrorEvent) => {
        this.logErrorToFirestore(event.error || new Error(event.message));
    };

    private handlePromiseRejection = (event: PromiseRejectionEvent) => {
        this.logErrorToFirestore(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center border border-rose-100 dark:border-rose-900/30">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ExclamationTriangleIcon className="w-10 h-10 text-rose-500" />
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">System Interruption</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                            We encountered an unexpected error. Our engineers have been notified and are looking into it.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                                Reload Application
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition-all"
                            >
                                Back to Home
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t dark:border-slate-700">
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 break-all">
                                Reference ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
