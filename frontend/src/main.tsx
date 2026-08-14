import { StrictMode } from 'react';
import './i18n';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { env, isDevelopment, isProduction } from '@/config/env';

document.title = isProduction
  ? `${env.appName} — ERP Escolar`
  : `${env.appName} — ${env.appEnv}`;

if (isDevelopment || env.appEnv === 'qa') {
  console.info(`[SchoolCore] env=${env.appEnv} mode=${env.mode} api=${env.apiBaseUrl}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
