import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, X, ChevronDown, ChevronUp, AlertCircle, MessageSquare, Send, UsersRound } from 'lucide-react';
import { Task, Project, Comment, User, TeamMember, Sprint } from '../types';
import { cn } from '../lib/utils';
import { ContextualHelp } from './ContextualHelp';
import { v4 as uuidv4 } from 'uuid';
import { MentionTextarea } from './MentionTextarea';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

interface TaskModalProps {
  task: Task;
  project: Project;
  sprints?: Sprint[];
  currentUser?: User;
  users?: User[];
  onSave: (task: Task) => void;
  onUpdate?: (task: Task) => void;
  onClose: () => void;
  onDelete?: (taskId: string) => void;
  onAddTeamMember?: (user: User, projectId?: string) => void;
  isReadOnly?: boolean;
}

export function TaskModal({ task, project, sprints = [], currentUser, users = [], onSave, onUpdate, onClose, onDelete, onAddTeamMember, isReadOnly }: TaskModalProps) {
  const [editingTask, setEditingTask] = useState<Task>(task);
  const [pendingTeamMember, setPendingTeamMember] = useState<User | null>(null);
  const [showBlockerDetails, setShowBlockerDetails] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const { addNotification } = useNotifications();
  const { addToast } = useToast();

  const moscowCategories = [
    { id: 'Must', label: 'Must Have', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' },
    { id: 'Should', label: 'Should Have', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    { id: 'Could', label: 'Could Have', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
    { id: 'Wont', label: 'Won\'t Have', color: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' }
  ];

  const kanbanColumns = project.kanbanColumns || [
    { id: 'Backlog', title: 'Backlog', color: 'zinc', order: 0 },
    { id: 'In Progress', title: 'In Progress', color: 'blue', order: 1 },
    { id: 'Review/Test', title: 'Review/Test', color: 'purple', order: 2 },
    { id: 'Done', title: 'Done', color: 'emerald', order: 3 }
  ];

  const isBlocked = !!editingTask.isBlocked;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{isReadOnly ? 'View Task' : 'Edit Task'}</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Title</label>
            <input 
              type="text"
              value={editingTask.title}
              disabled={isReadOnly}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              className={cn(
                "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                isReadOnly && "opacity-70 cursor-not-allowed"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Description</label>
            <textarea 
              value={editingTask.description}
              disabled={isReadOnly}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              rows={4}
              className={cn(
                "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200 resize-none",
                isReadOnly && "opacity-70 cursor-not-allowed"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Status</label>
              <select 
                value={editingTask.kanbanStatus}
                disabled={isReadOnly}
                onChange={(e) => setEditingTask({ ...editingTask, kanbanStatus: e.target.value })}
                className={cn(
                  "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                  isReadOnly && "opacity-70 cursor-not-allowed"
                )}
              >
                {kanbanColumns.map(col => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Blocked Status</label>
              <div className="flex items-center h-[50px]">
                <button
                  disabled={isReadOnly}
                  onClick={() => setEditingTask({ ...editingTask, isBlocked: !editingTask.isBlocked })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    editingTask.isBlocked ? "bg-rose-600" : "bg-zinc-200 dark:bg-zinc-700",
                    isReadOnly && "opacity-70 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      editingTask.isBlocked ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <span className={cn(
                  "ml-3 text-sm font-bold",
                  editingTask.isBlocked ? "text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400"
                )}>
                  {editingTask.isBlocked ? 'Blocked' : 'Not Blocked'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Owner</label>
            <select 
              value={editingTask.owner || ''}
              disabled={isReadOnly}
              onChange={(e) => {
                const selectedName = e.target.value;
                const selectedUser = users.find(u => u.name === selectedName);
                
                if (selectedUser) {
                  const isInTeam = project.team?.some(m => m.userId === selectedUser.id || m.name === selectedUser.name);
                  if (!isInTeam) {
                    setPendingTeamMember(selectedUser);
                    return;
                  }
                }
                
                setEditingTask({ ...editingTask, owner: selectedName });
              }}
              className={cn(
                "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                isReadOnly && "opacity-70 cursor-not-allowed"
              )}
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {isBlocked && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowBlockerDetails(!showBlockerDetails)}
              >
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                  <h4 className="font-bold">Blocker Details</h4>
                </div>
                {showBlockerDetails ? (
                  <ChevronUp className="w-5 h-5 text-rose-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-rose-500" />
                )}
              </div>
              
              <AnimatePresence>
                {showBlockerDetails && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">What is blocking this?</label>
                      <textarea 
                        value={editingTask.blockerDescription || ''}
                        disabled={isReadOnly}
                        onChange={(e) => setEditingTask({ ...editingTask, blockerDescription: e.target.value })}
                        rows={2}
                        placeholder="Describe the blocker..."
                        className={cn(
                          "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-zinc-700 dark:text-zinc-200 resize-none",
                          isReadOnly && "opacity-70 cursor-not-allowed"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Actions to unblock</label>
                      <textarea 
                        value={editingTask.unblockActions || ''}
                        disabled={isReadOnly}
                        onChange={(e) => setEditingTask({ ...editingTask, unblockActions: e.target.value })}
                        rows={2}
                        placeholder="What needs to happen to unblock this?"
                        className={cn(
                          "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-zinc-700 dark:text-zinc-200 resize-none",
                          isReadOnly && "opacity-70 cursor-not-allowed"
                        )}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">MoSCoW Priority</label>
              <ContextualHelp 
                title="MoSCoW Prioritization" 
                description="Must Have: Non-negotiable requirements. Should Have: Important but not vital. Could Have: Nice to have if time permits. Won't Have: Not in this timeframe."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {moscowCategories.map(cat => (
                <button
                  key={cat.id}
                  disabled={isReadOnly}
                  onClick={() => setEditingTask({ ...editingTask, moscow: cat.id as any })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                    editingTask.moscow === cat.id 
                      ? cat.color 
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700",
                    isReadOnly && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Expected Completion</label>
              <input 
                type="date"
                value={editingTask.expectedCompletionDate ? new Date(editingTask.expectedCompletionDate).toISOString().split('T')[0] : ''}
                disabled={isReadOnly}
                onChange={(e) => setEditingTask({ ...editingTask, expectedCompletionDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className={cn(
                  "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                  isReadOnly && "opacity-70 cursor-not-allowed"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Actual Completion</label>
              <input 
                type="date"
                value={editingTask.actualCompletionDate ? new Date(editingTask.actualCompletionDate).toISOString().split('T')[0] : ''}
                disabled={isReadOnly}
                onChange={(e) => setEditingTask({ ...editingTask, actualCompletionDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className={cn(
                  "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                  isReadOnly && "opacity-70 cursor-not-allowed"
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Impact</label>
              <select 
                value={editingTask.impact}
                disabled={isReadOnly}
                onChange={(e) => setEditingTask({ ...editingTask, impact: e.target.value as any })}
                className={cn(
                  "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                  isReadOnly && "opacity-70 cursor-not-allowed"
                )}
              >
                {['Low', 'Medium', 'High'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Effort</label>
              <select 
                value={editingTask.effort}
                disabled={isReadOnly}
                onChange={(e) => setEditingTask({ ...editingTask, effort: e.target.value as any })}
                className={cn(
                  "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                  isReadOnly && "opacity-70 cursor-not-allowed"
                )}
              >
                {['Low', 'Medium', 'High'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Sprint</label>
            <select 
              value={editingTask.sprint || ''}
              disabled={isReadOnly}
              onChange={(e) => setEditingTask({ ...editingTask, sprint: e.target.value || undefined })}
              className={cn(
                "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                isReadOnly && "opacity-70 cursor-not-allowed"
              )}
            >
              <option value="">No Sprint (Backlog)</option>
              {sprints
                .filter(s => s.projectId === project.id)
                .sort((a, b) => (b.number || 0) - (a.number || 0))
                .map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Acceptance Criteria</label>
            <textarea 
              value={editingTask.acceptanceCriteria || ''}
              disabled={isReadOnly}
              onChange={(e) => setEditingTask({ ...editingTask, acceptanceCriteria: e.target.value })}
              rows={3}
              placeholder="What needs to be true for this task to be considered done?"
              className={cn(
                "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200 resize-none",
                isReadOnly && "opacity-70 cursor-not-allowed"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Notes</label>
            <textarea 
              value={editingTask.notes || ''}
              disabled={isReadOnly}
              onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
              rows={4}
              placeholder="Add your notes, observations, or next steps here..."
              className={cn(
                "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-700 dark:text-zinc-200 resize-none",
                isReadOnly && "opacity-70 cursor-not-allowed"
              )}
            />
          </div>
          
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Estimation Points</label>
              <button
                disabled={isReadOnly}
                onClick={() => setEditingTask({ ...editingTask, showEstimation: !editingTask.showEstimation })}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  editingTask.showEstimation ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700",
                  isReadOnly && "opacity-70 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                    editingTask.showEstimation ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </button>
            </div>
            
            {editingTask.showEstimation && (
              <input 
                type="number"
                value={editingTask.estimation || ''}
                disabled={isReadOnly}
                onChange={(e) => setEditingTask({ ...editingTask, estimation: parseInt(e.target.value) || undefined })}
                placeholder="e.g. 3, 5, 8"
                className={cn(
                  "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white",
                  isReadOnly && "opacity-70 cursor-not-allowed"
                )}
              />
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Comments</h4>
              <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {editingTask.comments?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {editingTask.comments?.map((comment) => (
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
              ))}
              {(!editingTask.comments || editingTask.comments.length === 0) && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No comments yet.</p>
              )}
            </div>

            {!isReadOnly && currentUser && (
              <div className="flex gap-2 mt-4">
                <MentionTextarea
                  value={newCommentText}
                  onChange={setNewCommentText}
                  users={users}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-zinc-900 dark:text-white"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && newCommentText.trim()) {
                      e.preventDefault();
                      const text = newCommentText.trim();
                      const newComment: Comment = {
                        id: uuidv4(),
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userAvatar: currentUser.photoUrl,
                        text: text,
                        createdAt: new Date().toISOString(),
                      };

                      // Check for mentions
                      const allUsers = [...users];
                      if (currentUser && !allUsers.some(u => u.id === currentUser.id)) {
                        allUsers.push(currentUser);
                      }

                      allUsers.forEach(user => {
                        if (text.includes(`@${user.name}`)) {
                          addNotification({
                            title: 'New Mention',
                            message: `${currentUser.name} mentioned you in a task comment: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                            type: 'chat',
                            sourceId: newComment.id,
                            link: {
                              type: 'task',
                              id: editingTask.id,
                              projectId: editingTask.projectId
                            }
                          });
                          
                          if (user.id === currentUser.id) {
                            addToast(`You mentioned yourself!`, 'info');
                          } else {
                            addToast(`Mentioned ${user.name}`, 'success');
                          }
                        }
                      });

                      setEditingTask({
                        ...editingTask,
                        comments: [...(editingTask.comments || []), newComment]
                      });
                      setNewCommentText('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newCommentText.trim()) {
                      const text = newCommentText.trim();
                      const newComment: Comment = {
                        id: uuidv4(),
                        userId: currentUser.id,
                        userName: currentUser.name,
                        userAvatar: currentUser.photoUrl,
                        text: text,
                        createdAt: new Date().toISOString(),
                      };

                      // Check for mentions
                      const allUsers = [...users];
                      if (currentUser && !allUsers.some(u => u.id === currentUser.id)) {
                        allUsers.push(currentUser);
                      }

                      allUsers.forEach(user => {
                        if (text.includes(`@${user.name}`)) {
                          addNotification({
                            title: 'New Mention',
                            message: `${currentUser.name} mentioned you in a task comment: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                            type: 'chat',
                            sourceId: newComment.id,
                            link: {
                              type: 'task',
                              id: editingTask.id,
                              projectId: editingTask.projectId
                            }
                          });
                          
                          if (user.id === currentUser.id) {
                            addToast(`You mentioned yourself!`, 'info');
                          } else {
                            addToast(`Mentioned ${user.name}`, 'success');
                          }
                        }
                      });

                      const updatedTask = {
                        ...editingTask,
                        comments: [...(editingTask.comments || []), newComment]
                      };
                      setEditingTask(updatedTask);
                      if (onUpdate) {
                        onUpdate(updatedTask);
                      } else {
                        onSave(updatedTask);
                      }
                      setNewCommentText('');
                    }
                  }}
                  disabled={!newCommentText.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between shrink-0">
          {onDelete && !isReadOnly ? (
            <button 
              onClick={() => onDelete(editingTask.id)}
              className="px-6 py-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold transition-colors"
            >
              Delete
            </button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-bold transition-colors"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button 
                onClick={() => onSave(editingTask)}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>

      {/* Add to Team Prompt */}
      <AnimatePresence>
        {pendingTeamMember && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center"
            >
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <UsersRound className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Add to Project Team?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                <span className="font-bold text-zinc-900 dark:text-white">{pendingTeamMember.name}</span> is not currently on the project team. Would you like me to add them?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPendingTeamMember(null)}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onAddTeamMember) {
                      onAddTeamMember(pendingTeamMember, project.id);
                    }
                    setEditingTask({ ...editingTask, owner: pendingTeamMember.name });
                    setPendingTeamMember(null);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  Add Member
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
