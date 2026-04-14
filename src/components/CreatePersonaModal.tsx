import React, { useState, useRef } from 'react';
import { X, Wand2, Upload, User, Target, Frown, Quote, Loader2, FileText, Sliders, Star, Plus, Image as ImageIcon, Heart, BookOpen, Folder, ChevronLeft, Home, Building2, Briefcase, HeartPulse, ShoppingCart, Scale, Calculator, Zap, Filter, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { Type, ThinkingLevel } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { stripPIData } from '../lib/piStripper';
import { useToast } from '../context/ToastContext';
import { Persona, DemographicSlider } from '../types';
import { personaTemplates } from '../data/mockData';
import { personaLibrary, PersonaFolder } from '../data/personaLibrary';
import { AvatarGalleryModal } from './AvatarGalleryModal';

const iconMap: Record<string, React.ElementType> = {
  Home,
  Building2,
  Briefcase,
  HeartPulse,
  ShoppingCart,
  Folder,
  Scale,
  Calculator,
  Zap
};

interface CreatePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Persona) => void;
}

export function CreatePersonaModal({ isOpen, onClose, onSave }: CreatePersonaModalProps) {
  const { addToast } = useToast();
  const [mode, setMode] = useState<'manual' | 'ai' | 'template' | 'library'>('manual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [uploadData, setUploadData] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Library State
  const [selectedFolder, setSelectedFolder] = useState<PersonaFolder | null>(null);
  const [previewPersona, setPreviewPersona] = useState<Partial<Persona> | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [ageFilter, setAgeFilter] = useState<string>('All');

  const defaultTemplate = personaTemplates.find(t => t.isDefaultTemplate) || personaTemplates[0];

  const HUMAN_AVATARS = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop',
  ];

  const getRandomAvatar = () => HUMAN_AVATARS[Math.floor(Math.random() * HUMAN_AVATARS.length)];

  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    type: '',
    role: '',
    age: 30,
    quote: '',
    goals: [''],
    frustrations: [''],
    imageUrl: getRandomAvatar(),
    demographics: defaultTemplate.demographics.map(d => ({ ...d, id: uuidv4() }))
  });

  const handleManualSave = () => {
    if (!formData.name || !formData.role) return;
    
    const newPersona: Persona = {
      id: uuidv4(),
      name: formData.name || '',
      type: formData.type || '',
      role: formData.role || '',
      age: formData.age || 30,
      gender: formData.gender || 'Female',
      quote: formData.quote || '',
      goals: (formData.goals || []).filter(g => g.trim() !== ''),
      frustrations: (formData.frustrations || []).filter(f => f.trim() !== ''),
      motivations: (formData.motivations || []).filter(m => m.trim() !== ''),
      sentiment: formData.sentiment || 3,
      imageUrl: formData.imageUrl || getRandomAvatar(),
      demographics: formData.demographics || []
    };
    
    onSave(newPersona);
    onClose();
  };

  const handleAiGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    
    try {
      await ensureApiKey();
      const ai = await getGeminiClient();
      if (!ai) {
        setIsGenerating(false);
        return;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a detailed customer persona based on this description: "${stripPIData(prompt)}". 
        ${uploadData ? `Use this demographic data as context: ${stripPIData(uploadData)}` : ''}
        Also, generate 3 relevant user stories for this persona in the format: "As a [persona], I want [action], so that [benefit]".
        Provide the persona in JSON format.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, description: "The type or category of the persona, e.g., 'Library User Persona' or 'Housing Association Tenant'" },
              role: { type: Type.STRING },
              age: { type: Type.INTEGER },
              gender: { type: Type.STRING, description: "Gender of the persona, e.g., 'Male', 'Female', or 'Non-binary'" },
              quote: { type: Type.STRING },
              goals: { type: Type.ARRAY, items: { type: Type.STRING } },
              frustrations: { type: Type.ARRAY, items: { type: Type.STRING } },
              motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
              sentiment: { type: Type.INTEGER, description: "A number from 1 to 5 representing current sentiment (1=Angry, 5=Delighted)" },
              demographics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.INTEGER }
                  },
                  required: ["label", "value"]
                }
              },
              userStories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    asA: { type: Type.STRING },
                    iWant: { type: Type.STRING },
                    soThat: { type: Type.STRING }
                  },
                  required: ["asA", "iWant", "soThat"]
                }
              }
            },
            required: ["name", "role", "age", "gender", "quote", "goals", "frustrations", "motivations", "sentiment", "demographics", "userStories"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      const newPersona: Persona = {
        id: uuidv4(),
        ...data,
        userStories: (data.userStories || []).map((us: any) => ({ ...us, id: uuidv4() })),
        demographics: data.demographics.map((d: any) => ({ ...d, id: uuidv4() })),
        imageUrl: getRandomAvatar()
      };
      
      onSave(newPersona);
      onClose();
    } catch (error) {
      console.error('AI Generation failed:', error);
      addToast('AI Generation failed. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadData(content);
      setMode('ai');
    };
    reader.readAsText(file);
  };

  const useTemplate = (template: Persona) => {
    setFormData({
      ...template,
      id: undefined,
      isTemplate: false,
      isDefaultTemplate: false,
      demographics: template.demographics.map(d => ({ ...d, id: uuidv4() }))
    });
    setMode('manual');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create New Persona</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Define a target customer profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <button 
            onClick={() => setMode('manual')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${mode === 'manual' ? 'border-zinc-900 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-200'}`}
          >
            Manual Entry
          </button>
          <button 
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${mode === 'ai' ? 'border-zinc-900 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-200'}`}
          >
            AI Guided
          </button>
          <button 
            onClick={() => setMode('template')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${mode === 'template' ? 'border-zinc-900 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-200'}`}
          >
            Templates
          </button>
          <button 
            onClick={() => setMode('library')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all ${mode === 'library' ? 'border-zinc-900 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-200'} flex items-center justify-center gap-2`}
          >
            <BookOpen className="w-4 h-4" />
            Persona Library
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {mode === 'manual' ? (
              <motion.div 
                key="manual"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                    <img src={formData.imageUrl} alt="Avatar Preview" className="w-20 h-20 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-800 group-hover:brightness-75 transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Full Name</label>
                        <input 
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                          placeholder="e.g. Sarah Jenkins"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Persona Name</label>
                        <input 
                          type="text"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                          placeholder="e.g. Library User Persona"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Role / Title</label>
                        <input 
                          type="text"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                          placeholder="e.g. Marketing Manager"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Age</label>
                    <input 
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Gender</label>
                    <select
                      value={formData.gender || 'Female'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Key Quote</label>
                    <input 
                      type="text"
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                      placeholder="A defining statement..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-zinc-400" /> Demographics
                    </label>
                    <button 
                      onClick={() => {
                        const label = 'New Demographic';
                        setFormData({ ...formData, demographics: [...(formData.demographics || []), { id: uuidv4(), label, value: 50 }] });
                      }}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white font-medium"
                    >
                      + Add Slider
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.demographics?.map((demo, i) => (
                      <div key={demo.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                          <span>{demo.label}</span>
                          <div className="flex items-center gap-2">
                            <span>{demo.value}%</span>
                            <button 
                              onClick={() => setFormData({ ...formData, demographics: formData.demographics?.filter(d => d.id !== demo.id) })}
                              className="text-zinc-300 hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={demo.value} 
                          onChange={(e) => {
                            const newDemos = [...(formData.demographics || [])];
                            newDemos[i] = { ...newDemos[i], value: parseInt(e.target.value) };
                            setFormData({ ...formData, demographics: newDemos });
                          }}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" /> Goals
                    </label>
                    <button 
                      onClick={() => setFormData({ ...formData, goals: [...(formData.goals || []), ''] })}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white font-medium"
                    >
                      + Add Goal
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.goals?.map((goal, i) => (
                      <input 
                        key={i}
                        type="text"
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...(formData.goals || [])];
                          newGoals[i] = e.target.value;
                          setFormData({ ...formData, goals: newGoals });
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        placeholder={`Goal ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" /> Motivations
                    </label>
                    <button 
                      onClick={() => setFormData({ ...formData, motivations: [...(formData.motivations || []), ''] })}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white font-medium"
                    >
                      + Add Motivation
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.motivations?.map((motivation, i) => (
                      <input 
                        key={i}
                        type="text"
                        value={motivation}
                        onChange={(e) => {
                          const newMotivations = [...(formData.motivations || [])];
                          newMotivations[i] = e.target.value;
                          setFormData({ ...formData, motivations: newMotivations });
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        placeholder={`Motivation ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                      <Frown className="w-4 h-4 text-rose-500" /> Frustrations
                    </label>
                    <button 
                      onClick={() => setFormData({ ...formData, frustrations: [...(formData.frustrations || []), ''] })}
                      className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white font-medium"
                    >
                      + Add Frustration
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.frustrations?.map((frustration, i) => (
                      <input 
                        key={i}
                        type="text"
                        value={frustration}
                        onChange={(e) => {
                          const newFrustrations = [...(formData.frustrations || [])];
                          newFrustrations[i] = e.target.value;
                          setFormData({ ...formData, frustrations: newFrustrations });
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
                        placeholder={`Frustration ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                    Current Sentiment
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setFormData({ ...formData, sentiment: score })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                          formData.sentiment === score
                            ? score === 1 ? 'bg-rose-100 text-rose-600 border-2 border-rose-500'
                            : score === 2 ? 'bg-orange-100 text-orange-600 border-2 border-orange-500'
                            : score === 3 ? 'bg-amber-100 text-amber-600 border-2 border-amber-500'
                            : score === 4 ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500'
                            : 'bg-indigo-100 text-indigo-600 border-2 border-indigo-500'
                            : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {score === 1 ? '😡' : score === 2 ? '😟' : score === 3 ? '😐' : score === 4 ? '🙂' : '🤩'}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : mode === 'ai' ? (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">AI Persona Builder</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Describe your target customer or use uploaded data</p>
                    </div>
                  </div>
                  
                  {uploadData && (
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <span className="flex-1 truncate">Demographic data loaded</span>
                      <button onClick={() => setUploadData(null)} className="text-rose-500 hover:text-rose-700">Remove</button>
                    </div>
                  )}

                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. A tech-savvy millennial marketing manager who values automation and efficiency..."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 min-h-[120px] resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="ai-file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".txt,.csv,.json,.pdf,.docx"
                      />
                      <label
                        htmlFor="ai-file-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadData ? 'File Uploaded' : 'Upload Context File'}
                      </label>
                      {uploadData && (
                        <button
                          onClick={() => setUploadData(null)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          title="Remove uploaded data"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {uploadData && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Context added to prompt
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Please do not upload or enter Personally Identifiable Information (PII). The system will automatically strip common PII formats before processing.
                  </p>
                  
                  <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !prompt}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-zinc-900/10"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Persona...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : mode === 'library' ? (
              <motion.div 
                key="library"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {previewPersona ? (
                  <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                      <div className="w-full md:w-1/3 flex flex-col items-center text-center">
                        <img 
                          src={previewPersona.imageUrl || getRandomAvatar()} 
                          alt={previewPersona.name} 
                          className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-zinc-700 shadow-lg mb-4"
                        />
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{previewPersona.name}</h2>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">{previewPersona.role}</p>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Age: {previewPersona.age}
                        </div>
                      </div>
                      <div className="w-full md:w-2/3 space-y-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                          <p className="text-sm text-indigo-900 dark:text-indigo-300 italic">"{previewPersona.quote}"</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                              <Target className="w-3 h-3" /> Goals
                            </h3>
                            <ul className="space-y-1">
                              {previewPersona.goals?.slice(0, 3).map((goal, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                  <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <span className="line-clamp-1">{goal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                              <Frown className="w-3 h-3" /> Frustrations
                            </h3>
                            <ul className="space-y-1">
                              {previewPersona.frustrations?.slice(0, 3).map((frustration, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                  <div className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                  <span className="line-clamp-1">{frustration}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                      <button 
                        onClick={() => setPreviewPersona(null)}
                        className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        Back to Library
                      </button>
                      <button 
                        onClick={() => {
                          const newPersona: Persona = {
                            ...previewPersona,
                            id: uuidv4(),
                            imageUrl: previewPersona.imageUrl || getRandomAvatar(),
                            demographics: previewPersona.demographics?.map(d => ({ ...d, id: uuidv4() })) || []
                          } as Persona;
                          onSave(newPersona);
                          onClose();
                        }}
                        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Import Persona
                      </button>
                    </div>
                  </div>
                ) : !selectedFolder ? (
                  <div className="grid grid-cols-2 gap-4">
                    {personaLibrary.map(folder => {
                      const Icon = iconMap[folder.icon] || Folder;
                      return (
                        <div 
                          key={folder.id}
                          onClick={() => setSelectedFolder(folder)}
                          className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 cursor-pointer hover:border-zinc-900 dark:hover:border-zinc-500 transition-all group"
                        >
                          <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{folder.name}</h4>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{folder.description}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedFolder(null)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-zinc-500" />
                        </button>
                        <h3 className="font-bold text-zinc-900 dark:text-white">{selectedFolder.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={genderFilter}
                          onChange={(e) => setGenderFilter(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] outline-none"
                        >
                          <option value="All">All Genders</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-binary">Non-binary</option>
                        </select>
                        <select
                          value={ageFilter}
                          onChange={(e) => setAgeFilter(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] outline-none"
                        >
                          <option value="All">All Ages</option>
                          <option value="18-30">18-30</option>
                          <option value="31-50">31-50</option>
                          <option value="51+">51+</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedFolder.personas.filter(persona => {
                        const genderMatch = genderFilter === 'All' || persona.gender === genderFilter;
                        let ageMatch = true;
                        if (ageFilter !== 'All' && persona.age) {
                          if (ageFilter === '18-30') ageMatch = persona.age >= 18 && persona.age <= 30;
                          if (ageFilter === '31-50') ageMatch = persona.age >= 31 && persona.age <= 50;
                          if (ageFilter === '51+') ageMatch = persona.age >= 51;
                        }
                        return genderMatch && ageMatch;
                      }).map((persona, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col hover:border-zinc-900 dark:hover:border-zinc-500 transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <img 
                              src={persona.imageUrl || getRandomAvatar()} 
                              alt={persona.name} 
                              className="w-10 h-10 rounded-full object-cover border border-zinc-100 dark:border-zinc-700"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-zinc-900 dark:text-white text-xs truncate">{persona.name}</h4>
                              <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 truncate">{persona.role}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-auto">
                            <button 
                              onClick={() => setPreviewPersona(persona)}
                              className="flex-1 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              Preview
                            </button>
                            <button 
                              onClick={() => {
                                const newPersona: Persona = {
                                  ...persona,
                                  id: uuidv4(),
                                  imageUrl: persona.imageUrl || getRandomAvatar(),
                                  demographics: persona.demographics?.map(d => ({ ...d, id: uuidv4() })) || []
                                } as Persona;
                                onSave(newPersona);
                                onClose();
                              }}
                              className="flex-1 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Import
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="template"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-4"
              >
                {personaTemplates.map(template => (
                  <button 
                    key={template.id}
                    onClick={() => useTemplate(template)}
                    className="flex flex-col items-center p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-900 hover:bg-white dark:bg-zinc-900 transition-all group text-center"
                  >
                    <img src={template.imageUrl} alt={template.name} className="w-16 h-16 rounded-full mb-3 border-2 border-white shadow-sm" />
                    <h4 className="font-bold text-zinc-900 dark:text-white">{template.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{template.role}</p>
                    {template.isDefaultTemplate && (
                      <span className="mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-700" /> Default
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-all"
          >
            Cancel
          </button>
          {mode === 'manual' && (
            <button 
              onClick={handleManualSave}
              className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-zinc-900/10"
            >
              Save Persona
            </button>
          )}
        </div>
      </motion.div>

      <AvatarGalleryModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={(url) => setFormData({ ...formData, imageUrl: url })}
      />
    </div>
  );
}
