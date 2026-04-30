import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, Users, ChevronLeft, Plus, Home, Building2, Briefcase, HeartPulse, ShoppingCart, Scale, Calculator, Zap, Target, Frown, Sparkles, Sliders, Filter, ImageIcon, FileText, Loader2 } from 'lucide-react';
import { Persona } from '../types';
import { personaLibrary, PersonaFolder } from '../data/personaLibrary';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PersonaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (persona: Persona) => void;
}

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

export function PersonaLibraryModal({ isOpen, onClose, onImport }: PersonaLibraryModalProps) {
  const [selectedFolder, setSelectedFolder] = useState<PersonaFolder | null>(null);
  const [previewPersona, setPreviewPersona] = useState<Partial<Persona> | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [ageFilter, setAgeFilter] = useState<string>('All');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!contentRef.current || !previewPersona || isExporting) return;
    
    setIsExporting(true);
    try {
      // Temporarily set a fixed width to prevent cutoff
      const originalWidth = contentRef.current.style.width;
      contentRef.current.style.width = '1000px';

      const canvas = await html2canvas(contentRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        logging: false,
        windowWidth: 1200,
      });

      contentRef.current.style.width = originalWidth;
      
      const link = document.createElement('a');
      link.download = `${previewPersona.name?.replace(/\s+/g, '_')}_Persona.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || !previewPersona || isExporting) return;

    setIsExporting(true);
    try {
      // Temporarily set a fixed width to prevent cutoff
      const originalWidth = contentRef.current.style.width;
      contentRef.current.style.width = '1000px';

      const canvas = await html2canvas(contentRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        logging: false,
        windowWidth: 1200,
      });

      contentRef.current.style.width = originalWidth;
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width / 2;
      const imgHeight = canvas.height / 2;

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${previewPersona.name?.replace(/\s+/g, '_')}_Persona.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedFolder(null);
      setPreviewPersona(null);
      setGenderFilter('All');
      setAgeFilter('All');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImport = (template: Partial<Persona>) => {
    const newPersona: Persona = {
      ...template,
      id: uuidv4(),
      name: template.name || 'New Persona',
      role: template.role || 'Role',
      age: template.age || 30,
      quote: template.quote || '',
      goals: template.goals || [],
      frustrations: template.frustrations || [],
      motivations: template.motivations || [],
      sentiment: template.sentiment || 3,
      imageUrl: template.imageUrl || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=400&fit=crop`,
      demographics: template.demographics?.map(d => ({ ...d, id: uuidv4() })) || []
    } as Persona;
    
    onImport(newPersona);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        {isExporting && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[2px] z-[70] flex flex-col items-center justify-center gap-4 transition-all animate-in fade-in duration-200">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-100 dark:border-zinc-800">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Generating Quality Asset</p>
              <p className="text-xs text-zinc-500 mt-1">Please wait, this may take a moment...</p>
            </div>
          </div>
        )}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            {previewPersona ? (
              <button 
                onClick={() => setPreviewPersona(null)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to {selectedFolder?.name}
              </button>
            ) : selectedFolder ? (
              <button 
                onClick={() => setSelectedFolder(null)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Library
              </button>
            ) : (
              <>
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Personas</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Browse and import industry-specific personas</p>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {previewPersona ? (
            <div className="max-w-4xl mx-auto">
              <div ref={contentRef} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl mb-8">
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="w-full md:w-1/3 flex flex-col items-center text-center">
                    <img 
                      src={previewPersona.imageUrl} 
                      alt={previewPersona.name} 
                      className="w-48 h-48 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-xl mb-6"
                      crossOrigin="anonymous"
                    />
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{previewPersona.name}</h2>
                    <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mb-2">{previewPersona.role}</p>
                    {previewPersona.type && (
                      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                        {previewPersona.type}
                      </span>
                    )}
                    <div className="mt-4 text-zinc-500 dark:text-zinc-400">
                      Age: {previewPersona.age}
                    </div>
                  </div>
                  <div className="w-full md:w-2/3 space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                      <p className="text-xl text-indigo-900 dark:text-indigo-300 italic">"{previewPersona.quote}"</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                          <Target className="w-4 h-4" /> Goals
                        </h3>
                        <ul className="space-y-2">
                          {previewPersona.goals?.map((goal, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                          <Frown className="w-4 h-4" /> Frustrations
                        </h3>
                        <ul className="space-y-2">
                          {previewPersona.frustrations?.map((frustration, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <span>{frustration}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Motivations
                      </h3>
                      <ul className="space-y-2">
                        {previewPersona.motivations?.map((motivation, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span>{motivation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4" /> Demographics
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {previewPersona.demographics?.map((demo, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
                              <span>{demo.label}</span>
                              <span>{demo.value}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${demo.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportImage}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all disabled:opacity-50"
                    title="Save as Image"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    PNG
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all disabled:opacity-50"
                    title="Save as PDF"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    PDF
                  </button>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setPreviewPersona(null)}
                    className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleImport(previewPersona)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    <Plus className="w-4 h-4" />
                    Import Persona
                  </button>
                </div>
              </div>
            </div>
          ) : !selectedFolder ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personaLibrary.map(folder => {
                const Icon = iconMap[folder.icon] || Folder;
                return (
                  <div 
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{folder.name}</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{folder.description}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg w-fit">
                      <Users className="w-3 h-3" />
                      {folder.personas.length} Personas
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{selectedFolder.name}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">{selectedFolder.description}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium px-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">Filter:</span>
                  </div>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Genders</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                  <select
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Ages</option>
                    <option value="18-30">18-30</option>
                    <option value="31-50">31-50</option>
                    <option value="51+">51+</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div key={idx} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={persona.imageUrl} 
                        alt={persona.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-zinc-100 dark:border-zinc-700"
                      />
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white text-lg">{persona.name}</h4>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{persona.role}</p>
                      </div>
                    </div>
                    
                    {persona.type && (
                      <div className="mb-4">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Persona Name</span>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{persona.type}</p>
                      </div>
                    )}
                    
                    <div className="mb-6 flex-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic line-clamp-3">"{persona.quote}"</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setPreviewPersona(persona)}
                        className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl text-sm font-bold flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleImport(persona)}
                        className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Import
                      </button>
                    </div>
                  </div>
                ))}
                {selectedFolder.personas.filter(persona => {
                  const genderMatch = genderFilter === 'All' || persona.gender === genderFilter;
                  let ageMatch = true;
                  if (ageFilter !== 'All' && persona.age) {
                    if (ageFilter === '18-30') ageMatch = persona.age >= 18 && persona.age <= 30;
                    if (ageFilter === '31-50') ageMatch = persona.age >= 31 && persona.age <= 50;
                    if (ageFilter === '51+') ageMatch = persona.age >= 51;
                  }
                  return genderMatch && ageMatch;
                }).length === 0 && (
                  <div className="col-span-full py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No personas found matching your filters.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
