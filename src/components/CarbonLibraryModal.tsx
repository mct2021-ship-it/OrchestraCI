import React, { useState } from 'react';
import { X, Search, Leaf, Info, Check } from 'lucide-react';
import { carbonLibrary, CarbonCoefficient } from '../data/carbonLibrary';

interface CarbonLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: number) => void;
}

export const CarbonLibraryModal: React.FC<CarbonLibraryModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = Array.from(new Set(carbonLibrary.map(c => c.category)));
  
  const filteredLibrary = carbonLibrary.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase()) || 
                         item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Carbon Intelligence Library</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Select standard coefficients for your touchpoints</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search coefficients (e.g. 'email', 'delivery')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!selectedCategory ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === cat ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLibrary.length > 0 ? (
            filteredLibrary.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.value);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white">{item.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{item.value} <span className="text-xs font-normal text-zinc-400">kg CO2e</span></div>
                  <div className="text-[10px] text-zinc-400">{item.unit}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>No coefficients found matching your search.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
