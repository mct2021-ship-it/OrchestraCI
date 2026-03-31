import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { defaultSwimlanes } from '../data/mockData';
import { ContextualHelp } from '../components/ContextualHelp';
import { Plus, Smile, Meh, Frown, ArrowRight, Settings2, Download, Share2, Trash2, Wand2, X, ChevronUp, ChevronDown, ChevronRight, GitMerge, Package, Layers, Printer, Map, Eye, EyeOff, Sparkles, MessageSquare, Target, FileText, CheckCircle2, Archive, Copy, Search, ShoppingCart, CreditCard, Truck, Home, User as UserIcon, Phone, Mail, Calendar, Clock, Star, Heart, ThumbsUp, Zap, Shield, Briefcase, Coffee, Music, Video, Camera, Image as ImageIcon, Book, Compass, Navigation, AlertCircle, Lightbulb, Settings, Users, Monitor, BarChart, CheckSquare, Flag, AlertTriangle, ShoppingBag, RefreshCw, Leaf, Activity, TrendingDown, MoreHorizontal } from 'lucide-react';

const STAGE_ICONS = [
  { name: 'Target', icon: Target },
  { name: 'Search', icon: Search },
  { name: 'Eye', icon: Eye },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'RefreshCw', icon: RefreshCw },
  { name: 'Truck', icon: Truck },
  { name: 'Home', icon: Home },
  { name: 'User', icon: UserIcon },
  { name: 'Phone', icon: Phone },
  { name: 'Mail', icon: Mail },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'Calendar', icon: Calendar },
  { name: 'Clock', icon: Clock },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'ThumbsUp', icon: ThumbsUp },
  { name: 'Zap', icon: Zap },
  { name: 'Shield', icon: Shield },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Coffee', icon: Coffee },
  { name: 'Music', icon: Music },
  { name: 'Video', icon: Video },
  { name: 'Camera', icon: Camera },
  { name: 'Image', icon: ImageIcon },
  { name: 'Book', icon: Book },
  { name: 'Compass', icon: Compass },
  { name: 'Navigation', icon: Navigation },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Flag', icon: Flag },
  { name: 'CheckCircle2', icon: CheckCircle2 },
  { name: 'AlertTriangle', icon: AlertTriangle },
  { name: 'HelpCircle', icon: AlertCircle }, // Using AlertCircle as HelpCircle proxy if needed, or just AlertCircle
];

const SWIMLANE_ICONS = [
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'AlertTriangle', icon: AlertTriangle },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Settings', icon: Settings },
  { name: 'Users', icon: Users },
  { name: 'Monitor', icon: Monitor },
  { name: 'BarChart', icon: BarChart },
  { name: 'FileText', icon: FileText },
  { name: 'CheckSquare', icon: CheckSquare },
  { name: 'Flag', icon: Flag },
  { name: 'Zap', icon: Zap },
  { name: 'Clock', icon: Clock },
  { name: 'Heart', icon: Heart },
  { name: 'Smile', icon: Smile },
  { name: 'Frown', icon: Frown },
  { name: 'Target', icon: Target },
  { name: 'Search', icon: Search },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'Truck', icon: Truck },
  { name: 'Home', icon: Home },
  { name: 'Phone', icon: Phone },
  { name: 'Mail', icon: Mail },
  { name: 'Calendar', icon: Calendar },
  { name: 'Star', icon: Star },
  { name: 'Shield', icon: Shield },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Coffee', icon: Coffee },
  { name: 'Music', icon: Music },
  { name: 'Video', icon: Video },
  { name: 'Camera', icon: Camera },
  { name: 'Image', icon: ImageIcon },
  { name: 'Book', icon: Book },
  { name: 'Compass', icon: Compass },
  { name: 'Navigation', icon: Navigation },
  { name: 'Database', icon: Layers }, // Using Layers as Database proxy
  { name: 'Server', icon: Settings2 }, // Using Settings2 as Server proxy
];

const getIconComponent = (iconName?: string) => {
  const icon = STAGE_ICONS.find(i => i.name === iconName);
  return icon ? icon.icon : Target;
};

const getSwimlaneIconComponent = (iconName?: string) => {
  const icon = SWIMLANE_ICONS.find(i => i.name === iconName);
  return icon ? icon.icon : Layers;
};
import { JourneyStage, Swimlane, JourneyMap, Product, Service, Persona, Task, Project, ProcessMap, Comment, User, RecycleBinItem } from '../types';
import { EditableText } from '../components/EditableText';
import { CreateJourneyModal } from '../components/CreateJourneyModal';
import { JourneyAiAssistant } from '../components/JourneyAiAssistant';
import { CarbonLibraryModal } from '../components/CarbonLibraryModal';
import { carbonLibrary } from '../data/carbonLibrary';
import { BookOpen } from 'lucide-react';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { Type, ThinkingLevel } from "@google/genai";
import { stripPIData } from '../lib/piStripper';
import { CommentsPanel } from '../components/CommentsPanel';
import { VersionHistory } from '../components/VersionHistory';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface JourneyMapsProps {
  journeys: JourneyMap[];
  setJourneys: React.Dispatch<React.SetStateAction<JourneyMap[]>>;
  products: Product[];
  services: Service[];
  personas: Persona[];
  projects: Project[];
  processMaps?: ProcessMap[];
  setProcessMaps?: React.Dispatch<React.SetStateAction<ProcessMap[]>>;
  initialJourneyId?: string | null;
  onNavigateToProcessMap?: (processMapId?: string) => void;
  onNavigateToPersonas?: () => void;
  activeProjectId: string | null;
  onAddTask?: (task: Task) => void;
  openNewJourneyModal?: boolean;
  setOpenNewJourneyModal?: (open: boolean) => void;
  currentUser?: User;
  onDeleteItem?: (item: any, type: RecycleBinItem['type'], originalProjectId?: string) => void;
  users?: User[];
}

