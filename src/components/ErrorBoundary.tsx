import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        const { hasError, error } = this.state;
        const { children } = this.props;

        if (hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md">
                        <div className="text-rose-600 mb-4 flex justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h1>
                        <p className="text-slate-600 mb-6">
                            Ocorreu um erro inesperado na interface. Tente recarregar a página.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                        >
                            Recarregar Sistema
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <pre className="mt-6 p-4 bg-slate-50 rounded-xl text-left text-xs text-rose-800 overflow-auto max-h-40">
                                {error?.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default ErrorBoundary;
