import React, { useState } from 'react';
import { Plus, Trash2, ArrowDown, User, Monitor, FileText, GitBranch, Edit2, Check } from 'lucide-react';
import { ProcessMap, ProcessNode, ProcessEdge } from '../types';

interface VerticalProcessBuilderProps {
  processMap: ProcessMap;
  onUpdate: (nodes: ProcessNode[], edges: ProcessEdge[]) => void;
  canEdit?: boolean;
}

const NODE_TYPES = [
  { id: 'manual', icon: User, label: 'Manual Step', color: 'bg-blue-100 text-blue-600' },
  { id: 'system', icon: Monitor, label: 'System Action', color: 'bg-purple-100 text-purple-600' },
  { id: 'document', icon: FileText, label: 'Document', color: 'bg-amber-100 text-amber-600' },
  { id: 'decision', icon: GitBranch, label: 'Decision', color: 'bg-rose-100 text-rose-600' }
];

export function VerticalProcessBuilder({ processMap, onUpdate, canEdit = true }: VerticalProcessBuilderProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [openTypeSelectorId, setOpenTypeSelectorId] = useState<string | null>(null);

  // Sort nodes by Y position to get the sequence
  const sortedNodes = [...processMap.nodes].sort((a, b) => a.position.y - b.position.y);

  const handleAddNode = (index: number) => {
    const newNode: ProcessNode = {
      id: `node_${Date.now()}`,
      type: 'manual',
      data: { label: 'New Step', description: 'Description of the step' },
      position: { x: 0, y: 0 } // Will be recalculated
    };

    const newNodes = [...sortedNodes];
    newNodes.splice(index, 0, newNode);

    // Recalculate Y positions and rebuild edges
    const updatedNodes = newNodes.map((n, i) => ({
      ...n,
      position: { x: 250, y: i * 150 }
    }));

    const updatedEdges: ProcessEdge[] = [];
    for (let i = 0; i < updatedNodes.length - 1; i++) {
      updatedEdges.push({
        id: `e_${updatedNodes[i].id}-${updatedNodes[i+1].id}`,
        source: updatedNodes[i].id,
        target: updatedNodes[i+1].id
      });
    }

    onUpdate(updatedNodes, updatedEdges);
    setEditingNodeId(newNode.id);
  };

  const handleUpdateNode = (id: string, updates: Partial<ProcessNode>) => {
    const updatedNodes = processMap.nodes.map(n => 
      n.id === id ? { ...n, ...updates } : n
    );
    onUpdate(updatedNodes, processMap.edges);
  };

  const handleUpdateNodeData = (id: string, dataUpdates: Partial<ProcessNode['data']>) => {
    const updatedNodes = processMap.nodes.map(n => 
      n.id === id ? { ...n, data: { ...n.data, ...dataUpdates } } : n
    );
    onUpdate(updatedNodes, processMap.edges);
  };

  const handleDeleteNode = (id: string) => {
    const newNodes = sortedNodes.filter(n => n.id !== id);
    
    // Recalculate Y positions and rebuild edges
    const updatedNodes = newNodes.map((n, i) => ({
      ...n,
      position: { x: 250, y: i * 150 }
    }));

    const updatedEdges: ProcessEdge[] = [];
    for (let i = 0; i < updatedNodes.length - 1; i++) {
      updatedEdges.push({
        id: `e_${updatedNodes[i].id}-${updatedNodes[i+1].id}`,
        source: updatedNodes[i].id,
        target: updatedNodes[i+1].id
      });
    }

    onUpdate(updatedNodes, updatedEdges);
  };

  if (sortedNodes.length === 0) {
    return (
      <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GitBranch className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Start Mapping</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
          Add the first step to begin building your process map.
        </p>
        {canEdit && (
          <button
            onClick={() => handleAddNode(0)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors shadow-sm no-export"
          >
            <Plus className="w-5 h-5" />
            Add First Step
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 overflow-y-auto max-h-[600px]">
      <div className="max-w-3xl mx-auto relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

        {/* Top Add Button */}
        {canEdit && (
          <div className="relative z-10 flex mb-8 no-export">
            <button
              onClick={() => handleAddNode(0)}
              className="w-16 h-8 bg-white dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {sortedNodes.map((node, index) => {
          const nodeType = NODE_TYPES.find(t => t.id === (node.type || 'manual')) || NODE_TYPES[0];
          const Icon = nodeType.icon;
          const isEditing = editingNodeId === node.id;

          return (
            <div key={node.id} className="relative z-10 mb-8 group">
              <div className="flex items-start gap-6">
                {/* Node Icon / Type Selector */}
                <div className="relative">
                  <button 
                    onClick={() => canEdit && setOpenTypeSelectorId(openTypeSelectorId === node.id ? null : node.id)}
                    className={`w-16 h-16 rounded-2xl ${nodeType.color} flex items-center justify-center shadow-sm border-4 border-white dark:border-zinc-900 shrink-0 ${canEdit ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} transition-transform relative z-30`}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                  
                  {/* Type Selector Dropdown (Click) */}
                  {openTypeSelectorId === node.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setOpenTypeSelectorId(null)} 
                      />
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-2 z-50 w-56 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2 pb-2 border-b border-zinc-100 dark:border-zinc-700">Change Step Type</p>
                        <div className="space-y-1">
                          {NODE_TYPES.map(t => {
                            const TIcon = t.icon;
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  handleUpdateNode(node.id, { type: t.id });
                                  setOpenTypeSelectorId(null);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${node.type === t.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'}`}
                              >
                                <div className={`p-1.5 rounded-md ${t.color}`}>
                                  <TIcon className="w-4 h-4" />
                                </div>
                                {t.label}
                                {node.type === t.id && <Check className="w-4 h-4 ml-auto" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Node Content */}
                <div className="flex-1 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-5 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={node.data.label}
                            onChange={(e) => handleUpdateNodeData(node.id, { label: e.target.value })}
                            className="w-full text-lg font-bold text-zinc-900 dark:text-white bg-transparent border-b border-indigo-500 focus:outline-none pb-1"
                            placeholder="Step Name"
                            autoFocus
                          />
                          <textarea
                            value={node.data.description || ''}
                            onChange={(e) => handleUpdateNodeData(node.id, { description: e.target.value })}
                            className="w-full text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 focus:outline-none focus:border-indigo-500 resize-none"
                            placeholder="Describe what happens in this step..."
                            rows={3}
                          />
                          {node.type === 'decision' && node.data.branches && node.data.branches.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {node.data.branches.map((branch, bIndex) => (
                                <div key={branch.id} className="flex items-center gap-2">
                                  <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                    <GitBranch className="w-4 h-4 text-zinc-500" />
                                  </div>
                                  <input
                                    type="text"
                                    value={branch.label}
                                    onChange={(e) => {
                                      const newBranches = [...node.data.branches!];
                                      newBranches[bIndex] = { ...branch, label: e.target.value };
                                      handleUpdateNodeData(node.id, { branches: newBranches });
                                    }}
                                    className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                                    placeholder="Branch Label (e.g., Yes)"
                                  />
                                  <button
                                    onClick={() => {
                                      const newBranches = node.data.branches!.filter((_, i) => i !== bIndex);
                                      handleUpdateNodeData(node.id, { branches: newBranches });
                                    }}
                                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            {node.type === 'decision' ? (
                              <button
                                onClick={() => {
                                  const newBranches = node.data.branches ? [...node.data.branches] : [];
                                  newBranches.push({ id: `branch_${Date.now()}`, label: newBranches.length === 0 ? 'Yes' : 'No' });
                                  handleUpdateNodeData(node.id, { branches: newBranches });
                                }}
                                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1 no-export"
                              >
                                <Plus className="w-4 h-4" />
                                Add Branch
                              </button>
                            ) : (
                              <div />
                            )}
                            <button
                              onClick={() => setEditingNodeId(null)}
                              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer group/content"
                          onClick={() => setEditingNodeId(node.id)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{nodeType.label}</span>
                          </div>
                          <h4 className="text-lg font-bold text-zinc-900 dark:text-white group-hover/content:text-indigo-600 transition-colors">
                            {node.data.label}
                          </h4>
                          {node.data.description && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                              {node.data.description}
                            </p>
                          )}
                          {node.type === 'decision' && node.data.branches && node.data.branches.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {node.data.branches.map(branch => (
                                <div key={branch.id} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                                  <GitBranch className="w-3 h-3" />
                                  {branch.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!isEditing && canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-export">
                        <button
                          onClick={() => setEditingNodeId(node.id)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Button Below Node */}
              {canEdit && (
                <div className="absolute -bottom-4 left-0 w-16 flex justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity no-export">
                  <button
                    onClick={() => handleAddNode(index + 1)}
                    className="w-8 h-8 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-600 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
