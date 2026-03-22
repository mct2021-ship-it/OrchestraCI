import { loadEnv } from 'vite';
console.log(loadEnv('development', '.', '').GEMINI_API_KEY);
