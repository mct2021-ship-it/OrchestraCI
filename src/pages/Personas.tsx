import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mockPersonas, personaTemplates, mockProjects } from '../data/mockData';
import { Plus, Target, Frown, Quote, Download, Printer, Share2, Trash2, Sliders, Settings, Star, Image as ImageIcon, X, ChevronLeft, Eye, Edit3, Sparkles, ChevronUp, ChevronDown, FileText, CheckCircle2, User, Users, LayoutTemplate, Smile, Meh, Angry, Laugh, Heart, Clock, List, BookOpen, Briefcase, ArrowRight } from 'lucide-react';
import { CreatePersonaModal } from '../components/CreatePersonaModal';
import { AvatarGalleryModal } from '../components/AvatarGalleryModal';
import { AiPersonaGenerator } from '../components/AiPersonaGenerator';
import { PersonaLibraryModal } from '../components/PersonaLibraryModal';
import { EditableText } from '../components/EditableText';
import { VersionHistory } from '../components/VersionHistory';
import { Persona, DemographicSlider, Project } from '../types';
import { CompanyProfile } from '../components/YourCompany';
import { v4 as uuidv4 } from 'uuid';
import { cn, fixOklch } from '../lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { ContextualHelp } from '../components/ContextualHelp';
import { usePermissions } from '../hooks/usePermissions';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { Type, ThinkingLevel } from "@google/genai";
import { stripPIData } from '../lib/piStripper';

interface PersonasProps {
  personas: Persona[];
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  startInNewMode?: boolean;
  isDarkMode?: boolean;
  onNavigate?: (tab: string, subTab?: string) => void;
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
  companyProfile?: CompanyProfile;
  projects?: Project[];
}

import { LimitReachedModal } from '../components/LimitReachedModal';