export function JourneyMaps({ 
  journeys, 
  setJourneys, 
  products, 
  services, 
  personas, 
  projects, 
  processMaps,
  setProcessMaps,
  initialJourneyId, 
  onNavigateToProcessMap, 
  onNavigateToPersonas, 
  activeProjectId, 
  onAddTask,
  openNewJourneyModal,
  setOpenNewJourneyModal,
  currentUser = { 
    id: 'u1', 
    name: 'Jane Doe', 
    email: 'jane@example.com', 
    role: 'Viewer', 
    status: 'Active',
    photoUrl: 'https://ui-avatars.com/api/?name=Jane+Doe&background=random' 
  }, // Default user for now
  onDeleteItem,
  users = []
}: JourneyMapsProps) {
  const { plan } = usePlan();
  const { addToast } = useToast();
  const { canEditProjectFeature } = usePermissions();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const canEdit = activeProject ? canEditProjectFeature(activeProject) : false;
  
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(initialJourneyId || null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(openNewJourneyModal || false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<string | null>(null);
  const [pendingTaskData, setPendingTaskData] = useState<{ item: string; stageName: string } | null>(null);
  const [editingStageIconId, setEditingStageIconId] = useState<string | null>(null);
  const [editingSwimlaneIconId, setEditingSwimlaneIconId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isAddSwimlaneMenuOpen, setIsAddSwimlaneMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [showCarbon, setShowCarbon] = useState(false);
  const [isCalculatingCarbon, setIsCalculatingCarbon] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeCarbonTarget, setActiveCarbonTarget] = useState<{ stageId: string; laneId: string; itemIndex: number } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const moreActionsMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const addSwimlaneMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (moreActionsMenuRef.current && !moreActionsMenuRef.current.contains(event.target as Node)) {
        setIsMoreActionsOpen(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (addSwimlaneMenuRef.current && !addSwimlaneMenuRef.current.contains(event.target as Node)) {
        setIsAddSwimlaneMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'stage' | 'swimlane';
    id: string;
    name: string;
  }>({ isOpen: false, type: 'stage', id: '', name: '' });

  const updateSwimlaneIcon = (laneId: string, iconName: string) => {
    if (!activeJourney) return;
    const updatedSwimlanes = activeJourney.swimlanes.map(l => 
      l.id === laneId ? { ...l, icon: iconName } : l
    );
    const updatedJourney = { ...activeJourney, swimlanes: updatedSwimlanes };
    setJourneys(journeys.map(j => j.id === activeJourney.id ? updatedJourney : j));
    setEditingSwimlaneIconId(null);
  };

  const confirmDelete = () => {
    if (!activeJourney) return;

    if (deleteConfirmation.type === 'stage') {
      const updatedStages = activeJourney.stages.filter(s => s.id !== deleteConfirmation.id);
      const updatedJourney = { ...activeJourney, stages: updatedStages };
      setJourneys(journeys.map(j => j.id === activeJourney.id ? updatedJourney : j));
    } else {
      const updatedSwimlanes = activeJourney.swimlanes.filter(l => l.id !== deleteConfirmation.id);
      const updatedJourney = { ...activeJourney, swimlanes: updatedSwimlanes };
      setJourneys(journeys.map(j => j.id === activeJourney.id ? updatedJourney : j));
    }
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
  };

  React.useEffect(() => {
    if (openNewJourneyModal !== undefined) {
      setIsAiModalOpen(openNewJourneyModal);
    }
  }, [openNewJourneyModal]);

  const handleCloseCreateModal = () => {
    setIsAiModalOpen(false);
    if (setOpenNewJourneyModal) {
      setOpenNewJourneyModal(false);
    }
  };

  const currentProjectJourneys = activeProjectId ? journeys.filter(j => j.projectId === activeProjectId) : journeys;
  const canAddJourney = plan !== 'starter' || currentProjectJourneys.length < 3;

  const activeJourney = journeys.find(j => j.id === activeJourneyId);

  const handlePrint = async () => {
    setIsExportMenuOpen(false);
    if (!activeJourney) return;
    const element = document.getElementById('journey-map-content');
    if (!element) return;
    
    try {
      addToast('Generating PDF...', 'info');
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-export')
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`journey-${activeJourney.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      addToast('PDF generated successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Failed to generate PDF', 'error');
    }
  };

  const handleDownloadImage = async () => {
    setIsExportMenuOpen(false);
    if (!activeJourney) return;
    const element = document.getElementById('journey-map-content');
    if (!element) return;

    try {
      addToast('Generating image...', 'info');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-export')
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${activeJourney.title.replace(/\s+/g, '_')}.png`;
      link.click();
      addToast('Image generated successfully', 'success');
    } catch (err) {
      console.error('Failed to download image', err);
      addToast('Failed to generate image', 'error');
    }
  };

  const handleExportWord = () => {
    setIsExportMenuOpen(false);
    if (!activeJourney) return;
    const element = document.getElementById('journey-map-content');
    if (!element) return;

    try {
      // Basic HTML export for Word
      const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${activeJourney.title}</title>
        </head>
        <body>
          <h1>${activeJourney.title}</h1>
          ${element.innerHTML}
        </body>
        </html>
      `;
      
      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeJourney.title.replace(/\s+/g, '_')}.doc`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Word', err);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportMenuOpen(false);
    if (!activeJourney) return;
    const element = document.getElementById('journey-map-content');
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${activeJourney.title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleAssessBenefits = async () => {
    if (!activeJourney || !activeProject) return;
    
    // Find the corresponding "Current" or "Proposed" map for the same project
    const otherMap = journeys.find(j => 
      j.projectId === activeProjectId && 
      j.id !== activeJourneyId && 
      j.status === 'Complete'
    );

    if (!otherMap) {
      alert("To assess benefits, you need both a 'Current' and a 'Proposed' journey map marked as 'Complete' for this project.");
      return;
    }

    setIsAssessing(true);
    try {
      const ai = await getGeminiClient();
      if (!ai) {
        setAssessmentResult('Gemini API key is missing. Please select one to enable AI features.');
        await ensureApiKey();
        setIsAssessing(false);
        return;
      }
      
      const currentMap = activeJourney.state === 'Current' ? activeJourney : otherMap;
      const proposedMap = activeJourney.state === 'Proposed' ? activeJourney : otherMap;

      const prompt = `
        As a CX and Sustainability Strategist, assess the benefits of moving from the "Current" journey to the "Proposed" journey for the project: "${stripPIData(activeProject.name)}".
        
        Project Goals: ${activeProject.goals.map(stripPIData).join(', ')}
        
        Current Journey: ${JSON.stringify(currentMap.stages.map(s => ({ 
          name: stripPIData(s.name), 
          emotion: s.emotion, 
          friction: stripPIData(s.laneData['lane_friction']?.join(', ') || ''),
          carbon: s.carbonData?.['lane_touchpoints']?.reduce((a, b) => a + b, 0) || 0
        })))}
        Total Current Carbon: ${currentMap.carbonFootprint || 0} kg CO2e
        
        Proposed Journey: ${JSON.stringify(proposedMap.stages.map(s => ({ 
          name: stripPIData(s.name), 
          emotion: s.emotion, 
          friction: stripPIData(s.laneData['lane_friction']?.join(', ') || ''),
          carbon: s.carbonData?.['lane_touchpoints']?.reduce((a, b) => a + b, 0) || 0
        })))}
        Total Proposed Carbon: ${proposedMap.carbonFootprint || 0} kg CO2e
        
        Provide a concise assessment of:
        1. Expected improvement in customer emotion.
        2. Reduction in friction points.
        3. Alignment with project goals.
        4. Estimated ROI/Impact.
        5. Sustainability Impact (Carbon reduction/increase).
        
        Format the response in clear Markdown.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      setAssessmentResult(response.text || "Unable to generate assessment.");
    } catch (error) {
      console.error("AI Assessment error:", error);
      setAssessmentResult("Error generating assessment. Please try again.");
    } finally {
      setIsAssessing(false);
    }
  };

  const handleExport = () => {
    if (!activeJourney) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeJourney, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${activeJourney.title.replace(/\s+/g, '_')}_journey.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDuplicate = (journey: JourneyMap, newState?: 'Current' | 'Proposed' | 'Implemented') => {
    const newJourney: JourneyMap = {
      ...journey,
      id: uuidv4(),
      title: `${journey.title} (Copy)`,
      state: newState || journey.state,
      stages: journey.stages.map(s => ({ ...s, id: uuidv4() }))
    };
    if (newState === 'Proposed') {
      newJourney.title = journey.title.replace('(As-Is)', '').replace('Current', '').trim() + ' (Proposed)';
    }
    setJourneys([...journeys, newJourney]);
    setActiveJourneyId(newJourney.id);
  };

  const deleteJourney = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const journey = journeys.find(j => j.id === id);
    if (journey && onDeleteItem) {
      onDeleteItem(journey, 'JourneyMap', activeProjectId || undefined);
    } else {
      setJourneys(journeys.filter(j => j.id !== id));
    }
    if (activeJourneyId === id) setActiveJourneyId(null);
  };

  const archiveJourney = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJourneys(journeys.map(j => j.id === id ? { ...j, archived: true } : j));
    if (activeJourneyId === id) setActiveJourneyId(null);
  };

  const restoreJourney = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJourneys(journeys.map(j => j.id === id ? { ...j, archived: false } : j));
  };

  const [showArchived, setShowArchived] = useState(false);
  const [draggedLaneIndex, setDraggedLaneIndex] = useState<number | null>(null);

  const reorderSwimlanes = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || !activeJourney) return;
    const newSwimlanes = [...activeJourney.swimlanes];
    const [movedItem] = newSwimlanes.splice(fromIndex, 1);
    newSwimlanes.splice(toIndex, 0, movedItem);
    setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, swimlanes: newSwimlanes } : j));
  };
  const visibleJourneys = journeys.filter(j => showArchived ? j.archived : !j.archived);

  if (!activeJourneyId) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <ContextualHelp 
          title="Journey Orchestration" 
          description="Design, analyze, and optimize customer pathways. Journey maps help you visualize the end-to-end experience from the customer's perspective, identifying pain points and opportunities for improvement."
        />
        <AnimatePresence>
          {assessmentResult && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-indigo-900 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden mb-8"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setAssessmentResult(null)} className="text-white/60 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-zinc-900/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-indigo-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-4">AI Benefit Assessment</h3>
                  <div className="prose prose-invert max-w-none text-indigo-100">
                    <ReactMarkdown>{assessmentResult}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Journey Orchestration</h2>
              {activeProject && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
                  {activeProject.name}
                </span>
              )}
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Design, analyze, and optimize customer pathways.</p>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && plan !== 'starter' && (
              <button 
                onClick={() => setIsAiModalOpen(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors border border-indigo-200"
              >
                <Wand2 className="w-5 h-5" />
                Create with AI
              </button>
            )}
            {canEdit && (
              canAddJourney ? (
                <button 
                  onClick={() => {
                    const newJourney: JourneyMap = {
                      id: uuidv4(),
                      projectId: activeProjectId || 'proj1',
                      title: 'New Journey Map',
                      personaId: 'p1',
                      state: 'Proposed',
                      satisfaction: {
                        metric: 'NPS',
                        value: 0
                      },
                      swimlanes: defaultSwimlanes,
                      stages: ['Awareness', 'Consideration', 'Purchase/Decision', 'Retention', 'Advocacy'].map(name => {
                        const stageId = uuidv4();
                        const laneData: Record<string, string[]> = {};
                        defaultSwimlanes.forEach(lane => {
                          laneData[lane.id] = [];
                        });
                        return {
                          id: stageId,
                          name,
                          emotion: 3,
                          laneData
                        };
                      })
                    };
                    setJourneys([...journeys, newJourney]);
                    setActiveJourneyId(newJourney.id);
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  New Journey
                </button>
              ) : (
                <button 
                  disabled
                  title="Starter plan limit reached (3 journeys per project)"
                  className="bg-zinc-300 text-zinc-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  New Journey
                </button>
              )
            )}
          </div>
        </div>

        {!activeJourneyId && (
          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 overflow-hidden transition-all mb-8 print:hidden no-export">
            <button 
              onClick={() => setShowIntro(!showIntro)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-indigo-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-indigo-900">Data-Driven Journey Orchestration</h3>
                  <p className="text-sm text-indigo-600">Maps should be based on real customer data and research from the Intelligence hub.</p>
                </div>
              </div>
              {showIntro ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-indigo-400" />}
            </button>
            
            {showIntro && (
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <p className="text-indigo-900/80 leading-relaxed">
                      Journey Maps visualize the process a person goes through to accomplish a goal. They help you see your service from the customer's perspective.
                    </p>
                    <ul className="space-y-2">
                      {[
                        'Base maps on real data from the Intelligence hub',
                        'Identify key touchpoints and interactions',
                        'Visualize customer emotions and friction',
                        'Align internal teams around the customer',
                        'Discover opportunities for innovation'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-indigo-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-indigo-200">
                    <iframe 
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/mSxpVRo3LiU" 
                      title="What is a Customer Journey Map?"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Journey Map</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Taxonomy</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">State</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Satisfaction</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {visibleJourneys.map(journey => {
                const product = products.find(p => p.id === journey.productId);
                const service = services.find(s => s.id === journey.serviceId);
                return (
                  <tr 
                    key={journey.id} 
                    onClick={() => setActiveJourneyId(journey.id)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Map className="w-5 h-5 text-zinc-400" />
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white">{journey.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{product?.name || 'No Product'}</span>
                        <span className="text-xs text-zinc-400">{service?.name || 'No Service'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        journey.state === 'Current' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200' :
                        journey.state === 'Proposed' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {journey.state}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{journey.satisfaction.value}</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{journey.satisfaction.metric}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveJourneyId(journey.id); }}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg transition-all"
                          title="View Journey"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDuplicate(journey); }}
                              className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                              title="Duplicate Journey"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {journey.state === 'Current' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDuplicate(journey, 'Proposed'); }}
                                className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Copy to Proposed"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                            )}
                            {journey.archived ? (
                              <button 
                                onClick={(e) => restoreJourney(journey.id, e)}
                                className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                title="Restore Journey"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => archiveJourney(journey.id, e)}
                                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Archive Journey"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => deleteJourney(journey.id, e)}
                              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Journey"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {journeys.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center min-h-[500px]">
              <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mb-6">
                <Map className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No journey maps yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
                Start mapping your customer's experience to identify pain points and opportunities.
              </p>
              <button 
                onClick={() => setIsAiModalOpen(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Journey Map
              </button>
            </div>
          )}
        </div>

        {isAiModalOpen && (
          <CreateJourneyModal 
            projectId={activeProjectId || 'proj1'} 
            onClose={handleCloseCreateModal} 
            onSave={(newJourney) => {
              setJourneys([...journeys, newJourney]);
              setActiveJourneyId(newJourney.id);
              handleCloseCreateModal();
            }} 
          />
        )}
      </div>
    );
  }

  const getEmotionIcon = (score: number) => {
    if (score >= 4) return <Smile className="w-6 h-6 text-emerald-500" />;
    if (score === 3) return <Meh className="w-6 h-6 text-amber-500" />;
    return <Frown className="w-6 h-6 text-rose-500" />;
  };

  const handleAddStage = () => {
    const name = 'New Stage';
    let icon = 'Target';
    
    // Try to guess icon based on name if it was changed, but here it's just 'New Stage'
    
    const newStage: JourneyStage = {
      id: `s${Date.now()}`,
      name,
      emotion: 3,
      laneData: {},
      icon
    };
    
    // Initialize empty arrays for all current swimlanes
    activeJourney.swimlanes.forEach(lane => {
      newStage.laneData[lane.id] = [];
    });

    setJourneys(journeys.map(j => 
      j.id === activeJourneyId ? { ...j, stages: [...j.stages, newStage] } : j
    ));
  };

  const handleAddSwimlane = (type: 'text-list' | 'pictures') => {
    const newLaneId = `lane_${Date.now()}`;
    const newLane: Swimlane = {
      id: newLaneId,
      name: type === 'pictures' ? 'Pictures' : 'New Swimlane',
      type,
      colorTheme: 'zinc'
    };

    setJourneys(journeys.map(j => {
      if (j.id === activeJourneyId) {
        // Add lane to map
        const updatedSwimlanes = [...j.swimlanes, newLane];
        // Initialize lane data in all stages
        const updatedStages = j.stages.map(s => ({
          ...s,
          laneData: { ...s.laneData, [newLaneId]: [] }
        }));
        return { ...j, swimlanes: updatedSwimlanes, stages: updatedStages };
      }
      return j;
    }));
    setIsAddSwimlaneMenuOpen(false);
  };

  const toggleSwimlaneVisibility = (laneId: string) => {
    setJourneys(journeys.map(j => 
      j.id === activeJourneyId ? {
        ...j,
        swimlanes: j.swimlanes.map(l => l.id === laneId ? { ...l, isHidden: !l.isHidden } : l)
      } : j
    ));
  };

  const handleImageUpload = (stageId: string, laneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
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
            const base64String = canvas.toDataURL('image/jpeg', 0.7);
            
            setJourneys(journeys.map(j => {
              if (j.id === activeJourneyId) {
                return {
                  ...j,
                  stages: j.stages.map(s => {
                    if (s.id === stageId) {
                      return {
                        ...s,
                        laneData: {
                          ...s.laneData,
                          [laneId]: [...(s.laneData[laneId] || []), base64String]
                        }
                      };
                    }
                    return s;
                  })
                };
              }
              return j;
            }));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      // Reset the input value so the same file can be uploaded again
      e.target.value = '';
    }
  };

  const moveSwimlane = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === activeJourney.swimlanes.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSwimlanes = [...activeJourney.swimlanes];
    const temp = newSwimlanes[index];
    newSwimlanes[index] = newSwimlanes[newIndex];
    newSwimlanes[newIndex] = temp;

    setJourneys(journeys.map(j => 
      j.id === activeJourneyId ? { ...j, swimlanes: newSwimlanes } : j
    ));
  };

  const updateStageEmotion = (stageId: string, emotion: number) => {
    setJourneys(journeys.map(j => 
      j.id === activeJourneyId ? {
        ...j,
        stages: j.stages.map(s => s.id === stageId ? { ...s, emotion } : s)
      } : j
    ));
  };

  const updateStageName = (stageId: string, newName: string) => {
    setJourneys(journeys.map(j => 
      j.id === activeJourneyId ? {
        ...j,
        stages: j.stages.map(s => s.id === stageId ? { ...s, name: newName } : s)
      } : j
    ));
  };

  const updateStageIcon = (stageId: string, icon: string) => {
    setJourneys(journeys.map(j => 
      j.id === activeJourneyId ? {
        ...j,
        stages: j.stages.map(s => s.id === stageId ? { ...s, icon } : s)
      } : j
    ));
    setEditingStageIconId(null);
  };

  const updateLaneName = (laneId: string, newName: string) => {
    setJourneys(journeys.map(j => 
      j.id === activeJourneyId ? {
        ...j,
        swimlanes: j.swimlanes.map(l => l.id === laneId ? { ...l, name: newName } : l)
      } : j
    ));
  };

  const updateLaneItem = (stageId: string, laneId: string, itemIndex: number, newValue: string) => {
    setJourneys(journeys.map(j => {
      if (j.id === activeJourneyId) {
        return {
          ...j,
          stages: j.stages.map(s => {
            if (s.id === stageId) {
              const newItems = [...(s.laneData[laneId] || [])];
              newItems[itemIndex] = newValue;
              
              // If we change the text, we might want to reset the carbon data for that item
              const newCarbonData = { ...(s.carbonData || {}) };
              if (newCarbonData[laneId]) {
                const updatedCarbon = [...newCarbonData[laneId]];
                // We keep it for now, but AI estimation will overwrite it if triggered
                return { ...s, laneData: { ...s.laneData, [laneId]: newItems }, carbonData: newCarbonData };
              }
              
              return { ...s, laneData: { ...s.laneData, [laneId]: newItems } };
            }
            return s;
          })
        };
      }
      return j;
    }));
  };

  const updateCarbonValue = (stageId: string, laneId: string, itemIndex: number, value: number) => {
    setJourneys(journeys.map(j => {
      if (j.id === activeJourneyId) {
        return {
          ...j,
          stages: j.stages.map(s => {
            if (s.id === stageId) {
              const newCarbonData = { ...(s.carbonData || {}) };
              const laneCarbon = [...(newCarbonData[laneId] || [])];
              // Ensure the array is long enough
              while (laneCarbon.length <= itemIndex) laneCarbon.push(0);
              laneCarbon[itemIndex] = value;
              newCarbonData[laneId] = laneCarbon;
              return { ...s, carbonData: newCarbonData };
            }
            return s;
          })
        };
      }
      return j;
    }));
  };

  const handleAiEstimateCarbon = async () => {
    if (!activeJourney) return;
    setIsCalculatingCarbon(true);
    addToast('AI is estimating carbon footprint...', 'info');

    try {
      const ai = await getGeminiClient();
      if (!ai) {
        addToast('Gemini API key is missing. Please select one to enable AI features.', 'error');
        await ensureApiKey();
        setIsCalculatingCarbon(false);
        return;
      }
      
      // Prepare data for AI
      const touchpoints = activeJourney.stages.flatMap(stage => 
        Object.entries(stage.laneData).flatMap(([laneId, items]) => 
          items.map((item, index) => ({ stageId: stage.id, laneId, item, index }))
        )
      );

      const libraryContext = carbonLibrary.map(c => `${c.label}: ${c.value}kg CO2e (${c.description})`).join('\n');

      const prompt = `
        As a Sustainability Expert, estimate the carbon footprint (kg CO2e) for the following customer journey touchpoints.
        Provide a JSON array of numbers representing the estimated kg CO2e for each touchpoint in the EXACT same order as provided.
        
        Use the following standard coefficients as a reference for your estimates:
        ${libraryContext}
        
        Touchpoints:
        ${touchpoints.map(t => `- ${stripPIData(t.item)}`).join('\n')}
        
        Return ONLY the JSON array of numbers. Example: [0.5, 1.2, 0.05, ...]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      const text = response.text || "[]";
      const estimates = JSON.parse(text.match(/\[.*\]/s)?.[0] || "[]");

      if (Array.isArray(estimates) && estimates.length === touchpoints.length) {
        setJourneys(journeys.map(j => {
          if (j.id === activeJourneyId) {
            const updatedStages = j.stages.map(s => {
              const newCarbonData: Record<string, number[]> = { ...(s.carbonData || {}) };
              
              touchpoints.forEach((t, i) => {
                if (t.stageId === s.id) {
                  if (!newCarbonData[t.laneId]) newCarbonData[t.laneId] = [];
                  newCarbonData[t.laneId][t.index] = estimates[i];
                }
              });
              
              return { ...s, carbonData: newCarbonData };
            });
            
            const totalCarbon = estimates.reduce((sum, val) => sum + val, 0);
            return { ...j, stages: updatedStages, carbonFootprint: totalCarbon };
          }
          return j;
        }));
        addToast('Carbon estimation complete', 'success');
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (error) {
      console.error('Carbon estimation error:', error);
      addToast('Failed to estimate carbon footprint', 'error');
    } finally {
      setIsCalculatingCarbon(false);
    }
  };

  const addLaneItem = (stageId: string, laneId: string) => {
    setJourneys(journeys.map(j => {
      if (j.id === activeJourneyId) {
        return {
          ...j,
          stages: j.stages.map(s => {
            if (s.id === stageId) {
              const newItems = [...(s.laneData[laneId] || []), 'New Item'];
              return { ...s, laneData: { ...s.laneData, [laneId]: newItems } };
            }
            return s;
          })
        };
      }
      return j;
    }));
  };

  const removeLaneItem = (stageId: string, laneId: string, itemIndex: number) => {
    setJourneys(journeys.map(j => {
      if (j.id === activeJourneyId) {
        return {
          ...j,
          stages: j.stages.map(s => {
            if (s.id === stageId) {
              const newItems = [...(s.laneData[laneId] || [])];
              newItems.splice(itemIndex, 1);
              return { ...s, laneData: { ...s.laneData, [laneId]: newItems } };
            }
            return s;
          })
        };
      }
      return j;
    }));
  };

  const removeStage = (stageId: string) => {
    if (!activeJourney) return;
    const stage = activeJourney.stages.find(s => s.id === stageId);
    if (stage) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'stage',
        id: stageId,
        name: stage.name
      });
    }
  };

  const removeLane = (laneId: string) => {
    if (!activeJourney) return;
    const lane = activeJourney.swimlanes.find(l => l.id === laneId);
    if (lane) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'swimlane',
        id: laneId,
        name: lane.name
      });
    }
  };

  // Find the index of the opportunities lane to insert the emotion score right after it
  const opportunitiesLaneIndex = activeJourney.swimlanes.findIndex(l => l.id === 'lane_opportunities');
  // If opportunities lane doesn't exist, we'll put it at the end
  const emotionScoreIndex = opportunitiesLaneIndex !== -1 ? opportunitiesLaneIndex + 1 : activeJourney.swimlanes.length;

  // Calculate improvement if applicable
  const currentJourney = journeys.find(j => j.projectId === activeJourney.projectId && j.state === 'Current' && j.satisfaction.metric === activeJourney.satisfaction.metric);
  const implementedJourney = journeys.find(j => j.projectId === activeJourney.projectId && j.state === 'Implemented' && j.satisfaction.metric === activeJourney.satisfaction.metric);
  
  let improvement: number | null = null;
  if (currentJourney && implementedJourney) {
    improvement = implementedJourney.satisfaction.value - currentJourney.satisfaction.value;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 print:p-0 print:max-w-none">
      <div className="flex items-center justify-between print:hidden no-export">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Journey Orchestration</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Design, analyze, and optimize customer pathways.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {activeJourneyId && (
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <button 
                onClick={() => setIsAiAssistantOpen(true)}
                className="hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-all text-sm"
                title="AI Assistant"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden lg:inline">AI Assistant</span>
              </button>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
              <button 
                onClick={() => setShowComments(!showComments)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-all text-sm",
                  showComments 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400" 
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                )}
                title="Comments"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline">Comments</span>
              </button>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
              <button 
                onClick={() => setShowCarbon(!showCarbon)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-all text-sm",
                  showCarbon 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" 
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                )}
                title="Carbon Intelligence"
              >
                <Leaf className="w-4 h-4" />
                <span className="hidden lg:inline">Carbon Intel</span>
              </button>
              
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
              
              <div className="relative" ref={moreActionsMenuRef}>
                <button 
                  onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1.5 rounded-lg font-medium flex items-center transition-all"
                  title="More Actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isMoreActionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                    >
                      {canEdit && (
                        <>
                          <button 
                            onClick={() => { handleDuplicate(activeJourney); setIsMoreActionsOpen(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <Layers className="w-4 h-4 text-zinc-400" /> Duplicate Journey
                          </button>
                          {activeJourney.state === 'Current' && (
                            <button 
                              onClick={() => { handleDuplicate(activeJourney, 'Proposed'); setIsMoreActionsOpen(false); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"
                            >
                              <GitMerge className="w-4 h-4" /> Copy to Proposed
                            </button>
                          )}
                          <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                        </>
                      )}
                      
                      <button 
                        onClick={() => { setIsVersionHistoryOpen(true); setIsMoreActionsOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4 text-zinc-400" /> Version History
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {canEdit && plan !== 'starter' && (
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm text-sm"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Create with AI</span>
            </button>
          )}
          {canEdit && (
            canAddJourney ? (
              <button 
                onClick={() => {
                  const newJourney: JourneyMap = {
                    id: uuidv4(),
                    projectId: 'proj1',
                    title: 'New Journey Map',
                    personaId: 'p1',
                    state: 'Proposed',
                    satisfaction: {
                      metric: 'NPS',
                      value: 0
                    },
                    swimlanes: defaultSwimlanes,
                    stages: ['Awareness', 'Consideration', 'Purchase/Decision', 'Retention', 'Advocacy'].map(name => {
                      const stageId = uuidv4();
                      const laneData: Record<string, string[]> = {};
                      defaultSwimlanes.forEach(lane => {
                        laneData[lane.id] = [];
                      });
                      
                      let icon = 'Target';
                      if (name === 'Awareness') icon = 'Eye';
                      if (name === 'Consideration') icon = 'Search';
                      if (name === 'Purchase/Decision') icon = 'ShoppingBag';
                      if (name === 'Retention') icon = 'RefreshCw';
                      if (name === 'Advocacy') icon = 'Star';

                      return {
                        id: stageId,
                        name,
                        emotion: 3,
                        laneData,
                        icon
                      };
                    })
                  };
                  setJourneys([...journeys, newJourney]);
                  setActiveJourneyId(newJourney.id);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Journey</span>
              </button>
            ) : (
              <button 
                disabled
                title="Starter plan limit reached (3 journeys per project)"
                className="bg-zinc-300 text-zinc-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Journey</span>
              </button>
            )
          )}
        </div>
      </div>

      {isAiModalOpen && (
        <CreateJourneyModal 
          projectId={activeProjectId || 'proj1'} 
          onClose={handleCloseCreateModal} 
          onSave={(newJourney) => {
            setJourneys([...journeys, newJourney]);
            setActiveJourneyId(newJourney.id);
            handleCloseCreateModal();
          }} 
        />
      )}

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {journeys.map(j => (
          <button
            key={j.id}
            onClick={() => setActiveJourneyId(j.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
              activeJourneyId === j.id
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:text-zinc-900 dark:text-white'
            }`}
          >
            {j.title}
          </button>
        ))}
      </div>

      <div id="journey-map-content" className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <EditableText 
              value={activeJourney.title} 
              onChange={(val) => setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, title: val } : j))}
              className="text-lg font-bold text-zinc-900 dark:text-white"
            />
            <div className="hidden sm:block h-4 w-px bg-zinc-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">State</span>
              <select 
                value={activeJourney.state}
                onChange={(e) => setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, state: e.target.value as any } : j))}
                className="text-xs text-zinc-700 dark:text-zinc-200 font-bold bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 outline-none"
              >
                <option value="Current">Current</option>
                <option value="Proposed">Proposed</option>
                <option value="Implemented">Implemented</option>
              </select>
            </div>
            <div className="hidden sm:block h-4 w-px bg-zinc-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</span>
              <select 
                value={activeJourney.status || 'Draft'}
                onChange={(e) => setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, status: e.target.value as any } : j))}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all outline-none ${
                  activeJourney.status === 'Complete' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            {activeJourney.status === 'Complete' && (
              <>
                <div className="hidden sm:block h-4 w-px bg-zinc-300"></div>
                <button 
                  onClick={handleAssessBenefits}
                  disabled={isAssessing}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  {isAssessing ? 'Assessing...' : 'Assess Benefits'}
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-zinc-400" />
              <select 
                value={activeJourney.productId || ''}
                onChange={(e) => setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, productId: e.target.value, serviceId: undefined } : j))}
                className="text-xs text-zinc-700 dark:text-zinc-200 font-bold bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 outline-none max-w-[150px]"
              >
                <option value="">Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <select 
                value={activeJourney.serviceId || ''}
                onChange={(e) => setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, serviceId: e.target.value } : j))}
                className="text-xs text-zinc-700 dark:text-zinc-200 font-bold bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 outline-none max-w-[150px]"
                disabled={!activeJourney.productId}
              >
                <option value="">Service...</option>
                {services.filter(s => s.productId === activeJourney.productId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block h-4 w-px bg-zinc-300"></div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full pl-1 pr-3 py-1 shadow-sm">
                {(() => {
                  const persona = personas.find(p => p.id === activeJourney.personaId);
                  return (
                    <>
                      {persona?.imageUrl ? (
                        <img src={persona.imageUrl} alt={persona.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                          {persona?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold leading-none mb-0.5">Persona</span>
                        <select 
                          value={activeJourney.personaId || ''}
                          onChange={(e) => {
                            if (e.target.value === 'CREATE_NEW') {
                              onNavigateToPersonas?.();
                            } else {
                              setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, personaId: e.target.value } : j));
                            }
                          }}
                          className="text-xs font-bold text-zinc-900 dark:text-white bg-transparent outline-none cursor-pointer p-0 border-none focus:ring-0 w-full"
                        >
                          <option value="">Select Persona...</option>
                          {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          <option value="CREATE_NEW" className="font-bold text-indigo-600">+ Create New</option>
                        </select>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
            {showCarbon && (
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Carbon Footprint</span>
                  <div className="flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {activeJourney.stages.reduce((total, stage) => {
                        const stageCarbon = Object.values(stage.carbonData || {}).reduce((s, lane) => s + lane.reduce((l, val) => l + val, 0), 0);
                        return total + stageCarbon;
                      }, 0).toFixed(2)} kg CO2e
                    </span>
                  </div>
                </div>
                <div className="h-6 w-px bg-emerald-200 dark:bg-emerald-800"></div>
                <button 
                  onClick={handleAiEstimateCarbon}
                  disabled={isCalculatingCarbon}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors disabled:opacity-50"
                  title="Estimate with AI"
                >
                  <Sparkles className={cn("w-4 h-4", isCalculatingCarbon && "animate-spin")} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex flex-col">
                <select 
                  value={activeJourney.satisfaction.metric}
                  onChange={(e) => setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, satisfaction: { ...j.satisfaction, metric: e.target.value as any } } : j))}
                  className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-transparent outline-none cursor-pointer"
                >
                  <option value="NPS">NPS</option>
                  <option value="CSAT">CSAT</option>
                  <option value="% Satisfied">% Satisfied</option>
                </select>
              </div>
              <div className="h-6 w-px bg-zinc-200"></div>
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  value={activeJourney.satisfaction.value}
                  onChange={(e) => setJourneys(journeys.map(j => j.id === activeJourneyId ? { ...j, satisfaction: { ...j.satisfaction, value: Number(e.target.value) } } : j))}
                  className="text-lg font-bold text-zinc-900 dark:text-white w-12 bg-transparent outline-none text-right"
                />
                {activeJourney.satisfaction.metric === '% Satisfied' && <span className="text-sm font-bold text-zinc-900 dark:text-white">%</span>}
              </div>
              {improvement !== null && (activeJourney.state === 'Implemented' || activeJourney.state === 'Proposed') && (
                <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 ${improvement >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {improvement >= 0 ? '+' : ''}{improvement}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg transition-colors"
                  title="Export Options"
                >
                  <Download className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isExportMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50"
                    >
                      <button 
                        onClick={() => { handlePrint(); setIsExportMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4 text-zinc-400" /> Print
                      </button>
                      <button 
                        onClick={() => { handleDownloadPdf(); setIsExportMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-zinc-400" /> Download PDF
                      </button>
                      <button 
                        onClick={() => { handleDownloadImage(); setIsExportMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4 text-zinc-400" /> Download Image
                      </button>
                      <button 
                        onClick={() => { handleExportWord(); setIsExportMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-zinc-400" /> Export to Word
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative" ref={viewMenuRef}>
                <button 
                  onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg transition-colors"
                  title="View Options"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isViewMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50"
                    >
                      <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Visible Swimlanes</div>
                      {activeJourney.swimlanes.map(lane => (
                        <button
                          key={lane.id}
                          onClick={() => toggleSwimlaneVisibility(lane.id)}
                          className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                        >
                          <span className="truncate">{lane.name}</span>
                          {!lane.isHidden && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          <div className="min-w-[1000px]">
            {/* Stages Header */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 print:border-zinc-300">
              <div className="p-4 w-48 shrink-0 bg-zinc-50 dark:bg-zinc-900/80 font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 flex items-center print:bg-white dark:bg-zinc-900">
                Stages
              </div>
              {activeJourney.stages.map((stage, i) => {
                const StageIcon = getIconComponent(stage.icon);
                return (
                <div key={stage.id} className="p-4 text-center font-semibold text-zinc-900 dark:text-white bg-indigo-50/30 dark:bg-indigo-900/10 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 relative group flex-1 min-w-[200px] print:border-zinc-300">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="relative">
                      <button 
                        onClick={() => canEdit && setEditingStageIconId(editingStageIconId === stage.id ? null : stage.id)}
                        disabled={!canEdit}
                        className={`w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 transition-colors ${canEdit ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer' : 'cursor-default'}`}
                      >
                        <StageIcon className="w-5 h-5" />
                      </button>
                      
                      {editingStageIconId === stage.id && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 z-50 grid grid-cols-5 gap-2">
                          {STAGE_ICONS.map(iconDef => {
                            const Icon = iconDef.icon;
                            return (
                              <button
                                key={iconDef.name}
                                onClick={() => updateStageIcon(stage.id, iconDef.name)}
                                className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                                  stage.icon === iconDef.name 
                                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                }`}
                                title={iconDef.name}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <EditableText value={stage.name} onChange={(val) => updateStageName(stage.id, val)} disabled={!canEdit} />
                      {canEdit && (
                        <button onClick={() => removeStage(stage.id)} className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-rose-500 transition-opacity no-export">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {i < activeJourney.stages.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 z-10 bg-white dark:bg-zinc-900 rounded-full" />
                  )}
                </div>
              )})}
              {canEdit && (
                <div className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/30 w-[150px] shrink-0 print:hidden no-export">
                  <button onClick={handleAddStage} className="text-zinc-400 hover:text-zinc-900 dark:text-white flex items-center gap-1 text-sm font-medium transition-colors no-export">
                    <Plus className="w-4 h-4" /> Add Stage
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Swimlanes and Emotion Row */}
            {activeJourney.swimlanes.map((lane, index) => (
              <React.Fragment key={lane.id}>
                {/* Render Emotion Row if it's the right index */}
                {index === emotionScoreIndex && (
                  <div className="flex border-b border-zinc-200 dark:border-zinc-800 print:border-zinc-300">
                    <div className="p-4 w-48 shrink-0 bg-zinc-50 dark:bg-zinc-900/80 font-semibold text-zinc-700 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 flex items-center gap-2 print:bg-white dark:bg-zinc-900">
                      <Smile className="w-4 h-4 text-zinc-400" />
                      Emotion Score
                    </div>
                    {activeJourney.stages.map(stage => (
                      <div key={stage.id} className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 flex-1 min-w-[200px] print:border-zinc-300">
                        <div className="flex items-center gap-1 mb-2 print:hidden no-export">
                          {[1, 2, 3, 4, 5].map(score => (
                            <button 
                              key={score}
                              onClick={() => canEdit && updateStageEmotion(stage.id, score)}
                              disabled={!canEdit}
                              className={`w-2 h-2 rounded-full transition-all ${
                                stage.emotion >= score ? (
                                  stage.emotion >= 4 ? 'bg-emerald-500' : stage.emotion === 3 ? 'bg-amber-500' : 'bg-rose-500'
                                ) : 'bg-zinc-200 hover:bg-zinc-300'
                              } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                            />
                          ))}
                        </div>
                        <button 
                          onClick={() => canEdit && updateStageEmotion(stage.id, stage.emotion === 5 ? 1 : stage.emotion + 1)}
                          disabled={!canEdit}
                          className={`transition-transform ${canEdit ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                          title={canEdit ? "Click to change sentiment" : "Sentiment"}
                        >
                          {getEmotionIcon(stage.emotion)}
                        </button>
                      </div>
                    ))}
                    <div className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 bg-zinc-50 dark:bg-zinc-900/30 w-[150px] shrink-0 print:hidden no-export"></div>
                  </div>
                )}

                {/* Render the actual swimlane */}
                <div 
                  className={cn(
                    "flex border-b border-zinc-200 dark:border-zinc-800 print:border-zinc-300 transition-all",
                    draggedLaneIndex === index ? "opacity-50 bg-zinc-100 dark:bg-zinc-800" : ""
                  )}
                  draggable={canEdit}
                  onDragStart={(e) => {
                    setDraggedLaneIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedLaneIndex !== null) {
                        reorderSwimlanes(draggedLaneIndex, index);
                        setDraggedLaneIndex(null);
                      }
                    }}
                    onDragEnd={() => setDraggedLaneIndex(null)}
                  >
                    <div className="p-4 w-48 shrink-0 bg-zinc-50 dark:bg-zinc-900/80 font-semibold text-zinc-700 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-center group relative print:bg-white dark:bg-zinc-900 cursor-grab active:cursor-grabbing">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button 
                            onClick={() => canEdit && setEditingSwimlaneIconId(editingSwimlaneIconId === lane.id ? null : lane.id)}
                            disabled={!canEdit}
                            className={`w-6 h-6 rounded-full bg-${lane.colorTheme}-100 dark:bg-${lane.colorTheme}-900/30 flex items-center justify-center text-${lane.colorTheme}-600 dark:text-${lane.colorTheme}-400 transition-colors ${canEdit ? `hover:bg-${lane.colorTheme}-200 cursor-pointer` : 'cursor-default'}`}
                          >
                            {(() => {
                              const Icon = getSwimlaneIconComponent(lane.icon);
                              return <Icon className="w-3.5 h-3.5" />;
                            })()}
                          </button>
                          
                          {editingSwimlaneIconId === lane.id && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 z-50 grid grid-cols-5 gap-2">
                              {SWIMLANE_ICONS.map(iconDef => {
                                const Icon = iconDef.icon;
                                return (
                                  <button
                                    key={iconDef.name}
                                    onClick={() => updateSwimlaneIcon(lane.id, iconDef.name)}
                                    className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                                      lane.icon === iconDef.name 
                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                    }`}
                                    title={iconDef.name}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-10">
                          <EditableText value={lane.name} onChange={(val) => updateLaneName(lane.id, val)} className="text-sm font-bold truncate block w-full" disabled={!canEdit} />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden no-export bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 z-10">
                        <button 
                          onClick={() => toggleSwimlaneVisibility(lane.id)} 
                          className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-all"
                          title={lane.isHidden ? "Expand Swimlane" : "Collapse Swimlane"}
                        >
                          {lane.isHidden ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => removeLane(lane.id)} 
                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-all"
                            title="Delete Swimlane"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Reorder controls */}
                    {canEdit && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden no-export bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-md border border-zinc-200/50 dark:border-zinc-700/50 py-1 z-10">
                        <button 
                          onClick={() => moveSwimlane(index, 'up')}
                          disabled={index === 0}
                          className="text-zinc-400 hover:text-indigo-600 disabled:opacity-20 p-0.5"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => moveSwimlane(index, 'down')}
                          disabled={index === activeJourney.swimlanes.length - 1}
                          className="text-zinc-400 hover:text-indigo-600 disabled:opacity-20 p-0.5"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {activeJourney.stages.map(stage => {
                    if (lane.isHidden) {
                      return (
                        <div key={stage.id} className={`p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 flex-1 min-w-[200px] print:bg-white dark:bg-zinc-900 print:border-zinc-300`} />
                      );
                    }
                    const items = stage.laneData[lane.id] || [];
                    return (
                      <div key={stage.id} className={`p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 bg-${lane.colorTheme}-50/30 dark:bg-${lane.colorTheme}-900/10 flex-1 min-w-[200px] print:bg-white dark:bg-zinc-900 print:border-zinc-300`}>
                        <div className="flex flex-col gap-2">
                          {items.map((item, i) => {
                            const carbonValue = stage.carbonData?.[lane.id]?.[i] || 0;
                            return (
                            <div key={i} className={`group/item relative flex flex-col gap-1 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-${lane.colorTheme}-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 print:shadow-none print:border-zinc-200`}>
                              <div className="flex items-start gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full bg-${lane.colorTheme}-400 mt-1.5 shrink-0`} />
                                <div className="flex-1 flex flex-col gap-1">
                                  {lane.type === 'pictures' ? (
                                    <img 
                                      src={item} 
                                      alt="Journey step" 
                                      className="w-full h-auto rounded object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                      referrerPolicy="no-referrer" 
                                      onClick={() => setSelectedImage(item)}
                                    />
                                  ) : (
                                    <EditableText 
                                      value={item} 
                                      onChange={(val) => updateLaneItem(stage.id, lane.id, i, val)} 
                                      multiline 
                                      className="text-sm text-zinc-700 dark:text-zinc-200"
                                      disabled={!canEdit}
                                      showConfirmTick={true}
                                    />
                                  )}
                                  {showCarbon && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                                        carbonValue > 5 ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                        carbonValue > 1 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                        "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                      )}>
                                        <Leaf className="w-2.5 h-2.5" />
                                        {carbonValue.toFixed(2)} kg
                                      </div>
                                      {canEdit && (
                                        <div className="flex items-center gap-1">
                                          <input 
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={carbonValue}
                                            onChange={(e) => updateCarbonValue(stage.id, lane.id, i, Number(e.target.value))}
                                            className="w-12 bg-zinc-50 dark:bg-zinc-800 border-none text-[9px] p-0 focus:ring-0 text-zinc-400 hover:text-zinc-600 transition-colors"
                                          />
                                          <button 
                                            onClick={() => {
                                              setActiveCarbonTarget({ stageId: stage.id, laneId: lane.id, itemIndex: i });
                                              setIsLibraryOpen(true);
                                            }}
                                            className="p-0.5 text-zinc-300 hover:text-emerald-500 transition-colors"
                                            title="Select from Library"
                                          >
                                            <BookOpen className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {canEdit && (
                                  <button 
                                    onClick={() => removeLaneItem(stage.id, lane.id, i)}
                                    className="opacity-0 group-hover/item:opacity-100 text-zinc-300 hover:text-rose-500 absolute top-1 right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5 print:hidden no-export"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {lane.id === 'lane_backoffice' && (
                                (() => {
                                  const existingMap = processMaps?.find(pm => pm.title.toLowerCase() === item.toLowerCase());
                                  if (!existingMap && !canEdit) return null;
                                  return (
                                    <button 
                                      onClick={() => {
                                        if (existingMap) {
                                          onNavigateToProcessMap?.(existingMap.id);
                                        } else {
                                          if (setProcessMaps && activeProjectId) {
                                            const newMap: ProcessMap = {
                                              id: `pm_${Date.now()}`,
                                              projectId: activeProjectId,
                                              title: item,
                                              nodes: [],
                                              edges: []
                                            };
                                            setProcessMaps(prev => [...prev, newMap]);
                                            onNavigateToProcessMap?.(newMap.id);
                                          } else {
                                            onNavigateToProcessMap?.();
                                          }
                                        }
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-indigo-600 transition-colors ml-3.5 mt-1 w-fit print:hidden no-export"
                                    >
                                      <GitMerge className="w-3 h-3" />
                                      {existingMap ? 'View Process Map' : 'Create Process Map'}
                                    </button>
                                  );
                                })()
                              )}
                              {lane.id === 'lane_opportunities' && onAddTask && canEdit && (
                                <button 
                                  onClick={() => setPendingTaskData({ item, stageName: stage.name })}
                                  className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-indigo-600 transition-colors ml-3.5 mt-1 w-fit print:hidden no-export"
                                >
                                  <Target className="w-3 h-3" />
                                  Create Task
                                </button>
                              )}
                            </div>
                            );
                          })}
                          {canEdit && (
                            <div className="mt-1">
                              {lane.type === 'pictures' ? (
                                <label className={`text-xs text-${lane.colorTheme}-500 hover:text-${lane.colorTheme}-700 text-left font-medium print:hidden no-export cursor-pointer flex items-center gap-1`}>
                                  <ImageIcon className="w-3 h-3" /> Add picture
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageUpload(stage.id, lane.id, e)}
                                  />
                                </label>
                              ) : (
                                <button 
                                  onClick={() => addLaneItem(stage.id, lane.id)}
                                  className={`text-xs text-${lane.colorTheme}-500 hover:text-${lane.colorTheme}-700 text-left font-medium print:hidden no-export`}
                                >
                                  + Add item
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 bg-zinc-50 dark:bg-zinc-900/30 w-[150px] shrink-0 print:hidden no-export"></div>
                </div>
              </React.Fragment>
            ))}

            {/* Render Emotion Row at the very end if it wasn't rendered yet (e.g., no opportunities lane and we are at the end) */}
            {emotionScoreIndex >= activeJourney.swimlanes.length && (
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 print:border-zinc-300">
                <div className="p-4 w-48 shrink-0 bg-zinc-50 dark:bg-zinc-900/80 font-semibold text-zinc-700 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 flex items-center gap-2 print:bg-white dark:bg-zinc-900">
                  <Smile className="w-4 h-4 text-zinc-400" />
                  Emotion Score
                </div>
                {activeJourney.stages.map(stage => (
                  <div key={stage.id} className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 flex-1 min-w-[200px] print:border-zinc-300">
                    <div className="flex items-center gap-1 mb-2 print:hidden no-export">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button 
                          key={score}
                          onClick={() => canEdit && updateStageEmotion(stage.id, score)}
                          disabled={!canEdit}
                          className={`w-2 h-2 rounded-full transition-all ${
                            stage.emotion >= score ? (
                              stage.emotion >= 4 ? 'bg-emerald-500' : stage.emotion === 3 ? 'bg-amber-500' : 'bg-rose-500'
                            ) : 'bg-zinc-200 hover:bg-zinc-300'
                          } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => canEdit && updateStageEmotion(stage.id, stage.emotion === 5 ? 1 : stage.emotion + 1)}
                      disabled={!canEdit}
                      className={`transition-transform ${canEdit ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                      title={canEdit ? "Click to change sentiment" : "Sentiment"}
                    >
                      {getEmotionIcon(stage.emotion)}
                    </button>
                  </div>
                ))}
                <div className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 bg-zinc-50 dark:bg-zinc-900/30 w-[150px] shrink-0 print:hidden no-export"></div>
              </div>
            )}

            {/* Add Swimlane Row */}
            {canEdit && (
              <div className="flex print:hidden no-export">
                <div className="p-4 w-48 shrink-0 bg-zinc-50 dark:bg-zinc-900/80 border-r border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative" ref={addSwimlaneMenuRef}>
                  <button 
                    onClick={() => setIsAddSwimlaneMenuOpen(!isAddSwimlaneMenuOpen)} 
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Swimlane
                  </button>
                  <AnimatePresence>
                    {isAddSwimlaneMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50"
                      >
                        <button 
                          onClick={() => handleAddSwimlane('text-list')}
                          className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-zinc-400" /> Text List
                        </button>
                        <button 
                          onClick={() => handleAddSwimlane('pictures')}
                          className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4 text-zinc-400" /> Pictures
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {activeJourney.stages.map(stage => (
                  <div key={stage.id} className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 bg-zinc-50 dark:bg-zinc-900/30 flex-1 min-w-[200px]"></div>
                ))}
                <div className="p-4 border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 bg-zinc-50 dark:bg-zinc-900/30 w-[150px] shrink-0 print:hidden no-export"></div>
              </div>
            )}

          </div>
        </div>
      </div>

      {activeJourney && (
        <JourneyAiAssistant 
          isOpen={isAiAssistantOpen} 
          onClose={() => setIsAiAssistantOpen(false)} 
          journey={activeJourney} 
        />
      )}

      {/* Kanban Column Selection Modal */}
      <AnimatePresence>
        {pendingTaskData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Create Kanban Task</h3>
                </div>
                <button 
                  onClick={() => setPendingTaskData(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-sm text-indigo-900 font-medium">
                    Where should this task be added on the Kanban board?
                  </p>
                  <p className="text-xs text-indigo-600 mt-1 italic">
                    "{pendingTaskData.item}"
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {['Backlog', 'In Progress', 'Done', 'Blocked'].map((col) => (
                    <button
                      key={col}
                      onClick={() => {
                        onAddTask?.({
                          id: uuidv4(),
                          projectId: activeJourney.projectId,
                          title: pendingTaskData.item || 'New Opportunity Task',
                          description: `Task created from opportunity in ${pendingTaskData.stageName} stage of ${activeJourney.title}`,
                          status: 'Discover',
                          kanbanStatus: col as any,
                          impact: 'Medium',
                          effort: 'Medium',
                          owner: '',
                          createdAt: new Date().toISOString(),
                          stageHistory: [{ stage: col as any, enteredAt: new Date().toISOString() }],
                          sourceJourneyId: activeJourney.id,
                          metrics: {
                            experience: 'TBD',
                            efficiency: 'TBD'
                          }
                        });
                        setPendingTaskData(null);
                        alert(`Task added to ${col}!`);
                      }}
                      className="flex items-center justify-between px-6 py-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-200 rounded-2xl transition-all group"
                    >
                      <span className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-900">{col}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 flex justify-end">
                <button 
                  onClick={() => setPendingTaskData(null)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Are you sure?</h3>
              <p className="text-zinc-500 dark:text-zinc-400">
                You are about to delete the {deleteConfirmation.type} "{deleteConfirmation.name}". This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                Delete {deleteConfirmation.type === 'stage' ? 'Stage' : 'Swimlane'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Comments Panel */}
      <CommentsPanel
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        comments={activeJourney.comments || []}
        onAddComment={(newComment) => {
          setJourneys(journeys.map(j => 
            j.id === activeJourneyId 
              ? { ...j, comments: [...(j.comments || []), newComment] }
              : j
          ));
        }}
        currentUser={currentUser}
        users={users}
      />

      <VersionHistory
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        entityType="journeys"
        entityId={activeJourneyId}
        currentData={activeJourney}
        onRestore={(data) => {
          setJourneys(journeys.map(j => j.id === activeJourneyId ? data : j));
        }}
      />
      <CarbonLibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => {
          setIsLibraryOpen(false);
          setActiveCarbonTarget(null);
        }}
        onSelect={(value) => {
          if (activeCarbonTarget) {
            updateCarbonValue(activeCarbonTarget.stageId, activeCarbonTarget.laneId, activeCarbonTarget.itemIndex, value);
          }
        }}
      />

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-5xl w-full max-h-[90vh] bg-transparent flex items-center justify-center z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
