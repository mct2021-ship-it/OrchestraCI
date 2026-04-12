import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Camera, LogOut, Save, Shield, Upload, Zap, CreditCard, Building2, Users, Check, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PRESET_AVATARS } from '../constants';
import { User as SystemUser, Project } from '../types';
import { AvatarGalleryModal } from '../components/AvatarGalleryModal';

interface AccountSettingsProps {
  isDarkMode?: boolean;
  onNavigate?: (tab: string) => void;
  users?: SystemUser[];
  setUsers?: React.Dispatch<React.SetStateAction<SystemUser[]>>;
  projects?: Project[];
}

import { usePlan } from '../context/PlanContext';

export function AccountSettings({ isDarkMode, onNavigate, users, setUsers, projects }: AccountSettingsProps) {
  const { user, token, login, logout } = useAuth();
  const { plan, details } = usePlan();
  const [name, setName] = useState(user?.name || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<string | null>(null);
  const [isAvatarGalleryOpen, setIsAvatarGalleryOpen] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Image must be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
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
            setPhotoUrl(canvas.toDataURL('image/jpeg', 0.8));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || !token) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, photoUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      login(token, data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className={cn(
        "flex-none h-16 border-b flex items-center px-6",
        isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <h1 className={cn(
          "text-xl font-bold",
          isDarkMode ? "text-white" : "text-zinc-900"
        )}>Account Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-6 rounded-2xl border",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}
          >
            <h2 className={cn(
              "text-lg font-bold mb-6",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>Profile Information</h2>

            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className={cn(
                    "w-32 h-32 rounded-full overflow-hidden border-4",
                    isDarkMode ? "border-zinc-800" : "border-zinc-100"
                  )}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={cn(
                        "w-full h-full flex items-center justify-center",
                        isDarkMode ? "bg-zinc-800" : "bg-zinc-100"
                      )}>
                        <User className="w-12 h-12 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                
                <div className="flex flex-col gap-2 w-full">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                      isDarkMode 
                        ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" 
                        : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAvatarGalleryOpen(true)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                      isDarkMode 
                        ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" 
                        : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Use Avatar
                  </button>
                </div>

                <AvatarGalleryModal 
                  isOpen={isAvatarGalleryOpen}
                  onClose={() => setIsAvatarGalleryOpen(false)}
                  onSelect={(url) => setPhotoUrl(url)}
                />

                <div className="text-center pt-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    user?.role === 'Admin' 
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                  )}>
                    <Shield className="w-3.5 h-3.5" />
                    {user?.role || 'User'}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-1.5",
                    isDarkMode ? "text-zinc-300" : "text-zinc-700"
                  )}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all",
                      isDarkMode 
                        ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400"
                    )}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-1.5",
                    isDarkMode ? "text-zinc-300" : "text-zinc-700"
                  )}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border opacity-60 cursor-not-allowed",
                      isDarkMode 
                        ? "bg-zinc-950 border-zinc-800 text-white" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-900"
                    )}
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">Email address cannot be changed.</p>
                </div>

                {message && (
                  <div className={cn(
                    "p-3 rounded-lg text-sm font-medium",
                    message.type === 'success' 
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                      : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  )}>
                    {message.text}
                  </div>
                )}

                <div className="pt-4 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {user?.role === 'Admin' && users && setUsers && projects && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                "p-6 rounded-2xl border",
                isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
              )}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "p-2 rounded-lg",
                  isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                )}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={cn(
                    "text-lg font-bold",
                    isDarkMode ? "text-white" : "text-zinc-900"
                  )}>Team Management</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Manage users and their project access.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {users.map(u => (
                  <div key={u.id} className={cn(
                    "p-4 rounded-xl border transition-colors",
                    isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <p className={cn("font-medium", isDarkMode ? "text-white" : "text-zinc-900")}>{u.name}</p>
                          <p className="text-xs text-zinc-500">{u.email} • {u.role}</p>
                        </div>
                      </div>
                      {(u.role === 'Project Admin' || u.role === 'User' || u.role === 'Viewer') && (
                        <button
                          onClick={() => setSelectedUserForProjects(selectedUserForProjects === u.id ? null : u.id)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border",
                            selectedUserForProjects === u.id
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : isDarkMode
                                ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                          )}
                        >
                          Manage Project Access
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {selectedUserForProjects === u.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className={cn(
                            "p-4 rounded-lg border mt-4",
                            isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                          )}>
                            <h4 className={cn("text-sm font-bold mb-3", isDarkMode ? "text-zinc-300" : "text-zinc-700")}>Assigned Projects</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {projects.map(p => {
                                const isAssigned = u.projectIds?.includes(p.id);
                                return (
                                  <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={cn(
                                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                      isAssigned 
                                        ? "bg-indigo-500 border-indigo-500 text-white" 
                                        : isDarkMode
                                          ? "border-zinc-600 group-hover:border-indigo-500"
                                          : "border-zinc-300 group-hover:border-indigo-500"
                                    )}>
                                      {isAssigned && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className={cn("text-sm font-medium", isDarkMode ? "text-zinc-300" : "text-zinc-700")}>{p.name}</span>
                                    <input 
                                      type="checkbox" 
                                      className="hidden"
                                      checked={isAssigned || false}
                                      onChange={(e) => {
                                        const newProjectIds = e.target.checked
                                          ? [...(u.projectIds || []), p.id]
                                          : (u.projectIds || []).filter(id => id !== p.id);
                                        
                                        setUsers(prev => prev.map(user => 
                                          user.id === u.id ? { ...user, projectIds: newProjectIds } : user
                                        ));
                                      }}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "p-6 rounded-2xl border",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}
          >
            <h2 className={cn(
              "text-lg font-bold mb-2",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>Account Actions</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Sign out of your account on this device.
            </p>
            
            <button
              onClick={logout}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors border",
                isDarkMode 
                  ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" 
                  : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50"
              )}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "p-6 rounded-2xl border",
              isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={cn(
                  "text-lg font-bold",
                  isDarkMode ? "text-white" : "text-zinc-900"
                )}>Subscription & Usage</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Manage your plan and monitor AI usage.
                </p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-700"
              )}>
                {details.name} Plan
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    AI Credits
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400">12,450 / {details.aiCreditsPerMonth.toLocaleString()} used</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(12450 / details.aiCreditsPerMonth) * 100}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                  Credits reset on April 1st, 2026.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    Active Project Slots
                  </div>
                  <span className="text-zinc-500 dark:text-zinc-400">8 / {details.maxActiveProjects} slots</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(8 / details.maxActiveProjects) * 100}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  <p className="italic">12 archived projects (not counting towards slots)</p>
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">18 / {details.maxProjectCreationsPerYear} total creations this year</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
                <button
                  className={cn(
                    "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors border",
                    isDarkMode 
                      ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" 
                      : "bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  Manage Billing
                </button>
                <button
                  onClick={() => onNavigate?.('pricing')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
