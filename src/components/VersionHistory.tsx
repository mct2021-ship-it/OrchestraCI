import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Version {
  id: string;
  entityType: string;
  entityId: string;
  data: any;
  createdBy: string | null;
  createdAt: number;
  versionMessage: string | null;
}

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  currentData: any;
  onRestore: (data: any) => void;
}

export function VersionHistory({ isOpen, onClose, entityType, entityId, currentData, onRestore }: VersionHistoryProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/versions/${entityType}/${entityId}`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error(error);
      addToast('Failed to load version history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, entityType, entityId]);

  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionMessage.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          data: currentData,
          createdBy: user?.name,
          versionMessage
        })
      });

      if (!response.ok) throw new Error('Failed to save version');
      
      setVersionMessage('');
      addToast('Version saved successfully', 'success');
      fetchVersions();
    } catch (error) {
      console.error(error);
      addToast('Failed to save version', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = (version: Version) => {
    if (window.confirm('Are you sure you want to restore this version? Current unsaved changes will be lost.')) {
      onRestore(version.data);
      addToast('Version restored successfully', 'success');
      onClose();
    }
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col border-l border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Version History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Save Current State</h3>
              <form onSubmit={handleSaveVersion} className="flex gap-2">
                <input
                  type="text"
                  value={versionMessage}
                  onChange={(e) => setVersionMessage(e.target.value)}
                  placeholder="Version description (e.g., 'Before major redesign')"
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900 dark:text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={isSaving || !versionMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">No saved versions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {version.versionMessage || 'Unnamed Version'}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {new Date(version.createdAt).toLocaleString()}
                            {version.createdBy && ` • by ${version.createdBy}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(version)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-sm font-medium"
                          title="Restore this version"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
