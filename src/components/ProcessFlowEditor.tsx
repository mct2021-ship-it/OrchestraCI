import React, { useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge, 
  Node,
  Handle,
  Position,
  Panel,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Mail, 
  Monitor, 
  Phone, 
  ShieldCheck, 
  GitBranch, 
  User, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  Settings2,
  FileText,
  Clock,
  AlertCircle,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Lightbulb,
  CheckCircle2,
  X,
  PlusCircle,
  Flag
} from 'lucide-react';
import { ProcessMap, ProcessNode, ProcessEdge, Task } from '../types';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Custom Node Component
const CustomNode = ({ data, selected }: any) => {
  const Icon = data.icon || User;
  const colorClass = data.colorClass || 'bg-blue-500';
  const isDecision = data.type === 'decision';
  const hasImprovement = !!data.improvementOpportunity?.flagged;

  return (
    <div className={cn(
      "px-4 py-3 rounded-xl shadow-lg border-2 transition-all min-w-[200px] max-w-[300px]",
      selected ? "border-indigo-500 ring-4 ring-indigo-500/20" : "border-zinc-200 dark:border-zinc-800",
      "bg-white dark:bg-zinc-900",
      isDecision ? "rounded-3xl border-orange-200 dark:border-orange-900/30" : ""
    )}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-4 h-4 bg-indigo-500 border-2 border-white dark:border-zinc-900 -top-2" 
      />
      
      <div className="space-y-2">
        {data.imageUrl && (
          <div className="w-full h-24 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2">
            <img 
              src={data.imageUrl} 
              alt={data.label} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg text-white shrink-0", colorClass)}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{data.label}</p>
              {hasImprovement && (
                <div className="p-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full" title="Improvement Opportunity">
                  <Flag size={12} fill="currentColor" />
                </div>
              )}
            </div>
            {data.description && (
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{data.description}</p>
            )}
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-4 h-4 bg-indigo-500 border-2 border-white dark:border-zinc-900 -bottom-2" 
      />
      
      {isDecision && (
        <>
          <Handle 
            type="source" 
            position={Position.Left} 
            id="left"
            className="w-4 h-4 bg-orange-500 border-2 border-white dark:border-zinc-900 -left-2" 
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            id="right"
            className="w-4 h-4 bg-orange-500 border-2 border-white dark:border-zinc-900 -right-2" 
          />
        </>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const NODE_CONFIGS = [
  { type: 'start', label: 'Start', icon: Play, colorClass: 'bg-emerald-500' },
  { type: 'task', label: 'Manual Task', icon: User, colorClass: 'bg-blue-500' },
  { type: 'system', label: 'System Action', icon: Monitor, colorClass: 'bg-purple-500' },
  { type: 'email', label: 'Email', icon: Mail, colorClass: 'bg-indigo-500' },
  { type: 'phone', label: 'Phone Call', icon: Phone, colorClass: 'bg-amber-500' },
  { type: 'policy', label: 'Policy Check', icon: ShieldCheck, colorClass: 'bg-rose-500' },
  { type: 'decision', label: 'Decision', icon: GitBranch, colorClass: 'bg-orange-500' },
  { type: 'end', label: 'End', icon: Square, colorClass: 'bg-zinc-500' },
];

interface ProcessFlowEditorProps {
  processMap: ProcessMap;
  onUpdate: (nodes: ProcessNode[], edges: ProcessEdge[]) => void;
  canEdit?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onAddTask?: (task: Task) => void;
}

export function ProcessFlowEditor({ 
  processMap, 
  onUpdate, 
  canEdit = true,
  isFullScreen = false,
  onToggleFullScreen,
  onAddTask
}: ProcessFlowEditorProps) {
  // Map our ProcessNode/Edge to React Flow Node/Edge
  const initialNodes: Node[] = useMemo(() => {
    if (processMap.nodes.length === 0) {
      return [
        {
          id: 'start-1',
          type: 'custom',
          position: { x: 250, y: 50 },
          data: { 
            label: 'Start Process', 
            type: 'start', 
            icon: Play, 
            colorClass: 'bg-emerald-500',
            description: 'The beginning of the process'
          },
        }
      ];
    }
    return processMap.nodes.map(n => {
      const config = NODE_CONFIGS.find(c => c.type === n.type) || NODE_CONFIGS[1];
      const data = n.data || {};
      return {
        id: n.id,
        type: 'custom',
        position: n.position,
        data: { 
          ...data, 
          type: n.type,
          icon: config.icon,
          colorClass: config.colorClass,
          imageUrl: (data as any).imageUrl,
          details: (data as any).details,
          improvementOpportunity: (data as any).improvementOpportunity
        },
      };
    });
  }, [processMap.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return processMap.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }));
  }, [processMap.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [editingNode, setEditingNode] = React.useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setEditingNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setEditingNode(null);
  }, []);

  // Sync changes back to parent
  const handleSave = useCallback(() => {
    const updatedNodes: ProcessNode[] = nodes.map(n => ({
      id: n.id,
      type: n.data.type as string,
      data: {
        label: (n.data as any).label as string,
        description: (n.data as any).description as string,
        imageUrl: (n.data as any).imageUrl as string,
        details: (n.data as any).details as string,
        improvementOpportunity: (n.data as any).improvementOpportunity as any
      },
      position: n.position
    }));

    const updatedEdges: ProcessEdge[] = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label as string
    }));

    onUpdate(updatedNodes, updatedEdges);
  }, [nodes, edges, onUpdate]);

  const addNode = (config: typeof NODE_CONFIGS[0]) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { 
        label: `New ${config.label}`, 
        type: config.type, 
        icon: config.icon, 
        colorClass: config.colorClass,
        description: ''
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (id: string, updates: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
    handleSave();
  };

  const [newTaskTitle, setNewTaskTitle] = React.useState('');

  const handleCreateTask = () => {
    if (!newTaskTitle || !onAddTask || !editingNode) return;

    const taskId = uuidv4();
    const newTask: Task = {
      id: taskId,
      projectId: processMap.projectId,
      title: newTaskTitle,
      description: `Created from process map step: ${editingNode.data.label}\n\nContext: ${editingNode.data.description || 'No description provided.'}`,
      status: 'Discover',
      kanbanStatus: 'Backlog',
      impact: 'Medium',
      effort: 'Medium',
      owner: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBlocked: false
    };

    onAddTask(newTask);
    
    // Update node with task ID and flag it as improvement
    updateNodeData(editingNode.id, {
      improvementOpportunity: {
        flagged: true,
        details: (editingNode.data as any).improvementOpportunity?.details || newTaskTitle,
        taskId: taskId
      }
    });

    setNewTaskTitle('');
  };

  return (
    <div className={cn(
      "w-full bg-zinc-50 dark:bg-zinc-950 relative border-t border-zinc-200 dark:border-zinc-800 transition-all",
      isFullScreen ? "fixed inset-0 z-[100] h-screen" : "h-[700px]"
    )}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        onNodeDragStop={handleSave}
        onEdgesDelete={handleSave}
        onNodesDelete={handleSave}
        onConnectEnd={handleSave}
      >
        <Background color="#ccc" variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />
        
        <Panel position="top-right" className="flex flex-col gap-2">
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 transition-colors"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          )}
          
          {canEdit && (
            <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2">Add Elements</p>
              <div className="grid grid-cols-2 gap-2">
                {NODE_CONFIGS.map(config => (
                  <button
                    key={config.type}
                    onClick={() => addNode(config)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left group"
                  >
                    <div className={cn("p-1.5 rounded-md text-white", config.colorClass)}>
                      <config.icon size={14} />
                    </div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {editingNode && canEdit && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl text-white", editingNode.data.colorClass)}>
                    {React.createElement(editingNode.data.icon as any, { size: 20 })}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Process Step</h4>
                    <p className="text-xs text-zinc-500">Customize the details and properties of this step.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingNode(null)}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Step Label</label>
                      <input 
                        type="text" 
                        value={editingNode.data.label as string}
                        onChange={(e) => updateNodeData(editingNode.id, { label: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Customer Login"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Short Description</label>
                      <textarea 
                        value={editingNode.data.description as string || ''}
                        onChange={(e) => updateNodeData(editingNode.id, { description: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
                        placeholder="Brief summary of this step..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Image URL</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            type="text" 
                            value={editingNode.data.imageUrl as string || ''}
                            onChange={(e) => updateNodeData(editingNode.id, { imageUrl: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://example.com/image.png"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Detailed Documentation</label>
                      <textarea 
                        value={editingNode.data.details as string || ''}
                        onChange={(e) => updateNodeData(editingNode.id, { details: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[140px] resize-none"
                        placeholder="Detailed standard operating procedure or technical details..."
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Flag size={18} fill={(editingNode.data as any).improvementOpportunity?.flagged ? "currentColor" : "none"} />
                      <h5 className="font-bold text-sm">Improvement Opportunity</h5>
                    </div>
                    <button 
                      onClick={() => updateNodeData(editingNode.id, { 
                        improvementOpportunity: { 
                          ...(editingNode.data as any).improvementOpportunity, 
                          flagged: !(editingNode.data as any).improvementOpportunity?.flagged 
                        } 
                      })}
                      className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider transition-colors",
                        (editingNode.data as any).improvementOpportunity?.flagged 
                          ? "bg-amber-600 text-white" 
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                      )}
                    >
                      {(editingNode.data as any).improvementOpportunity?.flagged ? 'Flagged' : 'Flag it'}
                    </button>
                  </div>
                  <textarea 
                    value={(editingNode.data as any).improvementOpportunity?.details || ''}
                    onChange={(e) => updateNodeData(editingNode.id, { 
                      improvementOpportunity: { 
                        ...(editingNode.data as any).improvementOpportunity, 
                        details: e.target.value 
                      } 
                    })}
                    className="w-full px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-amber-500 min-h-[60px] resize-none"
                    placeholder="Identify what could be improved here..."
                  />
                  
                  {onAddTask && (
                    <div className="pt-2 flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Convert to Task</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Task title..."
                          className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/30 bg-white dark:bg-zinc-900 text-xs outline-none"
                        />
                        <button 
                          onClick={handleCreateTask}
                          disabled={!newTaskTitle}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <PlusCircle size={14} />
                          Create Task
                        </button>
                      </div>
                      {(editingNode.data as any).improvementOpportunity?.taskId && (
                        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> Linked to task: {(editingNode.data as any).improvementOpportunity.taskId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <button 
                  onClick={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== editingNode.id));
                    setEditingNode(null);
                    handleSave();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Step
                </button>
                <button 
                  onClick={() => setEditingNode(null)}
                  className="px-8 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <Panel position="bottom-center" className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Start
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-orange-500" /> Decision
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-zinc-500" /> End
          </div>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-2" />
          <button 
            onClick={handleSave}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Settings2 size={14} />
            Auto-Save Enabled
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
