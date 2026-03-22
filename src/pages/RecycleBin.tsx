import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  RefreshCcw, 
  Trash, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  Map, 
  CheckSquare, 
  Users,
  AlertCircle,
  ArrowLeft,
  Info
} from 'lucide-react';
import { RecycleBinItem, AuditEntry } from '../types';
import { cn } from '../lib/utils';

interface RecycleBinProps {
  items: RecycleBinItem[];
  onRestore: (item: RecycleBinItem) => void;
  onPermanentlyDelete: (itemId: string) => void;
  onNavigateBack: () => void;
}

export function RecycleBin({ items, onRestore, onPermanentlyDelete, onNavigateBack }: RecycleBinProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<RecycleBinItem | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.data.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.data.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, typeFilter]);

  const getItemIcon = (type: RecycleBinItem['type']) => {
    switch (type) {
      case 'Project': return <FileText className="w-4 h-4" />;
      case 'JourneyMap': return <Map className="w-4 h-4" />;
      case 'Task': return <CheckSquare className="w-4 h-4" />;
      case 'Persona': return <Users className="w-4 h-4" />;
      case 'ProcessMap': return <RefreshCcw className="w-4 h-4" />;
      case 'RAIDItem': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getItemName = (item: RecycleBinItem) => {
    return item.data.name || item.data.title || item.data.description || 'Unnamed Item';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#09090b] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={onNavigateBack}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">System Maintenance</span>
              </div>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                Recycle Bin
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Deleted items are stored here for 30 days. Site administrators can restore items or permanently delete them.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search deleted items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
              />
            </div>
          </div>
        </div>

        {/* Stats & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{items.length}</p>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Items</p>
            </div>
          </div>
          <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
              Restoring a project will also restore all its associated journey maps, tasks, and team members. Restoring individual items will return them to their original project.
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-zinc-400" />
              <div className="flex gap-2">
                {['All', 'Project', 'JourneyMap', 'Task', 'Persona', 'ProcessMap'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      typeFilter === type 
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md" 
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Item Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Deleted At</th>
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Deleted By</th>
                  <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.tr 
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            {getItemIcon(item.type)}
                          </div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{getItemName(item)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.deletedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs text-zinc-900 dark:text-zinc-300 font-medium">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          {item.deletedBy}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onRestore(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                            title="Restore Item"
                          >
                            <RefreshCcw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onPermanentlyDelete(item.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                            title="Permanently Delete"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full">
                          <Trash2 className="w-12 h-12 text-zinc-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-900 dark:text-white font-bold">Recycle bin is empty</p>
                          <p className="text-xs text-zinc-500">Items you delete will appear here for 30 days.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
