import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
  showConfirmTick?: boolean;
  hideEditIcon?: boolean;
}

export function EditableText({ value, onChange, className = '', multiline = false, disabled = false, showConfirmTick = false, hideEditIcon = false }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempValue.trim() !== '') {
      onChange(tempValue);
    } else {
      setTempValue(value); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-1 w-full relative">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full bg-white dark:bg-zinc-900 border border-indigo-500 rounded px-2 py-1 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${className}`}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full bg-white dark:bg-zinc-900 border border-indigo-500 rounded px-2 py-1 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${className}`}
          />
        )}
        <div className="absolute right-1 top-1 flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
            title="Save (Enter)"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setTempValue(value); setIsEditing(false); }}
            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className={`px-1 -mx-1 ${className}`}>
        <span className="break-words">{value}</span>
      </div>
    );
  }

  return (
    <div 
      className={`group relative cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:bg-zinc-800/50 rounded px-1 -mx-1 transition-colors ${className}`}
      onClick={() => {
        setTempValue(value);
        setIsEditing(true);
      }}
    >
      <span className="break-words">{value}</span>
    </div>
  );
}
