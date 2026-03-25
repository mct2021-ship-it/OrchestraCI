import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronRight, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  Download,
  MoreVertical
} from 'lucide-react';
import { Project, Sprint, Task, User } from '../types';
import { cn } from '../lib/utils';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { stripPIData } from '../lib/piStripper';

interface SprintManagementProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  activeProjectId?: string | null;
}

export function SprintManagement({ projects, tasks, users, sprints, setSprints, activeProjectId }: SprintManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed' | 'Planned'>('Active');
  const [projectFilter, setProjectFilter] = useState<string>(activeProjectId || 'All');
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

  const filteredSprints = useMemo(() => {
    return sprints.filter(sprint => {
      const matchesSearch = sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           sprint.goal?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || sprint.status === statusFilter;
      const matchesProject = projectFilter === 'All' || sprint.projectId === projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [sprints, searchQuery, statusFilter, projectFilter]);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const getSprintTasks = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint || !sprint.tasks) return [];
    return tasks.filter(t => sprint.tasks?.includes(t.id));
  };

  const handleGenerateReport = async (sprint: Sprint) => {
    setIsGeneratingReport(true);
    try {
      const sprintTasks = getSprintTasks(sprint.id);
      const project = projects.find(p => p.id === sprint.projectId);
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let reportType = 'Sprint Report';
      let focusPoints = '';
      
      if (sprint.status === 'Planned') {
        reportType = 'Sprint Planning Report';
        focusPoints = `
        1. Planning Summary & Objectives
        2. Scope and Task Breakdown
        3. Resource Allocation and Capacity
        4. Potential Risks and Mitigation Strategies
        5. Success Criteria for this Sprint`;
      } else if (sprint.status === 'Active') {
        reportType = 'Sprint Progress Report';
        focusPoints = `
        1. Current Progress Summary
        2. Completed vs. Remaining Work
        3. Velocity and Burn-down Outlook
        4. Emerging Blockers and Issues
        5. Adjustments for the remainder of the sprint`;
      } else {
        reportType = 'Sprint Retrospective Report';
        focusPoints = `
        1. Executive Summary
        2. Key Achievements
        3. Velocity and Completion Rate
        4. Challenges and Blockers encountered
        5. Recommendations for next sprint`;
      }

      const prompt = `Generate a comprehensive ${reportType} for Sprint "${stripPIData(sprint.name)}" of project "${stripPIData(project?.name || '')}".
      
      Sprint Status: ${sprint.status}
      Sprint Goal: ${stripPIData(sprint.goal || 'N/A')}
      Duration: ${sprint.startDate} to ${sprint.endDate}
      
      Tasks:
      ${sprintTasks.map(t => `- ${stripPIData(t.title)} (${t.kanbanStatus}): ${stripPIData(t.description || '')}`).join('\n')}
      
      Please include:
      ${focusPoints}
      
      Format as professional Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const report = response.text || 'Failed to generate report.';
      
      setSprints(prev => prev.map(s => s.id === sprint.id ? { ...s, report } : s));
      setSelectedSprint({ ...sprint, report });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#09090b] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Delivery Management</span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                Sprint Management
              </h1>
              {activeProject && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
                  {activeProject.name}
                </span>
              )}
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Track delivery progress across all active and completed sprints. Generate AI-powered reports for planning, progress, and retrospectives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search sprints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto"
            >
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 w-full sm:w-auto overflow-x-auto">
              {(['All', 'Active', 'Completed', 'Planned'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    statusFilter === status 
                      ? "bg-indigo-600 text-white shadow-md" 
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sprint Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSprints.map((sprint) => (
              <motion.div
                key={sprint.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer"
                onClick={() => setSelectedSprint(sprint)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      sprint.status === 'Active' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      sprint.status === 'Completed' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {sprint.status}
                    </div>
                    {sprint.stage && (
                      <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {sprint.stage}
                      </div>
                    )}
                  </div>
                  <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 mb-4">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {getProjectName(sprint.projectId)}
                  </p>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {sprint.name}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sprint.startDate} - {sprint.endDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>{sprint.tasks?.length || 0} Tasks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex -space-x-2">
                    {/* Placeholder for team members */}
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        U
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Sprint Placeholder */}
          <button className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-zinc-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-bold text-zinc-900 dark:text-white">New Sprint</p>
              <p className="text-xs text-zinc-500">Plan your next delivery cycle</p>
            </div>
          </button>
        </div>
      </div>

      {/* Sprint Detail Modal */}
      <AnimatePresence>
        {selectedSprint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                        {getProjectName(selectedSprint.projectId)}
                      </p>
                      <select
                        value={selectedSprint.stage || ''}
                        onChange={(e) => {
                          const newStage = e.target.value as Sprint['stage'];
                          const updatedSprint = { ...selectedSprint, stage: newStage };
                          setSelectedSprint(updatedSprint);
                          setSprints(prev => prev.map(s => s.id === selectedSprint.id ? updatedSprint : s));
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none outline-none cursor-pointer appearance-none"
                      >
                        <option value="">No Stage</option>
                        <option value="Discover">Discover</option>
                        <option value="Define">Define</option>
                        <option value="Develop">Develop</option>
                        <option value="Deliver">Deliver</option>
                      </select>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                      {selectedSprint.name}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSprint(null)}
                  className="p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Info & Tasks */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Sprint Goal</h4>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {selectedSprint.goal || 'No goal defined for this sprint.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint Backlog</h4>
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[10px] font-bold text-zinc-500">
                          {getSprintTasks(selectedSprint.id).length} Items
                        </span>
                      </div>
                      <div className="space-y-3">
                        {getSprintTasks(selectedSprint.id).map(task => (
                          <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                task.kanbanStatus === 'Done' ? "bg-emerald-500" : "bg-amber-500"
                              )} />
                              <div>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">{task.title}</p>
                                <p className="text-[10px] text-zinc-500">{task.kanbanStatus}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                task.impact === 'High' ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-700"
                              )}>
                                {task.impact}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Report & Actions */}
                  <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-4">Sprint Performance</h4>
                      <div className="space-y-6">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-black">84%</p>
                            <p className="text-[10px] font-bold uppercase opacity-80">Completion Rate</p>
                          </div>
                          <TrendingUp className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white w-[84%]" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint Report</h4>
                        {!selectedSprint.report && (
                          <button 
                            onClick={() => handleGenerateReport(selectedSprint)}
                            disabled={isGeneratingReport}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="p-6 max-h-[400px] overflow-y-auto">
                        {isGeneratingReport ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-zinc-500 animate-pulse">AI is analyzing sprint data...</p>
                          </div>
                        ) : selectedSprint.report ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                              {selectedSprint.report}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                            <p className="text-sm text-zinc-500">No report generated yet.</p>
                            <button 
                              onClick={() => handleGenerateReport(selectedSprint)}
                              className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              Generate AI {selectedSprint.status === 'Planned' ? 'Planning' : selectedSprint.status === 'Active' ? 'Progress' : 'Retrospective'} Report
                            </button>
                          </div>
                        )}
                      </div>
                      {selectedSprint.report && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
                          <button className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-all">
                            <Download className="w-4 h-4" />
                            Download PDF Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">8 Members Involved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">12 Tasks Completed</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedSprint(null)}
                    className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-all"
                  >
                    Close View
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
