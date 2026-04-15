import React, { useState } from 'react';
import { BrainCircuit, Upload, FileText, MessageSquare, BarChart3, Sparkles, Database, ArrowRight, CheckCircle2, Building2, Target, Gauge, Heart, Trash2, Star, RefreshCw, Loader2, Plus, AlertCircle, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { VocSection } from '../components/VocSection';
import { NpsCalculator } from '../components/NpsCalculator';
import { IntelligenceHub } from '../components/ReviewIntelligence';
import { YourCompany, CompanyProfile } from '../components/YourCompany';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';
import { useToast } from '../context/ToastContext';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { Type } from '@google/genai';
import { AnimatePresence } from 'motion/react';

interface IntelligenceProps {
  companyProfile?: CompanyProfile;
  onUpdateProfile?: (updates: Partial<CompanyProfile>) => void;
  startInEditMode?: boolean;
  onSaveComplete?: () => void;
  initialTab?: 'profile' | 'overview' | 'reviews' | 'connectors';
  // State setters for Review Intelligence integration
  setPersonas?: React.Dispatch<React.SetStateAction<any[]>>;
  setProjects?: React.Dispatch<React.SetStateAction<any[]>>;
  setJourneys?: React.Dispatch<React.SetStateAction<any[]>>;
  setTasks?: React.Dispatch<React.SetStateAction<any[]>>;
  setSprints?: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser?: any;
  onNavigate?: (tab: string, subTab?: string) => void;
  setActiveProjectId?: (id: string | null) => void;
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
}

export function Intelligence({ 
  companyProfile: propProfile, 
  onUpdateProfile, 
  startInEditMode, 
  onSaveComplete,
  initialTab,
  setPersonas,
  setProjects,
  setJourneys,
  setTasks,
  setSprints,
  currentUser,
  onNavigate,
  setActiveProjectId,
  onAddToAuditLog
}: IntelligenceProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<'profile' | 'overview' | 'reviews' | 'connectors'>(initialTab || (startInEditMode ? 'profile' : 'overview'));
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (startInEditMode) {
      setActiveTab('profile');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [startInEditMode, initialTab]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [uploadedData, setUploadedData] = useState([
    { id: 1, date: '2024-03-15', source: 'Trustpilot', type: 'Reviews', count: 1240, status: 'Synced' },
    { id: 3, date: '2024-03-10', source: 'Manual', type: 'Survey', count: 150, status: 'Processed' },
  ]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

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
        model: "gemini-3-flash-preview",
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

  const handleDeleteData = (id: number) => {
    setUploadedData(uploadedData.filter(d => d.id !== id));
  };

  const handleConnect = (integration: any) => {
    setSelectedIntegration(integration);
    setIsConfigModalOpen(true);
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
        title="Intelligence Hub" 
        description="Centralize your customer data, company profile, and satisfaction metrics. Use this hub to inform your journey maps and drive data-backed improvements."
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            Intelligence Hub
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
          <Building2 className="w-4 h-4" />
          Company Profile
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
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Active Connections
              </h3>
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
                  { name: 'Trustpilot', icon: 'trustpilot', desc: 'Sync customer reviews and ratings automatically.' },
                  { name: 'Zendesk', icon: 'zendesk', desc: 'Import support tickets and customer feedback.' },
                  { name: 'Salesforce', icon: 'salesforce', desc: 'Connect CRM data to your customer personas.' },
                  { name: 'Slack', icon: 'slack', desc: 'Get real-time alerts for critical customer insights.' },
                  { name: 'Intercom', icon: 'intercom', desc: 'Sync chat transcripts and user behavior data.' },
                  { name: 'HubSpot', icon: 'hubspot', desc: 'Import marketing and sales interaction data.' }
                ].map((integration) => (
                  <div key={integration.name} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:shadow-lg transition-all group">
                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center p-2 mb-4 group-hover:scale-110 transition-transform">
                      <img src={`https://cdn.simpleicons.org/${integration.icon}`} alt={integration.name} className="w-full h-full object-contain" />
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-1">{integration.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{integration.desc}</p>
                    <button 
                      onClick={() => handleConnect(integration)}
                      className="w-full py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Connect
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
        />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8">
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
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900 dark:text-white">Recent Insights</h3>
                  <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                </div>
                <div className="divide-y divide-zinc-100">
                  {[
                    { title: 'High friction in onboarding', type: 'Support Tickets', impact: 'Negative Emotion', date: '2 days ago' },
                    { title: 'Pricing page lacks clarity', type: 'User Interviews', impact: 'High Effort', date: '1 week ago' },
                    { title: 'Great response time from support', type: 'CSAT Survey', impact: 'Positive Emotion', date: '2 weeks ago' },
                  ].map((insight, i) => (
                    <div key={i} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 transition-colors flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-bold text-zinc-900 dark:text-white">{insight.title}</h4>
                        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {insight.type}</span>
                          <span>•</span>
                          <span>{insight.date}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        insight.impact.includes('Negative') || insight.impact.includes('High') 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {insight.impact}
                      </span>
                    </div>
                  ))}
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
          uploadedData={uploadedData}
          onDeleteData={handleDeleteData}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadSuccess={uploadSuccess}
          onAddToAuditLog={onAddToAuditLog}
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
                onClick={() => setIsConfigModalOpen(false)}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Save & Connect
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
