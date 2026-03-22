import React, { useState } from 'react';
import { MessageSquare, Send, X, User as UserIcon } from 'lucide-react';
import { Comment, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { MentionTextarea } from './MentionTextarea';

interface CommentsPanelProps {
  isOpen: boolean;
  comments: Comment[];
  currentUser: User;
  users: User[];
  onAddComment: (comment: Comment) => void;
  onClose: () => void;
  title?: string;
}

export function CommentsPanel({ isOpen, comments, currentUser, users, onAddComment, onClose, title = "Comments" }: CommentsPanelProps) {
  const [newCommentText, setNewCommentText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.photoUrl,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddComment(newComment);
    setNewCommentText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-zinc-900 dark:text-white">{title}</h3>
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {comments.length}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">No comments yet</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Be the first to start the conversation!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {comment.userAvatar ? (
                        <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                          {comment.userName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{comment.userName}</span>
                        <span className="text-xs text-zinc-400">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg rounded-tl-none">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <form onSubmit={handleSubmit} className="relative">
                <MentionTextarea
                  value={newCommentText}
                  onChange={setNewCommentText}
                  users={users}
                  placeholder="Write a comment..."
                  className="w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors z-10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
