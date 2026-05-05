import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-red-100 max-w-md w-full">
            <h1 className="text-2xl font-black text-red-600 mb-4">Something went wrong</h1>
            <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl overflow-auto max-h-60">
              {this.state.error?.message}
            </pre>
            <p className="text-xs text-gray-400 mt-4">
              Check the browser console (F12) for more details.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-primary text-white font-bold py-2 px-6 rounded-full"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
