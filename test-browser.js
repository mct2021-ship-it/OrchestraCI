import { GoogleGenAI } from '@google/genai';
globalThis.window = globalThis;
try {
  new GoogleGenAI({ apiKey: undefined });
} catch (e) {
  console.log(e.message);
}
