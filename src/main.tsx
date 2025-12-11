import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import App from './App.tsx'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', color: '#ef4444' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!convexUrl || !publishableKey) {
  console.error("Missing environment variables");
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: system-ui; padding: 2rem; text-align: center; color: #ef4444;">
        <h1>Configuration Error</h1>
        <p>Missing environment variables.</p>
        <p>Please ensure your <code>.env.local</code> file contains:</p>
        <ul style="list-style: none; padding: 0;">
          <li><code>VITE_CONVEX_URL</code></li>
          <li><code>VITE_CLERK_PUBLISHABLE_KEY</code></li>
        </ul>
        <p style="margin-top: 1rem; color: #666;">You may need to restart your dev server for changes to take effect.</p>
      </div>
    `;
  }
  throw new Error('Missing environment variables');
}

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
)
