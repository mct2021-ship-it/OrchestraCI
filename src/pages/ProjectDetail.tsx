import React, { useState, useEffect } from 'react';
import { Project, JourneyMap, ProcessMap, Task, Persona, Product, Service, TeamMember, RAIDItem, User, RecycleBinItem, Stakeholder } from '../types';
import { CompanyProfile } from '../components/YourCompany';
import { CreatePersonaModal } from '../components/CreatePersonaModal';
import { usePlan } from '../context/PlanContext';
import { LimitReachedModal } from '../components/LimitReachedModal';
import { ContextualHelp } from '../components/ContextualHelp';
import { 
  Info, 
  Map as MapIcon, 
  GitMerge, 
  Target, 
  Plus, 
  ChevronRight, 
  LayoutDashboard,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  Sparkles,
  Frown,
  BrainCircuit,
  ArrowRight,
  X,
  Package,
  Layers,
  UsersRound,
  User as UserIcon,
  AlertTriangle,
  Shield,
  UserPlus,
  Trash2,
  Edit2,
  KanbanSquare,
  Upload,
  Leaf,
  CheckSquare,
  ShieldAlert,
  Check,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { EditableText } from '../components/EditableText';
import { AvatarGalleryModal } from '../components/AvatarGalleryModal';
import { usePermissions } from '../hooks/usePermissions';
import { PRESET_AVATARS } from '../constants';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { Type, ThinkingLevel } from "@google/genai";
import { stripPIData } from '../lib/piStripper';
import ReactMarkdown from 'react-markdown';

interface ProjectDetailProps {
  project: Project;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  journeys: JourneyMap[];
  processMaps: ProcessMap[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  personas: Persona[];
  setPersonas?: React.Dispatch<React.SetStateAction<Persona[]>>;
  onNavigate: (tab: string, subTab?: string) => void;
  onOpenJourney: (journeyId: string) => void;
  products: Product[];
  services: Service[];
  isNewProject?: boolean;
  onOnboardingComplete?: () => void;
  currentUser?: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  stakeholders?: Stakeholder[];
  setStakeholders?: (items: Stakeholder[] | ((prev: Stakeholder[]) => Stakeholder[])) => void;
  onDeleteItem: (item: any, type: RecycleBinItem['type']) => void;
  isDarkMode?: boolean;
  companyProfile?: CompanyProfile;
}

import { AddTeamMemberModal } from '../components/AddTeamMemberModal';
import { HelpTooltip } from '../components/HelpTooltip';

interface FlipTileProps {
  title: string;
  icon: React.ElementType;
  description: string;
  onExplore: () => void;
  colorClass: string;
  iconColorClass: string;
}

const FlipTile: React.FC<FlipTileProps> = ({ title, icon: Icon, description, onExplore, colorClass, iconColorClass }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full h-64 cursor-pointer group"
      style={{ perspective: 1000 }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={cn("p-4 rounded-2xl", colorClass)}>
            <Icon className={cn("w-8 h-8", iconColorClass)} />
          </div>
          <h3 className="font-bold text-xl text-zinc-900 dark:text-white">{title}</h3>
          <p className="text-sm text-zinc-500 font-medium">Click to learn more</p>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 bg-indigo-600 rounded-3xl shadow-lg p-6 flex flex-col items-center justify-center text-center gap-4"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h3 className="font-bold text-xl text-white">{title}</h3>
          <p className="text-indigo-100 text-sm leading-relaxed">{description}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); onExplore(); }}
            className="mt-2 px-6 py-2 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors"
          >
            Explore
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export function ProjectDetail({ 
  project, 
  projects,
  setProjects,
  journeys, 
  processMaps, 
  tasks, 
  setTasks,
  personas,
  onNavigate,
  onOpenJourney,
  products: globalProducts,
  services: globalServices,
  isNewProject,
  onOnboardingComplete,
  currentUser,
  users,
  setUsers,
  stakeholders = [],
  setStakeholders,
  onDeleteItem,
  isDarkMode,
  companyProfile,
  setPersonas
}: ProjectDetailProps) {
  const [activeDiamondStage, setActiveDiamondStage] = useState<'Discover' | 'Define' | 'Develop' | 'Deliver' | 'Done' | 'Archived'>(project.status);
  const [activeJourneyTab, setActiveJourneyTab] = useState<'As-Is' | 'Proposed' | 'Implemented'>('As-Is');
  const [showStageMessage, setShowStageMessage] = useState(false);
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isEditingOutcomes, setIsEditingOutcomes] = useState(false);
  const [isSelectingPersonas, setIsSelectingPersonas] = useState(false);
  const [isCreatePersonaModalOpen, setIsCreatePersonaModalOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isEditingTaxonomy, setIsEditingTaxonomy] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isEditingRisks, setIsEditingRisks] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingRisk, setEditingRisk] = useState<RAIDItem | null>(null);
  const [showRoiReport, setShowRoiReport] = useState(false);
  const [roiReportContent, setRoiReportContent] = useState('');
  const [isGeneratingRoi, setIsGeneratingRoi] = useState(false);

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUserSelectionModalOpen, setIsUserSelectionModalOpen] = useState(false);

  const [isAiGeneratingStakeholders, setIsAiGeneratingStakeholders] = useState(false);
  const [stakeholderAiSuggestions, setStakeholderAiSuggestions] = useState<Partial<Stakeholder>[]>([]);
  const [showStakeholderAiSuggestions, setShowStakeholderAiSuggestions] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  const allAvailableUsers = React.useMemo(() => {
    const list = [...users];
    if (currentUser && !list.some(u => u.id === currentUser.id)) {
      list.push(currentUser);
    }
    return list;
  }, [users, currentUser]);

  const { details } = usePlan();
  const { canEditProject, canEditProjectFeature } = usePermissions();
  const canEdit = canEditProject(project);
  const canEditFeatures = canEditProjectFeature(project);

  const projectRoles = ['Project Admin', 'Project Sponsor', 'Project Lead', 'Programme Lead', 'Product Owner', 'UX Lead', 'Tech Lead', 'Business Analyst', 'Member'];

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [project.id]);

  const togglePersona = (personaId: string) => {
    const currentIds = project.personaIds || [];
    const isSelected = currentIds.includes(personaId);
    
    if (!isSelected && currentIds.length >= details.maxPersonasPerProject) {
      setShowLimitModal(true);
      return;
    }

    const newIds = isSelected
      ? currentIds.filter(id => id !== personaId)
      : [...currentIds, personaId];
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, personaIds: newIds } : p));
  };

  const handleCreatePersona = (newPersona: Persona) => {
    if (setPersonas) {
      setPersonas(prev => [...prev, newPersona]);
    }
    
    // Automatically link to this project
    const currentIds = project.personaIds || [];
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, personaIds: [...currentIds, newPersona.id] } : p
    ));
    
    setIsCreatePersonaModalOpen(false);
  };

  const handleAiSuggestStakeholders = async () => {
    if (!companyProfile?.name || !companyProfile?.description) {
      // Toast would be nice here but we don't have addToast in this scope easily without prop or context
      // Let's assume it works or just fail silently/alert for now as Toast is in page scope
      return;
    }

    setIsAiGeneratingStakeholders(true);
    setShowStakeholderAiSuggestions(true);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) return;

      const ai = await getGeminiClient();
      if (!ai) throw new Error("Failed to initialize AI client");

      const categories = [
        'Executive Sponsor',
        'Director/Head of Service',
        'Corporate Function (IT, Finance, HR, Legal, Comms)',
        'Key Partner (Contractor, Housing, NHS, Third Sector)',
        'Regulator',
        'Resident/Tenant Group',
        'Union',
        'Other'
      ];

      const prompt = `Based on the following company profile and specific project, suggest 5 key stakeholders that should be involved.
      For each stakeholder, provide:
      - name: A specific job title or role (e.g., "Director of Sustainability", "Lead Systems Architect").
      - category: One of the existing categories: ${categories.join(', ')}.
      - organization: A likely department or external entity type.
      - about: A brief context on why this stakeholder is important for this specific project.

      Company Profile:
      Name: ${companyProfile.name}
      Vertical: ${companyProfile.vertical}
      Description: ${companyProfile.description}
      Strategic Goals: ${companyProfile.goals?.join(', ') || 'N/A'}

      Project Context:
      Name: ${project.name}
      Description: ${project.description}
      Goals: ${project.goals.join(', ')}
      
      Respond with a JSON object containing a "suggestions" array.`;

      const result = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    organization: { type: Type.STRING },
                    about: { type: Type.STRING }
                  },
                  required: ["name", "category", "organization", "about"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });

      const data = JSON.parse(result.text || '{}');
      setStakeholderAiSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error(err);
      setShowStakeholderAiSuggestions(false);
    } finally {
      setIsAiGeneratingStakeholders(false);
    }
  };

  const handleAcceptStakeholderAiSuggestion = (suggestion: Partial<Stakeholder>) => {
    if (!setStakeholders) return;

    const newStakeholder: Stakeholder = {
      id: `stk_ai_${Date.now()}_${Math.random()}`,
      name: suggestion.name!,
      category: suggestion.category!,
      organization: suggestion.organization,
      about: suggestion.about,
      isGlobal: false // Project specific context usually
    };
    
    // In this app, stakeholders are global in the main state
    setStakeholders(prev => [...prev, newStakeholder]);
    setStakeholderAiSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleAddProduct = () => {
    const newProduct = { id: uuidv4(), name: 'New Product', description: '' };
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, products: [...(p.products || []), newProduct] } : p));
  };

  const handleUpdateProduct = (id: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { 
      ...p, 
      products: p.products?.map(prod => prod.id === id ? { ...prod, name } : prod) 
    } : p));
  };

  const handleRemoveProduct = (id: string) => {
    const product = (project.products || []).find(p => p.id === id);
    if (product) {
      onDeleteItem(product, 'Product');
    }
    setProjects(prev => prev.map(p => p.id === project.id ? { 
      ...p, 
      products: p.products?.filter(prod => prod.id !== id),
      services: p.services?.filter(serv => serv.productId !== id)
    } : p));
  };

  const handleAddService = (productId: string) => {
    const newService = { id: uuidv4(), productId, name: 'New Service', description: '' };
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, services: [...(p.services || []), newService] } : p));
  };

  const handleUpdateService = (id: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { 
      ...p, 
      services: p.services?.map(serv => serv.id === id ? { ...serv, name } : serv) 
    } : p));
  };

  const handleRemoveService = (id: string) => {
    const service = (project.services || []).find(s => s.id === id);
    if (service) {
      onDeleteItem(service, 'Service');
    }
    setProjects(prev => prev.map(p => p.id === project.id ? { 
      ...p, 
      services: p.services?.filter(serv => serv.id !== id) 
    } : p));
  };

  const stageMessages = {
    Discover: "Great start! Focus on gathering deep customer insights and understanding the 'why' behind their behaviors.",
    Define: "Now let's synthesize those insights. Clearly articulate the problem we're solving for the customer.",
    Develop: "Time to ideate! Create and test potential solutions that directly address the customer's pain points.",
    Deliver: "Almost there! Refine the chosen solution and prepare for a seamless rollout to your customers.",
    Done: "Congratulations! You've successfully delivered an improved experience. Don't forget to measure the impact!"
  };

  const handleStageChange = (newStatus: Project['status']) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p));
    setShowStageMessage(true);
    setTimeout(() => setShowStageMessage(false), 10000);
    
    if (newStatus === 'Done') {
      handleGenerateRoi();
    }
  };

  const updateProjectField = <K extends keyof Project>(field: K, value: Project[K]) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, [field]: value, updatedAt: new Date().toISOString() } : p));
  };

  const handleGenerateRoi = async () => {
    setIsGeneratingRoi(true);
    setShowRoiReport(true);
    
    try {
      const ai = await getGeminiClient();
      if (!ai) {
        setRoiReportContent('Gemini API key is missing. Please select one to enable AI features.');
        await ensureApiKey();
        setIsGeneratingRoi(false);
        return;
      }
      
      const currentJourneys = journeys.filter(j => j.projectId === project.id && j.state === 'Current');
      const proposedJourneys = journeys.filter(j => j.projectId === project.id && j.state === 'Proposed');
      const implementedJourneys = journeys.filter(j => j.projectId === project.id && j.state === 'Implemented');
      
      const carbonData = {
        current: currentJourneys.reduce((sum, j) => sum + (j.carbonFootprint || 0), 0),
        proposed: proposedJourneys.reduce((sum, j) => sum + (j.carbonFootprint || 0), 0),
        implemented: implementedJourneys.reduce((sum, j) => sum + (j.carbonFootprint || 0), 0)
      };

      const prompt = `
        As a CX Transformation and Sustainability Consultant, generate a comprehensive ROI and Impact Report for the project: "${stripPIData(project.name)}".
        
        Project Overview:
        - Description: ${stripPIData(project.description)}
        - Goals: ${project.goals.map(stripPIData).join(', ')}
        - Outcomes: ${project.expectedOutcomes.map(stripPIData).join(', ')}
        
        Data Context:
        - Total Journeys: ${journeys.length}
        - Current Journeys: ${currentJourneys.length}
        - Proposed Journeys: ${proposedJourneys.length}
        - Implemented Journeys: ${implementedJourneys.length}
        - Completed Tasks: ${tasks.filter(t => t.status === 'Done').length}
        - Open Risks: ${project.risks?.filter(r => r.status === 'Open').length || 0}
        
        Carbon Footprint Data (Sustainability ROI):
        - Current Footprint: ${carbonData.current} kg CO2e
        - Proposed Footprint: ${carbonData.proposed} kg CO2e
        - Implemented Footprint: ${carbonData.implemented} kg CO2e
        
        Metrics Focus:
        ${(project.improvementFocus || []).map(f => `- ${f.metric}: Target ${f.target}`).join('\n')}
        
        Please provide a detailed report in Markdown format including:
        1. Executive Summary
        2. Strategic Impact & Customer Alignment
        3. Operational Efficiency Gains
        4. Financial ROI Analysis
        5. Sustainability & Carbon Reduction Impact (Highlight the CO2e savings if any)
        6. Future Recommendations
        
        Be professional, data-driven, and persuasive.
      `;

      const response = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      setRoiReportContent(response.text || "Unable to generate report.");
    } catch (error) {
      console.error('Error generating ROI report:', error);
      setRoiReportContent('Failed to generate report. Please check your Gemini API key and try again.');
    } finally {
      setIsGeneratingRoi(false);
    }
  };

  const handleAddFocus = () => {
    const newFocus = { metric: 'New Metric', target: 'Target Value' };
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, improvementFocus: [...(p.improvementFocus || []), newFocus] } : p));
  };

  const handleUpdateFocus = (idx: number, field: 'metric' | 'target', value: string) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { 
      ...p, 
      improvementFocus: p.improvementFocus?.map((f, i) => i === idx ? { ...f, [field]: value } : f) 
    } : p));
  };

  const handleRemoveFocus = (idx: number) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { 
      ...p, 
      improvementFocus: p.improvementFocus?.filter((_, i) => i !== idx) 
    } : p));
  };

  const handleAddTeamMember = (member: TeamMember) => {
    const updatedTeam = [...(project.team || []), member];
    setProjects(prev => prev.map(proj => 
      proj.id === project.id ? { ...proj, team: updatedTeam } : proj
    ));
    setIsUserSelectionModalOpen(false);
  };

  const handleAddCurrentUser = () => {
    if (!currentUser) return;
    const newMember: TeamMember = {
      id: uuidv4(),
      userId: currentUser.id,
      name: currentUser.name,
      jobTitle: currentUser.role || 'Team Member',
      projectRole: 'Member',
      photoUrl: currentUser.photoUrl || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`
    };
    handleAddTeamMember(newMember);
  };

  const handleUpdateTeamMember = (memberId: string, updates: Partial<TeamMember>) => {
    const updatedTeam = (project.team || []).map(m => m.id === memberId ? { ...m, ...updates } : m);
    setProjects(prev => prev.map(proj => 
      proj.id === project.id ? { ...proj, team: updatedTeam } : proj
    ));
  };

  const handleRemoveTeamMember = (memberId: string) => {
    const member = (project.team || []).find(m => m.id === memberId);
    if (member) {
      onDeleteItem(member, 'TeamMember');
    }
    const updatedTeam = (project.team || []).filter(m => m.id !== memberId);
    setProjects(prev => prev.map(proj => 
      proj.id === project.id ? { ...proj, team: updatedTeam } : proj
    ));
  };

  const handleAddRisk = () => {
    const newRisk: RAIDItem = {
      id: uuidv4(),
      type: 'Risk',
      description: 'New RAID Item Description',
      impact: 'Medium',
      probability: 'Medium',
      mitigation: 'Mitigation strategy...',
      status: 'Open',
      customFields: {}
    };
    const updatedRisks = [...(project.risks || []), newRisk];
    setProjects(prev => prev.map(proj => 
      proj.id === project.id ? { ...proj, risks: updatedRisks } : proj
    ));
    setEditingRisk(newRisk);
  };

  const handleUpdateRisk = (riskId: string, updates: Partial<RAIDItem>) => {
    const updatedRisks = (project.risks || []).map(r => r.id === riskId ? { ...r, ...updates } : r);
    setProjects(prev => prev.map(proj => 
      proj.id === project.id ? { ...proj, risks: updatedRisks } : proj
    ));
  };

  const handleRemoveRisk = (riskId: string) => {
    const risk = (project.risks || []).find(r => r.id === riskId);
    if (risk) {
      onDeleteItem(risk, 'RAIDItem');
    }
    const updatedRisks = (project.risks || []).filter(r => r.id !== riskId);
    setProjects(prev => prev.map(proj => 
      proj.id === project.id ? { ...proj, risks: updatedRisks } : proj
    ));
  };
  
  const filteredTasks = tasks.filter(t => t.status === activeDiamondStage);
  const currentJourneys = journeys.filter(j => j.state === 'Current');
  const proposedJourneys = journeys.filter(j => j.state === 'Proposed');
  const implementedJourneys = journeys.filter(j => j.state === 'Implemented');
  const targetPersonas = personas.filter(p => project.personaIds?.includes(p.id));

  const strategicAlignment = React.useMemo(() => {
    if (!companyProfile?.wizardCompleted) return null;
    
    // Calculate average emotion across all 'Current' journeys for this project
    const projectJourneys = journeys.filter(j => j.projectId === project.id && j.state === 'Current');
    if (projectJourneys.length === 0) return null;
    
    let totalEmotion = 0;
    let stageCount = 0;
    
    projectJourneys.forEach(j => {
      j.stages.forEach(s => {
        totalEmotion += s.emotion;
        stageCount++;
      });
    });
    
    const avgEmotion = totalEmotion / (stageCount || 1);
    const gap = 5 - avgEmotion; // How far from 'Perfect' (5)
    
    return {
      avgEmotion,
      gap,
      isMisaligned: avgEmotion < 3.5, // 4-5 is healthy, < 3.5 is at risk
      severity: avgEmotion < 2.5 ? 'High' : (avgEmotion < 3.5 ? 'Medium' : 'Low')
    };
  }, [journeys, project.id, companyProfile]);

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      <ContextualHelp 
        title="Project Overview" 
        description="The Project Overview is your central hub for managing the project's lifecycle, team, and key focus areas. Use this dashboard to track progress through the Double Diamond phases, manage your team, and align on the core mission and taxonomy."
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Project Overview
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
            <EditableText 
              value={project.name} 
              onChange={(val) => updateProjectField('name', val)}
              className="text-3xl sm:text-4xl font-bold"
            />
          </h1>
          <div className="max-w-2xl">
            <EditableText 
              value={project.description} 
              onChange={(val) => updateProjectField('description', val)}
              className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base"
              multiline
            />
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => onNavigate('kanban')}
              className="flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4" />
              Kanban Board
            </button>
            {project.status === 'Done' && (
              <button
                onClick={handleGenerateRoi}
                className="flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow-md hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4" />
                ROI Report
              </button>
            )}
          </div>

          {/* Compact Taxonomy Selector */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-sm w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-1.5 mr-2">
              <Package className="w-3 h-3 text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Taxonomy</span>
            </div>
            <div className="flex gap-1.5">
              {(project.products || []).slice(0, 1).map(p => (
                <div key={p.id} className="px-2 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-100 rounded text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                  {p.name}
                </div>
              ))}
              {(project.services || []).slice(0, 1).map(s => (
                <div key={s.id} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 rounded text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                  {s.name}
                </div>
              ))}
              <button 
                onClick={() => setIsEditingTaxonomy(true)}
                className="p-1 hover:bg-zinc-200 rounded transition-colors"
                title="Edit Taxonomy"
              >
                <Plus className="w-3 h-3 text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Double Diamond Progress Bar */}
      {project.useDoubleDiamond !== false && (
        <div className="mb-8 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Project Lifecycle Stage</h3>
              <HelpTooltip content="The stage represents the current phase of your project in the Double Diamond framework. Changing the stage helps track progress but does not affect your current navigation tab." />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-2">Current:</span>
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full shadow-sm border",
                project.status === 'Discover' ? "bg-blue-50 text-blue-700 border-blue-100" :
                project.status === 'Define' ? "bg-purple-50 text-purple-700 border-purple-100" :
                project.status === 'Develop' ? "bg-amber-50 text-amber-700 border-amber-100" :
                project.status === 'Deliver' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                "bg-zinc-100 text-zinc-700 border-zinc-200"
              )}>
                {project.status}
              </span>
            </div>
          </div>
          
          <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner mb-8">
            {['Discover', 'Define', 'Develop', 'Deliver', 'Done'].map((stage, idx) => {
              const isActive = project.status === stage;
              const isPast = ['Discover', 'Define', 'Develop', 'Deliver', 'Done'].indexOf(project.status || 'Discover') > idx;
              const isCurrentOrPast = isActive || isPast;
              
              return (
                <div 
                  key={stage}
                  className={cn(
                    "h-full flex-1 border-r border-white/20 last:border-0 transition-all duration-500 relative",
                    isCurrentOrPast ? (
                      stage === 'Discover' ? "bg-blue-500" :
                      stage === 'Define' ? "bg-purple-500" :
                      stage === 'Develop' ? "bg-amber-500" :
                      stage === 'Deliver' ? "bg-emerald-500" :
                      "bg-zinc-500"
                    ) : "bg-transparent"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-stage-indicator"
                      className="absolute inset-0 bg-white/30"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {['Discover', 'Define', 'Develop', 'Deliver', 'Done'].map((stage, idx) => {
              const isActive = project.status === stage;
              const isPast = ['Discover', 'Define', 'Develop', 'Deliver', 'Done'].indexOf(project.status || 'Discover') > idx;
              
              return (
                <button
                  key={stage}
                  onClick={() => canEdit && handleStageChange(stage as any)}
                  disabled={!canEdit}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all group relative",
                    isActive 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    !canEdit && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all",
                    isActive ? "bg-indigo-600 border-indigo-600 text-white" :
                    isPast ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400" :
                    "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 group-hover:border-zinc-300"
                  )}>
                    {idx + 1}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                    isActive ? "text-indigo-600 dark:text-indigo-400" : 
                    isPast ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600"
                  )}>
                    {stage}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-dot"
                      className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white dark:border-zinc-900"
                    />
                  )}
                </button>
              );
            })}
          </div>
          
          <AnimatePresence>
            {showStageMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex items-start gap-3"
              >
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium leading-relaxed">
                  {stageMessages[project.status as keyof typeof stageMessages]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Prompts for missing items */}
      <div className="space-y-4 mb-8">
        {(!project.personaIds || (project.personaIds || []).length === 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-indigo-500"
          >
            <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <div className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">Project Launchpad</div>
                   <Sparkles className="w-4 h-4 text-indigo-200" />
                </div>
                <h3 className="text-xl font-bold">Who are we transforming for?</h3>
                <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                  Your project currently has no assigned personas. Linking personas allows for precise strategic alignment and personalized journey mapping.
                </p>
              </div>
              <button
                onClick={() => setIsSelectingPersonas(true)}
                className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold transition-all shadow-md hover:bg-indigo-50 flex items-center gap-2 shrink-0 group"
              >
                Assign Project Personas
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {(journeys.filter(j => j.projectId === project.id).length === 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-zinc-800"
          >
            <div className="absolute top-0 right-0 p-24 bg-indigo-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pr-12" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <div className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strategy Gap</div>
                   <MapIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold">Start your first Journey Map</h3>
                <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
                  Every successful transformation starts with understanding the current experience. Create an "As-Is" map to pinpoint friction.
                </p>
              </div>
              <button
                onClick={() => onNavigate('journeys', 'new')}
                className="bg-zinc-100 text-zinc-900 px-8 py-3 rounded-2xl font-bold transition-all shadow-md hover:bg-white flex items-center gap-2 shrink-0 group"
              >
                Launch Journey Studio
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => onNavigate('tasks')}>
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {tasks.filter(t => t.projectId === project.id && !['Done', 'Completed', 'Finished', 'Archived'].includes(t.status)).length}
          </h4>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Tasks</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-amber-300 transition-colors cursor-pointer" onClick={() => onNavigate('journeys')}>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <MapIcon className="w-5 h-5" />
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {journeys.filter(j => j.projectId === project.id).length}
          </h4>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Journey Maps</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setIsSelectingPersonas(true)}>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <UsersRound className="w-5 h-5" />
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {targetPersonas.length}
          </h4>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Target Personas</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-teal-300 transition-colors cursor-pointer" onClick={() => onNavigate('process_maps')}>
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
            <GitMerge className="w-5 h-5" />
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {processMaps.filter(pm => pm.projectId === project.id).length}
          </h4>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Process Maps</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm flex flex-col items-center justify-center text-center hover:border-rose-300 transition-colors cursor-pointer" onClick={() => onNavigate('raid')}>
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {(project.risks || []).filter(r => r.status === 'Open').length}
          </h4>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Open Risks</p>
        </div>
      </div>

      {companyProfile && companyProfile.wizardCompleted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-indigo-600" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Strategic Alignment</h3>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 italic serif">
                Aiming for: {companyProfile.targetEmotions.join(', ')}
              </h4>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed max-w-lg mb-4">
                Your company strategy focuses on delivering {companyProfile.customerBenefits.toLowerCase()}. 
                Ensure every task in this project reinforces these core values.
              </p>

              {strategicAlignment && (
                <div className={cn(
                  "p-3 rounded-2xl flex items-center gap-3 border",
                  strategicAlignment.isMisaligned 
                    ? "bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/50" 
                    : "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50"
                )}>
                  <div className={cn(
                    "p-2 rounded-xl",
                    strategicAlignment.isMisaligned ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {strategicAlignment.isMisaligned ? <Frown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Strategic Sentiment Gap</p>
                    <p className={cn(
                      "text-xs font-bold",
                      strategicAlignment.isMisaligned ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {strategicAlignment.isMisaligned 
                        ? `${strategicAlignment.severity} Misalignment Detected` 
                        : 'Perfectly Aligned with Strategy'}
                    </p>
                  </div>
                </div>
              )}

              {strategicAlignment?.isMisaligned && (
                <div className="mt-4 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">AI Alignment Strategy</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                    Current sentiment is trending below your target. Recommendation: Prioritize tasks linked to "{companyProfile.customerBenefits.split('\n')[0]}" and investigate the {strategicAlignment.severity === 'High' ? 'critical' : 'moderate'} friction in the current journey stages.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="relative h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">Contextual Intelligence</h3>
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 italic serif">
                Contextual Intelligence
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                Add intelligence or context specific to this project to guide AI recommendations across Orchestra.
              </p>
              <div className="flex-1">
                <EditableText
                  value={project.contextualIntelligence || 'Enter any specific context, intelligence data, market constraints, or business assumptions that the AI should consider for this project...'}
                  onChange={(val) => updateProjectField('contextualIntelligence', val)}
                  className="w-full text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap"
                  multiline
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Taxonomy Editor Modal */}
      <AnimatePresence>
        {isEditingTaxonomy && (
          <div key="taxonomy-modal" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Manage Products and Services</h3>
                </div>
                <button 
                  onClick={() => setIsEditingTaxonomy(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Global Taxonomy Selection */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Product</h4>
                    <div className="flex flex-wrap gap-2">
                      {globalProducts.map(p => {
                        const isSelected = (project.products || []).some(pp => pp.id === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (isSelected) {
                                setProjects(prev => prev.map(proj => 
                                  proj.id === project.id ? { ...proj, products: [], services: [] } : proj
                                ));
                              } else {
                                setProjects(prev => prev.map(proj => 
                                  proj.id === project.id ? { ...proj, products: [p], services: [] } : proj
                                ));
                              }
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                              isSelected 
                                ? "bg-indigo-600 text-white border-transparent shadow-md" 
                                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                            )}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {project.products && project.products.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Service</h4>
                      <div className="flex flex-wrap gap-2">
                        {globalServices
                          .filter(s => project.products?.some(p => p.id === s.productId))
                          .map(s => {
                            const isSelected = (project.services || []).some(ss => ss.id === s.id);
                            return (
                              <button
                                key={s.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setProjects(prev => prev.map(proj => 
                                      proj.id === project.id ? { ...proj, services: [] } : proj
                                    ));
                                  } else {
                                    setProjects(prev => prev.map(proj => 
                                      proj.id === project.id ? { ...proj, services: [s] } : proj
                                    ));
                                  }
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                  isSelected 
                                    ? "bg-emerald-600 text-white border-transparent shadow-md" 
                                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                )}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 flex justify-end">
                <button 
                  onClick={() => setIsEditingTaxonomy(false)}
                  className="px-8 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Charter */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col mb-8">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Project Charter</h3>
          </div>
          {canEdit && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditingTaxonomy(!isEditingTaxonomy)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Package className="w-3 h-3" />
                Products & Services
              </button>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
              <button 
                onClick={() => setIsEditingTags(!isEditingTags)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                {isEditingTags ? 'Done' : 'Edit Tags'}
              </button>
            </div>
          )}
        </div>
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            {/* Strategy & Purpose */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">The Mission</h4>
              <EditableText 
                value={project.purpose} 
                onChange={(val) => updateProjectField('purpose', val)}
                className="text-zinc-700 dark:text-zinc-200 text-xl font-medium leading-relaxed"
                multiline
              />
              <div className="flex flex-wrap gap-2 items-center mt-4">
                {project.taxonomy.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 uppercase tracking-wider flex items-center gap-1">
                    {isEditingTags ? (
                      <EditableText 
                        value={tag} 
                        onChange={(val) => {
                          const newTaxonomy = [...project.taxonomy];
                          newTaxonomy[i] = val;
                          updateProjectField('taxonomy', newTaxonomy);
                        }}
                        className="w-16"
                      />
                    ) : (
                      tag
                    )}
                    {isEditingTags && (
                      <button 
                        onClick={() => {
                          const newTaxonomy = project.taxonomy.filter((_, idx) => idx !== i);
                          updateProjectField('taxonomy', newTaxonomy);
                        }}
                        className="text-zinc-400 hover:text-rose-500 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {isEditingTags && (
                  <button 
                    onClick={() => updateProjectField('taxonomy', [...project.taxonomy, 'New Tag'])}
                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-100 dark:border-indigo-800 uppercase tracking-wider flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Tag
                  </button>
                )}
              </div>
            </div>

            {/* Improvement Focus */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Improvement Focus</h4>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditingFocus(!isEditingFocus)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      {isEditingFocus ? 'Done' : 'Edit'}
                    </button>
                    {isEditingFocus && (
                      <button 
                        onClick={handleAddFocus}
                        className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {project.improvementFocus && project.improvementFocus.length > 0 ? (
                  project.improvementFocus.map((focus, idx) => {
                    const colors = [
                      { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-500', text: 'text-emerald-600', icon: 'TrendingUp' },
                      { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-500', text: 'text-blue-600', icon: 'Zap' },
                      { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-500', text: 'text-amber-600', icon: 'DollarSign' },
                      { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-500', text: 'text-purple-600', icon: 'Target' },
                    ];
                    const theme = colors[idx % colors.length];
                    
                    return (
                      <div key={idx} className={`p-4 ${theme.bg} rounded-2xl border ${theme.border} flex items-center gap-4 relative group`}>
                        <div className={`p-3 ${theme.iconBg} text-white rounded-xl`}>
                          {theme.icon === 'TrendingUp' && <TrendingUp className="w-5 h-5" />}
                          {theme.icon === 'Zap' && <Zap className="w-5 h-5" />}
                          {theme.icon === 'DollarSign' && <DollarSign className="w-5 h-5" />}
                          {theme.icon === 'Target' && <Target className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          {isEditingFocus ? (
                            <div className="space-y-2">
                              <EditableText 
                                value={focus.metric}
                                onChange={(val) => handleUpdateFocus(idx, 'metric', val)}
                                className="text-xs font-bold uppercase tracking-wider"
                              />
                              <EditableText 
                                value={focus.target}
                                onChange={(val) => handleUpdateFocus(idx, 'target', val)}
                                className="text-sm font-bold"
                              />
                            </div>
                          ) : (
                            <>
                              <p className={`text-xs font-bold ${theme.text} uppercase tracking-wider`}>{focus.metric}</p>
                              <p className="text-lg font-bold text-zinc-900 dark:text-white">{focus.target}</p>
                            </>
                          )}
                        </div>
                        {isEditingFocus && (
                          <button 
                            onClick={() => handleRemoveFocus(idx)}
                            className="absolute -top-2 -right-2 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-3 h-3 rotate-45" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-zinc-400 text-sm">
                    No improvement focus defined.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Company Strategic Goals (Alignment) */}
            {companyProfile?.goals && companyProfile.goals.length > 0 && (
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-zinc-900 dark:text-white">Company Strategic Goals</h4>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {companyProfile.goals.map((goal, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-100/50 shadow-sm">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Goals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-bold text-zinc-900 dark:text-white">Strategic Goals</h4>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditingGoals(!isEditingGoals)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      {isEditingGoals ? 'Done' : 'Edit'}
                    </button>
                    {isEditingGoals && (
                      <button 
                        onClick={() => updateProjectField('goals', [...project.goals, 'New Goal'])}
                        className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <ul className="space-y-4">
                {project.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300 group relative">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 group-hover:scale-150 transition-transform" />
                    {isEditingGoals ? (
                      <div className="flex-1 flex items-center gap-2">
                        <EditableText 
                          value={goal} 
                          onChange={(val) => {
                            const newGoals = [...project.goals];
                            newGoals[i] = val;
                            updateProjectField('goals', newGoals);
                          }}
                          className="text-sm flex-1"
                        />
                        <button 
                          onClick={() => {
                            const newGoals = project.goals.filter((_, idx) => idx !== i);
                            updateProjectField('goals', newGoals);
                          }}
                          className="text-zinc-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm leading-relaxed">{goal}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected Outcomes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-zinc-900 dark:text-white">Expected Outcomes</h4>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditingOutcomes(!isEditingOutcomes)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      {isEditingOutcomes ? 'Done' : 'Edit'}
                    </button>
                    {isEditingOutcomes && (
                      <button 
                        onClick={() => updateProjectField('expectedOutcomes', [...project.expectedOutcomes, 'New Outcome'])}
                        className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <ul className="space-y-4">
                {project.expectedOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300 group relative">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-150 transition-transform" />
                    {isEditingOutcomes ? (
                      <div className="flex-1 flex items-center gap-2">
                        <EditableText
                          value={outcome}
                          onChange={(val) => {
                            const newOutcomes = [...project.expectedOutcomes];
                            newOutcomes[i] = val;
                            updateProjectField('expectedOutcomes', newOutcomes);
                          }}
                          className="flex-1 text-sm"
                        />
                        <button
                          onClick={() => {
                            const newOutcomes = project.expectedOutcomes.filter((_, index) => index !== i);
                            updateProjectField('expectedOutcomes', newOutcomes);
                          }}
                          className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm leading-relaxed">{outcome}</span>
                    )}
                  </li>
                ))}
                {(project.expectedOutcomes || []).length === 0 && (
                  <li className="text-sm text-zinc-400 italic">No expected outcomes defined.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Project Team */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <UsersRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Project Team</h3>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsUserSelectionModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  Add Member
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(project.team || []).map(member => {
              const linkedUser = member.userId ? users.find(u => u.id === member.userId) : null;
              const displayName = linkedUser ? linkedUser.name : member.name;
              const displayPhoto = linkedUser ? linkedUser.photoUrl : member.photoUrl;

              return (
                <div 
                  key={member.id}
                  className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center text-center gap-3 relative group"
                >
                  <img 
                    src={displayPhoto || `https://i.pravatar.cc/150?u=${member.id}`} 
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{member.jobTitle}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-wider">
                      {member.projectRole}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        onClick={() => setEditingMember(member)}
                        className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {(project.team || []).length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-400 text-sm">No team members added yet.</div>
            )}
          </div>
        </div>

        {/* Project Personas */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Project Personas</h3>
            </div>
            {canEdit && (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsCreatePersonaModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Create Persona
                </button>
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                <button 
                  onClick={() => setIsSelectingPersonas(!isSelectingPersonas)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  {isSelectingPersonas ? 'Done' : 'Select Personas'}
                </button>
              </div>
            )}
          </div>

          {isSelectingPersonas ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePersona(p.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3",
                    (project.personaIds || []).includes(p.id)
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-zinc-100 hover:border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  )}
                >
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate w-full">{p.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate w-full">{p.role}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {personas.filter(p => (project.personaIds || []).includes(p.id)).map(p => (
                <div key={p.id} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center text-center gap-3">
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{p.role}</p>
                  </div>
                </div>
              ))}
              {(project.personaIds || []).length === 0 && (
                <div className="col-span-full py-8 text-center text-zinc-400 text-sm">
                  No personas selected for this project.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

          <div className="lg:col-span-3">
            <LimitReachedModal
              isOpen={showLimitModal}
              onClose={() => setShowLimitModal(false)}
              title="Project Persona Limit"
              description={`You've reached the maximum number of personas allowed per project on your current plan (${details.maxPersonasPerProject}). Upgrade to assign more personas to this project.`}
              limitType="personas"
              currentUsage={project.personaIds?.length || 0}
              maxLimit={details.maxPersonasPerProject}
              onUpgrade={() => onNavigate('pricing')}
              isDarkMode={isDarkMode}
            />
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FlipTile 
            title="Stakeholder Mapping" 
            icon={Target} 
            colorClass="bg-purple-100" 
            iconColorClass="text-purple-600"
            description="Map and track project stakeholders on a power-interest grid to optimize engagement."
            onExplore={() => onNavigate('stakeholder_mapping')}
          />
          <FlipTile 
            title="Journey Maps" 
            icon={MapIcon} 
            colorClass="bg-amber-100" 
            iconColorClass="text-amber-600"
            description="Visualize the customer experience over time to identify pain points and opportunities."
            onExplore={() => onNavigate('journeys')}
          />
          <FlipTile 
            title="Sprint and Backlogs" 
            icon={Clock} 
            colorClass="bg-blue-100" 
            iconColorClass="text-blue-600"
            description="Plan sprints and manage your product backlog to keep development on track."
            onExplore={() => onNavigate('backlog_sprints')}
          />
          <FlipTile 
            title="Kanban Board" 
            icon={KanbanSquare} 
            colorClass="bg-indigo-100" 
            iconColorClass="text-indigo-600"
            description="Manage tasks and track progress through customizable workflows."
            onExplore={() => onNavigate('kanban')}
          />
          <FlipTile 
            title="Process Maps" 
            icon={GitMerge} 
            colorClass="bg-rose-100" 
            iconColorClass="text-rose-600"
            description="Map out internal processes to identify inefficiencies and align with customer journeys."
            onExplore={() => onNavigate('process_maps')}
          />
          <FlipTile 
            title="RAID Log" 
            icon={Shield} 
            colorClass="bg-rose-100" 
            iconColorClass="text-rose-600"
            description="Track Risks, Assumptions, Issues, and Dependencies to ensure successful project delivery."
            onExplore={() => onNavigate('raid')}
          />
        </div>
      <AnimatePresence mode="wait">
        {/* User Selection Modal */}
        <AddTeamMemberModal
          isOpen={isUserSelectionModalOpen}
          onClose={() => setIsUserSelectionModalOpen(false)}
          project={project}
          projects={projects}
          setProjects={setProjects}
          users={users}
          setUsers={setUsers}
          onAddMember={handleAddTeamMember}
          isAdmin={isAdmin}
        />

        {/* Team Member Modal */}
        {editingMember && (
          <div key="member-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <UsersRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Edit Team Member</h3>
                </div>
                <button 
                  onClick={() => setEditingMember(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Link to Account</label>
                  <select 
                    value={editingMember.userId || ''}
                    onChange={(e) => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      if (selectedUser) {
                        setEditingMember({
                          ...editingMember,
                          userId: selectedUser.id,
                          name: selectedUser.name,
                          photoUrl: selectedUser.photoUrl || '',
                        });
                      } else {
                        setEditingMember({
                          ...editingMember,
                          userId: undefined
                        });
                      }
                    }}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  >
                    <option value="">Select an existing account...</option>
                    {allAvailableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-400">Linking an account will auto-fill name and photo.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Name</label>
                  <input 
                    type="text"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Job Title</label>
                  <input 
                    type="text"
                    value={editingMember.jobTitle}
                    onChange={(e) => setEditingMember({ ...editingMember, jobTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Role</label>
                  <div className="space-y-3">
                    <select 
                      value={projectRoles.includes(editingMember.projectRole) ? editingMember.projectRole : 'Custom'}
                      onChange={(e) => {
                        if (e.target.value === 'Custom') {
                          setEditingMember({ ...editingMember, projectRole: '' });
                        } else {
                          setEditingMember({ ...editingMember, projectRole: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    >
                      {projectRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      <option value="Custom">Custom Role...</option>
                    </select>
                    {!projectRoles.includes(editingMember.projectRole) && (
                      <input 
                        type="text"
                        value={editingMember.projectRole}
                        onChange={(e) => setEditingMember({ ...editingMember, projectRole: e.target.value })}
                        placeholder="Enter custom role"
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Photo</label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {editingMember.photoUrl ? (
                        <img src={editingMember.photoUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <UserIcon className="w-10 h-10" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input 
                          type="file" 
                          id="member-photo-upload"
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setEditingMember({ ...editingMember, photoUrl: event.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label 
                          htmlFor="member-photo-upload"
                          className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Photo
                        </label>
                        <button
                          onClick={() => setIsAvatarModalOpen(true)}
                          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-xs font-bold"
                        >
                          Browse Gallery
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quick Select Avatar</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {PRESET_AVATARS.slice(0, 6).map((url, i) => (
                          <button 
                            key={i}
                            onClick={() => setEditingMember({ ...editingMember, photoUrl: url })}
                            className={cn(
                              "w-10 h-10 rounded-full overflow-hidden border-2 transition-all shrink-0",
                              editingMember.photoUrl === url ? "border-indigo-600 scale-110 shadow-sm" : "border-transparent hover:border-zinc-300"
                            )}
                          >
                            <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setEditingMember(null)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleUpdateTeamMember(editingMember.id, editingMember);
                    setEditingMember(null);
                  }}
                  className="px-8 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all"
                >
                  Save Member
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Risk Item Modal */}
        {editingRisk && (
          <div key="risk-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Edit Risk Item</h3>
                </div>
                <button 
                  onClick={() => setEditingRisk(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Type</label>
                  <select 
                    value={editingRisk.type || 'Risk'}
                    onChange={(e) => setEditingRisk({ ...editingRisk, type: e.target.value as any })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  >
                    {['Risk', 'Assumption', 'Issue', 'Dependency'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={editingRisk.description}
                    onChange={(e) => setEditingRisk({ ...editingRisk, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Impact</label>
                    <select 
                      value={editingRisk.impact}
                      onChange={(e) => setEditingRisk({ ...editingRisk, impact: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    >
                      {['Low', 'Medium', 'High'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Probability</label>
                    <select 
                      value={editingRisk.probability}
                      onChange={(e) => setEditingRisk({ ...editingRisk, probability: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    >
                      {['Low', 'Medium', 'High'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</label>
                  <select 
                    value={editingRisk.status}
                    onChange={(e) => setEditingRisk({ ...editingRisk, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                  >
                    {['Open', 'Mitigated', 'Closed'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Mitigation Strategy</label>
                  <textarea 
                    value={editingRisk.mitigation}
                    onChange={(e) => setEditingRisk({ ...editingRisk, mitigation: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200 italic"
                  />
                </div>

                {Array.from(new Set(project.raidCustomFields || [])).map(field => (
                  <div key={field} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{field}</label>
                      <button
                        onClick={() => {
                          const updatedFields = project.raidCustomFields?.filter(f => f !== field);
                          setProjects(prev => prev.map(proj => 
                            proj.id === project.id ? { ...proj, raidCustomFields: updatedFields } : proj
                          ));
                        }}
                        className="text-xs text-rose-500 hover:text-rose-600"
                      >
                        Remove Field
                      </button>
                    </div>
                    <input 
                      type="text"
                      value={editingRisk.customFields?.[field] || ''}
                      onChange={(e) => setEditingRisk({
                        ...editingRisk,
                        customFields: {
                          ...(editingRisk.customFields || {}),
                          [field]: e.target.value
                        }
                      })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200"
                    />
                  </div>
                ))}
              </div>

              <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setEditingRisk(null)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleUpdateRisk(editingRisk.id, editingRisk);
                    setEditingRisk(null);
                  }}
                  className="px-8 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all"
                >
                  Save Risk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ROI Report Modal */}
      <AnimatePresence>
        {showRoiReport && (
          <div key="roi-modal" className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">AI-Driven ROI Report</h3>
                </div>
                <button 
                  onClick={() => setShowRoiReport(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-8 overflow-y-auto">
                {isGeneratingRoi ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="font-bold text-zinc-900 dark:text-white">Analyzing Project Outcomes...</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Calculating ROI and synthesizing customer centric transformation impact.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        This report was generated by AI based on your project data, journey maps, and task completion metrics. You can edit the content below before downloading.
                      </p>
                    </div>
                    <textarea 
                      value={roiReportContent}
                      onChange={(e) => setRoiReportContent(e.target.value)}
                      className="w-full h-[500px] p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-mono text-sm text-zinc-700 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 flex items-center justify-between">
                <p className="text-xs text-zinc-400 font-medium italic">
                  Tip: Use this report to demonstrate the value of customer centricity to stakeholders.
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowRoiReport(false)}
                    className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    disabled={isGeneratingRoi}
                    onClick={() => {
                      const blob = new Blob([roiReportContent], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${project.name.replace(/\s+/g, '_')}_ROI_Report.md`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-8 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Package className="w-4 h-4" />
                    Download Report (.md)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AvatarGalleryModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={(url) => {
          if (editingMember) {
            setEditingMember({ ...editingMember, photoUrl: url });
          }
        }}
      />

      <CreatePersonaModal 
        isOpen={isCreatePersonaModalOpen}
        onClose={() => setIsCreatePersonaModalOpen(false)}
        onSave={handleCreatePersona}
        companyProfile={companyProfile}
      />

    </div>
  );
}
