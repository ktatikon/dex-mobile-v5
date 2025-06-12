import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './services/i18nService'

// Debug logging for tunnel issues
console.log('🚀 V-DEX Mobile starting...');
console.log('Current URL:', window.location.href);
console.log('Host:', window.location.host);
console.log('Is tunnel:', window.location.host.includes('.devtunnels.ms') || window.location.host.includes('.github.dev'));

// Register service worker for PWA functionality (disabled for tunnel compatibility)
if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Proper React Error Boundary Class Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Critical App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ color: '#FF3B30' }}>🚨 Application Error</h1>
            <p>The V-DEX Mobile application encountered an error.</p>
            <pre style={{
              background: '#1a1a1a',
              padding: '15px',
              borderRadius: '5px',
              textAlign: 'left',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#FF3B30',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '15px'
              }}
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

try {
  const root = createRoot(document.getElementById("root")!);
  console.log('✅ Root element found, rendering app...');

  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );

  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Failed to render app:', error);

  // Fallback rendering
  document.getElementById("root")!.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; color: #fff; font-family: Arial, sans-serif; padding: 20px;">
      <div style="text-align: center; max-width: 500px;">
        <h1 style="color: #FF3B30;">🚨 Critical Error</h1>
        <p>Failed to initialize V-DEX Mobile application.</p>
        <pre style="background: #1a1a1a; padding: 15px; border-radius: 5px; text-align: left; overflow: auto;">${error}</pre>
        <button onclick="window.location.reload()" style="background: #FF3B30; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
