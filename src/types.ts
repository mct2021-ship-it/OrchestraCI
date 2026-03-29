export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  status: 'Active' | 'Inactive';
  projectIds?: string[];
}

export interface DemographicSlider {
  id: string;
  label: string;
  value: number; // 0 to 100
}

export interface UserStory {
  id: string;
  asA: string;
  iWant: string;
  soThat: string;
}

export interface CustomSection {
  title: string;
  text: string;
}

export interface Persona {
  id: string;
  name: string;
  type?: string;
  role: string;
  age: number;
  gender?: 'Male' | 'Female' | 'Non-binary';
  quote: string;
  goals: string[];
  frustrations: string[];
  motivations?: string[];
  imageUrl: string;
  demographics: DemographicSlider[];
  sentiment?: number;
  isTemplate?: boolean;
  isDefaultTemplate?: boolean;
  userStories?: UserStory[];
  customSection?: CustomSection;
}

export interface Swimlane {
  id: string;
  name: string;
  type: 'text-list' | 'emotion' | 'pictures';
  colorTheme: 'blue' | 'rose' | 'amber' | 'emerald' | 'zinc' | 'indigo' | 'purple';
  icon?: string;
  isHidden?: boolean;
}

export interface JourneyStage {
  id: string;
  name: string;
  icon?: string;
  emotion: number; // 1 to 5
  laneData: Record<string, string[]>; // Maps swimlane.id to an array of text items
  carbonData?: Record<string, number[]>; // Maps swimlane.id to an array of carbon values (kg CO2e)
}

export interface Product {
  id: string;
  name: string;
  description: string;
}

export interface Service {
  id: string;
  productId: string;
  name: string;
  description: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface JourneyMap {
  id: string;
  projectId: string;
  productId?: string;
  serviceId?: string;
  title: string;
  personaId: string;
  state: 'Current' | 'Proposed' | 'Implemented';
  status?: 'Draft' | 'In Progress' | 'Complete';
  archived?: boolean;
  satisfaction: {
    metric: 'NPS' | 'CSAT' | '% Satisfied';
    value: number;
  };
  carbonFootprint?: number; // Total estimated carbon (kg CO2e)
  swimlanes: Swimlane[];
  stages: JourneyStage[];
  comments?: Comment[];
}

export interface ImprovementFocus {
  metric: string;
  target: string;
}

export interface TeamMember {
  id: string;
  userId?: string; // Linked account ID
  name: string;
  photoUrl?: string;
  jobTitle: string;
  projectRole: string; // Predefined or custom
}

export interface RecycleBinItem {
  id: string;
  type: 'Project' | 'JourneyMap' | 'Task' | 'ProcessMap' | 'Persona' | 'RAIDItem' | 'Product' | 'Service' | 'TeamMember' | 'Stakeholder' | 'ProjectStakeholder';
  data: any;
  deletedAt: string;
  deletedBy: string;
  originalProjectId?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'Create' | 'Update' | 'Delete' | 'Restore' | 'Login';
  entityType?: string;
  entityId?: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  number: number;
  name: string;
  goal?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'In Progress' | 'Done' | 'Not Started';
  stage?: 'Discover' | 'Define' | 'Develop' | 'Deliver' | 'Done' | 'Archived';
  tasks?: string[]; // IDs of tasks in this sprint
  report?: string; // Generated report content
}

export interface RAIDItem {
  id: string;
  type: 'Risk' | 'Assumption' | 'Issue' | 'Dependency';
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  probability?: 'High' | 'Medium' | 'Low';
  mitigation?: string;
  resolution?: string;
  owner?: string;
  status: 'Open' | 'Mitigated' | 'Closed' | 'Resolved';
  customFields?: Record<string, string>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
}

export interface SprintSnapshot {
  sprintNumber: number;
  name: string;
  description?: string;
  completedAt: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  purpose: string;
  goals: string[];
  expectedOutcomes: string[];
  taxonomy: string[];
  status: 'Discover' | 'Define' | 'Develop' | 'Deliver' | 'Done' | 'Archived';
  useDoubleDiamond?: boolean;
  updatedAt: string;
  improvementFocus?: ImprovementFocus[];
  personaIds?: string[];
  products?: Product[];
  services?: Service[];
  archived?: boolean;
  team?: TeamMember[];
  risks?: RAIDItem[];
  raidCustomFields?: string[];
  kanbanColumns?: KanbanColumn[];
  features?: {
    processMaps: boolean;
    raidLog: boolean;
    sprints: boolean;
    insights: boolean;
  };
  currentSprint?: number;
  currentSprintDescription?: string;
  sprintSnapshots?: SprintSnapshot[];
  sprints?: Sprint[];
}

export interface TaskStageHistory {
  stage: string;
  enteredAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  notes?: string;
  status: 'Discover' | 'Define' | 'Develop' | 'Deliver' | 'Done' | 'Archived';
  kanbanStatus: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'High' | 'Medium' | 'Low';
  estimation?: number; // Story points
  sprint?: string;
  moscow?: 'Must' | 'Should' | 'Could' | 'Wont';
  metrics?: {
    experience?: string;
    efficiency?: string;
    timeSaved?: string;
    moneySaved?: string;
  };
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  acceptanceCriteria?: string;
  showEstimation?: boolean;
  stageHistory?: TaskStageHistory[];
  sourceJourneyId?: string;
  sourceOpportunityId?: string;
  archived?: boolean;
  blockerDescription?: string;
  unblockActions?: string;
  comments?: Comment[];
}

export interface ProcessNode {
  id: string;
  type?: string;
  data: { 
    label: string; 
    description?: string;
    branches?: { id: string; label: string; targetNodeId?: string }[];
  };
  position: { x: number; y: number };
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ProcessMap {
  id: string;
  projectId: string;
  title: string;
  journeyId?: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  archived?: boolean;
  comments?: Comment[];
}

export interface Stakeholder {
  id: string;
  name: string;
  category: string;
  organization?: string;
  email?: string;
  about?: string;
  isGlobal: boolean;
}

export interface StakeholderSentiment {
  date: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  note?: string;
}

export interface ProjectStakeholder extends Stakeholder {
  projectId: string;
  power: number; // 0-100
  interest: number; // 0-100
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentHistory: StakeholderSentiment[];
  engagementStrategy: string;
  linkedItems: { type: 'Journey' | 'Process' | 'Risk' | 'Task'; id: string }[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeminiChatbotProps {
  onNavigate?: (tab: string, subTab?: string) => void;
  contextData?: {
    activeProject?: any;
    tasks?: any[];
    personas?: any[];
    journeys?: any[];
    stakeholders?: any[];
    projectStakeholders?: any[];
  };
}



