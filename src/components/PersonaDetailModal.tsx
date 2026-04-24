import React, { useRef, useState } from 'react';
import { X, Users, Target, Frown, Heart, Smile, Meh, Angry, Download, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { Persona } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
      pdf.save(`${persona.name.replace(/\s+/g, '_')}_Persona.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
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
          <div ref={contentRef} className="bg-white dark:bg-zinc-900 p-2">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 flex flex-col items-center text-center">
                <img src={persona.imageUrl} alt={persona.name} className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-md mb-6" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{persona.name}</h2>
                <p className="text-indigo-600 font-medium mb-4">{persona.role}</p>
                
                <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-500 dark:text-zinc-400">Age</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{persona.age}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Gender</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{persona.gender || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className="w-full text-left">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-wider">Demographics</h3>
                  <div className="space-y-4">
                    {persona.demographics?.map(demo => (
                      <div key={demo.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{demo.label}</span>
                          <span className="text-zinc-500">{demo.value}%</span>
                        </div>
                        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${demo.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-2/3 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">"{persona.quote}"</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-5 border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
                        <Target className="w-5 h-5" />
                        <h3 className="font-bold">Goals</h3>
                      </div>
                      <ul className="space-y-3">
                        {persona.goals.map((goal, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-5 border border-rose-100 dark:border-rose-800/30">
                      <div className="flex items-center gap-2 mb-4 text-rose-700 dark:text-rose-400">
                        <Frown className="w-5 h-5" />
                        <h3 className="font-bold">Frustrations</h3>
                      </div>
                      <ul className="space-y-3">
                        {persona.frustrations.map((frustration, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                            <span>{frustration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {persona.motivations && persona.motivations.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-100 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-400">
                      <Heart className="w-5 h-5" />
                      <h3 className="font-bold">Motivations</h3>
                    </div>
                    <ul className="space-y-3">
                      {persona.motivations.map((motivation, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{motivation}</span>
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
                                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${slider.value}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.type === 'list' && section.list && section.list.length > 0 && (
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {section.list.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
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
