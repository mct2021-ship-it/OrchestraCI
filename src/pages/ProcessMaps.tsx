import React, { useState, useCallback } from 'react';
import { Plus, Download, Share2, GitMerge, Settings2, Trash2, Sparkles, ChevronUp, ChevronDown, Wand2, MessageSquare, Clock, Maximize2, Minimize2, Printer, FileText, Image as ImageIcon } from 'lucide-react';
import { ProcessMap, JourneyMap, ProcessNode, ProcessEdge, Comment, User, Project, RecycleBinItem, Task } from '../types';
import { ContextualHelp } from '../components/ContextualHelp';
import { ProcessFlowEditor } from '../components/ProcessFlowEditor';
import { BpmnEditor } from '../components/BpmnEditor';
import { AiProcessGeneratorModal } from '../components/AiProcessGeneratorModal';
import { CommentsPanel } from '../components/CommentsPanel';
import { VersionHistory } from '../components/VersionHistory';
import { v4 as uuidv4 } from 'uuid';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import { fixOklch } from '../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ProcessMapsProps {
  processMaps: ProcessMap[];
  setProcessMaps: React.Dispatch<React.SetStateAction<ProcessMap[]>>;
  activeProjectId: string | null;
  journeys: JourneyMap[];
  currentUser?: User;
  projects: Project[];
  onDeleteItem?: (item: any, type: RecycleBinItem['type'], originalProjectId?: string) => void;
  users?: User[];
  initialProcessMapId?: string | null;
  onAddToAuditLog?: (action: string, details: string, type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login', entityType?: string, entityId?: string, source?: 'Manual' | 'AI' | 'Data Source') => void;
  onAddTask?: (task: Task) => void;
}

