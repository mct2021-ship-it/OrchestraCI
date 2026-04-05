import React, { useState, useRef } from 'react';
import { Upload, Calculator, Loader2, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { Type, ThinkingLevel } from '@google/genai';
import { stripPIData } from '../lib/piStripper';

interface NpsData {
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  score: number;
}

export function NpsCalculator() {
  const [inputText, setInputText] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [npsResult, setNpsResult] = useState<NpsData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event.target?.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleCalculate = async () => {
    if (!inputText.trim()) {
      setError('Please provide some NPS survey data to calculate.');
      return;
    }

    setIsCalculating(true);
    setError(null);
    setNpsResult(null);

    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        throw new Error("Gemini API key is required. Please select one in the settings in AI Studio, or ensure the GEMINI_API_KEY environment variable is set if running standalone.");
      }

      const ai = await getGeminiClient();
      if (!ai) throw new Error("Failed to initialize Gemini AI client");

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following NPS survey data. Count the number of promoters (scores 9-10), passives (scores 7-8), and detractors (scores 0-6).
        
        NPS Data:
        ${stripPIData(inputText)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              promoters: {
                type: Type.NUMBER,
                description: "Number of promoters (scores 9-10)",
              },
              passives: {
                type: Type.NUMBER,
                description: "Number of passives (scores 7-8)",
              },
              detractors: {
                type: Type.NUMBER,
                description: "Number of detractors (scores 0-6)",
              },
            },
            required: ["promoters", "passives", "detractors"],
          },
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("No response from AI.");
      
      const result = JSON.parse(resultText);

      const total = result.promoters + result.passives + result.detractors;
      const score = total > 0 ? Math.round(((result.promoters - result.detractors) / total) * 100) : 0;

      setNpsResult({
        promoters: result.promoters,
        passives: result.passives,
        detractors: result.detractors,
        total,
        score
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to calculate NPS.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            NPS Calculator
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Upload survey data to automatically calculate your Net Promoter Score.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Upload Data</label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <Upload className="w-3 h-3" /> Choose File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".txt,.csv,.md"
            />
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste NPS scores (e.g., 9, 8, 10, 5, 7...) or upload a file containing the data."
            className="w-full h-32 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm"
          />
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
            Please do not upload or enter Personally Identifiable Information (PII). The system will automatically strip common PII formats before processing.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={isCalculating || !inputText.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isCalculating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Calculate NPS</>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                How NPS Works
              </h4>
            </div>
            
            <div className="flex rounded-lg overflow-hidden h-8 mb-4">
              <div className="bg-rose-500 flex-1 flex items-center justify-center text-white text-xs font-bold" style={{flex: 7}}>
                0-6
              </div>
              <div className="bg-amber-500 flex-1 flex items-center justify-center text-white text-xs font-bold" style={{flex: 2}}>
                7-8
              </div>
              <div className="bg-emerald-500 flex-1 flex items-center justify-center text-white text-xs font-bold" style={{flex: 2}}>
                9-10
              </div>
            </div>
            
            <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-300">
              <div className="text-center w-1/3">
                <span className="block text-rose-600 font-bold mb-1">Detractors</span>
                Unhappy customers who can damage your brand.
              </div>
              <div className="text-center w-1/3 px-2">
                <span className="block text-amber-600 font-bold mb-1">Passives</span>
                Satisfied but unenthusiastic customers.
              </div>
              <div className="text-center w-1/3">
                <span className="block text-emerald-600 font-bold mb-1">Promoters</span>
                Loyal enthusiasts who will keep buying.
              </div>
            </div>
          </div>

          {npsResult && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Your Result</h4>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Responses: {npsResult.total}</div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className={`text-5xl font-black ${
                    npsResult.score >= 50 ? 'text-emerald-600' : 
                    npsResult.score >= 0 ? 'text-amber-500' : 'text-rose-600'
                  }`}>
                    {npsResult.score > 0 ? '+' : ''}{npsResult.score}
                  </div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">NPS Score</div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-emerald-600">Promoters ({npsResult.promoters})</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{npsResult.total > 0 ? Math.round((npsResult.promoters / npsResult.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${npsResult.total > 0 ? (npsResult.promoters / npsResult.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-amber-500">Passives ({npsResult.passives})</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{npsResult.total > 0 ? Math.round((npsResult.passives / npsResult.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                      <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${npsResult.total > 0 ? (npsResult.passives / npsResult.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-rose-600">Detractors ({npsResult.detractors})</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{npsResult.total > 0 ? Math.round((npsResult.detractors / npsResult.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${npsResult.total > 0 ? (npsResult.detractors / npsResult.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
