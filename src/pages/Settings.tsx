import React, { useState } from 'react';
import { Settings as SettingsIcon, Package, Layers, Building2, Users, Plus, Trash2, Save, Shield, Mail, Bell, Moon, Globe, Upload, User as UserIcon, CreditCard, CheckCircle2, ArrowUpCircle, History, Download, Edit2, X, Sparkles, Database, Recycle } from 'lucide-react';
import { Product, Service, User, Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { CompanyProfile, YourCompany } from '../components/YourCompany';
import { AI_MODEL_EXPLANATIONS, AI_TOKEN_PRICING } from '../lib/aiConfig';
import { ContextualHelp } from '../components/ContextualHelp';
import { PRESET_AVATARS } from '../constants';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useAiUsage } from '../context/AiUsageContext';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  companyProfile?: CompanyProfile;
  onUpdateProfile?: (updates: Partial<CompanyProfile>) => void;
  users: User[];
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  currentUser?: User | null;
  onDeleteItem?: (item: any, type: any) => void;
  initialSection?: 'general' | 'users' | 'billing';
}

export function Settings({ projects, setProjects, products, setProducts, services, setServices, isDarkMode, setIsDarkMode, companyProfile, onUpdateProfile, users, setUsers, currentUser, onDeleteItem, initialSection }: SettingsProps) {
  const { updateUser } = useAuth();
  const { tokensUsed, tokensLimit, addTokens } = useAiUsage();
  const [activeSection, setActiveSection] = useState<'general' | 'users' | 'billing' | 'ai_models' | 'recycle_bin'>(initialSection || 'general');

  React.useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    language: 'English (US)',
    notifications: true,
    autoSave: true
  });

  // User Management State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Viewer', password: 'password123', photoUrl: '' });
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddUser = async () => {
    if (newUser.name && newUser.email) {
      if (!validateEmail(newUser.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('Server returned an unexpected response format.');
        }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create user');
        }
        
        const createdUser = await res.json();
        setUsers(prev => [...prev, createdUser]);
        
        if (selectedProjectIds.length > 0) {
          setProjects(prev => prev.map(p => {
            if (selectedProjectIds.includes(p.id)) {
              return {
                ...p,
                team: [...(p.team || []), {
                  id: uuidv4(),
                  userId: createdUser.id,
                  name: createdUser.name,
                  jobTitle: createdUser.role || 'Team Member',
                  projectRole: 'Member',
                  photoUrl: createdUser.photoUrl || `https://ui-avatars.com/api/?name=${createdUser.name.replace(/\s+/g, '+')}&background=random`
                }]
              };
            }
            return p;
          }));
        }

        setNewUser({ name: '', email: '', role: 'Viewer', password: 'password123', photoUrl: '' });
        setSelectedProjectIds([]);
        setIsAddUserModalOpen(false);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleEditUser = async () => {
    if (editingUser && editingUser.name && editingUser.email) {
      if (!validateEmail(editingUser.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      try {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingUser)
        });
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error('Server returned an unexpected response format.');
        }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update user');
        }
        
        setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
        
        setProjects(prev => prev.map(p => {
          const isSelected = selectedProjectIds.includes(p.id);
          const isCurrentlyInTeam = (p.team || []).some(m => m.userId === editingUser.id);
          
          if (isSelected && !isCurrentlyInTeam) {
            return {
              ...p,
              team: [...(p.team || []), {
                id: uuidv4(),
                userId: editingUser.id,
                name: editingUser.name,
                jobTitle: editingUser.role || 'Team Member',
                projectRole: 'Member',
                photoUrl: editingUser.photoUrl || `https://ui-avatars.com/api/?name=${editingUser.name.replace(/\s+/g, '+')}&background=random`
              }]
            };
          } else if (!isSelected && isCurrentlyInTeam) {
            return {
              ...p,
              team: (p.team || []).filter(m => m.userId !== editingUser.id)
            };
          } else if (isCurrentlyInTeam) {
             return {
               ...p,
               team: (p.team || []).map(m => m.userId === editingUser.id ? { 
                 ...m, 
                 name: editingUser.name,
                 jobTitle: editingUser.role || 'Team Member',
                 photoUrl: editingUser.photoUrl || `https://ui-avatars.com/api/?name=${editingUser.name.replace(/\s+/g, '+')}&background=random`
               } : m)
             }
          }
          return p;
        }));

        setIsEditUserModalOpen(false);
        setEditingUser(null);
        setSelectedProjectIds([]);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (user && onDeleteItem) {
      onDeleteItem(user, 'User');
    } else {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setUsers(prev => prev.filter(u => u.id !== id));
        }
      } catch (err) {
        console.error('Failed to delete user', err);
      }
    }
  };

  const toggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, status: newStatus })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      console.error('Failed to update user status', err);
    }
  };

  const addProduct = () => {
    const name = 'New Product';
    setProducts([...products, { id: uuidv4(), name, description: '' }]);
  };

  const addService = (productId: string) => {
    const name = 'New Service';
    setServices([...services, { id: uuidv4(), productId, name, description: '' }]);
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product && onDeleteItem) {
      onDeleteItem(product, 'Product');
    } else {
      setProducts(products.filter(p => p.id !== id));
      setServices(services.filter(s => s.productId !== id));
    }
  };

  const deleteService = (id: string) => {
    const service = services.find(s => s.id === id);
    if (service && onDeleteItem) {
      onDeleteItem(service, 'Service');
    } else {
      setServices(services.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 transition-colors duration-300">
      <ContextualHelp 
        title="Settings" 
        description="Configure your workspace. Manage your product and service taxonomy, company profile, and team access to ensure everyone is working with the same context."
      />
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white  tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-zinc-400  dark:text-zinc-400" />
          Settings
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your CX program configuration and team.</p>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'general', label: 'General', icon: Globe },
          { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
          { id: 'billing', label: 'Subscription & Billing', icon: CreditCard, adminOnly: true },
          { id: 'ai_models', label: 'AI Models & Usage', icon: Sparkles, adminOnly: true },
          { id: 'recycle_bin', label: 'Recycle Bin', icon: Recycle, adminOnly: true },
        ].filter(s => !s.adminOnly || currentUser?.role === 'Admin').map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeSection === section.id 
                ? (isDarkMode ? 'border-white text-white' : 'border-zinc-900 text-zinc-900 dark:text-white')
                : (isDarkMode ? 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-300 hover:border-zinc-700' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-200 hover:border-zinc-300')
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {activeSection === 'general' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Profile Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-zinc-400" />
                  My Profile
                </h3>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Profile Photo</label>
                    <div className="relative group">
                      <button 
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="relative block rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg transition-transform hover:scale-105"
                      >
                        {currentUser?.photoUrl ? (
                          <img src={currentUser.photoUrl} alt="Profile" className="w-24 h-24 object-cover" />
                        ) : (
                          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <UserIcon className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Edit2 className="w-6 h-6 text-white" />
                        </div>
                      </button>
                      <div className="absolute bottom-0 right-0 p-2 bg-zinc-900 text-white rounded-full shadow-lg pointer-events-none">
                        <Upload className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                        <input 
                          type="text"
                          value={currentUser?.name || ''}
                          onChange={(e) => {
                            const newName = e.target.value;
                            updateUser({ name: newName });
                            setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, name: newName } : u));
                          }}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none font-bold text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                        <input 
                          type="email"
                          value={currentUser?.email || ''}
                          disabled
                          className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Dark Mode</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Switch between light and dark themes.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Notifications</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Receive alerts for journey updates.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setGeneralSettings({...generalSettings, notifications: !generalSettings.notifications})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${generalSettings.notifications ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 transition-all ${generalSettings.notifications ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Language</label>
                  <select 
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 outline-none transition-all text-sm"
                  >
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm">
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'users' && currentUser?.role === 'Admin' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-zinc-900 dark:text-white">Team Members</h3>
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Invite User
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 overflow-hidden">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <Shield className="w-4 h-4 text-zinc-400" />
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleUserStatus(user)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider cursor-pointer hover:opacity-80 ${
                          user.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingUser(user);
                            setSelectedProjectIds(projects.filter(p => (p.team || []).some(m => m.userId === user.id)).map(p => p.id));
                            setIsEditUserModalOpen(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSection === 'billing' && currentUser?.role === 'Admin' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Current Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    Current Plan
                  </div>
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">Enterprise Pro</h3>
                  <p className="text-zinc-500 dark:text-zinc-400">Your plan renews on <span className="font-bold text-zinc-900 dark:text-white">April 12, 2026</span></p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-zinc-900 dark:text-white">$499<span className="text-lg text-zinc-500 font-normal">/mo</span></p>
                  <p className="text-sm text-zinc-500">Billed annually</p>
                </div>
              </div>
              
              <div className="bg-indigo-600 rounded-2xl p-8 text-white flex flex-col justify-between shadow-lg shadow-indigo-500/20">
                <div className="space-y-2">
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Next Payment</p>
                  <p className="text-3xl font-bold">$499.00</p>
                </div>
                <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors mt-4">
                  Manage Billing
                </button>
              </div>
            </div>

            {/* Usage Metrics */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-zinc-400" />
                  Usage & Limits
                </h3>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Active Projects</p>
                      <p className="text-xs text-zinc-500">{projects.length} of 20 projects used</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{Math.round((projects.length / 20) * 100)}%</p>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min((projects.length / 20) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Tokens (Monthly)</p>
                      <p className="text-xs text-zinc-500">{tokensUsed.toLocaleString()} of {tokensLimit.toLocaleString()} used</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{((tokensUsed / tokensLimit) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min((tokensUsed / tokensLimit) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Team Members</p>
                      <p className="text-xs text-zinc-500">{users.length} of 15 seats occupied</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{Math.round((users.length / 15) * 100)}%</p>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((users.length / 15) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Storage Space</p>
                      <p className="text-xs text-zinc-500">4.2 GB of 10 GB used</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">42%</p>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Options */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Starter', price: '0', features: ['Up to 3 projects', 'Basic analytics', 'Community support'], current: false },
                  { name: 'Professional', price: '99', features: ['Up to 10 projects', 'Advanced AI insights', 'Priority support', 'Custom taxonomy'], current: false },
                  { name: 'Enterprise Pro', price: '499', features: ['Unlimited projects', 'Full AI suite', 'Dedicated manager', 'SSO & Security'], current: true },
                ].map((plan) => (
                  <div key={plan.name} className={cn(
                    "bg-white dark:bg-zinc-900 rounded-2xl border p-8 space-y-6 transition-all",
                    plan.current ? "border-indigo-600 ring-4 ring-indigo-600/10 scale-105 z-10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                  )}>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.name}</h4>
                      <p className="text-3xl font-bold text-zinc-900 dark:text-white">${plan.price}<span className="text-sm text-zinc-500 font-normal">/mo</span></p>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button className={cn(
                      "w-full py-3 rounded-xl font-bold transition-all",
                      plan.current 
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default" 
                        : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-md"
                    )}>
                      {plan.current ? 'Current Plan' : 'Upgrade Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-400" />
                  Billing History
                </h3>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {[
                    { id: 'INV-2026-003', date: 'Mar 12, 2026', amount: '$499.00', status: 'Paid' },
                    { id: 'INV-2026-002', date: 'Feb 12, 2026', amount: '$499.00', status: 'Paid' },
                    { id: 'INV-2026-001', date: 'Jan 12, 2026', amount: '$499.00', status: 'Paid' },
                  ].map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white">{invoice.id}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{invoice.date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'ai_models' && currentUser?.role === 'Admin' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  AI Models & Usage
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Our platform utilizes different enterprise-ready AI models depending on the complexity of the task to ensure the best balance between speed, reasoning capability, and token consumption limits.
                </p>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 p-4 rounded-lg flex items-start gap-3">
                  <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Enterprise Grade Security & Compliance</p>
                    <p>Both Gemini models are running on secure infrastructure with strict data privacy controls. You're always accessing the most recently released capability.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {AI_MODEL_EXPLANATIONS.map(model => (
                    <div key={model.alias} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50 dark:bg-zinc-900/50">
                      <h4 className="font-bold text-zinc-900 dark:text-white mb-2">{model.name}</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{model.description}</p>
                      <div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Used For:</span>
                        <ul className="mt-2 space-y-2">
                          {model.useCases.map((useCase, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              {useCase}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-zinc-400" />
                  Token Usage Metrics
                </h3>
              </div>
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">AI Tokens (Monthly)</p>
                      <p className="text-xs text-zinc-500">{tokensUsed.toLocaleString()} of {tokensLimit.toLocaleString()} used</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{((tokensUsed / tokensLimit) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min((tokensUsed / tokensLimit) * 100, 100)}%` }} />
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 p-3 rounded-lg">
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                      <span className="font-bold">How usage is tracked:</span> {AI_TOKEN_PRICING.tracking} 
                      <br /><br />
                      <span className="font-bold">Usage Multiplier:</span> Pro models consume {AI_TOKEN_PRICING.multiplier.pro}x tokens per request due to their significantly higher reasoning costs and compute requirements.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="max-w-4xl">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Purchase Additional Tokens</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">+10,000 Tokens</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">$49</span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-4">Great for small bursts of complex generative tasks.</p>
                      <button 
                        onClick={() => addTokens(10000)}
                        className="w-full py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-medium rounded-lg transition-colors">
                        Buy Now
                      </button>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-500/50 dark:border-indigo-500/50 rounded-xl p-5 relative cursor-pointer group">
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Most Popular
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">+50,000 Tokens</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">$199</span>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Save $46</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mb-4">Recommended for teams with active ongoing projects.</p>
                      <button 
                        onClick={() => addTokens(50000)}
                        className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                        Buy Now
                      </button>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">+250,000 Tokens</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">$799</span>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Save $426</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mb-4">For heavy usage and constant platform interaction.</p>
                      <button 
                        onClick={() => addTokens(250000)}
                        className="w-full py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-medium rounded-lg transition-colors">
                        Buy Now
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                      Tokens rollover month-to-month and never expire. Need customized AI limits? <a href="#" className="flex-1 text-indigo-600 dark:text-indigo-400 hover:underline">Contact Sales</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}

        {activeSection === 'recycle_bin' && currentUser?.role === 'Admin' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Recycle className="w-5 h-5 text-zinc-400" />
                  Recycle Bin
                </h3>
              </div>
              <div className="p-16 text-center text-zinc-500 dark:text-zinc-400 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <Recycle className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">The recycle bin is empty</h4>
                <p className="max-w-md">Deleted projects, personas, journeys and tasks will appear here for 30 days before permanent deletion.</p>
              </div>
             </div>
          </div>
        )}

        {/* Add User Modal */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Invite User</h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Name</label>
                  <input 
                    type="text" 
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email</label>
                  <input 
                    type="email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Password</label>
                  <input 
                    type="password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Role</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="User">User</option>
                    <option value="Project Admin">Project Admin</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {newUser.role !== 'Admin' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Project Access</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar border border-zinc-200 dark:border-zinc-700 rounded-lg p-2">
                      {projects.map(project => (
                        <label key={project.id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProjectIds.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjectIds([...selectedProjectIds, project.id]);
                              } else {
                                setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">{project.name}</span>
                        </label>
                      ))}
                      {projects.length === 0 && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 p-2 text-center">No projects available</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {newUser.photoUrl ? (
                      <img src={newUser.photoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-zinc-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="user-photo-upload"
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewUser({ ...newUser, photoUrl: event.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="user-photo-upload"
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
                        onClick={() => setNewUser({ ...newUser, photoUrl: url })}
                        className={cn(
                          "w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0",
                          newUser.photoUrl === url ? "border-indigo-600 scale-110 shadow-sm" : "border-transparent hover:border-zinc-300"
                        )}
                      >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit User Modal */}
        {isEditUserModalOpen && editingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Edit User</h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Name</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="User">User</option>
                    <option value="Project Admin">Project Admin</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {editingUser.role !== 'Admin' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Project Access</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar border border-zinc-200 dark:border-zinc-700 rounded-lg p-2">
                      {projects.map(project => (
                        <label key={project.id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedProjectIds.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjectIds([...selectedProjectIds, project.id]);
                              } else {
                                setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">{project.name}</span>
                        </label>
                      ))}
                      {projects.length === 0 && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 p-2 text-center">No projects available</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {editingUser.photoUrl ? (
                      <img src={editingUser.photoUrl} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        id="edit-photo-upload"
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEditingUser({...editingUser, photoUrl: event.target?.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="edit-photo-upload"
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
                        onClick={() => setEditingUser({...editingUser, photoUrl: url})}
                        className={cn(
                          "w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0",
                          editingUser.photoUrl === url ? "border-indigo-600 scale-110 shadow-sm" : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                        )}
                      >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setEditingUser(null);
                    setError(null);
                  }}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditUser}
                  disabled={!editingUser.name}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Avatar Selection Modal */}
        <AnimatePresence>
          {isAvatarModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsAvatarModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
              >
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Choose Profile Photo</h3>
                    </div>
                    <button 
                      onClick={() => setIsAvatarModalOpen(false)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Upload Custom Photo</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="file" 
                          id="avatar-upload"
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const url = event.target?.result as string;
                                updateUser({ photoUrl: url });
                                setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, photoUrl: url } : u));
                                setIsAvatarModalOpen(false);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label 
                          htmlFor="avatar-upload"
                          className="flex-1 flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                        >
                          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:scale-110 transition-transform rounded-full">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">Click to upload photo</p>
                            <p className="text-xs text-zinc-500">PNG, JPG or GIF up to 2MB</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Choose an Avatar</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                        {PRESET_AVATARS.map((url, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              updateUser({ photoUrl: url });
                              setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, photoUrl: url } : u));
                              setIsAvatarModalOpen(false);
                            }}
                            className={cn(
                              "aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105",
                              currentUser?.photoUrl === url ? "border-zinc-900 shadow-lg" : "border-transparent hover:border-zinc-300"
                            )}
                          >
                            <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
