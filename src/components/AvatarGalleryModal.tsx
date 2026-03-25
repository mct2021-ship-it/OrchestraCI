import React, { useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { AVATAR_LIBRARY } from '../data/avatars';

interface AvatarGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function AvatarGalleryModal({ isOpen, onClose, onSelect }: AvatarGalleryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [ageFilter, setAgeFilter] = useState<string>('All');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; // Avatars don't need to be huge
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const url = canvas.toDataURL('image/jpeg', 0.8);
            onSelect(url);
            onClose();
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredAvatars = AVATAR_LIBRARY.filter(avatar => {
    const genderMatch = genderFilter === 'All' || avatar.gender === genderFilter;
    const ageMatch = ageFilter === 'All' || avatar.ageBracket === ageFilter;
    return genderMatch && ageMatch;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Choose Avatar</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Select a preset or upload your own</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters:</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Ages</option>
                <option value="18-30">18-30</option>
                <option value="31-50">31-50</option>
                <option value="51+">51+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
            {filteredAvatars.map((avatar, i) => (
              <button 
                key={i}
                onClick={() => { onSelect(avatar.url); onClose(); }}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-zinc-900 transition-all group"
              >
                <img src={avatar.url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
              </button>
            ))}
            {filteredAvatars.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 dark:text-zinc-400">
                No avatars found matching your filters.
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:border-zinc-900 transition-all font-medium"
            >
              <Upload className="w-5 h-5" />
              Upload Custom Image
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
