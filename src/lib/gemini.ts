import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

/**
 * Gets a Gemini AI client instance.
 * In the AI Studio environment, this handles checking for and prompting for an API key if necessary.
 */
export async function getGeminiClient(): Promise<GoogleGenAI | null> {
  // First try the standard environment variable
  let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  // If it's the string "undefined" or empty, treat as null
  if (apiKey === 'undefined' || !apiKey) {
    apiKey = undefined;
  }

  // If no key is found and we're in the browser, check for AI Studio key selection
  if (!apiKey && typeof window !== 'undefined' && window.aistudio) {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // This will open the platform's key selection dialog
        await window.aistudio.openSelectKey();
      }
      // After the dialog, the key should be available in process.env.API_KEY
      // We re-check the key here
      apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    } catch (error) {
      console.error('Error checking/selecting API key:', error);
    }
  }

  if (!apiKey) {
    console.warn('Gemini API key not found. AI features may not work.');
    return null;
  }

  const client = new GoogleGenAI({ apiKey });

  if (typeof window !== 'undefined') {
    // Intercept generateContent
    const originalGenerateContent = client.models.generateContent.bind(client.models);
    client.models.generateContent = async (...args: any[]) => {
      const response = await originalGenerateContent(...args);
      
      let tokensUsed = response.usageMetadata?.totalTokenCount;
      if (!tokensUsed) {
        // Fallback estimation
        tokensUsed = 500;
        const configStr = JSON.stringify(args[0]);
        const responseStr = JSON.stringify(response);
        tokensUsed = Math.ceil((configStr.length + responseStr.length) / 4);
      }
      
      if (args[0]?.model?.includes('pro')) {
        tokensUsed *= 10;
      }
      
      window.dispatchEvent(new CustomEvent('ai-usage-updated', { detail: { tokens: tokensUsed } }));
      return response;
    };

    // Intercept generateContentStream
    const originalGenerateContentStream = client.models.generateContentStream.bind(client.models);
    client.models.generateContentStream = async function* (...args: any[]) {
      const stream = await originalGenerateContentStream(...args);
      let tokensUsed = 0;
      for await (const chunk of stream) {
        if (chunk.usageMetadata?.totalTokenCount) {
          tokensUsed = chunk.usageMetadata.totalTokenCount;
        }
        yield chunk;
      }
      if (tokensUsed === 0) tokensUsed = 500; // Fallback
      
      if (args[0]?.model?.includes('pro')) {
        tokensUsed *= 10;
      }
      
      window.dispatchEvent(new CustomEvent('ai-usage-updated', { detail: { tokens: tokensUsed } }));
    } as any;
  }

  return client;
}

/**
 * Checks if an API key is available or can be selected.
 */
export async function ensureApiKey(): Promise<boolean> {
  // Check process.env (shimmed by Vite)
  let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (apiKey && apiKey !== 'undefined' && apiKey !== '') return true;

  // Check window.process.env directly (sometimes shims are weird)
  if (typeof window !== 'undefined') {
    const env = (window as any).process?.env;
    if (env?.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'undefined' && env.GEMINI_API_KEY !== '') return true;
    if (env?.API_KEY && env.API_KEY !== 'undefined' && env.API_KEY !== '') return true;
  }

  if (typeof window !== 'undefined' && window.aistudio) {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (hasKey) return true;
      
      await window.aistudio.openSelectKey();
      return true; // Assume success after opening dialog
    } catch (error) {
      console.error('Error in ensureApiKey:', error);
      return false;
    }
  }

  return false;
}
