import React, { useState } from 'react';
import { Project, TeamMember, Task, User as SystemUser } from '../types';
import { User, Plus, Mail, Shield, Briefcase, MoreVertical, X, Check, Search, Trash2, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { ContextualHelp } from '../components/ContextualHelp';
import { usePermissions } from '../hooks/usePermissions';
import { AddTeamMemberModal } from '../components/AddTeamMemberModal';
import { PRESET_AVATARS } from '../constants';

interface ProjectTeamProps {
  project: Project;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  onNavigate: (tab: string, subTab?: string) => void;
  users: SystemUser[];
  setUsers: React.Dispatch<React.SetStateAction<SystemUser[]>>;
  currentUser: SystemUser | null;
}

export function ProjectTeam({ project, projects, setProjects, tasks, onNavigate, users, setUsers, currentUser }: ProjectTeamProps) {
  const { canEditProject } = usePermissions();
  const canEdit = canEditProject(project);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  const handleAddMember = (member: TeamMember) => {
    const updatedTeam = [...(project.team || []), member];
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, team: updatedTeam } : p));
    setIsAddMemberOpen(false);
  };

  const handleUpdateMember = (id: string, updates: Partial<TeamMember>) => {
    const updatedTeam = (project.team || []).map(m => m.id === id ? { ...m, ...updates } : m);
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, team: updatedTeam } : p));
    setEditingMember(null);
  };

  const handleRemoveMember = (id: string) => {
    const updatedTeam = (project.team || []).filter(m => m.id !== id);
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, team: updatedTeam } : p));
    setEditingMember(null);
    setDeleteConfirmation(null);
  };

  const filteredTeam = (project.team || []).filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.projectRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <ContextualHelp 
        title="Project Team" 
        description="Manage the people involved in this project. Assign roles, add contact information, and ensure everyone is aligned on responsibilities."
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Project Team</h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-500/30">
              {project.name}
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage the team members and roles for <span className="text-indigo-600 font-semibold">{project.name}</span>.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsAddMemberOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search team members..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeam.map(member => (
          <div 
            key={member.id} 
            className={cn(
              "group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm transition-all relative overflow-hidden",
              canEdit ? "hover:shadow-md cursor-pointer" : ""
            )}
            onClick={() => {
              if (canEdit) {
                setEditingMember(member);
                setEditPhotoUrl(member.photoUrl || '');
              }
            }}
          >
            {canEdit && (
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-400 hover:text-indigo-600 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{member.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.jobTitle}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                  <Shield className="w-3 h-3" />
                  {member.projectRole}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </div>
              </div>
              <button 
                onClick={() => onNavigate('tasks', member.name)}
                className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer group"
              >
                <p className="text-xs font-bold text-zinc-400 group-hover:text-indigo-500 uppercase tracking-wider mb-1 transition-colors">Tasks Assigned</p>
                <p className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tasks.filter(t => t.owner === member.name && !t.archived).length} Assigned
                </p>
              </button>
            </div>
          </div>
        ))}

        {/* Add New Block */}
        <button 
          onClick={() => setIsAddMemberOpen(true)}
          className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center gap-4 text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold">Add Team Member</span>
        </button>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence mode="wait">
        <AddTeamMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          project={project}
          projects={projects}
          setProjects={setProjects}
          users={users}
          setUsers={setUsers}
          onAddMember={handleAddMember}
          isAdmin={isAdmin}
        />
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onAnimationComplete={() => {
                if (editingMember) {
                  const roles = ["Project Admin", "Project Manager", "Product Owner", "Designer", "Developer", "Member"];
                  if (editingMember.projectRole && !roles.includes(editingMember.projectRole)) {
                    setIsCustomRole(true);
                    setCustomRole(editingMember.projectRole);
                  } else {
                    setIsCustomRole(false);
                    setCustomRole('');
                  }
                }
              }}
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg">
                  Edit Team Member
                </h3>
                <button 
                  onClick={() => {
                    setEditingMember(null);
                    setEditPhotoUrl('');
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = {
                      name: formData.get('name') as string,
                      jobTitle: formData.get('jobTitle') as string,
                      projectRole: isCustomRole ? customRole : (formData.get('projectRoleSelect') as string),
                      photoUrl: editPhotoUrl,
                    };

                    handleUpdateMember(editingMember.id, data);
                  }}
                className="flex flex-col min-h-0"
              >
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        name="name"
                        defaultValue={editingMember?.name}
                        required
                        className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                        placeholder="e.g. Jane Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Job Title</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        name="jobTitle"
                        defaultValue={editingMember?.jobTitle}
                        required
                        className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                        placeholder="e.g. Product Designer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Project Role</label>
                    <div className="space-y-3">
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <select 
                          name="projectRoleSelect"
                          value={isCustomRole ? 'Other' : (editingMember?.projectRole || 'Member')}
                          onChange={(e) => {
                            if (e.target.value === 'Other') {
                              setIsCustomRole(true);
                            } else {
                              setIsCustomRole(false);
                            }
                          }}
                          className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white appearance-none"
                        >
                          <option value="Project Admin">Project Admin</option>
                          <option value="Project Manager">Project Manager</option>
                          <option value="Product Owner">Product Owner</option>
                          <option value="Designer">Designer</option>
                          <option value="Developer">Developer</option>
                          <option value="Member">Member</option>
                          <option value="Other">Other / Custom...</option>
                        </select>
                      </div>
                      
                      {isCustomRole && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="relative"
                        >
                          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input 
                            name="customProjectRole"
                            value={customRole}
                            onChange={(e) => setCustomRole(e.target.value)}
                            required
                            className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-zinc-900 dark:text-white"
                            placeholder="Enter custom role..."
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      {editPhotoUrl ? (
                        <img src={editPhotoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          id="edit-team-photo-upload"
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
                                    setEditPhotoUrl(canvas.toDataURL('image/jpeg', 0.8));
                                  }
                                };
                                img.src = event.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label 
                          htmlFor="edit-team-photo-upload"
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
                          onClick={() => setEditPhotoUrl(url)}
                          className={cn(
                            "w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0",
                            editPhotoUrl === url ? "border-indigo-600 scale-110 shadow-sm" : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                          )}
                        >
                          <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4 shrink-0">
                  {editingMember && (
                    <div className="relative">
                      {deleteConfirmation === editingMember.id ? (
                        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-zinc-800 shadow-xl rounded-xl p-3 border border-zinc-200 dark:border-zinc-700 w-48 z-10">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white mb-2">Are you sure?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmation(null)}
                              className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(editingMember.id)}
                              className="flex-1 px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <button 
                        type="button"
                        onClick={() => setDeleteConfirmation(editingMember.id)}
                        className="px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 ml-auto">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddMemberOpen(false);
                        setEditingMember(null);
                        setEditPhotoUrl('');
                      }}
                      className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {editingMember ? 'Save Changes' : 'Add Member'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
