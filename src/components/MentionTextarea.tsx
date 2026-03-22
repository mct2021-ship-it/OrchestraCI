import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  rows?: number;
}

export function MentionTextarea({
  value,
  onChange,
  users,
  placeholder,
  className,
  onKeyDown,
  rows = 2
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(suggestionFilter.toLowerCase()) ||
    user.email.toLowerCase().includes(suggestionFilter.toLowerCase())
  );

  useEffect(() => {
    if (showSuggestions) {
      setSelectedIndex(0);
    }
  }, [showSuggestions, suggestionFilter]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart;
    onChange(newValue);
    setCursorPosition(pos);

    // Check for @ mention
    const textBeforeCursor = newValue.slice(0, pos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      // Only show if there's no space between @ and cursor
      if (!textAfterAt.includes(' ')) {
        setShowSuggestions(true);
        setSuggestionFilter(textAfterAt);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const handleSelectUser = (user: User) => {
    const textBeforeAt = value.slice(0, value.lastIndexOf('@', cursorPosition - 1));
    const textAfterCursor = value.slice(cursorPosition);
    const newValue = `${textBeforeAt}@${user.name} ${textAfterCursor}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = textBeforeAt.length + user.name.length + 2;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectUser(filteredUsers[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />

      <AnimatePresence>
        {showSuggestions && filteredUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50"
          >
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mention someone</span>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                    index === selectedIndex 
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{user.name}</span>
                    <span className="text-[10px] text-zinc-400 truncate">{user.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
