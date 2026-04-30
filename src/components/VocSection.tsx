import React, { useState, useRef } from 'react';
import { Upload, MessageSquare, Loader2, AlertCircle, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { Type, ThinkingLevel } from '@google/genai';
import { stripPIData } from '../lib/piStripper';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Markdown from 'react-markdown';
import { PromptModal } from './PromptModal';

interface VocDataPoint {
  id: string;
  month: string;
  satisfaction: number;
  insights: string;
}

export function VocSection() {
  const [vocData, setVocData] = useState<VocDataPoint[]>([
    { id: '1', month: 'Jan', satisfaction: 72, insights: '- Users requested better onboarding.\n- Pricing is confusing.' },
    { id: '2', month: 'Feb', satisfaction: 78, insights: '- Onboarding improvements helped.\n- Still some bugs in mobile app.' },
    { id: '3', month: 'Mar', satisfaction: 82, insights: '- Positive feedback on new dashboard.\n- Requests for more integrations.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Apr');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState<'trustpilot' | 'google' | 'hubspot' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTrustpilotPrompt, setShowTrustpilotPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleSyncSource = async (source: 'trustpilot' | 'google' | 'hubspot') => {
    if (source === 'trustpilot') {
      setShowTrustpilotPrompt(true);
      return;
    }
    
    await executeSync(source);
  };

  const executeSync = async (source: 'trustpilot' | 'google' | 'hubspot', domain?: string) => {
    setIsSyncing(true);
    setSyncSource(source);
    setError(null);
    try {
      let endpoint = source === 'hubspot' ? '/api/hubspot/tickets' : `/api/${source}/reviews`;
      
      if (source === 'trustpilot' && domain) {
        endpoint += `?domain=${encodeURIComponent(domain)}`;
      }

      const response = await fetch(endpoint);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returned an unexpected response format. Please check if the API route is correctly configured.`);
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to sync with ${source}`);
      }
      const data = await response.json();
      
      const items = source === 'hubspot' ? data.tickets : data.reviews;
      if (!items || items.length === 0) {
        setError(`No data found on ${source}.`);
        return;
      }

      // Combine text for analysis
      const combinedText = items.map((item: any) => {
        if (source === 'hubspot') return `Ticket: ${item.subject} - ${item.content}`;
        return `${item.stars || item.rating} stars: ${item.text}`;
      }).join('\n\n');
      
      setInputText(combinedText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to sync ${source} data.`);
    } finally {
      setIsSyncing(false);
      setSyncSource(null);
    }
  };

  const handleUseDemoData = () => {
    let demoText = '';
    if (syncSource === 'google') {
      demoText = [
        "5 stars: The customer service at the store was exceptional. They helped me find exactly what I needed.",
        "3 stars: The product is good, but the wait time for pickup was longer than expected.",
        "5 stars: Best experience ever! The staff is friendly and the atmosphere is great.",
        "2 stars: I found the store layout very confusing and hard to navigate.",
        "4 stars: Solid service and quality products. Will definitely come back."
      ].join('\n\n');
    } else if (syncSource === 'hubspot') {
      demoText = [
        "Ticket: Login Issue - User unable to access dashboard after password reset.",
        "Ticket: Feature Request - Requesting bulk export for analytics data.",
        "Ticket: Billing Query - Question about the new enterprise pricing tier.",
        "Ticket: Slow Performance - Dashboard taking > 5s to load for some users.",
        "Ticket: Integration Error - Salesforce sync failing for specific accounts."
      ].join('\n\n');
    } else {
      demoText = [
        "5 stars: Absolutely love the journey mapping feature! It's so intuitive and saved us hours.",
        "2 stars: The mobile app is quite buggy and slow to load on Android devices.",
        "4 stars: Great tool for VOC analysis, but I would like more export options for the reports.",
        "1 star: Customer support took 3 days to respond to my ticket about account access.",
        "5 stars: The AI suggestions are surprisingly accurate and helped us identify a major bottleneck in our checkout."
      ].join('\n\n');
    }
    setInputText(demoText);
    setError(null);
  };

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

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please provide some VOC data to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        throw new Error("Gemini API key is required. Please select one in the settings in AI Studio, or ensure the GEMINI_API_KEY environment variable is set if running standalone.");
      }

      const ai = await getGeminiClient();
      if (!ai) throw new Error("Failed to initialize Gemini AI client");

      const response = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: `Analyze the following Voice of Customer data for the month of ${selectedMonth}. 
        1. Determine an overall satisfaction score from 0 to 100 based on the sentiment.
        2. Provide 2-3 concise bullet points of suggestions or key insights.
        
        VOC Data:
        ${stripPIData(inputText)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              satisfaction: {
                type: Type.NUMBER,
                description: "Overall satisfaction score from 0 to 100",
              },
              insights: {
                type: Type.STRING,
                description: "2-3 concise bullet points of suggestions or key insights, formatted as a markdown list",
              },
            },
            required: ["satisfaction", "insights"],
          },
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("No response from AI.");
      
      const result = JSON.parse(resultText);

      const newDataPoint: VocDataPoint = {
        id: Date.now().toString(),
        month: selectedMonth,
        satisfaction: result.satisfaction,
        insights: result.insights,
      };

      // Replace if month already exists, else append
      setVocData(prev => {
        const existingIndex = prev.findIndex(d => d.month === selectedMonth);
        if (existingIndex >= 0) {
          const newArray = [...prev];
          newArray[existingIndex] = newDataPoint;
          return newArray;
        }
        return [...prev, newDataPoint];
      });

      setInputText('');
      
      // Auto-select next month
      const currentIndex = months.indexOf(selectedMonth);
      if (currentIndex >= 0 && currentIndex < 11) {
        setSelectedMonth(months[currentIndex + 1]);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze VOC data.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Voice of Customer (VOC) Analysis
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Upload monthly feedback to track satisfaction and get AI suggestions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Month</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Source</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  <Upload className="w-4 h-4" /> File
                </button>
                <button 
                  onClick={() => handleSyncSource('trustpilot')}
                  disabled={isSyncing}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 transition-colors disabled:opacity-50"
                  title="Sync Trustpilot Reviews"
                >
                  {isSyncing && syncSource === 'trustpilot' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  TP
                </button>
                <button 
                  onClick={() => handleSyncSource('google')}
                  disabled={isSyncing}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 transition-colors disabled:opacity-50"
                  title="Sync Google Reviews"
                >
                  {isSyncing && syncSource === 'google' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Google
                </button>
                <button 
                  onClick={() => handleSyncSource('hubspot')}
                  disabled={isSyncing}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 transition-colors disabled:opacity-50"
                  title="Sync HubSpot Tickets"
                >
                  {isSyncing && syncSource === 'hubspot' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  HubSpot
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".txt,.csv,.md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Or Paste Data</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste customer feedback, survey responses, etc..."
              className="w-full h-32 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
            />
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Please do not upload or enter Personally Identifiable Information (PII). The system will automatically strip common PII formats before processing.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex flex-col gap-2 text-rose-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {error.includes('configuration missing') && (
                <button 
                  onClick={handleUseDemoData}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-left ml-6"
                >
                  Try with Demo Data instead →
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Analyze & Add to Chart</>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="h-48">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-4">Satisfaction Over Time</h4>
            {vocData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vocData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#71717A', fontSize: 12}} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#71717A', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: '1px solid #E4E4E7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="satisfaction" stroke="#4F46E5" strokeWidth={3} dot={{r: 4, fill: '#4F46E5'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                No data available yet.
              </div>
            )}
          </div>

          {vocData.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-100">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Latest Insights ({vocData[vocData.length - 1].month})
              </h4>
              <div className="text-sm text-zinc-600 dark:text-zinc-300 prose prose-sm prose-indigo">
                <Markdown>{vocData[vocData.length - 1].insights}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <PromptModal
        isOpen={showTrustpilotPrompt}
        title="Trustpilot Sync"
        message="Enter the website domain to fetch reviews for (e.g., apple.com):"
        placeholder="example.com"
        confirmLabel="Sync Reviews"
        onConfirm={(domain) => {
          setShowTrustpilotPrompt(false);
          executeSync('trustpilot', domain).catch(err => console.error('Trustpilot sync failed:', err));
        }}
        onCancel={() => setShowTrustpilotPrompt(false)}
      />
    </div>
  );
}
