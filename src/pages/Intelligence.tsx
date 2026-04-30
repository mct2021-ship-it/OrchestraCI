import React, { useState } from 'react';
import { BrainCircuit, Upload, FileText, MessageSquare, BarChart3, Sparkles, Database, ArrowRight, CheckCircle2, Building2, Target, Gauge, Heart, Trash2, Star, RefreshCw, Loader2, Plus, AlertCircle, Layers, Tag, Filter, Search, Users } from 'lucide-react';
import { IntelligenceSignal, Product, Service, Persona, Project, JourneyMap, Task, Sprint } from '../types';
import { motion } from 'motion/react';
import { VocSection } from '../components/VocSection';
import { NpsCalculator } from '../components/NpsCalculator';
import { IntelligenceHub } from '../components/ReviewIntelligence';
import { YourCompany, CompanyProfile } from '../components/YourCompany';
import { cn, scrollToTop } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';
import { useToast } from '../context/ToastContext';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { Type } from '@google/genai';
import { AnimatePresence } from 'motion/react';

interface IntelligenceProps {
  companyProfile?: CompanyProfile;
  onUpdateProfile?: (updates: Partial<CompanyProfile>) => void;
  startInEditMode?: boolean;
  onSaveComplete?: () => void;
  initialTab?: 'profile' | 'overview' | 'reviews' | 'connectors';
  // State setters for Review Intelligence integration
  personas?: Persona[];
  journeys?: JourneyMap[];
  setPersonas?: React.Dispatch<React.SetStateAction<Persona[]>>;
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
  setJourneys?: React.Dispatch<React.SetStateAction<JourneyMap[]>>;
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  setSprints?: React.Dispatch<React.SetStateAction<Sprint[]>>;
  currentUser?: any;
  onNavigate?: (tab: string, subTab?: string) => void;
  setActiveProjectId?: (id: string | null) => void;
  onOpenJourney?: (id: string) => void;
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
  signals?: IntelligenceSignal[];
  setSignals?: React.Dispatch<React.SetStateAction<IntelligenceSignal[]>>;
  products?: Product[];
  services?: Service[];
}

