import React, { createContext, useContext, useState, useEffect } from 'react';

interface AiUsageContextType {
  tokensUsed: number;
  tokensLimit: number;
  trackAiUsage: (tokens: number) => void;
  addTokens: (amount: number) => void;
}

const AiUsageContext = createContext<AiUsageContextType | undefined>(undefined);

export const AiUsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokensUsed, setTokensUsed] = useState(() => {
    const saved = localStorage.getItem('orchestra-ai-tokens-used');
    return saved ? parseInt(saved, 10) : 8450;
  });
  
  const [tokensLimit, setTokensLimit] = useState(() => {
    const savedLimit = localStorage.getItem('orchestra-ai-tokens-limit');
    return savedLimit ? parseInt(savedLimit, 10) : 10000;
  });

  useEffect(() => {
    localStorage.setItem('orchestra-ai-tokens-used', tokensUsed.toString());
  }, [tokensUsed]);

  useEffect(() => {
    localStorage.setItem('orchestra-ai-tokens-limit', tokensLimit.toString());
  }, [tokensLimit]);

  useEffect(() => {
    const handleUsageUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{tokens: number}>;
      if (customEvent.detail && typeof customEvent.detail.tokens === 'number') {
        setTokensUsed(prev => prev + customEvent.detail.tokens);
      }
    };
    
    window.addEventListener('ai-usage-updated', handleUsageUpdated);
    return () => window.removeEventListener('ai-usage-updated', handleUsageUpdated);
  }, []);

  const trackAiUsage = (tokens: number) => {
    setTokensUsed(prev => prev + tokens);
  };

  const addTokens = (amount: number) => {
    setTokensLimit(prev => prev + amount);
  };

  return (
    <AiUsageContext.Provider value={{ tokensUsed, tokensLimit, trackAiUsage, addTokens }}>
      {children}
    </AiUsageContext.Provider>
  );
};

export const useAiUsage = () => {
  const context = useContext(AiUsageContext);
  if (context === undefined) {
    throw new Error('useAiUsage must be used within an AiUsageProvider');
  }
  return context;
};
