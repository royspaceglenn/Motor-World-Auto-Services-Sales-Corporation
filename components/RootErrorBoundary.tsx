import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RootErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const { message, stack } = this.state.error;
      return (
        <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
          <h1 className="text-xl font-semibold text-red-700">EFCP Motor Parts and Trading — display error</h1>
          <p className="mt-2 text-sm text-slate-600">
            The app hit a JavaScript error. Use <strong>View → Toggle Developer Tools</strong> (desktop) for full logs, or reload
            below.
          </p>
          <pre className="mt-4 max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed">
            {message}
            {stack ? `\n\n${stack}` : ''}
          </pre>
          <button
            type="button"
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
