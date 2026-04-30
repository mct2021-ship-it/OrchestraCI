import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './context/ToastContext';
import { AiUsageProvider } from './context/AiUsageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log('Main entry point reached');

if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global Error Caught:', { message, source, lineno, colno, error });
  };
  window.onunhandledrejection = function(event) {
    console.error('Unhandled Rejection Caught:', event.reason);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AiUsageProvider>
          <App />
        </AiUsageProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
