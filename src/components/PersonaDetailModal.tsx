import React, { useRef, useState } from 'react';
import { X, Users, Target, Frown, Heart, Smile, Meh, Angry, Download, FileText, ImageIcon, Loader2, Globe, Calendar, Quote, Sliders, TrendingUp, BookOpen } from 'lucide-react';
import { Persona } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface PersonaDetailModalProps {
  persona: Persona;
  onClose: () => void;
}

export function PersonaDetailModal({ persona, onClose }: PersonaDetailModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportImage = async () => {
    if (!contentRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
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
      link.download = `${persona.name.replace(/\s+/g, '_')}_Persona.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || isExporting) return;

    setIsExporting(true);
    try {
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
      pdf.save(`${persona.name.replace(/\s+/g, '_')}_Persona.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col relative">
        {isExporting && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[2px] z-[60] flex flex-col items-center justify-center gap-4 transition-all animate-in fade-in duration-200">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-100 dark:border-zinc-800">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Generating Quality Asset</p>
              <p className="text-xs text-zinc-500 mt-1">Please wait, this may take a moment...</p>
            </div>
          </div>
        )}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Persona Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportImage}
              disabled={isExporting}
              className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export as Image"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">PNG</span>
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export as PDF"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span className="hidden sm:inline">PDF</span>
            </button>
            <div className="w-px h-6 bg-zinc-100 dark:bg-zinc-800 mx-1" />
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div ref={contentRef} className="bg-white dark:bg-zinc-950 p-6 rounded-3xl" style={{ containerType: 'inline-size' }}>
            
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm text-center md:text-left relative mb-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-50 dark:border-zinc-800 shadow-md shrink-0 focus-mode-11">
                  <img 
                    src={persona.imageUrl} 
                    className="w-full h-full object-cover" 
                    alt={persona.name} 
                    crossOrigin="anonymous" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 space-y-3">
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <h2 className="text-3xl font-black text-zinc-900 dark:text-white">
                        {persona.name}
                      </h2>
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800 shadow-sm inline-block">
                        {persona.type || 'Core Persona'}
                      </span>
                   </div>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span>{persona.role || 'Customer'}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <div className="flex items-center">
                          <span>{persona.age?.toString() || '30'}</span>
                          <span className="ml-1">Years Old</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-400" />
                        <span>{persona.gender || 'Universal'}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-sm space-y-8">
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6 flex items-center gap-2">
                       <Quote className="w-4 h-4 text-indigo-600" />
                       Behavioral Mantra
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-800/30 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-lg font-bold text-zinc-700 dark:text-zinc-200 italic leading-relaxed">
                        {persona.quote}
                      </p>
                    </div>
                  </div>

                  {persona.demographics && persona.demographics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        Market Archetype
                      </h4>
                      <div className="space-y-6">
                        {persona.demographics.map(demo => (
                          <div key={demo.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {demo.label}
                              </span>
                              <span className="text-xs font-black text-indigo-600">{demo.value}%</span>
                            </div>
                            <div className="relative h-3 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-3xl shadow-sm"
                                style={{ width: `${demo.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8 border-t border-zinc-50 dark:border-zinc-800">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-6 flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-indigo-600" />
                       Experience Sentiment
                    </h4>
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <div
                          key={score}
                          className={cn(
                            "aspect-square rounded-2xl flex items-center justify-center text-sm font-black transition-all border-2",
                            persona.sentiment === score
                              ? score <= 2 ? 'bg-rose-50 border-rose-600 text-rose-600 shadow-xl'
                              : score === 3 ? 'bg-amber-50 border-amber-600 text-amber-600 shadow-xl'
                              : 'bg-emerald-50 border-emerald-600 text-emerald-600 shadow-xl'
                              : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent text-zinc-400'
                          )}
                        >
                          {score}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-6 h-6 text-emerald-500" />
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Goals</h4>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {persona.goals.map((goal, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span className="text-sm font-medium flex-1">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Frown className="w-6 h-6 text-rose-500" />
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Frustrations</h4>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {persona.frustrations.map((frustration, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                        <span className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                        <span className="text-sm font-medium flex-1">{frustration}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {persona.motivations && persona.motivations.length > 0 && (
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="w-6 h-6 text-amber-500" />
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Motivations</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {persona.motivations.map((motivation, i) => (
                        <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/item">
                          <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                          <span className="text-sm font-medium flex-1">{motivation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Additional Sections */}
                {persona.additionalSections && persona.additionalSections.length > 0 && (
                  <div className="space-y-6">
                    {persona.additionalSections.map((section) => (
                      <div key={section.id} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">{section.title}</h3>
                        
                        {section.type === 'images' && section.images && section.images.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {section.images.map((img, i) => (
                              <div key={i} className="aspect-video rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                                <img src={img} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                              </div>
                            ))}
                          </div>
                        )}

                        {section.type === 'sliders' && section.sliders && section.sliders.length > 0 && (
                          <div className="space-y-4">
                            {section.sliders.map((slider) => (
                              <div key={slider.id}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{slider.label}</span>
                                  <span className="text-zinc-500">{slider.value}%</span>
                                </div>
                                <div className="relative h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-3xl" style={{ width: `${slider.value}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.type === 'list' && section.list && section.list.length > 0 && (
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {section.list.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
