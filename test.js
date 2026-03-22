import { GoogleGenAI } from '@google/genai';
try {
  new GoogleGenAI({ apiKey: undefined });
} catch (e) {
  console.log(e.message);
}
