// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
    public state: any;

    constructor(props: any) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Detect Chunk loading errors/Dynamic import failures
        const isChunkError =
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('ChunkLoadError') ||
            error.name === 'ChunkLoadError';

        if (isChunkError) {
            const hasReloaded = sessionStorage.getItem('chunk_error_reloaded');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk_error_reloaded', 'true');
                console.warn('Chunk load error detected in Boundary. Attempting auto-reload...');
                window.location.reload();
                return;
            }
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-gray-500 mb-6">We're sorry, but the application encountered an unexpected error.</p>
                        <div className="bg-gray-100 p-4 rounded text-left overflow-auto text-xs font-mono mb-6 max-h-32">
                            {this.state.error?.toString()}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-[#2c3e50] text-white rounded-lg font-bold hover:bg-[#34495e] transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
