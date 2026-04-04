import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Personas } from './pages/Personas';
import { Intelligence } from './pages/Intelligence';
import { JourneyMaps } from './pages/JourneyMaps';

import { ProcessMaps } from './pages/ProcessMaps';
import { KanbanBoard } from './pages/KanbanBoard';
import { Backlog } from './pages/Backlog';
import { RaidLog } from './pages/RaidLog';
import { Settings } from './pages/Settings';
import { AuditLog } from './pages/AuditLog';
import { RecycleBin } from './pages/RecycleBin';
import { SprintManagement } from './pages/SprintManagement';
import { Welcome } from './pages/Welcome';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProjectTeam } from './pages/ProjectTeam';
import { Pricing } from './pages/Pricing';
import { BetaSignup } from './pages/BetaSignup';
import { AccountSettings } from './pages/AccountSettings';
import { TaskList } from './pages/TaskList';
import { OnboardingTour } from './components/OnboardingTour';
import { CompanyProfile } from './components/YourCompany';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { FeedbackModal } from './components/FeedbackModal';
import { NotificationsModal } from './components/NotificationsModal';
import { Menu, ChevronLeft, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { mockPersonas, mockJourneyMaps, mockTasks, mockProcessMaps, mockProducts, mockServices, mockProjects, mockUsers, mockSprints, mockStakeholders, mockProjectStakeholders } from './data/mockData';
import { Stakeholders } from './pages/Stakeholders';
import { StakeholderMapping } from './components/StakeholderMapping';
import { Persona, JourneyMap, Task, ProcessMap, Product, Service, Project, User, Sprint, RecycleBinItem, AuditEntry, Stakeholder, ProjectStakeholder } from './types';
import { PlanContext, PLAN_DETAILS, PlanType } from './context/PlanContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Login } from './pages/Login';
import { Logo } from './components/Logo';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, token, isLoading } = useAuth();
  console.log('AppContent: Rendering...', { user: user?.email, isLoading, hasToken: !!token });
  const [betaUser, setBetaUser] = useState<{name: string, email: string, plan: PlanType} | null>(null);
  
  // Determine plan
  const plan: PlanType = betaUser?.plan || 'professional';
  const planDetails = PLAN_DETAILS[plan];

  const [currentTab, setCurrentTab] = useState('welcome');
  const [history, setHistory] = useState<string[]>(['welcome']);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeProcessMapId, setActiveProcessMapId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: '',
    vertical: '',
    description: '',
    customerBenefits: '',
    targetEmotions: [],
    measurementMethods: [],
    pastAnalyses: []
  });

  // Global State
  const [personas, setPersonas] = useState<Persona[]>(mockPersonas);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [journeys, setJourneys] = useState<JourneyMap[]>(mockJourneyMaps);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [processMaps, setProcessMaps] = useState<ProcessMap[]>(mockProcessMaps);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [services, setServices] = useState<Service[]>(mockServices);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [sprints, setSprints] = useState<Sprint[]>(mockSprints);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(mockStakeholders);
  const [projectStakeholders, setProjectStakeholders] = useState<ProjectStakeholder[]>(mockProjectStakeholders);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>('proj1');
  const [newlyCreatedProjectId, setNewlyCreatedProjectId] = useState<string | null>(null);
  const [openNewProjectModal, setOpenNewProjectModal] = useState(false);
  const [openNewJourneyModal, setOpenNewJourneyModal] = useState(false);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [startPersonasInNewMode, setStartPersonasInNewMode] = useState(false);
  const [showPersonaPromptModal, setShowPersonaPromptModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ item: any, type: RecycleBinItem['type'], originalProjectId?: string } | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    console.log('App: Initializing WebSocket...');
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}`);

      socket.onopen = () => {
        console.log('App: WebSocket connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('App: WebSocket message received:', data.type);
          if (data.type === 'INITIAL_STATE') {
            const state = data.payload;
            if (state.personas?.length) setPersonas(state.personas);
            if (state.projects?.length) setProjects(state.projects);
            if (state.journeys?.length) setJourneys(state.journeys);
            if (state.tasks?.length) setTasks(state.tasks);
            if (state.processMaps?.length) setProcessMaps(state.processMaps);
            if (state.products?.length) setProducts(state.products);
            if (state.services?.length) setServices(state.services);
            if (state.stakeholders?.length) setStakeholders(state.stakeholders);
            if (state.projectStakeholders?.length) setProjectStakeholders(state.projectStakeholders);
            if (state.sprints?.length) setSprints(state.sprints);
            // Users are handled separately via /api/users but can be synced for UI updates
            if (state.users?.length) setUsers(state.users);
          } else if (data.type === 'COLLECTION_UPDATED') {
            const { collection, items } = data.payload;
            switch (collection) {
              case 'personas': setPersonas(items); break;
              case 'projects': setProjects(items); break;
              case 'journeys': setJourneys(items); break;
              case 'tasks': setTasks(items); break;
              case 'processMaps': setProcessMaps(items); break;
              case 'products': setProducts(items); break;
              case 'services': setServices(items); break;
              case 'stakeholders': setStakeholders(items); break;
              case 'projectStakeholders': setProjectStakeholders(items); break;
              case 'sprints': setSprints(items); break;
              case 'users': setUsers(items); break;
            }
          }
        } catch (err) {
          console.error('App: Failed to parse WebSocket message', err);
        }
      };

      socket.onerror = (error) => {
        console.error('App: WebSocket error:', error);
      };

      socket.onclose = () => {
        console.log('App: WebSocket disconnected');
      };

      setWs(socket);

      return () => {
        socket.close();
      };
    } catch (error) {
      console.error('App: Failed to initialize WebSocket:', error);
    }
  }, [user]);

  // Fetch users on load
  useEffect(() => {
    if (user) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(err => console.error('Failed to fetch users', err));
    }
  }, [user]);
  const syncCollection = useCallback((collection: string, items: any[]) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'UPDATE_COLLECTION',
        payload: { collection, items }
      }));
    }
  }, [ws]);

  // Wrappers for state setters to also sync
  const handleSetPersonas = useCallback((items: Persona[] | ((prev: Persona[]) => Persona[])) => {
    setPersonas(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('personas', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetProjects = useCallback((items: Project[] | ((prev: Project[]) => Project[])) => {
    setProjects(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('projects', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetJourneys = useCallback((items: JourneyMap[] | ((prev: JourneyMap[]) => JourneyMap[])) => {
    setJourneys(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('journeys', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetTasks = useCallback((items: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      const now = new Date().toISOString();
      const updatedItems = newItems.map(newItem => {
        const oldItem = prev.find(p => p.id === newItem.id);
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          return { ...newItem, updatedAt: now };
        }
        return newItem;
      });
      syncCollection('tasks', updatedItems);
      return updatedItems;
    });
  }, [syncCollection]);

  const handleSetProcessMaps = useCallback((items: ProcessMap[] | ((prev: ProcessMap[]) => ProcessMap[])) => {
    setProcessMaps(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('processMaps', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetProducts = useCallback((items: Product[] | ((prev: Product[]) => Product[])) => {
    setProducts(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('products', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetServices = useCallback((items: Service[] | ((prev: Service[]) => Service[])) => {
    setServices(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('services', newItems);
      return newItems;
    });
  }, [syncCollection]);
  
  const handleSetStakeholders = useCallback((items: Stakeholder[] | ((prev: Stakeholder[]) => Stakeholder[])) => {
    setStakeholders(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('stakeholders', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetProjectStakeholders = useCallback((items: ProjectStakeholder[] | ((prev: ProjectStakeholder[]) => ProjectStakeholder[])) => {
    setProjectStakeholders(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('projectStakeholders', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetSprints = useCallback((items: Sprint[] | ((prev: Sprint[]) => Sprint[])) => {
    setSprints(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('sprints', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const handleSetUsers = useCallback((items: User[] | ((prev: User[]) => User[])) => {
    setUsers(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      syncCollection('users', newItems);
      return newItems;
    });
  }, [syncCollection]);

  const currentUser: User | undefined = useMemo(() => user ? {
    id: user.id,
    name: user.name || 'User',
    email: user.email || '',
    role: user.role as User['role'],
    status: (user.status as User['status']) || 'Active',
    photoUrl: user.photoUrl
  } : undefined, [user]);

  const handleAddToAuditLog = useCallback((action: string, details: string, type: AuditEntry['type'], entityType?: string, entityId?: string) => {
    if (!currentUser) return;
    const newEntry: AuditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      type,
      entityType,
      entityId
    };
    setAuditLog(prev => [newEntry, ...prev]);
    syncCollection('auditLog', [newEntry, ...auditLog]);
  }, [currentUser, auditLog, syncCollection]);

  const handleDeleteItem = useCallback((item: any, type: RecycleBinItem['type'], originalProjectId?: string) => {
    setPendingDelete({ item, type, originalProjectId });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!pendingDelete || !currentUser) return;
    const { item, type, originalProjectId } = pendingDelete;
    
    const recycleItem: RecycleBinItem = {
      id: `del_${Date.now()}`,
      type,
      data: item,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser.name,
      originalProjectId
    };
    setRecycleBin(prev => [recycleItem, ...prev]);
    handleAddToAuditLog(`Deleted ${type}`, `Deleted ${item.name || item.title || item.id}`, 'Delete', type, item.id);
    
    // Remove from active state
    if (type === 'Project') setProjects(prev => prev.filter(p => p.id !== item.id));
    if (type === 'JourneyMap') setJourneys(prev => prev.filter(j => j.id !== item.id));
    if (type === 'Task') setTasks(prev => prev.filter(t => t.id !== item.id));
    if (type === 'ProcessMap') setProcessMaps(prev => prev.filter(pm => pm.id !== item.id));
    if (type === 'Persona') setPersonas(prev => prev.filter(p => p.id !== item.id));
    if (type === 'Stakeholder') setStakeholders(prev => prev.filter(s => s.id !== item.id));
    if (type === 'ProjectStakeholder') setProjectStakeholders(prev => prev.filter(ps => ps.id !== item.id));

    setPendingDelete(null);
  }, [currentUser, pendingDelete, handleAddToAuditLog]);

  const handleRestoreItem = useCallback((item: RecycleBinItem) => {
    setRecycleBin(prev => prev.filter(i => i.id !== item.id));
    
    if (item.type === 'Project') setProjects(prev => [...prev, item.data]);
    if (item.type === 'JourneyMap') setJourneys(prev => [...prev, item.data]);
    if (item.type === 'Task') setTasks(prev => [...prev, item.data]);
    if (item.type === 'ProcessMap') setProcessMaps(prev => [...prev, item.data]);
    if (item.type === 'Persona') setPersonas(prev => [...prev, item.data]);
    if (item.type === 'Stakeholder') setStakeholders(prev => [...prev, item.data]);
    if (item.type === 'ProjectStakeholder') setProjectStakeholders(prev => [...prev, item.data]);

    handleAddToAuditLog(`Restored ${item.type}`, `Restored ${item.data.name || item.data.title || item.data.id}`, 'Restore', item.type, item.data.id);
  }, [handleAddToAuditLog]);

  const handlePermanentlyDeleteItem = useCallback((itemId: string) => {
    setRecycleBin(prev => prev.filter(i => i.id !== itemId));
    handleAddToAuditLog('Permanently Deleted', `Permanently deleted item ${itemId}`, 'Delete');
  }, [handleAddToAuditLog]);

  const handleAddTeamMember = useCallback((user: User) => {
    if (!activeProjectId) return;
    
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const alreadyInTeam = p.team?.some(m => m.userId === user.id || m.name === user.name);
        if (alreadyInTeam) return p;

        const newMember = {
          id: `tm_${Date.now()}`,
          userId: user.id,
          name: user.name,
          photoUrl: user.photoUrl,
          jobTitle: user.role,
          projectRole: 'Member'
        };
        return { ...p, team: [...(p.team || []), newMember] };
      }
      return p;
    }));
    
    handleAddToAuditLog('Added Team Member', `Added ${user.name} to project team`, 'Create', 'Project', activeProjectId);
  }, [activeProjectId, handleAddToAuditLog]);

  const filteredJourneys = useMemo(() => activeProjectId 
    ? journeys.filter(j => j.projectId === activeProjectId)
    : journeys, [journeys, activeProjectId]);
  
  const filteredTasks = useMemo(() => activeProjectId
    ? tasks.filter(t => t.projectId === activeProjectId)
    : tasks, [tasks, activeProjectId]);

  const filteredProcessMaps = useMemo(() => activeProjectId
    ? processMaps.filter(pm => pm.projectId === activeProjectId)
    : processMaps, [processMaps, activeProjectId]);

  const filteredProjectStakeholders = useMemo(() => activeProjectId
    ? projectStakeholders.filter(ps => ps.projectId === activeProjectId)
    : [], [projectStakeholders, activeProjectId]);

  const handleTabChange = useCallback((tab: string, subTab?: string) => {
    if (tab === currentTab && !subTab) {
      if (tab === 'journeys') setActiveJourneyId(null);
      if (tab === 'tasks') setSelectedAssignee('all');
      setResetTrigger(prev => prev + 1);
      return;
    }
    if (tab === 'journeys') {
      setActiveJourneyId(null);
      if (subTab === 'new') {
        setOpenNewJourneyModal(true);
      }
    }
    if (tab === 'projects' && subTab === 'new') {
      setOpenNewProjectModal(true);
    }
    if (tab === 'intelligence' && subTab === 'edit-company') {
      setStartInEditMode(true);
    } else {
      setStartInEditMode(false);
    }
    if (tab === 'personas' && subTab === 'new') {
      setStartPersonasInNewMode(true);
    } else {
      setStartPersonasInNewMode(false);
    }
    if (tab === 'tasks' && subTab) {
      setSelectedAssignee(subTab);
    } else if (tab === 'tasks') {
      setSelectedAssignee('all');
    }
    setHistory(prev => [...prev, tab]);
    setCurrentTab(tab);
  }, [currentTab]);

  const handleBack = useCallback(() => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previousTab = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setCurrentTab(previousTab);
  }, [history]);

  const handleMentionClick = useCallback((type: 'task' | 'journey' | 'process', sourceId: string, projectId: string) => {
    setActiveProjectId(projectId);
    if (type === 'task') {
      setActiveTaskId(sourceId);
      handleTabChange('tasks');
    } else if (type === 'journey') {
      setActiveJourneyId(sourceId);
      handleTabChange('journeys');
    } else if (type === 'process') {
      setActiveProcessMapId(sourceId);
      handleTabChange('process_maps');
    }
  }, [handleTabChange]);

  const handleOpenJourney = useCallback((journeyId: string) => {
    setActiveJourneyId(journeyId);
    handleTabChange('journeys');
  }, [handleTabChange]);

  const handleSelectProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    handleTabChange('project_detail');
    if (projectId === 'proj_test') {
      setIsTourActive(true);
    }
  }, [handleTabChange]);

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

  const renderContent = () => {
    switch (currentTab) {
      case 'account':
        return <AccountSettings isDarkMode={isDarkMode} onNavigate={handleTabChange} users={users} setUsers={setUsers} projects={projects} />;
      case 'welcome':
        return <Welcome onNavigate={(tab, subTab) => {
          if (tab === 'projects' && subTab === 'new') {
            setOpenNewProjectModal(true);
            handleTabChange('projects');
          } else {
            handleTabChange(tab, subTab);
          }
        }} onSelectProject={handleSelectProject} userName={currentUser?.name} companyProfile={companyProfile} personas={personas} projects={projects} />;
      case 'dashboard':
        return (
          <Dashboard 
            personas={personas} 
            journeys={journeys} 
            tasks={tasks} 
            processMaps={processMaps} 
            projects={projects}
            onNavigate={handleTabChange}
            onSelectProject={handleSelectProject}
            onMentionClick={(type, sourceId, projectId) => {
              handleSelectProject(projectId);
              if (type === 'task') {
                handleTabChange('backlog');
              } else if (type === 'journey') {
                handleTabChange('journeys');
              } else if (type === 'process') {
                handleTabChange('processes');
              }
            }}
            currentUser={currentUser}
            users={users}
          />
        );
      case 'project_detail':
        if (activeProject) {
          return (
            <ProjectDetail 
              project={activeProject}
              projects={projects}
              setProjects={handleSetProjects}
              journeys={filteredJourneys}
              processMaps={filteredProcessMaps}
              tasks={filteredTasks}
              setTasks={handleSetTasks}
              personas={personas}
              onNavigate={handleTabChange}
              onOpenJourney={handleOpenJourney}
              products={products}
              services={services}
              isNewProject={newlyCreatedProjectId === activeProjectId}
              onOnboardingComplete={() => setNewlyCreatedProjectId(null)}
              currentUser={currentUser}
              users={users}
              setUsers={handleSetUsers}
              onDeleteItem={handleDeleteItem}
              isDarkMode={isDarkMode}
            />
          );
        }
        return (
          <Projects 
            projects={projects}
            setProjects={handleSetProjects}
            onOpenJourney={handleOpenJourney} 
            onSelectProject={handleSelectProject}
            onDeleteItem={handleDeleteItem}
            activeProjectId={activeProjectId}
            products={products}
            setProducts={setProducts}
            services={services}
            setServices={setServices}
            openNewProjectModal={openNewProjectModal}
            setOpenNewProjectModal={setOpenNewProjectModal}
            onProjectCreated={(id) => setNewlyCreatedProjectId(id)}
            journeys={journeys}
            processMaps={processMaps}
            tasks={tasks}
            personas={personas}
            users={users}
            setUsers={handleSetUsers}
          />
        );
      case 'project_team':
        if (!activeProject) return <Projects projects={projects} setProjects={handleSetProjects} onSelectProject={handleSelectProject} onOpenJourney={handleOpenJourney} onDeleteItem={handleDeleteItem} activeProjectId={activeProjectId} products={products} services={services} journeys={journeys} processMaps={processMaps} tasks={tasks} personas={personas} users={users} setUsers={handleSetUsers} />;
        return <ProjectTeam project={activeProject} projects={projects} setProjects={handleSetProjects} tasks={tasks} onNavigate={handleTabChange} users={users} setUsers={setUsers} currentUser={currentUser} />;
      case 'stakeholder_mapping':
        if (!activeProject) return <Projects projects={projects} setProjects={handleSetProjects} onSelectProject={handleSelectProject} onOpenJourney={handleOpenJourney} onDeleteItem={handleDeleteItem} activeProjectId={activeProjectId} products={products} services={services} journeys={journeys} processMaps={processMaps} tasks={tasks} personas={personas} users={users} setUsers={handleSetUsers} />;
        return (
          <StakeholderMapping 
            project={activeProject}
            globalStakeholders={stakeholders}
            projectStakeholders={projectStakeholders}
            setProjectStakeholders={handleSetProjectStakeholders}
            setGlobalStakeholders={handleSetStakeholders}
            onNavigate={handleTabChange}
          />
        );
      case 'projects':
        return (
          <Projects 
            projects={projects}
            setProjects={handleSetProjects}
            onOpenJourney={handleOpenJourney} 
            onSelectProject={handleSelectProject}
            onDeleteItem={handleDeleteItem}
            activeProjectId={activeProjectId}
            products={products}
            setProducts={setProducts}
            services={services}
            setServices={setServices}
            openNewProjectModal={openNewProjectModal}
            setOpenNewProjectModal={setOpenNewProjectModal}
            onProjectCreated={(id) => setNewlyCreatedProjectId(id)}
            journeys={journeys}
            processMaps={processMaps}
            tasks={tasks}
            personas={personas}
            users={users}
            setUsers={handleSetUsers}
          />
        );
      case 'intelligence':
        return <Intelligence 
          companyProfile={companyProfile} 
          onUpdateProfile={(updates) => setCompanyProfile(prev => ({ ...prev, ...updates }))} 
          startInEditMode={startInEditMode}
          onSaveComplete={() => {
            setShowPersonaPromptModal(true);
          }}
        />;
      case 'personas':
        return <Personas personas={personas} setPersonas={handleSetPersonas} startInNewMode={startPersonasInNewMode} isDarkMode={isDarkMode} onNavigate={handleTabChange} />;
      case 'stakeholders':
        return <Stakeholders stakeholders={stakeholders} setStakeholders={handleSetStakeholders} onDeleteItem={handleDeleteItem} />;
      case 'journeys':
        const journeyUsers = [...mockUsers];
        if (currentUser && !journeyUsers.some(u => u.email === currentUser.email)) {
          journeyUsers.push(currentUser);
        }
        return (
          <JourneyMaps 
            journeys={filteredJourneys}
            setJourneys={handleSetJourneys}
            products={activeProject?.products || products}
            services={activeProject?.services || services}
            personas={personas}
            projects={projects}
            initialJourneyId={activeJourneyId} 
            onNavigateToProcessMap={(processMapId) => {
              if (processMapId) {
                // We could set active process map here if we had state for it
              }
              setCurrentTab('process_maps');
            }} 
            onNavigateToPersonas={() => setCurrentTab('personas')}
            activeProjectId={activeProjectId}
            onAddTask={(task) => handleSetTasks(prev => [...prev, task])}
            openNewJourneyModal={openNewJourneyModal}
            setOpenNewJourneyModal={setOpenNewJourneyModal}
            processMaps={filteredProcessMaps}
            setProcessMaps={handleSetProcessMaps}
            currentUser={currentUser}
            onDeleteItem={handleDeleteItem}
            users={journeyUsers}
          />
        );
      case 'process_maps':
        const processUsers = [...mockUsers];
        if (currentUser && !processUsers.some(u => u.email === currentUser.email)) {
          processUsers.push(currentUser);
        }
        return <ProcessMaps processMaps={filteredProcessMaps} setProcessMaps={handleSetProcessMaps} activeProjectId={activeProjectId} journeys={journeys} currentUser={currentUser} projects={projects} onDeleteItem={handleDeleteItem} users={processUsers} initialProcessMapId={activeProcessMapId} />;
      case 'kanban':
        if (!activeProject) return <Projects projects={projects} setProjects={handleSetProjects} onSelectProject={handleSelectProject} onOpenJourney={handleOpenJourney} onDeleteItem={handleDeleteItem} activeProjectId={activeProjectId} products={products} services={services} journeys={journeys} processMaps={processMaps} tasks={tasks} />;
        
        return (
          <KanbanBoard 
            project={activeProject} 
            setProjects={handleSetProjects} 
            tasks={tasks} 
            setTasks={handleSetTasks} 
            onNavigate={handleTabChange} 
            currentUser={currentUser}
            onDeleteItem={handleDeleteItem}
            onAddTeamMember={handleAddTeamMember}
            users={users}
            activeTaskId={activeTaskId}
          />
        );
      case 'backlog':
        if (!activeProject) return <Projects projects={projects} setProjects={handleSetProjects} onSelectProject={handleSelectProject} onOpenJourney={handleOpenJourney} onDeleteItem={handleDeleteItem} activeProjectId={activeProjectId} products={products} services={services} journeys={journeys} processMaps={processMaps} tasks={tasks} />;
        
        return (
          <Backlog 
            project={activeProject} 
            setProjects={handleSetProjects}
            tasks={tasks} 
            setTasks={handleSetTasks} 
            onNavigate={handleTabChange} 
            currentUser={currentUser}
            onDeleteItem={handleDeleteItem}
            onAddTeamMember={handleAddTeamMember}
            users={users}
          />
        );
      case 'raid':
        if (!activeProject) return <Projects projects={projects} setProjects={handleSetProjects} onSelectProject={handleSelectProject} onOpenJourney={handleOpenJourney} onDeleteItem={handleDeleteItem} activeProjectId={activeProjectId} products={products} services={services} journeys={journeys} processMaps={processMaps} tasks={tasks} />;
        
        const allUsers = [...mockUsers];
        if (currentUser && !allUsers.some(u => u.email === currentUser.email)) {
          allUsers.push(currentUser);
        }
        
        return <RaidLog project={activeProject} setProjects={handleSetProjects} users={allUsers} />;

      case 'tasks':
        return (
          <TaskList 
            tasks={tasks} 
            projects={projects} 
            initialAssigneeId={selectedAssignee || 'all'}
            initialProjectId={activeProjectId || 'all'}
            onNavigate={handleTabChange}
            onUpdateTask={(updatedTask) => handleSetTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))}
            onDeleteItem={handleDeleteItem}
            onAddTeamMember={handleAddTeamMember}
            currentUser={currentUser}
            users={users}
          />
        );
      case 'settings':
        return (
          <Settings 
            projects={projects}
            setProjects={handleSetProjects}
            products={products} 
            setProducts={setProducts} 
            services={services} 
            setServices={setServices} 
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            companyProfile={companyProfile}
            onUpdateProfile={(updates) => setCompanyProfile(prev => ({ ...prev, ...updates }))}
            users={users}
            setUsers={handleSetUsers}
            currentUser={currentUser}
            onDeleteItem={handleDeleteItem}
          />
        );
      case 'audit_log':
        return <AuditLog currentUser={currentUser} entries={auditLog} />;
      case 'recycle_bin':
        return (
          <RecycleBin 
            items={recycleBin} 
            onRestore={handleRestoreItem} 
            onPermanentlyDelete={handlePermanentlyDeleteItem}
            onNavigateBack={() => setCurrentTab('settings')}
          />
        );
      case 'sprints':
        return (
          <SprintManagement 
            projects={projects} 
            tasks={tasks} 
            users={users} 
            sprints={sprints} 
            setSprints={handleSetSprints} 
            activeProjectId={activeProjectId}
          />
        );
      case 'pricing':
        return <Pricing />;
      default:
        return (
          <Dashboard 
            personas={personas} 
            journeys={journeys} 
            tasks={tasks} 
            processMaps={processMaps} 
            projects={projects}
            onNavigate={handleTabChange}
            onSelectProject={handleSelectProject}
            onMentionClick={(type, sourceId, projectId) => {
              handleSelectProject(projectId);
              if (type === 'task') {
                handleTabChange('backlog');
              } else if (type === 'journey') {
                handleTabChange('journeys');
              } else if (type === 'process') {
                handleTabChange('processes');
              }
            }}
            currentUser={currentUser}
            users={users}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <PlanContext.Provider value={{ plan, details: planDetails }}>
      <div className={cn(
        "flex h-screen font-sans overflow-hidden transition-colors duration-300",
        isDarkMode ? "dark bg-[#09090b] text-zinc-100" : "bg-zinc-50 text-zinc-900"
      )}>
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={handleTabChange} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeProject={activeProject}
          isDarkMode={isDarkMode}
          companyProfile={companyProfile}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          unreadNotificationsCount={unreadCount}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className={cn(
            "h-16 border-b flex items-center px-4 lg:hidden shrink-0 z-40 transition-colors",
            isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDarkMode ? "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              )}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Logo className="h-10 ml-3" />
          </header>
          <main className={`flex-1 overflow-y-auto relative ${history.length > 1 ? 'pt-16' : ''}`}>
            {history.length > 1 && (
              <div className="absolute top-4 left-4 z-50">
                <button 
                  onClick={handleBack}
                  className={cn(
                    "p-2 border rounded-lg shadow-sm transition-all flex items-center gap-1 text-sm font-medium backdrop-blur-sm",
                    isDarkMode 
                      ? "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" 
                      : "bg-white/90 border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-white"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            )}
            <React.Fragment key={`${currentTab}-${resetTrigger}`}>
              {renderContent()}
            </React.Fragment>
          </main>
          <OnboardingTour 
            isActive={isTourActive} 
            onClose={() => setIsTourActive(false)} 
            onNavigate={handleTabChange}
            currentTab={currentTab}
          />

          <DeleteConfirmationModal
            isOpen={!!pendingDelete}
            title="Confirm Deletion"
            message={`Are you sure you want to delete this ${pendingDelete?.type}? It will be moved to the Recycle Bin.`}
            onConfirm={confirmDelete}
            onCancel={() => setPendingDelete(null)}
          />

          <GeminiChatbot 
            onNavigate={handleTabChange} 
            contextData={{
              activeProject: projects.find(p => p.id === activeProjectId),
              tasks: tasks.filter(t => t.projectId === activeProjectId),
              personas: personas,
              journeys: journeys,
              stakeholders: stakeholders,
              projectStakeholders: projectStakeholders.filter(ps => ps.projectId === activeProjectId)
            }}
          />
          <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
          
          <NotificationsModal
            isOpen={isNotificationsModalOpen}
            onClose={() => setIsNotificationsModalOpen(false)}
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            isDarkMode={isDarkMode}
          />

          <AnimatePresence>
            {showPersonaPromptModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Company Profile Saved!</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Great job setting up your company information. The next step is to create your first customer persona.
                    </p>
                    <div className="pt-4 flex gap-3">
                      <button
                        onClick={() => setShowPersonaPromptModal(false)}
                        className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Maybe Later
                      </button>
                      <button
                        onClick={() => {
                          setShowPersonaPromptModal(false);
                          handleTabChange('personas', 'new');
                        }}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                      >
                        Create Persona
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PlanContext.Provider>
  );
}