export function Intelligence({ 
  companyProfile: propProfile, 
  onUpdateProfile, 
  startInEditMode, 
  onSaveComplete,
  initialTab,
  personas = [],
  journeys = [],
  setPersonas,
  setProjects,
  setJourneys,
  setTasks,
  setSprints,
  currentUser,
  onNavigate,
  setActiveProjectId,
  onOpenJourney,
  onAddToAuditLog,
  signals = [],
  setSignals,
  products = [],
  services = []
}: IntelligenceProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<'profile' | 'portfolio' | 'overview' | 'reviews' | 'connectors'>(initialTab || (startInEditMode ? 'profile' : 'overview'));
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    scrollToTop(false);
    if (startInEditMode) {
      setActiveTab('profile');
    } else if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [startInEditMode, initialTab]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const hasCompanyInfo = propProfile && propProfile.name && propProfile.name.trim() !== '';

  const [uploadedData, setUploadedData] = useState([
    { id: 1, date: '2024-03-15', source: 'Trustpilot', type: 'Reviews', count: 1240, status: 'Synced' },
    { id: 3, date: '2024-03-10', source: 'Manual', type: 'Survey', count: 150, status: 'Processed' },
  ]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  const handleAddToJourney = (insight: any) => {
    if (!setJourneys || !propProfile) return;

    setJourneys(prev => {
      // Find the first journey map for this project
      const projectJourney = prev.find(j => !j.archived);
      if (!projectJourney) {
        addToast("Please create a journey map first.", "info");
        return prev;
      }

      return prev.map(j => {
        if (j.id === projectJourney.id) {
          return {
            ...j,
            stages: j.stages.map((s, idx) => {
              // Add to the first stage by default or where relevant
              if (idx === 0) {
                const laneId = 'lane_opportunities';
                const currentItems = s.laneData[laneId] || [];
                const newItem = {
                  id: `insight_${Date.now()}`,
                  title: insight.title,
                  description: insight.description
                };
                return {
                  ...s,
                  laneData: {
                    ...s.laneData,
                    [laneId]: [...currentItems, newItem]
                  }
                };
              }
              return s;
            })
          };
        }
        return j;
      });
    });

    addToast(`Added "${insight.title}" to journey map`, "success");
    if (onAddToAuditLog) {
      onAddToAuditLog('Added Opportunity to Journey', `Added AI insight "${insight.title}" to journey map`, 'Update', 'Intelligence', insight.title, 'AI');
    }
  };

  const handleConnect = (integration: any) => {
    setSelectedIntegration(integration);
    setIsConfigModalOpen(true);
  };

  const confirmConnect = async () => {
    if (!selectedIntegration) return;
    
    setIsUploading(true);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      source: selectedIntegration.name,
      type: 'API Sync',
      count: 0,
      status: 'Connecting'
    };
    
    setUploadedData(prev => [newEntry, ...prev]);
    setIsConfigModalOpen(false);
    setIsUploading(false);
    
    // Auto-sync after connection
    handleSync(selectedIntegration.name);
  };

  const handleDeleteData = (id: number) => {
    setUploadedData(prev => prev.filter(d => d.id !== id));
    addToast("Connection removed.", "info");
  };

  const handleSync = async (source: string) => {
    if (!setSignals) return;
    
    addToast(`Syncing data from ${source}...`, "info");
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newSignals: IntelligenceSignal[] = [
      {
        id: `sig_${Date.now()}_1`,
        title: `New feedback from ${source}`,
        description: `Deep analysis of recent interactions from ${source} has detected a new pattern in onboarding friction.`,
        type: 'Observation',
        source: source as any,
        sentiment: 'negative',
        createdAt: new Date().toISOString(),
        status: 'New',
        metadata: {
          author: 'Automated Agent',
          rating: 2
        }
      },
      {
        id: `sig_${Date.now()}_2`,
        title: `High praise for new UI`,
        description: `Customers are reporting significant improvements in the dashboard usability since the last update.`,
        type: 'Praise',
        source: source as any,
        sentiment: 'positive',
        createdAt: new Date().toISOString(),
        status: 'New',
        metadata: {
          author: 'Aggregated Voice',
          rating: 5
        }
      }
    ];
    
    setSignals(prev => [...newSignals, ...prev]);
    addToast(`Successfully synced 2 new signals from ${source}`, "success");
    
    if (onAddToAuditLog) {
      onAddToAuditLog('Data Sync Completed', `Synced 2 intelligence signals from ${source}`, 'Create', 'Intelligence', source, 'Data Source');
    }
  };

  const handleGenerateInsights = async () => {
    if (!profile.name || !profile.description) {
      addToast("Please complete your company profile first to generate strategic insights.", "info");
      return;
    }

    setIsGeneratingInsights(true);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        addToast("Gemini API key is required.", "error");
        setIsGeneratingInsights(false);
        return;
      }

      const ai = await getGeminiClient();
      if (!ai) {
        addToast("Failed to initialize AI client", "error");
        setIsGeneratingInsights(false);
        return;
      }

      const prompt = `Based on the following company profile, generate 3 strategic insights or opportunities for improving the customer experience.
      Company: ${profile.name}
      Vertical: ${profile.vertical}
      Description: ${profile.description}
      Benefits: ${profile.customerBenefits}
      Target Emotions: ${profile.targetEmotions?.join(', ')}
      Goals: ${profile.goals?.join(', ')}

      Provide a JSON object with an 'insights' array. Each insight should have:
      - title: A short, punchy title.
      - description: A clear explanation of the insight and how it aligns with the company's goals and target emotions.
      - impact: One of 'High', 'Medium', 'Low'.
      - category: One of 'Intelligence', 'Success', 'Effort', 'Emotion'.
      
      Ensure the insights are actionable and specific to the vertical and description provided.`;

      const result = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    category: { type: Type.STRING, enum: ['Intelligence', 'Success', 'Effort', 'Emotion'] }
                  },
                  required: ["title", "description", "impact", "category"]
                }
              }
            },
            required: ["insights"]
          }
        }
      });

      const data = JSON.parse(result.text || '{}');
      setAiInsights(data.insights || []);
      addToast('Strategic insights generated successfully', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to generate insights", "error");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Fallback profile if not provided (though it should be from App.tsx)
  const defaultProfile: CompanyProfile = {
    name: '',
    vertical: '',
    description: '',
    customerBenefits: '',
    targetEmotions: [],
    measurementMethods: []
  };

  const profile = propProfile || defaultProfile;

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <ContextualHelp 
        title="Intelligence" 
        description="Centralize your customer data, company profile, and satisfaction metrics. Use this hub to inform your journey maps and drive data-backed improvements."
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            Intelligence
            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase rounded-lg border border-indigo-200 dark:border-indigo-800">Pro</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
            Fully Orchestrate your Continuous Improvement through our intelligent and automated engine.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'overview'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <BrainCircuit className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'profile'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <div className="relative">
            <Building2 className="w-4 h-4" />
            {!hasCompanyInfo && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-white dark:border-zinc-900" />
            )}
          </div>
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === 'portfolio'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <Layers className="w-4 h-4" />
          Product Portfolio
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap relative",
            activeTab === 'reviews'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Intelligence Hub
          <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-md border border-indigo-200 dark:border-indigo-800">Pro</span>
        </button>
        <button
          onClick={() => setActiveTab('connectors')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap relative",
            activeTab === 'connectors'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Connectors
          <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-md border border-indigo-200 dark:border-indigo-800">Pro</span>
        </button>
      </div>

      {activeTab === 'connectors' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Active Connections
                </h3>
                <button 
                  onClick={() => handleSync('All Sources')}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync All
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {uploadedData.filter(d => d.source !== 'Manual').map((conn) => (
                  <div key={conn.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center p-2">
                        <img src={`https://cdn.simpleicons.org/${conn.source.toLowerCase()}`} alt={conn.source} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white">{conn.source}</h4>
                        <p className="text-xs text-zinc-500">Last synced: {conn.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-100 dark:border-emerald-800">
                        {conn.status}
                      </span>
                      <button 
                        onClick={() => handleDeleteData(conn.id)}
                        className="p-2 text-zinc-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {uploadedData.filter(d => d.source !== 'Manual').length === 0 && (
                  <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-500">No active API connections. Connect an integration below.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Available Integrations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Document Upload', icon: 'googlekeep', desc: 'Ingest PDF, CSV, or Excel files directly into the intelligence engine.', isUpload: true },
                  { name: 'Trustpilot', icon: 'trustpilot', desc: 'Sync customer reviews and ratings automatically.' },
                  { name: 'Zendesk', icon: 'zendesk', desc: 'Import support tickets and customer feedback.' },
                  { name: 'Salesforce', icon: 'salesforce', desc: 'Connect CRM data to your customer personas.' },
                  { name: 'Slack', icon: 'slack', desc: 'Get real-time alerts for critical customer insights.' },
                  { name: 'Intercom', icon: 'intercom', desc: 'Sync chat transcripts and user behavior data.' },
                  { name: 'HubSpot', icon: 'hubspot', desc: 'Import marketing and sales interaction data.' }
                ].map((integration) => (
                  <div key={integration.name} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center p-2 mb-4 group-hover:scale-110 transition-transform">
                      {integration.isUpload ? (
                        <FileText className="w-6 h-6 text-indigo-600" />
                      ) : (
                        <img src={`https://cdn.simpleicons.org/${integration.icon}`} alt={integration.name} className="w-full h-full object-contain" />
                      )}
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-1 tracking-tight">{integration.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{integration.desc}</p>
                    <button 
                      onClick={() => integration.isUpload ? handleUpload() : handleConnect(integration)}
                      className={cn(
                        "w-full py-2.5 text-xs font-black uppercase rounded-xl transition-all shadow-sm",
                        integration.isUpload 
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20" 
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-indigo-600 hover:text-white"
                      )}
                    >
                      {integration.isUpload ? (isUploading ? 'Ingesting...' : 'Upload Files') : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <YourCompany 
          profile={profile} 
          onUpdateProfile={onUpdateProfile || (() => {})} 
          startInEditMode={startInEditMode}
          onSaveComplete={onSaveComplete}
          onNavigate={onNavigate}
          personasCount={personas?.length || 0}
        />
      )}

      {activeTab === 'portfolio' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Product & Service Portfolio
                </h3>
                <p className="text-zinc-500 text-sm mt-1">Manage the products and services that your business offers to categorize intelligence.</p>
              </div>
              <button 
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{product.name}</h4>
                        {signals.filter(s => s.productId === product.id).length > 0 && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-[8px] font-black uppercase rounded-lg border border-indigo-100 dark:border-indigo-800">
                            {signals.filter(s => s.productId === product.id).length} Signals
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">{product.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-white transition-all rounded-lg">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white transition-all rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        Services
                      </h5>
                      <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">
                        Add Service
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.filter(s => s.productId === product.id).map(service => (
                        <div key={service.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:border-indigo-500/30 transition-all group">
                          <h6 className="font-bold text-zinc-900 dark:text-white text-sm">{service.name}</h6>
                          <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{service.description}</p>
                          <div className="flex items-center justify-between mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex -space-x-1">
                                {signals.filter(sig => sig.serviceId === service.id).slice(0, 3).map(sig => (
                                  <div key={sig.id} className="w-5 h-5 rounded-full bg-zinc-100 border border-white flex items-center justify-center p-1" title={sig.title}>
                                    <img src={`https://cdn.simpleicons.org/${sig.source.toLowerCase()}`} className="w-full h-full object-contain" />
                                  </div>
                                ))}
                             </div>
                             <button className="text-[10px] font-bold text-zinc-400 hover:text-indigo-600">Edit</button>
                          </div>
                        </div>
                      ))}
                      {services.filter(s => s.productId === product.id).length === 0 && (
                        <div className="col-span-full py-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                          No services defined for this product.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Signal Trends & Health (Phase 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Signal Intelligence Distribution
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                   {['Request', 'Complaint', 'Praise', 'Error', 'Observation'].map(type => {
                      const count = signals.filter(s => s.type === type).length;
                      const total = signals.length || 1;
                      const percentage = (count / total) * 100;
                      return (
                        <div key={type} className="space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{type}s</span>
                              <span className="text-xs font-bold text-zinc-900 dark:text-white">{count}</span>
                           </div>
                           <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={cn(
                                  "h-full rounded-full",
                                  type === 'Error' ? 'bg-rose-500' :
                                  type === 'Complaint' ? 'bg-amber-500' :
                                  type === 'Praise' ? 'bg-emerald-500' :
                                  type === 'Request' ? 'bg-indigo-500' :
                                  'bg-zinc-400'
                                )}
                              />
                           </div>
                        </div>
                      );
                   })}
                </div>

                <div className="mt-12 text-center sm:text-left">
                   <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center justify-center sm:justify-start gap-2">
                     <Users className="w-3 h-3" />
                     Persona Intelligence Map
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {personas.slice(0, 4).map(persona => {
                        const personaSignals = signals.filter(s => s.personaIds?.includes(persona.id));
                        const sentiment = personaSignals.length > 0 
                          ? personaSignals.reduce((acc, s) => acc + (s.sentiment === 'positive' ? 1 : s.sentiment === 'negative' ? -1 : 0), 0) / personaSignals.length
                          : 0;

                        return (
                          <div key={persona.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                             <img src={persona.imageUrl} className="w-10 h-10 rounded-xl object-cover grayscale" />
                             <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{persona.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                   <div className="h-1 flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                      <div 
                                        className={cn("h-full", sentiment > 0 ? "bg-emerald-500" : sentiment < 0 ? "bg-rose-500" : "bg-zinc-400")} 
                                        style={{ width: `${Math.max(10, Math.abs(sentiment) * 100)}%` }}
                                      />
                                   </div>
                                   <span className="text-[8px] font-black uppercase text-zinc-400">{personaSignals.length} Sigs</span>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                      {personas.length === 0 && (
                        <div className="col-span-full p-8 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                           <p className="text-xs text-zinc-400 italic">No personas found. Run Orchestration to evolve your persona library from customer signals.</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group">
                <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-bold flex items-center gap-2">
                       <BrainCircuit className="w-5 h-5" />
                       Strategic Advisor
                     </h3>
                     <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] uppercase font-black tracking-widest">Live</span>
                   </div>
                   <p className="text-xs text-indigo-100 leading-relaxed opacity-90">
                      Based on recent signals, we recommend focusing on <strong>onboarding friction</strong> for the <strong>{products[0]?.name || 'Core Product'}</strong>.
                      Automated analysis suggests resolving these could improve CSAT by 12%.
                   </p>
                </div>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className="relative z-10 mt-6 w-full py-3 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10"
                >
                   Action Recommendation
                </button>
             </div>
          </div>

          {/* Persona Sentiment Analysis (New) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Persona Sentiment Analysis
                </h3>
                <p className="text-zinc-500 text-sm mt-1">Cross-reference journey sentiments with specific customer personas.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2">Filter by Persona:</span>
                <select
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="all">All Personas</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const personaJourneys = selectedPersonaId === 'all' 
                  ? journeys 
                  : journeys.filter(j => j.personaIds.includes(selectedPersonaId));
                
                const avgSentiment = personaJourneys.length > 0
                  ? personaJourneys.reduce((acc, j) => {
                      const journeyAvg = j.stages.reduce((sum: number, s: any) => sum + s.emotion, 0) / j.stages.length;
                      return acc + journeyAvg;
                    }, 0) / personaJourneys.length
                  : 0;

                return (
                  <>
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Aggregate Sentiment</p>
                      <div className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                        {avgSentiment > 0 ? avgSentiment.toFixed(1) : 'N/A'}
                        <span className="text-xl">/ 5.0</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        {avgSentiment >= 4 ? 'Highly Satisfied' : avgSentiment >= 3 ? 'Neutral' : avgSentiment > 0 ? 'Frictional' : 'No data available'}
                      </p>
                    </div>
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Analyzed Journeys</p>
                      <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                        {personaJourneys.length}
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">Active maps for this segment</p>
                    </div>
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Experience Delta</p>
                      <div className="text-3xl font-bold text-indigo-600">
                        {avgSentiment > 0 ? ((avgSentiment - 3.0) * 20).toFixed(0) : '0'}%
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">Variance from baseline expectation</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* I-SEE Graphic */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">I-SEE Framework</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Our core methodology for understanding and optimizing the complete customer experience.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Intelligence */}
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-300">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Intelligence</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Understanding the current experience through surveys, interviews, tickets, and complaints.
                </p>
              </div>

              {/* Success */}
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-300">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Success</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Measuring how well you meet customer needs and enabling them to be successful.
                </p>
              </div>

              {/* Effort */}
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-300">
                  <Gauge className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Effort</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Ensuring customers achieve goals quickly and simply. Reducing friction at every step.
                </p>
              </div>

              {/* Emotion */}
              <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800/50">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-800 rounded-xl flex items-center justify-center mb-4 text-rose-600 dark:text-rose-300">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Emotion</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Understanding how your customers feel versus how you want them to feel.
                </p>
              </div>
            </div>
          </div>

          {/* AI Strategic Insights */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  AI Strategic Insights
                </h3>
                <p className="text-sm text-zinc-500">Personalized opportunities based on your company profile.</p>
              </div>
              <button
                onClick={handleGenerateInsights}
                disabled={isGeneratingInsights}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Generate Insights
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {aiInsights.length > 0 ? (
                  aiInsights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 relative group hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                          insight.category === 'Intelligence' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          insight.category === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          insight.category === 'Effort' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        )}>
                          {insight.category}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          insight.impact === 'High' ? 'text-rose-600' :
                          insight.impact === 'Medium' ? 'text-amber-600' :
                          'text-emerald-600'
                        )}>
                          {insight.impact} Impact
                        </span>
                      </div>
                      <h4 className="font-bold text-zinc-900 dark:text-white mb-2">{insight.title}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{insight.description}</p>
                      
                      <button
                        onClick={() => handleAddToJourney(insight)}
                        className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-3 h-3" />
                        Add to Journey Map
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">Click generate to see AI-powered strategic insights for your company.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    Intelligence Signals
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-1">
                      {[...new Set(signals.map(s => s.source))].map(src => (
                         <div key={src} className="w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 p-1 flex items-center justify-center overflow-hidden" title={src}>
                           <img src={`https://cdn.simpleicons.org/${src.toLowerCase()}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                         </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveTab('reviews')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                      Manage
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {signals.length > 0 ? signals.slice(0, 5).map((signal) => (
                    <div key={signal.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-start justify-between group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-zinc-900 dark:text-white">{signal.title}</h4>
                           {signal.productId && (
                             <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded border border-indigo-100 dark:border-indigo-800">
                               {products.find(p => p.id === signal.productId)?.name}
                             </span>
                           )}
                           {signal.status !== 'New' && (
                              <span className={cn(
                                "px-1.5 py-0.5 text-[8px] font-black uppercase rounded border",
                                signal.status === 'Actioned' || signal.status === 'Resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                signal.status === 'In Progress' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                "bg-zinc-50 text-zinc-600 border-zinc-100"
                              )}>
                                {signal.status}
                              </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-1">{signal.description}</p>
                        <div className="flex items-center gap-3 text-[10px] font-medium text-zinc-400">
                          <span className="flex items-center gap-1 uppercase font-bold"><Database className="w-3 h-3" /> {signal.source}</span>
                          <span>•</span>
                          <span>{new Date(signal.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className={cn(
                           "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                           signal.sentiment === 'negative' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                           signal.sentiment === 'positive' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                           "bg-zinc-50 text-zinc-700 border border-zinc-100"
                         )}>
                          {signal.type}
                        </span>
                        <button className="p-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-indigo-600 transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-zinc-500 italic text-sm">
                      No signals detected yet. Connect a data source to start.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 p-12 bg-indigo-500/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <h3 className="text-lg font-bold mb-2 relative z-10">Improvement Cycle</h3>
              <div className="space-y-4 relative z-10 mt-6">
                {[
                  { step: '1', title: 'Intelligence', desc: 'Gather data and feedback.' },
                  { step: '2', title: 'Personas', desc: 'Build profiles from real data.' },
                  { step: '3', title: 'Journey', desc: 'Map current state pain points.' },
                  { step: '4', title: 'Tasks', desc: 'Execute changes (Discover to Deliver).' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 text-sm">{item.title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <IntelligenceHub 
          companyProfile={profile}
          onUpdateProfile={onUpdateProfile}
          setPersonas={setPersonas}
          setProjects={setProjects}
          setJourneys={setJourneys}
          setTasks={setTasks}
          setSprints={setSprints}
          currentUser={currentUser}
          onNavigate={onNavigate}
          setActiveProjectId={setActiveProjectId}
          onOpenJourney={onOpenJourney}
          uploadedData={uploadedData}
          onDeleteData={handleDeleteData}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadSuccess={uploadSuccess}
          onAddToAuditLog={onAddToAuditLog}
          signals={signals}
          setSignals={setSignals}
          products={products}
          services={services}
        />
      )}
      {/* API Configuration Modal */}
      {isConfigModalOpen && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl max-w-md w-full p-8 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center p-2">
                <img src={`https://cdn.simpleicons.org/${selectedIntegration.icon}`} alt={selectedIntegration.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Configure {selectedIntegration.name}</h3>
                <p className="text-sm text-zinc-500">Enter your API credentials to sync data.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">API Key</label>
                <input 
                  type="password" 
                  placeholder="sk_live_..."
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Environment</label>
                <select className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Production</option>
                  <option>Sandbox / Development</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="flex-1 px-6 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmConnect}
                disabled={isUploading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save & Connect'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
