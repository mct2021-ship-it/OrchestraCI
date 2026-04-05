import React, { useState, useCallback } from 'react';
import { Plus, Download, Share2, GitMerge, Settings2, Trash2, Sparkles, ChevronUp, ChevronDown, Wand2, MessageSquare, Clock } from 'lucide-react';
import { ProcessMap, JourneyMap, ProcessNode, ProcessEdge, Comment, User, Project, RecycleBinItem } from '../types';
import { ContextualHelp } from '../components/ContextualHelp';
import { ProcessFlowEditor } from '../components/ProcessFlowEditor';
import { AiProcessGeneratorModal } from '../components/AiProcessGeneratorModal';
import { CommentsPanel } from '../components/CommentsPanel';
import { VersionHistory } from '../components/VersionHistory';
import { v4 as uuidv4 } from 'uuid';
import { usePermissions } from '../hooks/usePermissions';

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
  initialProcessMapId
}: ProcessMapsProps) {
  const [showIntro, setShowIntro] = React.useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeCommentsMapId, setActiveCommentsMapId] = useState<string | null>(initialProcessMapId || null);
  const [activeVersionHistoryId, setActiveVersionHistoryId] = useState<string | null>(null);
  
  const { canEditProjectFeature } = usePermissions();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const canEdit = activeProject ? canEditProjectFeature(activeProject) : false;

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
    setProcessMaps(prev => [{ ...newProcessMap, projectId: activeProjectId || 'proj1' }, ...prev]);
  }, [activeProjectId, setProcessMaps]);

  const updateProcessMapData = useCallback((id: string, nodes: ProcessNode[], edges: ProcessEdge[]) => {
    setProcessMaps(prev => prev.map(pm => 
      pm.id === id ? { ...pm, nodes, edges } : pm
    ));
  }, [setProcessMaps]);

  const handleNewProcessMap = useCallback(() => {
    const newPM: ProcessMap = {
      id: `pm_${Date.now()}`,
      projectId: activeProjectId || 'proj1',
      title: 'New Process Map',
      nodes: [],
      edges: []
    };
    setProcessMaps(prev => [newPM, ...prev]);
  }, [activeProjectId, setProcessMaps]);

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
          <div key={pm.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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

            <ProcessFlowEditor 
              processMap={pm} 
              onUpdate={(nodes, edges) => updateProcessMapData(pm.id, nodes, edges)} 
              canEdit={canEdit}
            />
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
