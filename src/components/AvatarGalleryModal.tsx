import React, { useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { PRESET_AVATARS } from '../constants';

interface AvatarGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function AvatarGalleryModal({ isOpen, onClose, onSelect }: AvatarGalleryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onSelect(url);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            {PRESET_AVATARS.map((url, i) => (
              <button 
                key={i}
                onClick={() => { onSelect(url); onClose(); }}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-zinc-900 transition-all group"
              >
                <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-100 pt-6">
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
