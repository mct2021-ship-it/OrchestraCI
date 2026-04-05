import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'inject-env',
        transformIndexHtml(html) {
        const currentGeminiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
        const currentApiKey = process.env.API_KEY || env.API_KEY || '';
        return html.replace(
          '</head>',
          `<script>
            window.process = window.process || {}; 
            window.process.env = window.process.env || {}; 
            window.process.env.GEMINI_API_KEY = ${JSON.stringify(currentGeminiKey)};
            window.process.env.API_KEY = ${JSON.stringify(currentApiKey)};
          </script></head>`
        );
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': 'window.process.env.GEMINI_API_KEY',
      'process.env.API_KEY': 'window.process.env.API_KEY',
      '__MY_VAR__': '"hello"',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