export function ProcessMaps({ 
  processMaps, 
  setProcessMaps, 
  activeProjectId, 
  journeys,
  projects,
  currentUser = { 
    id: 'u1', 
    name: 'Jane Doe', 
    email: 'jane@example.com', 
    role: 'Viewer', 
    status: 'Active',
    photoUrl: 'https://ui-avatars.com/api/?name=Jane+Doe&background=random' 
  },
  onDeleteItem,
  users = [],
  initialProcessMapId,
  onAddToAuditLog,
  onAddTask
}: ProcessMapsProps) {
  const [showIntro, setShowIntro] = React.useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeCommentsMapId, setActiveCommentsMapId] = useState<string | null>(initialProcessMapId || null);
  const [activeVersionHistoryId, setActiveVersionHistoryId] = useState<string | null>(null);
  const [fullScreenMapId, setFullScreenMapId] = useState<string | null>(null);
  
  const { canEditProjectFeature } = usePermissions();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const canEdit = activeProject ? canEditProjectFeature(activeProject) : false;
  const { addToast } = useToast();

  const handleExportImage = async (pmId: string) => {
    const element = document.getElementById(`process-map-${pmId}`);
    if (!element) return;
    
    try {
      addToast('Generating image...', 'info');
      const pm = processMaps.find(m => m.id === pmId);
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });
      
      const link = document.createElement('a');
      link.download = `${pm?.title.replace(/\s+/g, '_') || 'Process_Map'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('Image exported successfully', 'success');
    } catch (error) {
      console.error('Error generating image:', error);
      addToast('Failed to export image', 'error');
    }
  };

  const handleExportPDF = async (pmId: string) => {
    const element = document.getElementById(`process-map-${pmId}`);
    if (!element) return;

    try {
      addToast('Generating PDF...', 'info');
      const pm = processMaps.find(m => m.id === pmId);
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width / 2;
      const imgHeight = canvas.height / 2;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${pm?.title.replace(/\s+/g, '_') || 'Process_Map'}.pdf`);
      addToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Failed to export PDF', 'error');
    }
  };

  React.useEffect(() => {
    if (initialProcessMapId) {
      setActiveCommentsMapId(initialProcessMapId);
    }
  }, [initialProcessMapId]);

  const deleteProcessMap = useCallback((id: string) => {
    const pm = processMaps.find(m => m.id === id);
    if (pm && onDeleteItem) {
      onDeleteItem(pm, 'ProcessMap', activeProjectId || undefined);
    } else {
      setProcessMaps(prev => prev.filter(pm => pm.id !== id));
    }
  }, [processMaps, onDeleteItem, activeProjectId, setProcessMaps]);

  const handleAiGenerate = useCallback((newProcessMap: ProcessMap) => {
    const pm = { ...newProcessMap, projectId: activeProjectId || 'proj1' };
    setProcessMaps(prev => [pm, ...prev]);
    onAddToAuditLog?.('Created AI Process Map', `Created process map ${pm.title} using AI`, 'Create', 'ProcessMap', pm.id, 'AI');
  }, [activeProjectId, setProcessMaps, onAddToAuditLog]);

  const updateProcessMapData = useCallback((id: string, nodes: ProcessNode[], edges: ProcessEdge[], bpmnXml?: string) => {
    setProcessMaps(prev => prev.map(pm => 
      pm.id === id ? { ...pm, nodes, edges, bpmnXml } : pm
    ));
  }, [setProcessMaps]);

  const handleNewProcessMap = useCallback(() => {
    const newPM: ProcessMap = {
      id: `pm_${Date.now()}`,
      projectId: activeProjectId || 'proj1',
      title: 'New Process Map (BPMN)',
      nodes: [],
      edges: [],
      bpmnXml: ''
    };
    setProcessMaps(prev => [newPM, ...prev]);
    onAddToAuditLog?.('Created Process Map', `Created process map ${newPM.title}`, 'Create', 'ProcessMap', newPM.id, 'Manual');
  }, [activeProjectId, setProcessMaps, onAddToAuditLog]);

  const handleImportVisio = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vsdx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Mock Visio parsing
      addToast('Parsing Visio file...', 'info');
      setTimeout(() => {
        const newPM: ProcessMap = {
          id: `pm_vsdx_${Date.now()}`,
          projectId: activeProjectId || 'proj1',
          title: `Imported from ${file.name}`,
          nodes: [],
          edges: [],
          bpmnXml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" targetNamespace="http://bpmn.io/schema/bpmn" id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
    <bpmn:task id="Task_1" name="Imported Visio Task" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="173.0" y="102.0"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_1" bpmnElement="Task_1">
        <dc:Bounds height="80.0" width="100.0" x="250.0" y="80.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
        };
        setProcessMaps(prev => [newPM, ...prev]);
        addToast('Visio file imported successfully as BPMN', 'success');
      }, 1500);
    };
    input.click();
  }, [activeProjectId, setProcessMaps, addToast]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <ContextualHelp 
        title="Process Maps" 
        description="Map and optimize internal back-office processes. Visualize how work gets done, identify bottlenecks, and document standard operating procedures (SOPs)."
      />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Process Maps</h2>
            {activeProject && (
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
                {activeProject.name}
              </span>
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Map and optimize internal back-office processes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {canEdit && (
            <>
              <button 
                onClick={() => setIsAiModalOpen(true)}
                className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm"
              >
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">AI Generate from SOP</span>
              </button>
              <button 
                onClick={handleImportVisio}
                className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                <Download className="w-4 h-4 rotate-180" />
                <span className="hidden sm:inline">Import Visio</span>
              </button>
              <button 
                onClick={handleNewProcessMap}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Process Map</span>
              </button>
            </>
          )}
        </div>
      </div>

      <AiProcessGeneratorModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onGenerate={handleAiGenerate}
        projectId={activeProjectId || 'proj1'}
      />

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
              <h3 className="font-bold text-indigo-900">What are Process Maps?</h3>
              <p className="text-sm text-indigo-600">Optimize your back-office operations to support the customer journey.</p>
            </div>
          </div>
          {showIntro ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-indigo-400" />}
        </button>
        
        {showIntro && (
          <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-indigo-900/80 leading-relaxed">
                  Process maps provide a detailed look at the internal steps required to deliver a service. They bridge the gap between customer experience and operational execution.
                </p>
                <ul className="space-y-2">
                  {[
                    'Map internal workflows and handoffs',
                    'Identify operational bottlenecks',
                    'Standardize service delivery',
                    'Connect back-office actions to customer touchpoints'
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
                  src="https://www.youtube.com/embed/S_v8_oX_X_A" 
                  title="What is Process Mapping?"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {processMaps.map(pm => {
          const linkedJourney = pm.journeyId ? journeys.find(j => j.id === pm.journeyId) : null;
          return (
          <div key={pm.id} id={`process-map-${pm.id}`} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{pm.title}</h3>
                <div className="h-4 w-px bg-zinc-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">Linked Journey</span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-200 font-medium bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900">
                    {linkedJourney ? linkedJourney.title : 'None'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleExportImage(pm.id)}
                  className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors no-export"
                  title="Export as PNG"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleExportPDF(pm.id)}
                  className="p-2 text-zinc-400 hover:text-rose-600 transition-colors no-export"
                  title="Export as PDF"
                >
                  <FileText className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 no-export"></div>
                <button 
                  onClick={() => setActiveVersionHistoryId(pm.id === activeVersionHistoryId ? null : pm.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeVersionHistoryId === pm.id 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-300'
                  }`}
                  title="Version History"
                >
                  <Clock className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setActiveCommentsMapId(pm.id === activeCommentsMapId ? null : pm.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeCommentsMapId === pm.id 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                      : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-300'
                  }`}
                  title="Comments"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                {canEdit && (
                  <>
                    <button 
                      onClick={() => deleteProcessMap(pm.id)}
                      className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-300 transition-colors">
                      <Settings2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {pm.bpmnXml !== undefined ? (
              <BpmnEditor
                xml={pm.bpmnXml || ''}
                onUpdate={(xml) => updateProcessMapData(pm.id, pm.nodes, pm.edges, xml)}
                canEdit={canEdit}
                isFullScreen={fullScreenMapId === pm.id}
                onToggleFullScreen={() => setFullScreenMapId(fullScreenMapId === pm.id ? null : pm.id)}
              />
            ) : (
              <ProcessFlowEditor 
                processMap={pm} 
                onUpdate={(nodes, edges) => updateProcessMapData(pm.id, nodes, edges)} 
                canEdit={canEdit}
                isFullScreen={fullScreenMapId === pm.id}
                onToggleFullScreen={() => setFullScreenMapId(fullScreenMapId === pm.id ? null : pm.id)}
                onAddTask={onAddTask}
              />
            )}
          </div>
          );
        })}

        {processMaps.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center min-h-[500px]">
            <div className="w-24 h-24 bg-pink-50 dark:bg-pink-900/30 text-pink-500 rounded-full flex items-center justify-center mb-6">
              <GitMerge className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No process maps yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
              Start mapping your internal processes to identify bottlenecks and improve efficiency.
            </p>
            <button 
              onClick={handleNewProcessMap}
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Process Map
            </button>
          </div>
        )}
      </div>

      {/* Comments Panel */}
      {activeCommentsMapId && (
        <CommentsPanel
          isOpen={!!activeCommentsMapId}
          onClose={() => setActiveCommentsMapId(null)}
          comments={processMaps.find(pm => pm.id === activeCommentsMapId)?.comments || []}
          itemId={activeCommentsMapId}
          itemType="process"
          onAddComment={(newComment) => {
            setProcessMaps(processMaps.map(pm => 
              pm.id === activeCommentsMapId 
                ? { ...pm, comments: [...(pm.comments || []), newComment] }
                : pm
            ));
          }}
          currentUser={currentUser}
          users={users}
        />
      )}

      {/* Version History */}
      {activeVersionHistoryId && (
        <VersionHistory
          isOpen={!!activeVersionHistoryId}
          onClose={() => setActiveVersionHistoryId(null)}
          entityType="processMaps"
          entityId={activeVersionHistoryId}
          currentData={processMaps.find(pm => pm.id === activeVersionHistoryId)}
          onRestore={(data) => {
            setProcessMaps(processMaps.map(pm => pm.id === activeVersionHistoryId ? data : pm));
          }}
        />
      )}
    </div>
  );
}
