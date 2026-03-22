import React, { useState, useRef } from 'react';
import { X, Wand2, Upload, Loader2, AlertCircle, Sparkles, FileText, MessageSquare } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { JourneyMap } from '../types';
import Markdown from 'react-markdown';

interface JourneyAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  journey: JourneyMap;
}

export function JourneyAiAssistant({ isOpen, onClose, journey }: JourneyAiAssistantProps) {
  const [activeTab, setActiveTab] = useState<'analyze' | 'voc'>('analyze');
  const [vocText, setVocText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setVocText(event.target?.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleAnalyzeJourney = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing.");

      const ai = new GoogleGenAI({ apiKey });
      const journeyData = JSON.stringify(journey, null, 2);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert Customer Experience (CX) and Sustainability designer. Analyze the following Journey Map and suggest experience improvements, highlight potential friction points, and identify missing opportunities.
        
        Additionally, if carbon footprint data is present in the journey stages, provide specific suggestions for reducing the carbon impact of the journey without compromising the customer experience.
        
        Journey Map Data:
        ${journeyData}
        
        Provide your analysis in Markdown format. Be concise and actionable. Include a dedicated section for "Sustainability & Carbon Optimization" if applicable.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      setResult(response.text || 'No suggestions generated.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze journey map.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeVoc = async () => {
    if (!vocText.trim()) {
      setError('Please provide some VOC data or upload a document.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing.");

      const ai = new GoogleGenAI({ apiKey });
      const journeyData = JSON.stringify(journey, null, 2);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert Customer Experience (CX) designer. Analyze the following Voice of Customer (VOC) data in the context of the provided Journey Map.
        
        Identify which stages of the journey the feedback relates to, highlight key pain points mentioned by customers, and suggest specific improvements to the journey map.
        
        Journey Map Data:
        ${journeyData}
        
        VOC Data:
        ${vocText}
        
        Provide your analysis in Markdown format. Be concise and actionable.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      setResult(response.text || 'No analysis generated.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze VOC data.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">AI Assistant</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Analyze & Improve Journey</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'analyze' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Analyze Map
          </button>
          <button
            onClick={() => setActiveTab('voc')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'voc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Analyze VOC
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {activeTab === 'analyze' && !result && !isGenerating && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-900">
                <p>Ask the AI to review your current journey map. It will look for:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-indigo-700">
                  <li>Missing touchpoints or stages</li>
                  <li>Inconsistencies in emotion vs. friction</li>
                  <li>Opportunities for innovation</li>
                  <li>Alignment with best practices</li>
                </ul>
              </div>
              <button
                onClick={handleAnalyzeJourney}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Sparkles className="w-5 h-5" />
                Generate Insights
              </button>
            </div>
          )}

          {activeTab === 'voc' && !result && !isGenerating && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-900">
                <p>Upload Voice of Customer (VOC) data like survey responses, support tickets, or interview transcripts. The AI will map this feedback to your journey stages.</p>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  file ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".txt,.md,.csv"
                />
                <Upload className={`w-8 h-8 mx-auto mb-3 ${file ? 'text-indigo-600' : 'text-zinc-300'}`} />
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">
                  {file ? file.name : 'Upload VOC Data'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Support for .txt, .md, .csv
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 top-0 flex items-center justify-center -translate-y-1/2">
                  <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Or Paste Text</span>
                </div>
                <textarea
                  value={vocText}
                  onChange={(e) => setVocText(e.target.value)}
                  placeholder="Paste customer feedback here..."
                  className="w-full h-32 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-sm"
                />
              </div>

              <button
                onClick={handleAnalyzeVoc}
                disabled={!vocText.trim()}
                className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <MessageSquare className="w-5 h-5" />
                Analyze Feedback
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Analyzing journey data...</p>
            </div>
          )}

          {result && !isGenerating && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 dark:text-white">AI Insights</h4>
                <button 
                  onClick={() => setResult(null)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Clear Results
                </button>
              </div>
              <div className="prose prose-sm prose-indigo max-w-none bg-zinc-50 dark:bg-zinc-900 p-5 rounded-xl border border-zinc-100">
                <div className="markdown-body">
                  <Markdown>{result}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
