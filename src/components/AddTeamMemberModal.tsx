import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UsersRound, Plus, Shield, Mail, User as UserIcon, Upload } from 'lucide-react';
import { User, Project, TeamMember } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PRESET_AVATARS } from '../constants';
import { cn } from '../lib/utils';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onAddMember: (member: TeamMember) => void;
  isAdmin: boolean;
}

export function AddTeamMemberModal({ isOpen, onClose, project, users, setUsers, onAddMember, isAdmin }: AddTeamMemberModalProps) {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'User', photoUrl: '' });

  const allAvailableUsers = React.useMemo(() => {
    const list = [...users];
    const teamUserIds = new Set((project.team || []).map(m => m.userId).filter(Boolean));
    return list.filter(u => !teamUserIds.has(u.id));
  }, [users, project.team]);

  const handleCreateAndAddUser = () => {
    if (!newUser.name || !newUser.email) return;

    const userObj: User = {
      id: `usr_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active',
      photoUrl: newUser.photoUrl || `https://ui-avatars.com/api/?name=${newUser.name.replace(/\s+/g, '+')}&background=random`
    };

    setUsers(prev => [...prev, userObj]);
    handleAddTeamMember(userObj);
    setIsCreatingUser(false);
    setNewUser({ name: '', email: '', role: 'User', photoUrl: '' });
  };

  const handleAddTeamMember = (user?: User) => {
    const newMember: TeamMember = user ? {
      id: uuidv4(),
      userId: user.id,
      name: user.name,
      jobTitle: user.role || 'Team Member',
      projectRole: 'Member',
      photoUrl: user.photoUrl || `https://ui-avatars.com/api/?name=${user.name.replace(/\s+/g, '+')}&background=random`
    } : {
      id: uuidv4(),
      name: 'New Member',
      jobTitle: 'Job Title',
      projectRole: 'Member',
      photoUrl: `https://ui-avatars.com/api/?name=New+Member&background=random`
    };

    onAddMember(newMember);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <UsersRound className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Add Team Member</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {isCreatingUser ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Role</label>
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Project Admin">Project Admin</option>
                  <option value="User">User</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Profile Photo</label>
                <div className="flex items-center gap-4">
                  {newUser.photoUrl ? (
                    <img src={newUser.photoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      id="modal-photo-upload"
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
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
                                setNewUser({...newUser, photoUrl: canvas.toDataURL('image/jpeg', 0.8)});
                              }
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label 
                      htmlFor="modal-photo-upload"
                      className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                      title="Upload Photo"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {PRESET_AVATARS.map((url, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setNewUser({...newUser, photoUrl: url})}
                      className={cn(
                        "w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0",
                        newUser.photoUrl === url ? "border-indigo-600 scale-110 shadow-sm" : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                      )}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleCreateAndAddUser}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Create & Add to Team
                </button>
                <button 
                  onClick={() => setIsCreatingUser(false)}
                  className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option to create a new user (Admins only) */}
              {isAdmin && (
                <button
                  onClick={() => setIsCreatingUser(true)}
                  className="p-4 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition-colors">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Create New User</p>
                    <p className="text-xs text-zinc-500">Add a new user to the system</p>
                  </div>
                </button>
              )}

              {/* List of available users */}
              {allAvailableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleAddTeamMember(user)}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 hover:shadow-md transition-all flex items-center gap-4 text-left group bg-white dark:bg-zinc-900"
                >
                  <img 
                    src={user.photoUrl} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{user.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3 h-3 text-zinc-400" />
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
