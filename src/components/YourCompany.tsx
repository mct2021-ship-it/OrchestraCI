import React, { useState, useEffect } from 'react';
import { Building2, Upload, X, CheckCircle2, AlertCircle, Globe, Sparkles, Plus, Trash2, FileText, Download, History, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { ThinkingLevel, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import { stripPIData } from '../lib/piStripper';

export interface AnalysisReport {
  id: string;
  date: string;
  content: string;
  type?: string;
  result?: string;
}

export interface CompanyProfile {
  name: string;
  logoUrl?: string;
  websiteUrl?: string;
  vertical: string;
  description: string;
  customerBenefits: string;
  targetEmotions: string[];
  measurementMethods: string[];
  goals?: string[];
  competitors?: { name: string; url: string }[];
  pastAnalyses?: AnalysisReport[];
  wizardCompleted?: boolean;
}

interface YourCompanyProps {
  profile: CompanyProfile;
  onUpdateProfile: (updates: Partial<CompanyProfile>) => void;
  startInEditMode?: boolean;
  onSaveComplete?: () => void;
}

const VERTICALS = [
  'SaaS',
  'E-commerce',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Media',
  'Travel',
  'Other'
];

const EMOTIONS = [
  'Happy', 'Trusting', 'Excited', 'Relieved', 'Confident', 
  'Empowered', 'Valued', 'Understood', 'Safe', 'Inspired'
];

const MEASUREMENTS = [
  'NPS (Net Promoter Score)',
  'CSAT (Customer Satisfaction)',
  'CES (Customer Effort Score)',
  'Churn Rate',
  'Retention Rate',
  'LTV (Lifetime Value)',
  'User Interviews',
  'Support Ticket Analysis'
];

export function YourCompany({ profile, onUpdateProfile, startInEditMode, onSaveComplete }: YourCompanyProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [wizardStep, setWizardStep] = useState<number | null>(null);
  const [tempProfile, setTempProfile] = useState<CompanyProfile>(profile);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoUrl || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompetitorAnalyzing, setIsCompetitorAnalyzing] = useState(false);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [customEmotion, setCustomEmotion] = useState('');
  const [customMeasurement, setCustomMeasurement] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  useEffect(() => {
    setTempProfile(profile);
    setLogoPreview(profile.logoUrl || null);
  }, [profile]);

  useEffect(() => {
    if (startInEditMode) {
      if (profile.wizardCompleted) {
        setIsEditing(true);
        setWizardStep(null);
      } else {
        setIsEditing(true);
        setWizardStep(1);
      }
    }
  }, [startInEditMode, profile.wizardCompleted]);

  const handleStartWizard = () => {
    if (profile.wizardCompleted) {
      setIsEditing(true);
      setWizardStep(null);
    } else {
      setIsEditing(true);
      setWizardStep(1);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 512;
          const MAX_HEIGHT = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64String = canvas.toDataURL('image/png'); // Use PNG for logos to preserve transparency
            setLogoPreview(base64String);
            setTempProfile(prev => ({ ...prev, logoUrl: base64String }));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateProfile({ ...tempProfile, wizardCompleted: true });
    setIsEditing(false);
    if (onSaveComplete) {
      onSaveComplete();
    }
  };

  const addGoal = () => {
    if (customGoal && !tempProfile.goals?.includes(customGoal)) {
      setTempProfile(prev => ({
        ...prev,
        goals: [...(prev.goals || []), customGoal]
      }));
      setCustomGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setTempProfile(prev => ({
      ...prev,
      goals: (prev.goals || []).filter(g => g !== goal)
    }));
  };

  const toggleEmotion = (emotion: string) => {
    const current = tempProfile.targetEmotions || [];
    const updated = current.includes(emotion)
      ? current.filter(e => e !== emotion)
      : [...current, emotion];
    setTempProfile(prev => ({ ...prev, targetEmotions: updated }));
  };

  const addCustomEmotion = () => {
    if (customEmotion && !tempProfile.targetEmotions?.includes(customEmotion)) {
      setTempProfile(prev => ({
        ...prev,
        targetEmotions: [...(prev.targetEmotions || []), customEmotion]
      }));
      setCustomEmotion('');
    }
  };

  const toggleMeasurement = (method: string) => {
    const current = tempProfile.measurementMethods || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    setTempProfile(prev => ({ ...prev, measurementMethods: updated }));
  };

  const addCustomMeasurement = () => {
    if (customMeasurement && !tempProfile.measurementMethods?.includes(customMeasurement)) {
      setTempProfile(prev => ({
        ...prev,
        measurementMethods: [...(prev.measurementMethods || []), customMeasurement]
      }));
      setCustomMeasurement('');
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!tempProfile.websiteUrl) return;
    
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        throw new Error("Gemini API key is required. Please select one in the settings in AI Studio, or ensure the GEMINI_API_KEY environment variable is set if running standalone.");
      }

      const prompt = `Analyze the company at this URL: ${stripPIData(tempProfile.websiteUrl)}. 
      Provide a JSON object with the following fields:
      - description: A concise description of what the company does (max 3 sentences).
      - customerBenefits: Key benefits customers get from this company (max 3 sentences).
      - vertical: The industry vertical this company belongs to.
      - goals: A list of 3-5 strategic customer experience goals for this company based on their mission and services.
      
      If the vertical is not one of these: ${VERTICALS.join(', ')}, provide a new suitable vertical name.`;

      const ai = await getGeminiClient();
      if (!ai) throw new Error("Failed to initialize Gemini AI client");

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "A concise description of what the company does (max 3 sentences)." },
              customerBenefits: { type: Type.STRING, description: "Key benefits customers get from this company (max 3 sentences)." },
              vertical: { type: Type.STRING, description: "The industry vertical this company belongs to." },
              goals: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "A list of 3-5 strategic customer experience goals."
              }
            },
            required: ["description", "customerBenefits", "vertical", "goals"]
          },
          tools: [{ googleSearch: {} }]
        }
      });
      
      const response = result;
      const text = response.text;
      
      if (!text) {
        throw new Error("No text returned from AI");
      }

      const data = JSON.parse(text);
      setTempProfile(prev => ({
        ...prev,
        description: data.description || prev.description,
        customerBenefits: data.customerBenefits || prev.customerBenefits,
        vertical: data.vertical || prev.vertical,
        goals: data.goals || prev.goals
      }));
      
      if (wizardStep === 6) {
        setWizardStep(7);
      }
    } catch (error: any) {
      console.error("Error analyzing website:", error);
      setAiError(error.message || "Failed to analyze website");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addCompetitor = () => {
    setTempProfile(prev => ({
      ...prev,
      competitors: [...(prev.competitors || []), { name: '', url: '' }]
    }));
  };

  const removeCompetitor = (index: number) => {
    setTempProfile(prev => ({
      ...prev,
      competitors: (prev.competitors || []).filter((_, i) => i !== index)
    }));
  };

  const updateCompetitor = (index: number, field: 'name' | 'url', value: string) => {
    setTempProfile(prev => {
      const updated = [...(prev.competitors || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, competitors: updated };
    });
  };

  const handleRunCompetitorAnalysis = async () => {
    if (!profile.competitors || profile.competitors.length === 0) return;

    setIsCompetitorAnalyzing(true);
    setAiError(null);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        throw new Error("Gemini API key is required. Please select one in the settings in AI Studio, or ensure the GEMINI_API_KEY environment variable is set if running standalone.");
      }

      const prompt = `Perform a competitor analysis for ${stripPIData(profile.name)} (${stripPIData(profile.websiteUrl || '')}) against the following competitors:
      ${profile.competitors.map(c => `- ${stripPIData(c.name)} (${stripPIData(c.url)})`).join('\n')}
      
      Provide a detailed analysis including:
      1. Market Positioning Comparison
      2. Strengths and Weaknesses relative to competitors
      3. Key Differentiators
      4. Strategic Recommendations
      
      Format the output as clear, structured markdown.`;

      const ai = await getGeminiClient();
      if (!ai) throw new Error("Failed to initialize Gemini AI client");

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      if (!result.text) {
        throw new Error("No text returned from AI");
      }

      setCompetitorAnalysis(result.text);

      const newReport: AnalysisReport = {
        id: uuidv4(),
        date: new Date().toISOString(),
        content: result.text,
        type: 'Competitor Analysis'
      };
      const updatedAnalyses = [newReport, ...(profile.pastAnalyses || [])];
      onUpdateProfile({ pastAnalyses: updatedAnalyses });
    } catch (error: any) {
      console.error("Error running competitor analysis:", error);
      setAiError(error.message || "Failed to run competitor analysis");
    } finally {
      setIsCompetitorAnalyzing(false);
    }
  };

  const handleSaveAnalysisAsPDF = () => {
    if (!competitorAnalysis) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(`Competitor Analysis: ${profile.name}`, 20, 20);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Content
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(competitorAnalysis.replace(/\*\*/g, ''), 170); // Simple markdown strip
    doc.text(splitText, 20, 40);
    
    doc.save(`${profile.name.replace(/\s+/g, '_')}_Competitor_Analysis.pdf`);
  };

  if (isEditing && wizardStep !== null) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 border border-zinc-200 dark:border-zinc-800 relative"
        >
          <button 
            onClick={() => {
              setIsEditing(false);
              setWizardStep(null);
            }}
            className="absolute top-8 right-8 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Company Setup</h3>
                <p className="text-zinc-500 text-sm">Step {wizardStep} of 7</p>
              </div>
            </div>

            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-indigo-600 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${(wizardStep / 7) * 100}%` }}
              />
            </div>

            <AnimatePresence mode="wait">
              {wizardStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Upload your logo</h4>
                    <p className="text-zinc-500">Make your profile recognizable with your brand logo.</p>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-40 h-40 rounded-3xl bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden relative group shadow-inner">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4" />
                      ) : (
                        <Upload className="w-12 h-12 text-zinc-300" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <button 
                      onClick={() => setWizardStep(2)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Continue
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setWizardStep(null);
                      }}
                      className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold transition-colors"
                    >
                      Skip to manual edit
                    </button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">What's your company name?</h4>
                    <p className="text-zinc-500">Enter the official name of your organization.</p>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      autoFocus
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg text-zinc-900 dark:text-white text-center"
                      placeholder="e.g. Acme Corp"
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setWizardStep(1)}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => setWizardStep(3)}
                        disabled={!tempProfile.name}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setWizardStep(null);
                      }}
                      className="w-full text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold transition-colors"
                    >
                      Skip to manual edit
                    </button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Your website address</h4>
                    <p className="text-zinc-500">We'll use this to help AI understand your business.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="url"
                        autoFocus
                        value={tempProfile.websiteUrl || ''}
                        onChange={(e) => setTempProfile({ ...tempProfile, websiteUrl: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg text-zinc-900 dark:text-white"
                        placeholder="https://www.acme.com"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setWizardStep(2)}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => setWizardStep(4)}
                        disabled={!tempProfile.websiteUrl}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setWizardStep(null);
                      }}
                      className="w-full text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold transition-colors"
                    >
                      Skip to manual edit
                    </button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Target Customer Emotions</h4>
                    <p className="text-zinc-500">How do you want your customers to feel when interacting with your brand?</p>
                  </div>
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {EMOTIONS.map(emotion => (
                        <button
                          key={emotion}
                          onClick={() => toggleEmotion(emotion)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                            (tempProfile.targetEmotions || []).includes(emotion)
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300"
                          )}
                        >
                          {emotion}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setWizardStep(3)}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => setWizardStep(5)}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {wizardStep === 5 && (
                <motion.div 
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Measurement Methods</h4>
                    <p className="text-zinc-500">How do you currently measure the customer experience?</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MEASUREMENTS.map(method => (
                        <button
                          key={method}
                          onClick={() => toggleMeasurement(method)}
                          className={cn(
                            "p-4 rounded-xl text-sm font-bold transition-all border text-left flex items-center gap-3",
                            (tempProfile.measurementMethods || []).includes(method)
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-emerald-300"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                            (tempProfile.measurementMethods || []).includes(method)
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-zinc-300 dark:border-zinc-600"
                          )}>
                            {(tempProfile.measurementMethods || []).includes(method) && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          {method}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setWizardStep(4)}
                        className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => setWizardStep(6)}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {wizardStep === 6 && (
                <motion.div 
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">AI Analysis</h4>
                    <p className="text-zinc-500">Let our AI analyze your website to automatically generate your company vertical, description, benefits, and goals.</p>
                  </div>
                  
                  <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-3xl flex items-center justify-center shadow-xl">
                      <Sparkles className={cn("w-10 h-10 text-indigo-600", isAnalyzing && "animate-pulse")} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-zinc-900 dark:text-white">Ready to analyze</p>
                      <p className="text-sm text-zinc-500">{tempProfile.websiteUrl}</p>
                    </div>
                    <button 
                      onClick={handleAnalyzeWebsite}
                      disabled={isAnalyzing}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Run AI Analysis
                        </>
                      )}
                    </button>
                    {aiError && (
                      <p className="text-xs text-rose-500 font-medium text-center">{aiError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setWizardStep(5)}
                      className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setWizardStep(7)}
                      className="flex-[2] py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      Skip and enter manually
                    </button>
                  </div>
                </motion.div>
              )}

              {wizardStep === 7 && (
                <motion.div 
                  key="step7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">Review & Complete</h4>
                    <p className="text-zinc-500">Review the generated profile and make any final adjustments.</p>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Vertical</label>
                      <input
                        type="text"
                        value={tempProfile.vertical}
                        onChange={(e) => setTempProfile({ ...tempProfile, vertical: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                      <textarea
                        value={tempProfile.description}
                        onChange={(e) => setTempProfile({ ...tempProfile, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-700 dark:text-zinc-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Goals</label>
                      <div className="space-y-2">
                        {(tempProfile.goals || []).map((goal, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={goal}
                              onChange={(e) => {
                                const newGoals = [...(tempProfile.goals || [])];
                                newGoals[i] = e.target.value;
                                setTempProfile({ ...tempProfile, goals: newGoals });
                              }}
                              className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                            />
                            <button onClick={() => removeGoal(goal)} className="text-zinc-400 hover:text-rose-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setWizardStep(null); // Go to full edit mode
                      }}
                      className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                    >
                      Advanced Edit
                    </button>
                    <button 
                      onClick={() => {
                        handleSave();
                        setWizardStep(null);
                      }}
                      className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Finish Setup
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Edit Company Profile
            </h3>
            <div className="flex items-center gap-3">
              {aiError && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {aiError}
                </div>
              )}
              <button
                onClick={() => {
                  setTempProfile(profile);
                  setLogoPreview(profile.logoUrl || null);
                  setIsEditing(false);
                  setAiError(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-500 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Company Logo</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden relative group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-zinc-400" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-xs text-white font-bold">Change</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <p>Upload your company logo.</p>
                    <p className="text-xs mt-1">Recommended size: 512x512px</p>
                  </div>
                </div>
              </div>

              {/* Company Name & Website */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Company Name</label>
                  <input
                    type="text"
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    placeholder="Enter company name..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Website URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={tempProfile.websiteUrl || ''}
                      onChange={(e) => setTempProfile({ ...tempProfile, websiteUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                      placeholder="https://example.com"
                    />
                    <button
                      onClick={handleAnalyzeWebsite}
                      disabled={!tempProfile.websiteUrl || isAnalyzing}
                      className="px-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                      title="Auto-fill with AI"
                    >
                      {isAnalyzing ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Vertical */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Industry Vertical</label>
                <div className="relative">
                  <input
                    list="verticals-list"
                    value={tempProfile.vertical}
                    onChange={(e) => setTempProfile({ ...tempProfile, vertical: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    placeholder="Select or enter vertical..."
                  />
                  <datalist id="verticals-list">
                    {VERTICALS.map(v => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">What does the company do?</label>
                <textarea
                  value={tempProfile.description}
                  onChange={(e) => setTempProfile({ ...tempProfile, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-300 resize-none"
                  placeholder="Describe your business..."
                />
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Customer Benefits</label>
                <textarea
                  value={tempProfile.customerBenefits}
                  onChange={(e) => setTempProfile({ ...tempProfile, customerBenefits: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-300 resize-none"
                  placeholder="What value do customers get?"
                />
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Goals</label>
                <div className="space-y-3">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(tempProfile.goals || []).map((goal, index) => (
                      <li key={index} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <input
                          type="text"
                          value={goal}
                          onChange={(e) => {
                            const newGoals = [...(tempProfile.goals || [])];
                            newGoals[index] = e.target.value;
                            setTempProfile({ ...tempProfile, goals: newGoals });
                          }}
                          className="text-sm font-medium flex-1 bg-transparent outline-none border-none p-0 focus:ring-0"
                        />
                        <button
                          onClick={() => removeGoal(goal)}
                          className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="e.g., Increase sales, Reduce effort..."
                      className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addGoal();
                        }
                      }}
                    />
                    <button
                      onClick={addGoal}
                      disabled={!customGoal}
                      className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Target Emotions */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Target Customer Emotions</label>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map(emotion => (
                    <button
                      key={emotion}
                      onClick={() => toggleEmotion(emotion)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                        (tempProfile.targetEmotions || []).includes(emotion)
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                      )}
                    >
                      {emotion}
                    </button>
                  ))}
                  {/* Display custom emotions that are not in the predefined list */}
                  {(tempProfile.targetEmotions || [])
                    .filter(e => !EMOTIONS.includes(e))
                    .map(emotion => (
                      <button
                        key={emotion}
                        onClick={() => toggleEmotion(emotion)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                      >
                        {emotion}
                      </button>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customEmotion}
                    onChange={(e) => setCustomEmotion(e.target.value)}
                    placeholder="Add custom emotion..."
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomEmotion();
                      }
                    }}
                  />
                  <button
                    onClick={addCustomEmotion}
                    disabled={!customEmotion}
                    className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Measurement Methods */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">How do you measure experience?</label>
                <div className="space-y-2">
                  {MEASUREMENTS.map(method => (
                    <label key={method} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        (tempProfile.measurementMethods || []).includes(method)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                      )}>
                        {(tempProfile.measurementMethods || []).includes(method) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={(tempProfile.measurementMethods || []).includes(method)}
                        onChange={() => toggleMeasurement(method)}
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{method}</span>
                    </label>
                  ))}
                  {/* Display custom measurements */}
                  {(tempProfile.measurementMethods || [])
                    .filter(m => !MEASUREMENTS.includes(m))
                    .map(method => (
                      <label key={method} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                        <div className="w-5 h-5 rounded border flex items-center justify-center transition-colors bg-indigo-600 border-indigo-600 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={true}
                          onChange={() => toggleMeasurement(method)}
                        />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{method}</span>
                      </label>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMeasurement}
                    onChange={(e) => setCustomMeasurement(e.target.value)}
                    placeholder="Add custom measurement..."
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomMeasurement();
                      }
                    }}
                  />
                  <button
                    onClick={addCustomMeasurement}
                    disabled={!customMeasurement}
                    className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Competitors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Key Competitors</label>
                  <button 
                    onClick={addCompetitor}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Competitor
                  </button>
                </div>
                <div className="space-y-3">
                  {(tempProfile.competitors || []).map((competitor, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={competitor.name}
                        onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                        placeholder="Competitor Name"
                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <input
                        type="url"
                        value={competitor.url}
                        onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                        placeholder="Website URL"
                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button 
                        onClick={() => removeCompetitor(index)}
                        className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(tempProfile.competitors || []).length === 0 && (
                    <p className="text-sm text-zinc-400 italic">No competitors added yet.</p>
                  )}
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800/50 flex gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    When you save your company profile, our AI can provide a competitor analysis based on the competitors you list here.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                setTempProfile(profile);
                setLogoPreview(profile.logoUrl || null);
                setIsEditing(false);
                setAiError(null);
              }}
              className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-500 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-10 h-10 text-zinc-300" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{profile.name || 'Your Company'}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {profile.vertical || 'Industry Not Set'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleStartWizard}
            className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
          >
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">About The Company</h4>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {profile.description || <span className="text-zinc-400 italic">No description provided yet.</span>}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Customer Benefits</h4>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {profile.customerBenefits || <span className="text-zinc-400 italic">No benefits listed yet.</span>}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Key Competitors</h4>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Manage
                </button>
              </div>
              <div className="space-y-2">
                {(profile.competitors || []).length > 0 ? (
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {profile.competitors!.map((comp, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <Globe className="w-4 h-4 text-zinc-400" />
                          <span className="font-medium">{comp.name}</span>
                          <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[200px]">
                            {comp.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleRunCompetitorAnalysis}
                      disabled={isCompetitorAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                    >
                      {isCompetitorAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Run Competitor Analysis
                        </>
                      )}
                    </button>
                    {aiError && (
                      <div className="mt-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {aiError}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-zinc-400 italic text-sm">No competitors listed.</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Goals</h4>
              {(profile.goals || []).length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.goals!.map((goal, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/50 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span className="text-sm font-medium flex-1">{goal}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-zinc-400 italic text-sm">No goals listed yet.</span>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Target Emotions</h4>
              <div className="flex flex-wrap gap-2">
                {(profile.targetEmotions || []).length > 0 ? (
                  profile.targetEmotions.map(emotion => (
                    <span key={emotion} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-800">
                      {emotion}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-400 italic text-sm">No target emotions selected.</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Measurement Methods</h4>
              <div className="flex flex-wrap gap-2">
                {(profile.measurementMethods || []).length > 0 ? (
                  profile.measurementMethods.map(method => (
                    <span key={method} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium border border-emerald-100 dark:border-emerald-800">
                      {method}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-400 italic text-sm">No measurement methods selected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {competitorAnalysis && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              Competitor Analysis Results
            </h3>
            <button
              onClick={handleSaveAnalysisAsPDF}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Save as PDF
            </button>
          </div>
          <div className="prose dark:prose-invert max-w-none prose-indigo prose-headings:font-bold prose-h3:text-indigo-600 dark:prose-h3:text-indigo-400 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-li:text-zinc-700 dark:prose-li:text-zinc-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {competitorAnalysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Past Analyses Table */}
      {(profile.pastAnalyses || []).length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
           <div className="flex items-center gap-3 mb-6">
             <History className="w-6 h-6 text-indigo-600" />
             <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Analysis History</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead>
                 <tr className="border-b border-zinc-200 dark:border-zinc-800">
                   <th className="pb-3 pl-4 font-bold text-zinc-500 dark:text-zinc-400">Date</th>
                   <th className="pb-3 font-bold text-zinc-500 dark:text-zinc-400">Preview</th>
                   <th className="pb-3 pr-4 font-bold text-zinc-500 dark:text-zinc-400 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {profile.pastAnalyses?.map((analysis) => (
                   <tr key={analysis.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                     <td className="py-4 pl-4 text-zinc-900 dark:text-white font-medium whitespace-nowrap">
                       {new Date(analysis.date).toLocaleDateString()} <span className="text-zinc-400 text-xs ml-1">{new Date(analysis.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     </td>
                     <td className="py-4 text-zinc-500 dark:text-zinc-400 max-w-md truncate">
                       {analysis.content.replace(/[#*`]/g, '').substring(0, 100)}...
                     </td>
                     <td className="py-4 pr-4 text-right">
                       <button 
                         onClick={() => {
                           setCompetitorAnalysis(analysis.content);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         }}
                         className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                       >
                         View Report <ChevronRight className="w-3 h-3" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-lg shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">AI Context Awareness</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
            The information provided here is used by the platform's AI to better understand your business context. 
            This helps generate more relevant persona insights, journey map suggestions, and strategic recommendations across the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