export function Personas({ personas, setPersonas, startInNewMode, isDarkMode, onNavigate, onAddToAuditLog, companyProfile, projects = [] }: PersonasProps) {
  const { plan, details } = usePlan();
  const { addToast } = useToast();
  const { canEditPersonas } = usePermissions();
  const canEdit = canEditPersonas();
  const [templates, setTemplates] = useState<Persona[]>(personaTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isCreationWizardOpen, setIsCreationWizardOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [personaToUpdateAvatar, setPersonaToUpdateAvatar] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [newDemographicLabel, setNewDemographicLabel] = useState('');
  const [isAddingDemographic, setIsAddingDemographic] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isGeneratingStories, setIsGeneratingStories] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isAddSectionMenuOpen, setIsAddSectionMenuOpen] = useState(false);
  const [isAddingImageToSection, setIsAddingImageToSection] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const addSectionMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startInNewMode) {
      handleOpenNewPersona();
    }
  }, [startInNewMode]);

  useEffect(() => {
    if (!showIntro) return;
    const timer = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [showIntro]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (addSectionMenuRef.current && !addSectionMenuRef.current.contains(event.target as Node)) {
        setIsAddSectionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isAtGlobalLimit = personas.length >= details.maxGlobalPersonas;
  const canAddPersona = !isAtGlobalLimit && canEdit;

  const handleOpenNewPersona = () => {
    if (isAtGlobalLimit) {
      setShowLimitModal(true);
      return;
    }
    setIsCreationWizardOpen(true);
  };

  const handleCreateBlankPersona = () => {
    const newPersona: Persona = {
      id: uuidv4(),
      name: 'New Persona',
      type: 'Standard',
      role: 'Customer',
      age: 30,
      gender: 'Female',
      quote: 'I want a better experience.',
      goals: [],
      frustrations: [],
      motivations: [],
      sentiment: 3,
      imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=400&fit=crop`,
      demographics: [
        { id: uuidv4(), label: 'Tech Savvy', value: 50 },
        { id: uuidv4(), label: 'Brand Loyalty', value: 50 },
        { id: uuidv4(), label: 'Price Sensitivity', value: 50 }
      ]
    };
    handleSavePersona(newPersona);
    setIsCreationWizardOpen(false);
  };

  const handleOpenAiGenerator = () => {
    if (isAtGlobalLimit) {
      setShowLimitModal(true);
      return;
    }
    setIsAiGeneratorOpen(true);
  };

  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  const handleSavePersona = (newPersona: Persona) => {
    setPersonas([newPersona, ...personas]);
    setSelectedPersonaId(newPersona.id);
    onAddToAuditLog?.('Created Persona', `Created persona ${newPersona.name}`, 'Create', 'Persona', newPersona.id, 'Manual');
  };

  const handlePrint = async () => {
    setIsExportMenuOpen(false);
    if (!selectedPersona) return;
    const element = document.getElementById('persona-content');
    if (!element) return;
    
    try {
      addToast('Generating PDF...', 'info');
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-export'),
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
          const clonedElement = clonedDoc.getElementById('persona-content');
          if (clonedElement) {
            clonedElement.style.overflow = 'visible';
            clonedElement.style.height = 'auto';
            clonedElement.style.width = `${element.scrollWidth}px`;
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`persona-${selectedPersona.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      addToast('PDF generated successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Failed to generate PDF', 'error');
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(personas, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "personas.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDownloadImage = async () => {
    setIsExportMenuOpen(false);
    if (!selectedPersona) return;
    const element = document.getElementById('persona-content');
    if (!element) return;

    try {
      addToast('Generating image...', 'info');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-export'),
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
          const clonedElement = clonedDoc.getElementById('persona-content');
          if (clonedElement) {
            clonedElement.style.overflow = 'visible';
            clonedElement.style.height = 'auto';
            clonedElement.style.width = `${element.scrollWidth}px`;
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${selectedPersona.name.replace(/\s+/g, '_')}_persona.png`;
      link.click();
      addToast('Image generated successfully', 'success');
    } catch (err) {
      console.error('Failed to download image', err);
      addToast('Failed to generate image', 'error');
    }
  };

  const handleExportWord = () => {
    setIsExportMenuOpen(false);
    if (!selectedPersona) return;
    const element = document.getElementById('persona-content');
    if (!element) return;

    try {
      // Basic HTML export for Word
      const html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${selectedPersona.name}</title>
        </head>
        <body>
          <h1>${selectedPersona.name}</h1>
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
      link.download = `${selectedPersona.name.replace(/\s+/g, '_')}_persona.doc`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Word', err);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportMenuOpen(false);
    if (!selectedPersona) return;
    const element = document.getElementById('persona-content');
    if (!element) return;

    try {
      addToast('Generating PDF...', 'info');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
          const clonedElement = clonedDoc.getElementById('persona-content');
          if (clonedElement) {
            clonedElement.style.overflow = 'visible';
            clonedElement.style.height = 'auto';
            clonedElement.style.width = `${element.scrollWidth}px`;
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedPersona.name.replace(/\s+/g, '_')}_persona.pdf`);
      addToast('PDF generated successfully', 'success');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      addToast('Failed to generate PDF', 'error');
    }
  };

  const handleGenerateStories = async () => {
    if (!selectedPersona || isGeneratingStories) return;
    
    setIsGeneratingStories(true);
    addToast('Generating user stories...', 'info');

    try {
      const ai = await getGeminiClient();
      if (!ai) {
        addToast('Gemini API key is missing. Please select one to enable AI features.', 'error');
        await ensureApiKey();
        setIsGeneratingStories(false);
        return;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5-7 high-quality user stories for the following customer persona:
        Name: ${stripPIData(selectedPersona.name)}
        Role: ${stripPIData(selectedPersona.role)}
        Goals: ${selectedPersona.goals.map(stripPIData).join(', ')}
        Frustrations: ${selectedPersona.frustrations.map(stripPIData).join(', ')}
        
        Format the output as a JSON array of objects with the following structure:
        [
          { "asA": "...", "iWant": "...", "soThat": "..." }
        ]
        
        The "asA" field should be a variation of their role or specific context.
        The "iWant" should be a specific action or feature they need to solve their frustrations or achieve their goals.
        The "soThat" should be the specific benefit or value they expect to receive.
        
        Ensure the stories are diverse, covering different aspects of their interaction with a product or service.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json"
        }
      });

      const text = response.text || '[]';
      const stories = JSON.parse(text);
      const storiesWithIds = stories.map((s: any) => ({ ...s, id: uuidv4() }));
      
      updatePersonaField(selectedPersona.id, 'userStories', [...(selectedPersona.userStories || []), ...storiesWithIds]);
      addToast('User stories generated successfully', 'success');
    } catch (error) {
      console.error('Error generating stories:', error);
      addToast('Failed to generate user stories', 'error');
    } finally {
      setIsGeneratingStories(false);
    }
  };

  const updatePersonaField = (id: string, field: keyof Persona, value: any) => {
    setPersonas(personas.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateDemographic = (personaId: string, sliderId: string, value: number) => {
    setPersonas(personas.map(p => {
      if (p.id === personaId) {
        return {
          ...p,
          demographics: p.demographics.map(d => d.id === sliderId ? { ...d, value } : d)
        };
      }
      return p;
    }));
  };

  const addDemographic = (personaId: string) => {
    if (!newDemographicLabel.trim()) return;
    setPersonas(personas.map(p => {
      if (p.id === personaId) {
        return {
          ...p,
          demographics: [...(p.demographics || []), { id: uuidv4(), label: newDemographicLabel, value: 50 }]
        };
      }
      return p;
    }));
    setNewDemographicLabel('');
    setIsAddingDemographic(null);
  };

  const updateDemographicLabel = (personaId: string, sliderId: string, label: string) => {
    setPersonas(personas.map(p => {
      if (p.id === personaId) {
        return {
          ...p,
          demographics: p.demographics.map(d => d.id === sliderId ? { ...d, label } : d)
        };
      }
      return p;
    }));
  };

  const removeDemographic = (personaId: string, sliderId: string) => {
    setPersonas(personas.map(p => {
      if (p.id === personaId) {
        return {
          ...p,
          demographics: p.demographics.filter(d => d.id !== sliderId)
        };
      }
      return p;
    }));
  };

  const handleAddSection = (type: 'images' | 'sliders' | 'list') => {
    if (!selectedPersona) return;
    const currentSections = selectedPersona.additionalSections || [];
    if (currentSections.length >= 3) return;

    const newSection: any = {
      id: uuidv4(),
      title: type === 'images' ? 'Image Gallery' : type === 'sliders' ? 'Metrics' : 'Custom List',
      type,
      images: type === 'images' ? [] : undefined,
      sliders: type === 'sliders' ? [] : undefined,
      list: type === 'list' ? [] : undefined,
    };

    updatePersonaField(selectedPersona.id, 'additionalSections', [...currentSections, newSection]);
    setIsAddSectionMenuOpen(false);
  };

  const handleUpdateSection = (sectionId: string, updates: any) => {
    if (!selectedPersona) return;
    const currentSections = selectedPersona.additionalSections || [];
    const updatedSections = currentSections.map(s => s.id === sectionId ? { ...s, ...updates } : s);
    updatePersonaField(selectedPersona.id, 'additionalSections', updatedSections);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!selectedPersona) return;
    const currentSections = selectedPersona.additionalSections || [];
    updatePersonaField(selectedPersona.id, 'additionalSections', currentSections.filter(s => s.id !== sectionId));
  };

  const saveAsTemplate = (persona: Persona) => {
    const newTemplate: Persona = {
      ...persona,
      id: uuidv4(),
      isTemplate: true,
      isDefaultTemplate: false,
      name: `${persona.name} (Template)`
    };
    setTemplates([...templates, newTemplate]);
    addToast('Persona saved as template!', 'success');
  };

  const handleAvatarSelect = (url: string) => {
    if (!personaToUpdateAvatar) return;
    setPersonas(personas.map(p => {
      if (p.id === personaToUpdateAvatar) {
        return { ...p, imageUrl: url };
      }
      return p;
    }));
    setPersonaToUpdateAvatar(null);
  };

  const changeAvatar = (personaId: string) => {
    setPersonaToUpdateAvatar(personaId);
    setIsAvatarModalOpen(true);
  };

  const setDefaultTemplate = (templateId: string) => {
    setTemplates(templates.map(t => ({
      ...t,
      isDefaultTemplate: t.id === templateId
    })));
  };

  const deletePersona = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPersonas(personas.filter(p => p.id !== id));
    if (selectedPersonaId === id) setSelectedPersonaId(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:max-w-none">
      <ContextualHelp 
        title="Personas" 
        description="Create and manage detailed customer profiles. Personas help your team build empathy and ensure products are designed for real user needs, behaviors, and goals."
      />
      <div className="flex items-center justify-between print:hidden no-export">
        <div className="flex items-center gap-4">
          {selectedPersonaId && (
            <button 
              onClick={() => setSelectedPersonaId(null)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {selectedPersonaId ? 'Edit Persona' : 'Personas'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {selectedPersonaId ? `Refining profile for ${selectedPersona?.name}` : 'Manage your target customer profiles.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!selectedPersonaId && (
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className={cn(
                "px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border shadow-sm",
                showTemplates 
                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 text-zinc-900 dark:text-white" 
                  : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800"
              )}
            >
              <Star className={`w-4 h-4 ${showTemplates ? 'fill-zinc-900 dark:fill-white' : ''}`} />
              <span className="hidden sm:inline">Templates</span>
            </button>
          )}
          {selectedPersonaId && (
            <>
              <button 
                onClick={() => setIsVersionHistoryOpen(true)}
                className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
                title="Version History"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  title="Print or Export"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                <AnimatePresence>
                  {isExportMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                    >
                      <button 
                        onClick={handlePrint}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" /> Print
                      </button>
                      <button 
                        onClick={handleDownloadPdf}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Save as PDF
                      </button>
                      <button 
                        onClick={handleDownloadImage}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" /> Save as Image
                      </button>
                      <button 
                        onClick={handleExportWord}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Export to Word
                      </button>
                      <button 
                        onClick={handleExport}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Export to JSON
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
          {plan !== 'starter' && canEdit && !selectedPersonaId && (
            <button 
              onClick={handleOpenAiGenerator}
              className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Generator</span>
            </button>
          )}
          {canAddPersona && !selectedPersonaId && (
            <button 
              onClick={() => setIsLibraryOpen(true)}
              className="bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm relative"
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Browse Library</span>
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-md border border-indigo-200 dark:border-indigo-800">Pro</span>
            </button>
          )}
          {canAddPersona && !selectedPersonaId ? (
            <button 
              onClick={handleOpenNewPersona}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Persona</span>
            </button>
          ) : !selectedPersonaId && (
            <button 
              onClick={() => setShowLimitModal(true)}
              title={!canEdit ? "You do not have permission to add personas" : `Plan limit reached (${details.maxGlobalPersonas} personas)`}
              className="bg-zinc-300 text-zinc-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-zinc-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Persona</span>
            </button>
          )}
          {selectedPersonaId && canEdit && (
            <button 
              onClick={() => saveAsTemplate(selectedPersona!)}
              className="bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-amber-200 dark:border-amber-800 shadow-sm"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Save as Template</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Project Creation Prompt - Persistent until first project created */}
      {!selectedPersonaId && personas.length > 0 && !projects.some(p => !mockProjects.find(mp => mp.id === p.id)) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl mb-8 mt-4"
        >
          <div className="absolute top-0 right-0 p-32 bg-indigo-500/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 p-24 bg-emerald-500/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Next Step
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Create your First Project</h3>
              <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
                Great job on your personas! Now, group them into a project to start mapping their journeys and identifying transformation opportunities.
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('projects', 'new')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              Create First Project
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {!selectedPersonaId && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 overflow-hidden transition-all print:hidden no-export">
          <button 
            onClick={() => setShowIntro(!showIntro)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-indigo-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-indigo-900">Data-Driven Personas</h3>
                <p className="text-sm text-indigo-600">Personas should be based on real customer data and research from the Intelligence hub.</p>
              </div>
            </div>
            {showIntro ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-indigo-400" />}
          </button>
          
          {showIntro && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <p className="text-indigo-900/80 leading-relaxed">
                    A persona is a semi-fictional representation of your ideal customer based on market research and real data about your existing customers.
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Use Intelligence data to define goals and frustrations',
                      'Identify common behavioral patterns',
                      'Understand what drives their decision making',
                      'Keep them updated as you learn more'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-indigo-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-indigo-200 relative flex items-center justify-center">
                  {/* Persona Card Mockup */}
                  <div className="bg-white dark:bg-zinc-800 w-3/4 max-w-md rounded-xl shadow-2xl p-6 relative">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
                      </div>
                    </div>

                    {/* Sliders Section */}
                    <div className="space-y-4 mb-6">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium uppercase">
                          <span>Tech Savvy</span>
                          <span>{animationStep >= 1 ? 'High' : 'Low'}</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-indigo-500"
                            initial={{ width: '20%' }}
                            animate={{ width: animationStep >= 1 ? '80%' : '20%' }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium uppercase">
                          <span>Price Sensitivity</span>
                          <span>{animationStep >= 2 ? 'Low' : 'High'}</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: '90%' }}
                            animate={{ width: animationStep >= 2 ? '30%' : '90%' }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Demographics Section */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-zinc-500 font-medium uppercase mb-2">Demographics</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs rounded-md">Age: 25-34</span>
                        <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs rounded-md">Location: Urban</span>
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: animationStep >= 3 ? 1 : 0, scale: animationStep >= 3 ? 1 : 0.8 }}
                          className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-md border border-indigo-200 dark:border-indigo-800"
                        >
                          Income: $75k+
                        </motion.span>
                      </div>
                    </div>

                    {/* Cursor Animation */}
                    <motion.div
                      className="absolute z-50 pointer-events-none"
                      initial={{ x: 50, y: 150, opacity: 0 }}
                      animate={{
                        x: animationStep === 0 ? 50 : animationStep === 1 ? 250 : animationStep === 2 ? 100 : 150,
                        y: animationStep === 0 ? 150 : animationStep === 1 ? 100 : animationStep === 2 ? 140 : 220,
                        opacity: 1
                      }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.5 3.21V20.8C5.5 21.45 6.27 21.8 6.75 21.36L11.44 17.02L15.48 23.31C15.72 23.69 16.21 23.82 16.6 23.58L18.66 22.25C19.05 22.01 19.18 21.52 18.94 21.14L14.9 14.85H20.21C20.89 14.85 21.25 14.05 20.8 13.54L6.75 2.5C6.31 2.01 5.5 2.32 5.5 3.21Z" fill="black" stroke="white" strokeWidth="1.5"/>
                      </svg>
                      {/* Click Ripple */}
                      <motion.div
                        className="absolute top-0 left-0 w-6 h-6 bg-indigo-500 rounded-full"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                          scale: [0, 1.5, 0],
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{
                          duration: 0.5,
                          times: [0, 0.5, 1],
                          repeat: animationStep > 0 ? 1 : 0,
                          repeatDelay: 2.5
                        }}
                        style={{ originX: 0.2, originY: 0.2 }}
                      />
                    </motion.div>
                  </div>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-zinc-400 text-sm font-medium">
                      {animationStep === 0 && "Reviewing persona attributes..."}
                      {animationStep === 1 && "Adjusting trait sliders..."}
                      {animationStep === 2 && "Refining behavioral metrics..."}
                      {animationStep === 3 && "Adding new demographic data..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showTemplates ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              Template Library
            </h3>
            <button onClick={() => setShowTemplates(false)} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className={`bg-white dark:bg-zinc-900 p-4 rounded-xl border transition-all ${template.isDefaultTemplate ? 'border-amber-400 ring-1 ring-amber-400' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <img src={template.imageUrl} alt={template.name} className="w-10 h-10 rounded-full object-cover" crossOrigin="anonymous" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-900 dark:text-white truncate">{template.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{template.role}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button 
                    onClick={() => setDefaultTemplate(template.id)}
                    className={`text-xs font-bold px-2 py-1 rounded ${template.isDefaultTemplate ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'}`}
                  >
                    {template.isDefaultTemplate ? 'Default Template' : 'Set as Default'}
                  </button>
                  <button 
                    onClick={() => {
                      handleSavePersona({ ...template, id: uuidv4(), isTemplate: false, isDefaultTemplate: false });
                      setShowTemplates(false);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !selectedPersonaId ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Person Name</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Persona Name</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Age</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {personas.map(persona => (
                <tr 
                  key={persona.id} 
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={persona.imageUrl} alt={persona.name} className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" crossOrigin="anonymous" />
                      <span className="font-bold text-zinc-900 dark:text-white">{persona.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300 font-medium">{persona.type || 'Standard'}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300 font-medium">{persona.role}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{persona.age}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{persona.gender || 'Not specified'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedPersonaId(persona.id); }}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg transition-all"
                          title="Edit Persona"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button 
                          onClick={(e) => deletePersona(persona.id, e)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Persona"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {personas.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center min-h-[500px]">
              <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <Users className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No personas yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
                Start understanding your customers better by creating your first user persona.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create New Persona
              </button>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div id="persona-content" className="space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col md:flex-row print:shadow-none print:border-zinc-300 break-inside-avoid">
            <div className="bg-zinc-50 dark:bg-zinc-900 p-8 md:w-1/3 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 print:bg-white dark:bg-zinc-900">
            <div className="relative group">
              <div className="relative cursor-pointer" onClick={() => setSelectedImage(selectedPersona!.imageUrl)}>
                <img src={selectedPersona!.imageUrl} alt={selectedPersona!.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mb-6 transition-all group-hover:brightness-75" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
              {canEdit && (
                <button 
                  onClick={() => changeAvatar(selectedPersona!.id)}
                  className="absolute bottom-6 right-0 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-all no-export"
                  title="Change Avatar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <EditableText 
              value={selectedPersona!.name} 
              onChange={(val) => updatePersonaField(selectedPersona!.id, 'name', val)}
              className="text-2xl font-bold text-zinc-900 dark:text-white text-center"
              disabled={!canEdit}
            />
            
            <EditableText 
              value={selectedPersona!.type || 'Standard Persona'} 
              onChange={(val) => updatePersonaField(selectedPersona!.id, 'type', val)}
              className="text-indigo-600 dark:text-indigo-400 font-bold text-sm text-center mt-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full inline-block"
              disabled={!canEdit}
            />

            <EditableText 
              value={selectedPersona!.role} 
              onChange={(val) => updatePersonaField(selectedPersona!.id, 'role', val)}
              className="text-zinc-600 dark:text-zinc-300 font-semibold text-lg text-center mt-3"
              disabled={!canEdit}
            />
            
            <div className="flex items-center justify-center gap-4 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400">Age:</span>
                <EditableText 
                  value={selectedPersona!.age.toString()} 
                  onChange={(val) => updatePersonaField(selectedPersona!.id, 'age', parseInt(val) || selectedPersona!.age)}
                  className="text-zinc-500 dark:text-zinc-400"
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400">Gender:</span>
                {canEdit ? (
                  <select
                    value={selectedPersona!.gender || 'Female'}
                    onChange={(e) => updatePersonaField(selectedPersona!.id, 'gender', e.target.value)}
                    className="bg-transparent text-zinc-500 dark:text-zinc-400 outline-none cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">{selectedPersona!.gender || 'Not specified'}</span>
                )}
              </div>
            </div>
            
            <div className="mt-8 text-left w-full bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Quote className="w-6 h-6 text-zinc-300 mb-2" />
              <EditableText 
                value={selectedPersona!.quote} 
                onChange={(val) => updatePersonaField(selectedPersona!.id, 'quote', val)}
                multiline
                className="text-zinc-700 dark:text-zinc-200 italic leading-relaxed"
                disabled={!canEdit}
              />
            </div>

            <div className="mt-8 w-full space-y-4 print:hidden">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Demographics
                </h4>
                {canEdit && (
                  <button onClick={() => setIsAddingDemographic(selectedPersona!.id)} className="text-xs text-zinc-400 hover:text-zinc-900 dark:text-white no-export">
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {isAddingDemographic === selectedPersona!.id && (
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg no-export">
                  <input 
                    type="text"
                    value={newDemographicLabel}
                    onChange={(e) => setNewDemographicLabel(e.target.value)}
                    placeholder="Label..."
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && addDemographic(selectedPersona!.id)}
                  />
                  <button onClick={() => addDemographic(selectedPersona!.id)} className="text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsAddingDemographic(null)} className="text-zinc-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {selectedPersona!.demographics?.map(demo => (
                  <div key={demo.id} className="space-y-2 group/slider">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      <EditableText 
                        value={demo.label}
                        onChange={(val) => updateDemographicLabel(selectedPersona!.id, demo.id, val)}
                        className="hover:text-zinc-900 dark:text-white"
                        disabled={!canEdit}
                      />
                      <div className="flex items-center gap-2">
                        <span>{demo.value}%</span>
                        {canEdit && (
                          <button onClick={() => removeDemographic(selectedPersona!.id, demo.id)} className="text-zinc-300 hover:text-rose-500 opacity-0 group-hover/slider:opacity-100 transition-opacity no-export">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative h-2 w-full rounded-lg bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={demo.value} 
                        onChange={(e) => updateDemographic(selectedPersona!.id, demo.id, parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-2 bg-transparent appearance-none cursor-pointer accent-white disabled:opacity-50"
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Current Sentiment
                </h4>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex justify-between w-full px-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => updatePersonaField(selectedPersona!.id, 'sentiment', score)}
                        disabled={!canEdit}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedPersona!.sentiment === score
                            ? score <= 2 ? 'bg-rose-500 text-white shadow-md scale-110'
                            : score === 3 ? 'bg-amber-500 text-white shadow-md scale-110'
                            : 'bg-emerald-500 text-white shadow-md scale-110'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between w-full text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                    <span>Negative</span>
                    <span>Neutral</span>
                    <span>Positive</span>
                  </div>
                  {selectedPersona!.sentiment && (
                    <div className="mt-4 flex flex-col items-center animate-in zoom-in duration-300">
                      {selectedPersona!.sentiment === 1 ? (
                        <Angry className="w-16 h-16 text-rose-600" />
                      ) : selectedPersona!.sentiment === 2 ? (
                        <Frown className="w-16 h-16 text-rose-500" />
                      ) : selectedPersona!.sentiment === 3 ? (
                        <Meh className="w-16 h-16 text-amber-500" />
                      ) : selectedPersona!.sentiment === 4 ? (
                        <Smile className="w-16 h-16 text-emerald-500" />
                      ) : (
                        <Laugh className="w-16 h-16 text-emerald-600" />
                      )}
                      <span className="text-xs font-bold mt-2 text-zinc-500">
                        {selectedPersona!.sentiment === 1 ? 'Angry' 
                         : selectedPersona!.sentiment === 2 ? 'Frustrated' 
                         : selectedPersona!.sentiment === 3 ? 'Neutral' 
                         : selectedPersona!.sentiment === 4 ? 'Satisfied' 
                         : 'Delighted'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:w-2/3 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-6 h-6 text-emerald-500" />
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Goals</h4>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPersona!.goals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <EditableText 
                        value={goal} 
                        onChange={(val) => {
                          const newGoals = [...selectedPersona!.goals];
                          newGoals[i] = val;
                          updatePersonaField(selectedPersona!.id, 'goals', newGoals);
                        }}
                        className="text-sm font-medium flex-1"
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <button 
                          onClick={() => {
                            const newGoals = selectedPersona!.goals.filter((_, idx) => idx !== i);
                            updatePersonaField(selectedPersona!.id, 'goals', newGoals);
                          }}
                          className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shadow-sm no-export"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  ))}
                  {canEdit && (
                    <button 
                      onClick={() => {
                        const goal = 'New Goal';
                        setPersonas(personas.map(p => p.id === selectedPersona!.id ? { ...p, goals: [...p.goals, goal] } : p));
                      }}
                      className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mt-2 no-export"
                    >
                      <Plus className="w-4 h-4" /> Add Goal
                    </button>
                  )}
                </ul>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-4">
                  <Frown className="w-6 h-6 text-rose-500" />
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Frustrations</h4>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPersona!.frustrations.map((frustration, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                      <span className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                      <EditableText 
                        value={frustration} 
                        onChange={(val) => {
                          const newFrustrations = [...selectedPersona!.frustrations];
                          newFrustrations[i] = val;
                          updatePersonaField(selectedPersona!.id, 'frustrations', newFrustrations);
                        }}
                        className="text-sm font-medium flex-1"
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <button 
                          onClick={() => {
                            const newFrustrations = selectedPersona!.frustrations.filter((_, idx) => idx !== i);
                            updatePersonaField(selectedPersona!.id, 'frustrations', newFrustrations);
                          }}
                          className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shadow-sm no-export"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  ))}
                  {canEdit && (
                    <button 
                      onClick={() => {
                        const frustration = 'New Frustration';
                        setPersonas(personas.map(p => p.id === selectedPersona!.id ? { ...p, frustrations: [...p.frustrations, frustration] } : p));
                      }}
                      className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mt-2 no-export"
                    >
                      <Plus className="w-4 h-4" /> Add Frustration
                    </button>
                  )}
                </ul>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-6 h-6 text-pink-500" />
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Motivations</h4>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(selectedPersona!.motivations || []).map((motivation, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                      <span className="w-2 h-2 rounded-full bg-pink-400 mt-2 shrink-0" />
                      <EditableText 
                        value={motivation} 
                        onChange={(val) => {
                          const newMotivations = [...(selectedPersona!.motivations || [])];
                          newMotivations[i] = val;
                          updatePersonaField(selectedPersona!.id, 'motivations', newMotivations);
                        }}
                        className="text-sm font-medium flex-1"
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <button 
                          onClick={() => {
                            const newMotivations = (selectedPersona!.motivations || []).filter((_, idx) => idx !== i);
                            updatePersonaField(selectedPersona!.id, 'motivations', newMotivations);
                          }}
                          className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shadow-sm no-export"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  ))}
                  {canEdit && (
                    <button 
                      onClick={() => {
                        const motivation = 'New Motivation';
                        setPersonas(personas.map(p => p.id === selectedPersona!.id ? { ...p, motivations: [...(p.motivations || []), motivation] } : p));
                      }}
                      className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mt-2 no-export"
                    >
                      <Plus className="w-4 h-4" /> Add Motivation
                    </button>
                  )}
                </ul>
              </div>

              {/* Additional Sections */}
              {(selectedPersona!.additionalSections || []).map((section) => (
                <div key={section.id} className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 relative group">
                  {canEdit && (
                    <button 
                      onClick={() => handleRemoveSection(section.id)}
                      className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 no-export"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutTemplate className="w-6 h-6 text-indigo-500" />
                    <EditableText
                      value={section.title}
                      onChange={(val) => handleUpdateSection(section.id, { title: val })}
                      className="text-lg font-bold text-zinc-900 dark:text-white pr-8"
                      disabled={!canEdit}
                    />
                  </div>
                  
                  {section.type === 'images' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(section.images || []).map((img, i) => (
                        <div key={i} className="relative group/img aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden">
                          <img 
                            src={img} 
                            alt="" 
                            className="w-full h-full object-cover cursor-pointer" 
                            crossOrigin="anonymous" 
                            onClick={() => setSelectedImage(img)}
                          />
                          {canEdit && (
                            <button 
                              onClick={() => {
                                const newImages = [...(section.images || [])];
                                newImages.splice(i, 1);
                                handleUpdateSection(section.id, { images: newImages });
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEdit && (section.images || []).length < 3 && (
                        <div className="aspect-video relative">
                          <input 
                            type="file"
                            id={`section-image-upload-${section.id}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const url = event.target?.result as string;
                                  handleUpdateSection(section.id, { images: [...(section.images || []), url] });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`section-image-upload-${section.id}`}
                            className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer"
                          >
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-xs font-medium">Upload Image</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {section.type === 'sliders' && (
                    <div className="space-y-4">
                      {(section.sliders || []).map((slider) => (
                        <div key={slider.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/slider">
                          <div className="flex justify-between items-center mb-2">
                            <EditableText
                              value={slider.label}
                              onChange={(val) => {
                                const newSliders = (section.sliders || []).map(s => s.id === slider.id ? { ...s, label: val } : s);
                                handleUpdateSection(section.id, { sliders: newSliders });
                              }}
                              className="text-sm font-bold text-zinc-700 dark:text-zinc-200"
                              disabled={!canEdit}
                            />
                            <span className="text-xs font-medium text-zinc-500">{slider.value}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={slider.value}
                            onChange={(e) => {
                              const newSliders = (section.sliders || []).map(s => s.id === slider.id ? { ...s, value: Number(e.target.value) } : s);
                              handleUpdateSection(section.id, { sliders: newSliders });
                            }}
                            disabled={!canEdit}
                            className="w-full accent-indigo-600"
                          />
                          {canEdit && (
                            <button 
                              onClick={() => {
                                const newSliders = (section.sliders || []).filter(s => s.id !== slider.id);
                                handleUpdateSection(section.id, { sliders: newSliders });
                              }}
                              className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity shadow-sm no-export"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <button 
                          onClick={() => {
                            const newSliders = [...(section.sliders || []), { id: uuidv4(), label: 'New Metric', value: 50 }];
                            handleUpdateSection(section.id, { sliders: newSliders });
                          }}
                          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mt-2 no-export"
                        >
                          <Plus className="w-4 h-4" /> Add Metric
                        </button>
                      )}
                    </div>
                  )}

                  {section.type === 'list' && (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(section.list || []).map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                          <EditableText 
                            value={item} 
                            onChange={(val) => {
                              const newList = [...(section.list || [])];
                              newList[i] = val;
                              handleUpdateSection(section.id, { list: newList });
                            }}
                            className="text-sm font-medium flex-1"
                            disabled={!canEdit}
                          />
                          {canEdit && (
                            <button 
                              onClick={() => {
                                const newList = (section.list || []).filter((_, idx) => idx !== i);
                                handleUpdateSection(section.id, { list: newList });
                              }}
                              className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity shadow-sm no-export"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </li>
                      ))}
                      {canEdit && (
                        <button 
                          onClick={() => {
                            const newList = [...(section.list || []), 'New Item'];
                            handleUpdateSection(section.id, { list: newList });
                          }}
                          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 mt-2 no-export"
                        >
                          <Plus className="w-4 h-4" /> Add Item
                        </button>
                      )}
                    </ul>
                  )}
                </div>
              ))}

              {/* Add Section Button */}
              {canEdit && (selectedPersona!.additionalSections || []).length < 3 && (
                <div className="relative" ref={addSectionMenuRef}>
                  <button 
                    onClick={() => setIsAddSectionMenuOpen(!isAddSectionMenuOpen)}
                    className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-zinc-500 font-medium hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2 no-export"
                  >
                    <Plus className="w-5 h-5" /> Add Section
                  </button>
                  <AnimatePresence>
                    {isAddSectionMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50"
                      >
                        <button 
                          onClick={() => handleAddSection('images')}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                        >
                          <ImageIcon className="w-4 h-4 text-indigo-500" /> Image Gallery
                        </button>
                        <button 
                          onClick={() => handleAddSection('sliders')}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                        >
                          <Sliders className="w-4 h-4 text-emerald-500" /> Metrics & Sliders
                        </button>
                        <button 
                          onClick={() => handleAddSection('list')}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3"
                        >
                          <List className="w-4 h-4 text-amber-500" /> Custom List
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Stories */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm print:shadow-none print:border-zinc-300 break-inside-avoid">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">User Stories</h4>
              </div>
              <div className="flex items-center gap-3">
                {canEdit && (
                  <button
                    onClick={handleGenerateStories}
                    disabled={isGeneratingStories}
                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 no-export"
                  >
                    <Sparkles className={cn("w-4 h-4", isGeneratingStories && "animate-pulse")} />
                    {isGeneratingStories ? 'Generating...' : 'Generate with AI'}
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => {
                      const newStory = { id: uuidv4(), asA: selectedPersona!.role || 'user', iWant: 'do something', soThat: 'I can achieve my goal' };
                      updatePersonaField(selectedPersona!.id, 'userStories', [...(selectedPersona!.userStories || []), newStory]);
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white no-export"
                  >
                    <Plus className="w-4 h-4" /> Add Story
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-zinc-50 dark:bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">As a...</th>
                    <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">I want to...</th>
                    <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">So that...</th>
                    <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {(selectedPersona!.userStories || []).map((story, idx) => (
                    <tr key={story.id} className="hover:bg-white dark:hover:bg-zinc-800 group/story transition-colors">
                      <td className="px-4 py-3 align-top">
                        <EditableText
                          value={story.asA}
                          onChange={(val) => {
                            const newStories = [...(selectedPersona!.userStories || [])];
                            newStories[idx] = { ...story, asA: val };
                            updatePersonaField(selectedPersona!.id, 'userStories', newStories);
                          }}
                          className="text-sm text-zinc-900 dark:text-white font-medium"
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <EditableText
                          value={story.iWant}
                          onChange={(val) => {
                            const newStories = [...(selectedPersona!.userStories || [])];
                            newStories[idx] = { ...story, iWant: val };
                            updatePersonaField(selectedPersona!.id, 'userStories', newStories);
                          }}
                          className="text-sm text-zinc-700 dark:text-zinc-300"
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <EditableText
                          value={story.soThat}
                          onChange={(val) => {
                            const newStories = [...(selectedPersona!.userStories || [])];
                            newStories[idx] = { ...story, soThat: val };
                            updatePersonaField(selectedPersona!.id, 'userStories', newStories);
                          }}
                          className="text-sm text-zinc-700 dark:text-zinc-300"
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        {canEdit && (
                          <button
                            onClick={() => {
                              const newStories = (selectedPersona!.userStories || []).filter(s => s.id !== story.id);
                              updatePersonaField(selectedPersona!.id, 'userStories', newStories);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all opacity-0 group-hover/story:opacity-100 no-export"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!selectedPersona!.userStories || selectedPersona!.userStories.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        No user stories yet. Click "Add Story" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Persona Limit Reached"
        description="You've reached the maximum number of personas allowed on your current plan. Upgrade to create more personas and unlock advanced features."
        limitType="personas"
        currentUsage={personas.length}
        maxLimit={details.maxGlobalPersonas}
        onUpgrade={() => onNavigate?.('pricing')}
        isDarkMode={isDarkMode}
      />

      <CreatePersonaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePersona}
        companyProfile={companyProfile}
      />

      <AiPersonaGenerator
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onSave={(newPersonas) => {
          setPersonas([...newPersonas, ...personas]);
          newPersonas.forEach(p => {
            onAddToAuditLog?.('Created AI Persona', `Created persona ${p.name} using AI`, 'Create', 'Persona', p.id, 'AI');
          });
        }}
        companyProfile={companyProfile}
      />

      <PersonaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onImport={handleSavePersona}
      />

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.img
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AvatarGalleryModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={handleAvatarSelect}
      />

      {/* Creation Wizard Selection Modal */}
      <AnimatePresence>
        {isCreationWizardOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Create New Persona</h3>
                  <p className="text-zinc-500 dark:text-zinc-400">Choose how you'd like to build your customer profile</p>
                </div>
                <button onClick={() => setIsCreationWizardOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Browse Library */}
                <button
                  onClick={() => {
                    if (plan === 'starter') {
                      addToast("Persona Library is a Pro feature. Upgrade to unlock.", "info");
                      return;
                    }
                    setIsLibraryOpen(true);
                    setIsCreationWizardOpen(false);
                  }}
                  className="flex flex-col items-center p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all group text-center"
                >
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Browse Library</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose from pre-built industry templates</p>
                  {plan === 'starter' && (
                    <span className="mt-3 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded uppercase tracking-wider">Pro Feature</span>
                  )}
                </button>

                {/* Use a Template */}
                <button
                  onClick={() => {
                    setShowTemplates(true);
                    setIsCreationWizardOpen(false);
                  }}
                  className="flex flex-col items-center p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-600 hover:bg-blue-50/30 transition-all group text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <LayoutTemplate className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Use a Template</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Start with a structured persona framework</p>
                </button>

                {/* Create New Persona (Manual) */}
                <button
                  onClick={handleCreateBlankPersona}
                  className="flex flex-col items-center p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-emerald-600 hover:bg-emerald-50/30 transition-all group text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Create New</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Start with a blank profile and edit manually</p>
                </button>

                {/* Use AI */}
                <button
                  onClick={() => {
                    setIsAiGeneratorOpen(true);
                    setIsCreationWizardOpen(false);
                  }}
                  className="flex flex-col items-center p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-purple-600 hover:bg-purple-50/30 transition-all group text-center"
                >
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Use AI</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Generate personas from research data</p>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedPersonaId && (
        <VersionHistory
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          entityType="personas"
          entityId={selectedPersonaId}
          currentData={selectedPersona}
          onRestore={(data) => {
            setPersonas(personas.map(p => p.id === selectedPersonaId ? data : p));
          }}
        />
      )}
    </div>
  );
}
