import React, { useCallback, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { ProcessMap, ProcessNode, ProcessEdge } from '../types';
import { cn } from '../lib/utils';

// Custom Node Component
const CustomNode = ({ data, selected }: any) => {
  const Icon = data.icon || User;
  const colorClass = data.colorClass || 'bg-blue-500';
  const isDecision = data.type === 'decision';

  return (
    <div className={cn(
      "px-4 py-3 rounded-xl shadow-lg border-2 transition-all min-w-[180px]",
      selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-zinc-200 dark:border-zinc-800",
      "bg-white dark:bg-zinc-900",
      isDecision ? "rounded-3xl border-orange-200 dark:border-orange-900/30" : ""
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-900" />
      
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg text-white shrink-0", colorClass)}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{data.label}</p>
          {data.description && (
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{data.description}</p>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-zinc-900" />
      
      {isDecision && (
        <>
          <Handle 
            type="source" 
            position={Position.Left} 
            id="left"
            className="w-3 h-3 bg-orange-500 border-2 border-white dark:border-zinc-900" 
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            id="right"
            className="w-3 h-3 bg-orange-500 border-2 border-white dark:border-zinc-900" 
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
}

export function ProcessFlowEditor({ processMap, onUpdate, canEdit = true }: ProcessFlowEditorProps) {
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
            colorClass: 'bg-emerald-500' 
          },
        }
      ];
    }
    return processMap.nodes.map(n => {
      const config = NODE_CONFIGS.find(c => c.type === n.type) || NODE_CONFIGS[1];
      return {
        id: n.id,
        type: 'custom',
        position: n.position,
        data: { 
          ...n.data, 
          type: n.type,
          icon: config.icon,
          colorClass: config.colorClass
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
        label: n.data.label as string, 
        description: n.data.description as string 
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
        colorClass: config.colorClass 
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

  return (
    <div className="h-[700px] w-full bg-zinc-50 dark:bg-zinc-950 relative border-t border-zinc-200 dark:border-zinc-800">
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
        
        {canEdit && (
          <Panel position="top-right" className="bg-white dark:bg-zinc-900 p-2 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
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
          </Panel>
        )}

        {editingNode && canEdit && (
          <Panel position="top-left" className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-72 flex flex-col gap-4 animate-in slide-in-from-left-2 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Step</h4>
              <button onClick={() => setEditingNode(null)} className="text-zinc-400 hover:text-zinc-600">
                <Square size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Label</label>
                <input 
                  type="text" 
                  value={editingNode.data.label as string}
                  onChange={(e) => updateNodeData(editingNode.id, { label: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <textarea 
                  value={editingNode.data.description as string || ''}
                  onChange={(e) => updateNodeData(editingNode.id, { description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button 
                  onClick={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== editingNode.id));
                    setEditingNode(null);
                    handleSave();
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </Panel>
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
