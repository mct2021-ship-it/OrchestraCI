import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Users, 
  Lightbulb, 
  Rocket, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Star,
  Quote,
  TrendingUp,
  ExternalLink,
  Database,
  Upload,
  ChevronRight,
  X,
  Check,
  Calendar,
  Layers,
  ListTodo,
  Map as MapIcon,
  FileText,
  RefreshCw,
  Trash2,
  BarChart3,
  BrainCircuit,
  Frown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { Type } from '@google/genai';
import { CompanyProfile } from './YourCompany';
import { Persona, Project, JourneyMap, Task, Sprint, IntelligenceSignal, Product, Service } from '../types';
import { VocSection } from './VocSection';
import { NpsCalculator } from './NpsCalculator';
import { useToast } from '../context/ToastContext';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
}

interface InsightPersona {
  name: string;
  description: string;
  painPoints: string[];
  goals: string[];
  role: string;
  quote: string;
}

interface InsightOpportunity {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface InsightProject {
  id: string;
  title: string;
  description: string;
  expectedImpact: string;
  opportunities: InsightOpportunity[];
  suggestedJourney?: {
    stages: {
      name: string;
      emotion: number;
      items: string[];
    }[];
  };
}

interface IntelligenceData {
  personas: InsightPersona[];
  projects: InsightProject[];
}

interface ReviewIntelligenceProps {
  companyProfile?: CompanyProfile;
  onUpdateProfile?: (updates: Partial<CompanyProfile>) => void;
  setPersonas?: React.Dispatch<React.SetStateAction<Persona[]>>;
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
  setJourneys?: React.Dispatch<React.SetStateAction<JourneyMap[]>>;
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  setSprints?: React.Dispatch<React.SetStateAction<Sprint[]>>;
  currentUser?: any;
  onNavigate?: (tab: string, subTab?: string) => void;
  setActiveProjectId?: (id: string | null) => void;
  uploadedData?: any[];
  onDeleteData?: (id: number) => void;
  onUpload?: () => void;
  isUploading?: boolean;
  uploadSuccess?: boolean;
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
  signals?: IntelligenceSignal[];
  setSignals?: React.Dispatch<React.SetStateAction<IntelligenceSignal[]>>;
  products?: Product[];
  services?: Service[];
}

type Step = 'input' | 'signals' | 'personas' | 'projects' | 'execution';

export function IntelligenceHub({ 
  companyProfile, 
  onUpdateProfile,
  setPersonas,
  setProjects,
  setJourneys,
  setTasks,
  setSprints,
  currentUser,
  onNavigate,
  setActiveProjectId,
  uploadedData = [],
  onDeleteData,
  onUpload,
  isUploading: isUploadingProp,
  uploadSuccess: uploadSuccessProp,
  onAddToAuditLog,
  signals = [],
  setSignals,
  products = [],
  services = []
}: ReviewIntelligenceProps) {
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawInsights, setRawInsights] = useState<IntelligenceData | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<IntelligenceSignal | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  
  // Selection state
  const [acceptedPersonas, setAcceptedPersonas] = useState<InsightPersona[]>([]);
  const [rejectedPersonas, setRejectedPersonas] = useState<InsightPersona[]>([]);
  const [selectedProject, setSelectedProject] = useState<InsightProject | null>(null);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    projectId: string;
    personaIds: string[];
    journeyId: string;
    sprintId: string;
    taskIds: string[];
  } | null>(null);

  const handlePromoteToTask = (signal: IntelligenceSignal) => {
    if (!setTasks || !currentUser) {
       addToast("Project or user context missing.", "error");
       return;
    }

    const newTask: any = {
      id: `task_${Date.now()}`,
      projectId: signal.linkedProjectId || 'default',
      title: `Intelligence: ${signal.title}`,
      description: `Action derived from signal: ${signal.description}`,
      type: signal.type === 'Error' ? 'Security' : signal.type === 'Complaint' ? 'Maintenance' : 'Feature',
      status: 'Discover',
      priority: signal.sentiment === 'negative' ? 'Critical' : 'Medium',
      assigneeId: currentUser.id,
      stage: 'Discover',
      createdAt: new Date().toISOString(),
      tags: [signal.source, 'Intelligence'],
      comments: []
    };

    setTasks(prev => [...prev, newTask]);
    if (setSignals) {
       setSignals(prev => prev.map(s => s.id === signal.id ? { ...s, status: 'In Progress', linkedTaskId: newTask.id } : s));
    }
    addToast(`Promoted signal to task: ${newTask.title}`, "success");
    if (onAddToAuditLog) {
      onAddToAuditLog('Promoted Signal', `Created task from signal: ${signal.title}`, 'Create', 'Task', newTask.id, 'Data Source');
    }
  };

  // Check if allowed to run (once per month)
  const lastAnalysisDate = companyProfile?.pastAnalyses?.[0]?.date;
  const daysSinceLastAnalysis = lastAnalysisDate 
    ? Math.floor((new Date().getTime() - new Date(lastAnalysisDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const isAllowed = daysSinceLastAnalysis >= 30;

  // Mock reviews for the demonstration
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      author: 'Sarah J.',
      rating: 2,
      text: "The onboarding process was extremely confusing. I didn't know where to start and the documentation was outdated. Once I got it working, it was fine, but the first hour was a nightmare.",
      date: '2024-03-20',
      sentiment: 'negative'
    },
    {
      id: '2',
      author: 'Michael R.',
      rating: 5,
      text: "Orchestra CI has transformed how our team manages sprints. The automation features are top-notch. I wish there was a better way to export reports to PDF though.",
      date: '2024-03-18',
      sentiment: 'positive'
    },
    {
      id: '3',
      author: 'David L.',
      rating: 3,
      text: "It's a solid tool, but it feels a bit slow when handling large backlogs. Also, I'm a project manager and I find the persona mapping a bit too basic for my needs.",
      date: '2024-03-15',
      sentiment: 'neutral'
    }
  ]);

  const handleAnalyze = async () => {
    if (!isAllowed) {
      setError(`You can only run a strategic analysis once every 30 days. Next analysis available in ${30 - daysSinceLastAnalysis} days.`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        throw new Error("Gemini API key is required for AI analysis.");
      }

      const ai = await getGeminiClient();
      if (!ai) throw new Error("Failed to initialize AI client");

      const prompt = `Analyze the following intelligence signals and extract strategic intelligence for ${companyProfile?.name || 'our company'}.
      Company Context: ${companyProfile?.description || 'A software company'}
      Target Emotions: ${companyProfile?.targetEmotions?.join(', ') || 'N/A'}
      Strategic Goals: ${companyProfile?.goals?.join(', ') || 'N/A'}
      Products/Services: ${products.map(p => p.name).join(', ')}
      
      Intelligence Signals:
      ${signals.map(s => `- [${s.type} - ${s.sentiment} sentiment] ${s.title}: ${s.description} (Source: ${s.source}, Product ID: ${s.productId || 'Unknown'})`).join('\n')}

      Provide a JSON object with:
      1. personas: Array of 3 distinct user archetypes (name, description, painPoints, goals, role, quote).
      2. projects: Array of 2 strategic projects to address these. Each project MUST have:
         - title, description, expectedImpact
         - opportunities: Array of 3 specific tasks/features (title, description, severity: 'high'|'medium'|'low')
         - suggestedJourney: An object with 'stages' array. Each stage has 'name', 'emotion' (1-5), and 'items' (array of strings for touchpoints/friction/opps).
      
      Ensure the insights are directly tied to the signals and align with the company's strategic goals and relevant products.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                    role: { type: Type.STRING },
                    quote: { type: Type.STRING }
                  }
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    expectedImpact: { type: Type.STRING },
                    opportunities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                        }
                      }
                    },
                    suggestedJourney: {
                      type: Type.OBJECT,
                      properties: {
                        stages: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              emotion: { type: Type.NUMBER },
                              items: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["personas", "projects"]
          }
        }
      });

      const data = JSON.parse(result.text || '{}');
      // Assign IDs to opportunities if missing
      data.projects.forEach((p: any) => {
        p.opportunities.forEach((o: any, idx: number) => {
          if (!o.id) o.id = `opp_${Date.now()}_${idx}`;
        });
      });
      
      setRawInsights(data);
      setStep('personas');

      // Update analysis history immediately to enforce limit
      if (onUpdateProfile) {
        onUpdateProfile({
          pastAnalyses: [
            { 
              id: `analysis_${Date.now()}`, 
              date: new Date().toISOString(), 
              type: 'Strategic Analysis Run', 
              result: 'Analysis Completed',
              content: `Ran strategic analysis on ${reviews.length} reviews.`
            },
            ...(companyProfile?.pastAnalyses || [])
          ]
        });
      }
    } catch (err: any) {
      setError(err.message || "Analysis failed");
      addToast(err.message || "Analysis failed", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptPersona = (persona: InsightPersona) => {
    setAcceptedPersonas(prev => [...prev, persona]);
  };

  const handleRejectPersona = (persona: InsightPersona) => {
    setRejectedPersonas(prev => [...prev, persona]);
  };

  const handleExecute = async () => {
    if (!selectedProject || !setPersonas || !setProjects || !setJourneys || !setTasks || !setSprints) return;
    
    setIsExecuting(true);
    try {
      const projectId = `proj_${Date.now()}`;
      const sprintId = `sprint_${Date.now()}`;
      const journeyId = `journey_${Date.now()}`;
      
      // 1. Create Personas
      const newPersonas: Persona[] = acceptedPersonas.map((p, i) => ({
        id: `persona_${Date.now()}_${i}`,
        name: p.name,
        role: p.role,
        age: 35,
        quote: p.quote,
        goals: p.goals,
        frustrations: p.painPoints,
        imageUrl: `https://i.pravatar.cc/150?u=${p.name}`,
        demographics: [
          { id: 'tech', label: 'Tech Savvy', value: 75 },
          { id: 'exp', label: 'Experience', value: 60 }
        ]
      }));
      
      setPersonas(prev => [...prev, ...newPersonas]);
      const personaIds = newPersonas.map(p => p.id);
      newPersonas.forEach(p => {
        onAddToAuditLog?.('Created AI Persona', `Created persona ${p.name} using Review Intelligence`, 'Create', 'Persona', p.id, 'AI');
      });

      // 2. Create Project
      const newProject: Project = {
        id: projectId,
        name: selectedProject.title,
        description: selectedProject.description,
        purpose: selectedProject.expectedImpact,
        goals: [selectedProject.expectedImpact],
        expectedOutcomes: [selectedProject.expectedImpact],
        taxonomy: ['Review Intelligence', 'Strategic'],
        status: 'Discover',
        updatedAt: new Date().toISOString(),
        personaIds,
        features: {
          processMaps: true,
          raidLog: true,
          sprints: true,
          insights: true
        }
      };
      setProjects(prev => [...prev, newProject]);
      setCreatedProjectId(projectId);
      onAddToAuditLog?.('Created AI Project', `Created project ${newProject.name} using Review Intelligence`, 'Create', 'Project', newProject.id, 'AI');

      // 3. Create Journey Map
      const selectedOpps = selectedProject.opportunities.filter(o => selectedOpportunities.includes(o.id));
      
      const newJourney: JourneyMap = {
        id: journeyId,
        projectId,
        title: `Customer Journey: ${selectedProject.title}`,
        personaIds,
        state: 'Current',
        status: 'In Progress',
        satisfaction: { metric: 'CSAT', value: 3 },
        swimlanes: [
          { id: 'lane_touchpoints', name: 'Touchpoints', icon: 'Target', type: 'text-list', colorTheme: 'indigo' },
          { id: 'lane_friction', name: 'Friction Points', icon: 'AlertCircle', type: 'text-list', colorTheme: 'rose' },
          { id: 'lane_opportunities', name: 'Opportunities', icon: 'Lightbulb', type: 'text-list', colorTheme: 'emerald' }
        ],
        stages: selectedProject.suggestedJourney?.stages?.map((s: any, i: number) => {
          // Add some selected opportunities to each stage or distribute them
          // Here we just take the first two selected ones for the first stage, etc.
          const stageOpps = i === 0 ? selectedOpps.map(o => ({ id: `opp_item_${o.id}_${Date.now()}`, title: o.title, description: o.description })) : [];
          
          return {
            id: `stage_${i + 1}`,
            name: s.name,
            emotion: s.emotion || 3,
            laneData: {
              'lane_touchpoints': s.items?.slice(0, 2).map((text: string) => ({ id: `item_${Date.now()}_${Math.random()}`, title: text })) || [],
              'lane_friction': s.items?.slice(2, 3).map((text: string) => ({ id: `item_${Date.now()}_${Math.random()}`, title: text })) || [],
              'lane_opportunities': [
                ...(s.items?.slice(3, 5).map((text: string) => ({ id: `item_${Date.now()}_${Math.random()}`, title: text })) || []),
                ...stageOpps
              ]
            }
          };
        }) || [
          { id: 'stage_1', name: 'Discovery', emotion: 3, laneData: { 'lane_touchpoints': [], 'lane_friction': [], 'lane_opportunities': selectedOpps.map(o => ({ id: `opp_item_${o.id}_${Date.now()}`, title: o.title, description: o.description })) } },
          { id: 'stage_2', name: 'Engagement', emotion: 3, laneData: { 'lane_touchpoints': [], 'lane_friction': [], 'lane_opportunities': [] } },
          { id: 'stage_3', name: 'Conversion', emotion: 3, laneData: { 'lane_touchpoints': [], 'lane_friction': [], 'lane_opportunities': [] } },
          { id: 'stage_4', name: 'Retention', emotion: 3, laneData: { 'lane_touchpoints': [], 'lane_friction': [], 'lane_opportunities': [] } },
          { id: 'stage_5', name: 'Advocacy', emotion: 3, laneData: { 'lane_touchpoints': [], 'lane_friction': [], 'lane_opportunities': [] } }
        ]
      };
      setJourneys(prev => [...prev, newJourney]);
      onAddToAuditLog?.('Created AI Journey', `Created journey ${newJourney.title} using Review Intelligence`, 'Create', 'Journey', newJourney.id, 'AI');

      // 4. Create Sprint
      const newSprint: Sprint = {
        id: sprintId,
        projectId,
        number: 1,
        name: 'Sprint 1: Foundation',
        goal: `Address initial findings from ${selectedProject.title}`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        stage: 'Discover'
      };
      setSprints(prev => [...prev, newSprint]);
      onAddToAuditLog?.('Created AI Sprint', `Created sprint ${newSprint.name} using Review Intelligence`, 'Create', 'Sprint', newSprint.id, 'AI');

      // 5. Create Tasks
      const newTasks: Task[] = selectedOpps.map((o, i) => ({
        id: `task_${Date.now()}_${i}`,
        projectId,
        sprint: sprintId,
        title: o.title,
        description: o.description,
        status: 'Discover',
        kanbanStatus: 'todo',
        impact: o.severity === 'high' ? 'High' : o.severity === 'medium' ? 'Medium' : 'Low',
        effort: 'Medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: currentUser?.id
      }));
      setTasks(prev => [...prev, ...newTasks]);
      newTasks.forEach(t => {
        onAddToAuditLog?.('Created AI Task', `Created task ${t.title} using Review Intelligence`, 'Create', 'Task', t.id, 'AI');
      });

      // 6. Update Signals if they exist
      if (setSignals) {
        setSignals(prev => prev.map(s => ({
          ...s,
          status: 'Actioned',
          linkedProjectId: projectId
        })));
      }

      // Update company profile with execution history
      if (onUpdateProfile) {
        onUpdateProfile({
          pastAnalyses: [
            { 
              id: `exec_${Date.now()}`, 
              date: new Date().toISOString(), 
              type: 'Strategic Execution', 
              result: 'Project Implemented',
              content: `AI Analysis executed: ${selectedProject.title} with ${acceptedPersonas.length} personas and ${selectedOpportunities.length} tasks.`
            },
            ...(companyProfile?.pastAnalyses || [])
          ]
        });
      }

      setExecutionResult({
        projectId,
        personaIds,
        journeyId,
        sprintId,
        taskIds: newTasks.map(t => t.id)
      });
      setStep('execution');
    } catch (err) {
      console.error(err);
      setError("Execution failed. Please check console for details.");
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleOpportunity = (id: string) => {
    setSelectedOpportunities(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {/* Progress Stepper */}
      <div className="flex items-center justify-center max-w-3xl mx-auto mb-12">
        {[
          { id: 'input', label: 'Data Input', icon: Database },
          { id: 'signals', label: 'Intelligence', icon: BrainCircuit },
          { id: 'personas', label: 'Personas', icon: Users },
          { id: 'projects', label: 'Strategy', icon: Rocket },
          { id: 'execution', label: 'Execution', icon: CheckCircle2 },
        ].map((s, i, arr) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2 relative">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                step === s.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-110" :
                arr.findIndex(x => x.id === step) > i ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
              )}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 whitespace-nowrap",
                step === s.id ? "text-indigo-600" : "text-zinc-400"
              )}>{s.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className={cn(
                "h-0.5 w-24 mx-2",
                arr.findIndex(x => x.id === step) > i ? "bg-emerald-500" : "bg-zinc-100 dark:bg-zinc-800"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Trustpilot Connector */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-md border border-indigo-200 dark:border-indigo-800">Pro Feature</div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center p-2">
                    <img src="https://cdn.simpleicons.org/trustpilot/white" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Trustpilot Integration</h3>
                    <p className="text-sm text-zinc-500">Connect your business account to sync reviews.</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Status</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Connected</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Successfully synced 1,240 reviews from the last 30 days.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Usage Limit</span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      Strategic analysis can only be run **once per month** to ensure data quality and focus.
                    </p>
                  </div>

                  <button 
                    onClick={() => setStep('signals')}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    View Intelligence Signals
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Other Connectors Preview */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                 <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">External Connectors</h3>
                    <p className="text-sm text-zinc-500">Sync data from Zendesk, Intercom, or Salesforce.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {['Zendesk', 'Intercom', 'Salesforce'].map(s => (
                    <div key={s} className="flex flex-col items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl grayscale hover:grayscale-0 transition-all cursor-not-allowed border border-transparent hover:border-zinc-200">
                      <img src={`https://cdn.simpleicons.org/${s.toLowerCase()}`} className="w-6 h-6 object-contain" />
                      <span className="text-[10px] font-bold text-zinc-500">{s}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-center text-zinc-400">
                  Connectors allow the Intelligence Engine to continuously monitor for "Signals" that may impact your projects.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'signals' && (
          <motion.div
            key="signals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Intelligence Signals</h3>
                <p className="text-zinc-500 mt-1">Review and categorize signals detected from your data sources.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[...new Set(signals.map(s => s.source))].map(src => (
                    <div key={src} className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 p-1.5 flex items-center justify-center" title={src}>
                      <img src={`https://cdn.simpleicons.org/${src.toLowerCase()}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Synthesize into Projects
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {signals.map((signal) => (
                <div key={signal.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-indigo-500/50 transition-all group">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex flex-1 gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        signal.sentiment === 'negative' ? "bg-rose-50 text-rose-600" :
                        signal.sentiment === 'positive' ? "bg-emerald-50 text-emerald-600" :
                        "bg-zinc-50 text-zinc-600"
                      )}>
                        {signal.type === 'Error' && <AlertCircle className="w-6 h-6" />}
                        {signal.type === 'Request' && <MessageSquare className="w-6 h-6" />}
                        {signal.type === 'Praise' && <Star className="w-6 h-6" />}
                        {signal.type === 'Complaint' && <Frown className="w-6 h-6" />}
                        {signal.type === 'Observation' && <FileText className="w-6 h-6" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-zinc-900 dark:text-white">{signal.title}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                            signal.sentiment === 'negative' ? "bg-rose-100 text-rose-700" :
                            signal.sentiment === 'positive' ? "bg-emerald-100 text-emerald-700" :
                            "bg-zinc-100 text-zinc-700"
                          )}>{signal.type}</span>
                        </div>
                        <p className="text-sm text-zinc-500">{signal.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                            <Database className="w-3 h-3" />
                            {signal.source}
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                            <Calendar className="w-3 h-3" />
                            {new Date(signal.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      <div className="space-y-2 w-full">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-right">Categorize by Product</label>
                        <div className="flex flex-wrap justify-end gap-2">
                          {products.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                if (setSignals) {
                                  setSignals(prev => prev.map(s => s.id === signal.id ? { ...s, productId: s.productId === p.id ? undefined : p.id } : s));
                                }
                              }}
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold border transition-all",
                                signal.productId === p.id 
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                                  : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300"
                              )}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-auto">
                        <button 
                          onClick={() => setSelectedSignal(signal)}
                          className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-500 rounded-xl text-[10px] font-bold uppercase hover:bg-zinc-100 transition-all border border-zinc-200 dark:border-zinc-700 shadow-sm"
                        >
                          Details
                        </button>
                        <button 
                          onClick={() => handlePromoteToTask(signal)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border border-transparent flex items-center gap-2 shadow-sm",
                            signal.status === 'In Progress' || signal.status === 'Actioned'
                              ? "bg-indigo-50 text-indigo-600 cursor-default" 
                              : "bg-zinc-900 text-white hover:bg-zinc-800"
                          )}
                          disabled={signal.status === 'In Progress' || signal.status === 'Actioned'}
                        >
                          {signal.status === 'In Progress' || signal.status === 'Actioned' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Executed
                            </>
                          ) : (
                            <>
                              <Rocket className="w-3 h-3" />
                              Promote
                            </>
                          )}
                        </button>
                        <button className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-xl text-[10px] font-bold uppercase hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8 gap-4">
               <button
                onClick={() => setStep('input')}
                className="px-8 py-3 rounded-xl font-bold text-zinc-500 hover:text-zinc-900 transition-all"
              >
                Back
              </button>
              <button
                disabled={signals.length === 0}
                onClick={handleAnalyze}
                className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-500/20"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Analyze Signals & Build Roadmap
              </button>
            </div>
          </motion.div>
        )}

        {step === 'personas' && rawInsights && (
          <motion.div
            key="personas"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Derived Personas</h3>
              <p className="text-zinc-500 mt-2">AI has identified these archetypes from your reviews. Review and accept the ones that match your strategy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rawInsights.personas.map((persona, i) => {
                const isAccepted = acceptedPersonas.some(p => p.name === persona.name);
                const isRejected = rejectedPersonas.some(p => p.name === persona.name);
                
                return (
                  <div key={i} className={cn(
                    "bg-white dark:bg-zinc-900 p-6 rounded-3xl border transition-all relative overflow-hidden",
                    isAccepted ? "border-emerald-500 ring-1 ring-emerald-500" :
                    isRejected ? "border-rose-200 opacity-50 grayscale" : "border-zinc-200 dark:border-zinc-800 shadow-sm"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {!isAccepted && !isRejected ? (
                          <>
                            <button 
                              onClick={() => handleRejectPersona(persona)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAcceptPersona(persona)}
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => {
                              setAcceptedPersonas(prev => prev.filter(p => p.name !== persona.name));
                              setRejectedPersonas(prev => prev.filter(p => p.name !== persona.name));
                            }}
                            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 underline"
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{persona.name}</h4>
                    <p className="text-xs text-zinc-500 font-medium mb-4">{persona.role}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 italic">"{persona.quote}"</p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Top Pain Points</p>
                        <div className="flex flex-wrap gap-2">
                          {persona.painPoints.map((p, j) => (
                            <span key={j} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] rounded-md font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center pt-8">
              <button
                disabled={acceptedPersonas.length === 0}
                onClick={() => setStep('projects')}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                Next: Strategy Suggestions
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'projects' && rawInsights && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Strategic Roadmap</h3>
              <p className="text-zinc-500 mt-2">Based on your accepted personas, AI suggests these projects and associated opportunities.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {rawInsights.projects.map((project, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "bg-white dark:bg-zinc-900 rounded-3xl border transition-all p-8 space-y-6 relative overflow-hidden",
                    selectedProject?.title === project.title ? "border-indigo-500 ring-1 ring-indigo-500" : "border-zinc-200 dark:border-zinc-800 shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedProject(project);
                        setSelectedOpportunities(project.opportunities.map(o => o.id));
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        selectedProject?.title === project.title ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                      )}
                    >
                      {selectedProject?.title === project.title ? 'Selected' : 'Select Project'}
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{project.title}</h4>
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{project.description}</p>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Expected Impact</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{project.expectedImpact}</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Associated Opportunities</p>
                    <div className="space-y-3">
                      {project.opportunities.map((opp) => (
                        <div 
                          key={opp.id}
                          onClick={() => selectedProject?.title === project.title && toggleOpportunity(opp.id)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4",
                            selectedOpportunities.includes(opp.id) && selectedProject?.title === project.title
                              ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" 
                              : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 opacity-60"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                            selectedOpportunities.includes(opp.id) && selectedProject?.title === project.title
                              ? "bg-indigo-600 border-indigo-600 text-white" 
                              : "border-zinc-300"
                          )}>
                            {selectedOpportunities.includes(opp.id) && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="text-sm font-bold text-zinc-900 dark:text-white">{opp.title}</h5>
                              <span className={cn(
                                "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                opp.severity === 'high' ? "bg-rose-50 text-rose-600" : "bg-zinc-100 text-zinc-600"
                              )}>{opp.severity}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 line-clamp-1">{opp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8 gap-4">
              <button
                onClick={() => setStep('personas')}
                className="px-8 py-3 rounded-xl font-bold text-zinc-500 hover:text-zinc-900 transition-all"
              >
                Back
              </button>
              <button
                disabled={!selectedProject || selectedOpportunities.length === 0}
                onClick={handleExecute}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                {isExecuting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Strategic Assets
              </button>
            </div>
          </motion.div>
        )}

        {step === 'execution' && executionResult && (
          <motion.div
            key="execution"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center space-y-8"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">Strategy Initialized</h3>
              <p className="text-zinc-500 mt-2">The system has successfully created your strategic assets. You can now begin execution.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                { label: 'Project Created', value: selectedProject?.title, icon: Rocket },
                { label: 'Personas Added', value: `${acceptedPersonas.length} New Profiles`, icon: Users },
                { label: 'Journey Map', value: 'Initial Map Generated', icon: MapIcon },
                { label: 'Sprint 1', value: 'Active & Ready', icon: Calendar },
                { label: 'Backlog', value: `${selectedOpportunities.length} Tasks Created`, icon: ListTodo },
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-4">
                  <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 flex gap-4 justify-center">
              <button
                onClick={() => setStep('input')}
                className="px-8 py-3 rounded-xl font-bold text-zinc-500 hover:text-zinc-900 transition-all"
              >
                Finish
              </button>
              <button
                onClick={() => {
                  if (createdProjectId && setActiveProjectId && onNavigate) {
                    setActiveProjectId(createdProjectId);
                    onNavigate('project_detail');
                  }
                }}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                Go to Project <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signal Details Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl max-w-lg w-full p-8 border border-zinc-200 dark:border-zinc-800 relative"
          >
            <button 
              onClick={() => setSelectedSignal(null)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                selectedSignal.sentiment === 'negative' ? "bg-rose-50 text-rose-600" :
                selectedSignal.sentiment === 'positive' ? "bg-emerald-50 text-emerald-600" :
                "bg-zinc-50 text-zinc-600"
              )}>
                {selectedSignal.type === 'Error' && <AlertCircle className="w-6 h-6" />}
                {selectedSignal.type === 'Request' && <MessageSquare className="w-6 h-6" />}
                {selectedSignal.type === 'Praise' && <Star className="w-6 h-6" />}
                {selectedSignal.type === 'Complaint' && <Frown className="w-6 h-6" />}
                {selectedSignal.type === 'Observation' && <FileText className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedSignal.title}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                    selectedSignal.sentiment === 'negative' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                    selectedSignal.sentiment === 'positive' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    "bg-zinc-50 text-zinc-700 border border-zinc-100"
                  )}>{selectedSignal.sentiment}</span>
                </div>
                <p className="text-sm text-zinc-500">Signal from {selectedSignal.source}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                  "{selectedSignal.description}"
                </p>
              </div>

              {selectedSignal.metadata && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Author</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{selectedSignal.metadata.author || 'Anonymous'}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      {[...Array(selectedSignal.metadata.rating || 0)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                    <Database className="w-3 h-3" />
                    {selectedSignal.source}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedSignal.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
