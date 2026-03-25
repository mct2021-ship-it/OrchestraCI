import { Persona, JourneyMap, Task, Project, Swimlane, Product, Service, ProcessMap, User, Sprint, Stakeholder, ProjectStakeholder } from '../types';

export const mockSprints: Sprint[] = [
  {
    id: 'sprint_test_1',
    projectId: 'proj_test',
    number: 1,
    name: 'Sprint 1',
    goal: 'Explore the platform features',
    startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 12).toISOString(),
    status: 'Active',
    tasks: ['i_test1']
  },
  {
    id: 'sprint1_1',
    projectId: 'proj1',
    number: 1,
    name: 'Sprint 1',
    goal: 'Initial onboarding improvements',
    startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 9).toISOString(),
    status: 'Active',
    tasks: ['i1', 'i2']
  },
  {
    id: 'sprint2_1',
    projectId: 'proj2',
    number: 1,
    name: 'Sprint 1',
    goal: 'Consolidate communications',
    startDate: new Date(Date.now() - 86400000 * 14).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'Completed',
    tasks: ['i3']
  }
];

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Admin',
    photoUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=random',
    status: 'Active'
  },
  {
    id: 'u2',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Editor',
    photoUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
    status: 'Active'
  },
  {
    id: 'u3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Viewer',
    photoUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
    status: 'Inactive'
  }
];

export const mockProducts: Product[] = [
  { id: 'prod1', name: 'Enterprise Suite', description: 'Our core B2B offering' },
  { id: 'prod2', name: 'Consumer App', description: 'Mobile-first consumer experience' }
];

export const mockServices: Service[] = [
  { id: 'serv1', productId: 'prod1', name: 'Onboarding Service', description: 'New customer setup' },
  { id: 'serv2', productId: 'prod1', name: 'Support Service', description: 'Ongoing maintenance' },
  { id: 'serv3', productId: 'prod2', name: 'Subscription Service', description: 'Billing and plans' }
];

export const mockProjects: Project[] = [
  {
    id: 'proj_test',
    name: 'Test Project (Playground)',
    description: 'A safe space to explore features, create maps, and manage tasks.',
    purpose: 'To provide users with a populated environment to test out the platform.',
    goals: ['Explore Journey Maps', 'Test Task Management', 'Understand Process Maps'],
    expectedOutcomes: ['Familiarity with the platform', 'Confidence in using tools'],
    taxonomy: ['Test', 'Playground', 'Demo'],
    status: 'Discover',
    updatedAt: new Date().toISOString(),
    improvementFocus: [
      { metric: 'CSAT', target: '+15%' },
      { metric: 'NPS', target: '+10' }
    ],
    personaIds: ['p1', 'p2'],
    products: [
      { id: 'p_t1', name: 'Test Product A', description: 'A sample product for testing' },
      { id: 'p_t2', name: 'Test Product B', description: 'Another sample product' }
    ],
    services: [
      { id: 's_t1', productId: 'p_t1', name: 'Test Service 1', description: 'A sample service' },
      { id: 's_t2', productId: 'p_t1', name: 'Test Service 2', description: 'Another sample service' }
    ],
    team: [
      {
        id: 'tm_test1',
        name: 'Alex Johnson',
        jobTitle: 'Product Manager',
        projectRole: 'Product Owner',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
      },
      {
        id: 'tm_test2',
        name: 'Maria Garcia',
        jobTitle: 'UX Designer',
        projectRole: 'UX Lead',
        photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
      }
    ]
  },
  {
    id: 'proj1',
    name: 'Core Platform Experience',
    description: 'Journey maps related to the main SaaS platform usage.',
    purpose: 'To identify and resolve friction points in the core user journey of our SaaS platform.',
    goals: ['Reduce churn by 5%', 'Increase NPS from 24 to 40', 'Streamline onboarding'],
    expectedOutcomes: ['New onboarding flow', 'Transparent pricing page', 'Improved checkout'],
    taxonomy: ['SaaS', 'B2B', 'Onboarding', 'Checkout'],
    status: 'Discover',
    updatedAt: '2023-10-25T10:00:00Z',
    improvementFocus: [
      { metric: 'CSAT', target: '+15%' },
      { metric: 'NPS', target: '+10' }
    ],
    personaIds: ['p1'],
    products: [
      { id: 'p1_p1', name: 'SaaS Platform', description: 'Main core offering' }
    ],
    services: [
      { id: 'p1_s1', productId: 'p1_p1', name: 'Onboarding', description: 'User signup and setup' },
      { id: 'p1_s2', productId: 'p1_p1', name: 'Checkout', description: 'Payment and billing' }
    ],
    team: [
      {
        id: 'tm_proj1_1',
        name: 'John Doe',
        jobTitle: 'Product Manager',
        projectRole: 'Product Owner',
        photoUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
      },
      {
        id: 'tm_proj1_2',
        name: 'Jane Smith',
        jobTitle: 'Developer',
        projectRole: 'Lead Dev',
        photoUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random'
      }
    ]
  },
  {
    id: 'proj2',
    name: 'Customer Support & Success',
    description: 'Mapping the post-sale support and renewal journeys.',
    purpose: 'To optimize the support experience and ensure high renewal rates.',
    goals: ['Decrease support ticket response time', 'Increase renewal rate to 95%'],
    expectedOutcomes: ['Automated support routing', 'Proactive renewal sequence'],
    taxonomy: ['Support', 'Success', 'Retention', 'Post-sale'],
    status: 'Define',
    updatedAt: '2023-10-20T14:30:00Z',
    improvementFocus: [
      { metric: 'Resolution Time', target: '-20%' }
    ],
    personaIds: ['p2'],
    products: [
      { id: 'p2_p1', name: 'Support Portal', description: 'Customer help center' }
    ],
    services: [
      { id: 'p2_s1', productId: 'p2_p1', name: 'Ticket Management', description: 'Handling support requests' }
    ],
    team: [
      {
        id: 'tm_proj2_1',
        name: 'Admin User',
        jobTitle: 'Support Lead',
        projectRole: 'Support Manager',
        photoUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=random'
      }
    ]
  }
];

export const mockPersonas: Persona[] = [
  {
    id: 'p1',
    name: 'Sarah Jenkins',
    role: 'Marketing Manager',
    age: 34,
    quote: "I need tools that save me time and integrate seamlessly.",
    goals: ['Increase campaign ROI', 'Automate reporting', 'Improve team collaboration'],
    frustrations: ['Siloed data', 'Manual data entry', 'Slow customer support'],
    motivations: ['Career advancement', 'Efficiency', 'Recognition'],
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Technical Savvy', value: 75 },
      { id: 'd2', label: 'Brand Loyalty', value: 40 },
      { id: 'd3', label: 'Price Sensitivity', value: 60 }
    ]
  },
  {
    id: 'p2',
    name: 'David Chen',
    role: 'IT Director',
    age: 45,
    quote: "Security and scalability are my top priorities.",
    goals: ['Ensure data compliance', 'Reduce system downtime', 'Streamline vendor management'],
    frustrations: ['Hidden costs', 'Complex onboarding', 'Lack of API documentation'],
    motivations: ['Security', 'Stability', 'Cost reduction'],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Technical Savvy', value: 95 },
      { id: 'd2', label: 'Risk Aversion', value: 80 },
      { id: 'd3', label: 'Decision Power', value: 90 }
    ]
  },
  {
    id: 'p3',
    name: 'Elena Rodriguez',
    role: 'Customer Success Lead',
    age: 29,
    quote: "Relationships are the foundation of any successful business.",
    goals: ['Reduce churn rate', 'Increase customer lifetime value', 'Build a community'],
    frustrations: ['Lack of customer feedback', 'Inefficient communication tools', 'High support volume'],
    motivations: ['Helping others', 'Building relationships', 'Customer satisfaction'],
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Empathy', value: 95 },
      { id: 'd2', label: 'Patience', value: 90 },
      { id: 'd3', label: 'Tech Proficiency', value: 70 }
    ]
  },
  {
    id: 'p4',
    name: 'Marcus Thorne',
    role: 'Financial Controller',
    age: 52,
    quote: "Every penny must be accounted for and justified.",
    goals: ['Optimize budget allocation', 'Ensure financial transparency', 'Minimize operational waste'],
    frustrations: ['Unpredictable expenses', 'Manual reporting', 'Lack of financial visibility'],
    motivations: ['Independence', 'Financial stability', 'Legacy'],
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Attention to Detail', value: 98 },
      { id: 'd2', label: 'Risk Tolerance', value: 20 },
      { id: 'd3', label: 'Analytical Thinking', value: 95 }
    ]
  },
  {
    id: 'p5',
    name: 'Aisha Khan',
    role: 'Product Designer',
    age: 26,
    quote: "Design is not just how it looks, but how it works.",
    goals: ['Create intuitive user interfaces', 'Conduct user research', 'Improve accessibility'],
    frustrations: ['Vague requirements', 'Technical constraints', 'Lack of design consistency'],
    motivations: ['Creativity', 'Impact', 'Continuous learning'],
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Creativity', value: 90 },
      { id: 'd2', label: 'User Focus', value: 95 },
      { id: 'd3', label: 'Collaboration', value: 85 }
    ]
  }
];

export const personaTemplates: Persona[] = [
  {
    id: 't1',
    name: 'The Tech Enthusiast',
    type: 'Tech Enthusiast',
    role: 'Early Adopter',
    age: 28,
    quote: "If it's new and shiny, I want it.",
    goals: ['Stay ahead of trends', 'Optimize workflows'],
    frustrations: ['Slow innovation', 'Bugs'],
    motivations: ['Innovation', 'Status', 'Efficiency'],
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Technical Savvy', value: 90 },
      { id: 'd2', label: 'Early Adoption', value: 95 }
    ],
    isTemplate: true,
    isDefaultTemplate: true
  },
  {
    id: 't2',
    name: 'The Pragmatic Buyer',
    type: 'Pragmatic Buyer',
    role: 'Decision Maker',
    age: 42,
    quote: "Show me the ROI.",
    goals: ['Cost reduction', 'Efficiency'],
    frustrations: ['Vague promises', 'Hidden fees'],
    motivations: ['Financial security', 'Career progression', 'Stability'],
    imageUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Technical Savvy', value: 50 },
      { id: 'd2', label: 'Price Sensitivity', value: 85 }
    ],
    isTemplate: true
  },
  {
    id: 't3',
    name: 'Leanne',
    type: 'Single parent balancing work and home',
    role: 'Tenant',
    age: 32,
    quote: "I just need things to work so I can focus on my child.",
    goals: ['Stable, affordable home', 'Timely repairs', 'Clear, flexible communication about rent and services'],
    frustrations: ['Long repair wait times', 'Rigid appointment windows', 'Difficulty attending meetings due to childcare and shifts'],
    motivations: ['Predictability', 'Practical support (e.g., payment plans, local childcare signposting)'],
    imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1b4492?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Time Pressure', value: 90 },
      { id: 'd2', label: 'Digital Savvy', value: 60 }
    ],
    isTemplate: true
  },
  {
    id: 't4',
    name: 'Dylan',
    type: 'Young adult transitioning to independent living',
    role: 'Tenant',
    age: 24,
    quote: "I want to do this right, but there's so much to learn.",
    goals: ['Understand tenancy responsibilities', 'Build credit and stability', 'Access digital services'],
    frustrations: ['Confusing tenancy paperwork', 'Fear of penalties for honest mistakes', 'Limited tailored onboarding'],
    motivations: ['Independence', 'Confidence', 'Clear digital guidance', 'Non-judgemental coaching'],
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Digital Savvy', value: 95 },
      { id: 'd2', label: 'Tenancy Knowledge', value: 20 }
    ],
    isTemplate: true
  },
  {
    id: 't5',
    name: 'Marion',
    type: 'Older tenant with mobility needs',
    role: 'Tenant',
    age: 78,
    quote: "I just want to feel safe and comfortable in my own home.",
    goals: ['Accessible home adaptations', 'Quick safety fixes', 'Reassurance and face-to-face contact'],
    frustrations: ['Complex referral processes for adaptations', 'Inconsistent communication', 'Transport barriers to appointments'],
    motivations: ['Dignity', 'Independence', 'Trusted relationships with staff', 'Predictable service delivery'],
    imageUrl: 'https://images.unsplash.com/photo-1581579186913-45ac3e6ef911?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Mobility Needs', value: 90 },
      { id: 'd2', label: 'Digital Savvy', value: 30 }
    ],
    isTemplate: true
  },
  {
    id: 't6',
    name: 'Amina',
    type: 'Community-minded tenant seeking voice',
    role: 'Tenant',
    age: 45,
    quote: "We can make this neighborhood better if we work together.",
    goals: ['Meaningful participation in landlord decisions', 'Transparent local investment', 'Safer neighbourhoods'],
    frustrations: ['Tokenistic consultations', 'Slow planning responses', 'Lack of feedback on outcomes'],
    motivations: ['Community improvement', 'Fairness', 'Visible change from participation'],
    imageUrl: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=400&fit=crop',
    demographics: [
      { id: 'd1', label: 'Community Engagement', value: 95 },
      { id: 'd2', label: 'Digital Savvy', value: 70 }
    ],
    isTemplate: true
  }
];

export const defaultSwimlanes: Swimlane[] = [
  { id: 'lane_touchpoints', name: 'Touchpoints', type: 'text-list', colorTheme: 'blue', icon: 'MessageSquare' },
  { id: 'lane_friction', name: 'Friction Points', type: 'text-list', colorTheme: 'rose', icon: 'AlertTriangle' },
  { id: 'lane_opportunities', name: 'Opportunities', type: 'text-list', colorTheme: 'amber', icon: 'Lightbulb' },
  { id: 'lane_backoffice', name: 'Back Office Processes', type: 'text-list', colorTheme: 'zinc', icon: 'Settings' },
  { id: 'lane_teams', name: 'Teams', type: 'text-list', colorTheme: 'purple', icon: 'Users' },
  { id: 'lane_systems', name: 'Systems (Tech)', type: 'text-list', colorTheme: 'indigo', icon: 'Monitor' }
];

export const mockJourneyMaps: JourneyMap[] = [
  {
    id: 'j_test_current',
    projectId: 'proj_test',
    title: 'Current Onboarding Experience (As-Is)',
    personaId: 'p1',
    state: 'Current',
    status: 'Complete',
    satisfaction: {
      metric: 'CSAT',
      value: 65
    },
    swimlanes: defaultSwimlanes,
    stages: [
      {
        id: 's1',
        name: 'Sign Up',
        emotion: 4,
        laneData: {
          'lane_touchpoints': ['Website Homepage', 'Registration Form'],
          'lane_friction': ['Password requirements too strict'],
          'lane_opportunities': ['Add SSO options'],
          'lane_backoffice': ['User account creation'],
          'lane_teams': ['Product'],
          'lane_systems': ['Auth0']
        }
      },
      {
        id: 's2',
        name: 'First Login',
        emotion: 2,
        laneData: {
          'lane_touchpoints': ['Welcome Dashboard'],
          'lane_friction': ['Empty state is confusing', 'Not sure what to do first'],
          'lane_opportunities': ['Add a guided tour', 'Show template options'],
          'lane_backoffice': ['Telemetry tracking'],
          'lane_teams': ['Customer Success'],
          'lane_systems': ['Mixpanel']
        }
      },
      {
        id: 's3',
        name: 'First Success',
        emotion: 5,
        laneData: {
          'lane_touchpoints': ['Success Modal', 'Email Confirmation'],
          'lane_friction': [],
          'lane_opportunities': ['Prompt for review/feedback'],
          'lane_backoffice': ['Milestone recorded'],
          'lane_teams': ['Marketing'],
          'lane_systems': ['HubSpot']
        }
      }
    ]
  },
  {
    id: 'j_test_proposed',
    projectId: 'proj_test',
    title: 'Optimized Onboarding Experience (To-Be)',
    personaId: 'p1',
    state: 'Proposed',
    status: 'Complete',
    satisfaction: {
      metric: 'CSAT',
      value: 85
    },
    swimlanes: defaultSwimlanes,
    stages: [
      {
        id: 's1',
        name: 'Sign Up',
        emotion: 5,
        laneData: {
          'lane_touchpoints': ['One-Click Signup', 'SSO Options'],
          'lane_friction': [],
          'lane_opportunities': ['Personalized welcome message'],
          'lane_backoffice': ['Instant account provisioning'],
          'lane_teams': ['Product'],
          'lane_systems': ['Auth0', 'Google/GitHub SSO']
        }
      },
      {
        id: 's2',
        name: 'First Login',
        emotion: 5,
        laneData: {
          'lane_touchpoints': ['Interactive Onboarding Tour'],
          'lane_friction': [],
          'lane_opportunities': ['AI-driven next steps'],
          'lane_backoffice': ['Progress tracking'],
          'lane_teams': ['Customer Success'],
          'lane_systems': ['Appcues']
        }
      },
      {
        id: 's3',
        name: 'First Success',
        emotion: 5,
        laneData: {
          'lane_touchpoints': ['Celebration Animation', 'Value Report'],
          'lane_friction': [],
          'lane_opportunities': ['Referral link generation'],
          'lane_backoffice': ['Impact analysis'],
          'lane_teams': ['Marketing'],
          'lane_systems': ['HubSpot']
        }
      }
    ]
  },
  {
    id: 'j1',
    projectId: 'proj1',
    productId: 'prod1',
    serviceId: 'serv1',
    title: 'Software Onboarding Journey',
    personaId: 'p1',
    state: 'Current',
    satisfaction: {
      metric: 'NPS',
      value: 24
    },
    swimlanes: defaultSwimlanes,
    stages: [
      {
        id: 's1',
        name: 'Awareness',
        emotion: 3,
        laneData: {
          'lane_touchpoints': ['Social Media Ad', 'Blog Post'],
          'lane_friction': ['Hard to find pricing'],
          'lane_opportunities': ['Make pricing transparent on landing page'],
          'lane_backoffice': ['Marketing campaign tracking'],
          'lane_teams': ['Marketing'],
          'lane_systems': ['HubSpot', 'Google Ads']
        }
      },
      {
        id: 's2',
        name: 'Consideration',
        emotion: 4,
        laneData: {
          'lane_touchpoints': ['Webinar', 'Case Studies'],
          'lane_friction': ['Too many emails after webinar'],
          'lane_opportunities': ['Consolidate follow-up emails'],
          'lane_backoffice': ['Lead scoring', 'Sales routing'],
          'lane_teams': ['Marketing', 'Sales Development'],
          'lane_systems': ['Salesforce', 'Marketo']
        }
      },
      {
        id: 's3',
        name: 'Purchase/Decision',
        emotion: 2,
        laneData: {
          'lane_touchpoints': ['Checkout Page', 'Sales Call'],
          'lane_friction': ['Checkout process is too long', 'Payment failed once'],
          'lane_opportunities': ['Implement one-click checkout', 'Add more payment options'],
          'lane_backoffice': ['Contract generation', 'Payment processing'],
          'lane_teams': ['Sales', 'Finance'],
          'lane_systems': ['Stripe', 'DocuSign']
        }
      },
      {
        id: 's4',
        name: 'Retention',
        emotion: 5,
        laneData: {
          'lane_touchpoints': ['Welcome Email', 'In-app Tutorial', 'QBR'],
          'lane_friction': ['Overwhelming initial setup'],
          'lane_opportunities': ['Add video tutorials', 'Guided in-app tours'],
          'lane_backoffice': ['Account provisioning', 'Welcome sequence trigger'],
          'lane_teams': ['Customer Success', 'Support'],
          'lane_systems': ['Auth0', 'Intercom', 'Zendesk']
        }
      },
      {
        id: 's5',
        name: 'Advocacy',
        emotion: 4,
        laneData: {
          'lane_touchpoints': ['Referral Program', 'Case Study Interview'],
          'lane_friction': ['No clear incentive for referring'],
          'lane_opportunities': ['Create automated referral rewards'],
          'lane_backoffice': ['NPS survey sending', 'Referral tracking'],
          'lane_teams': ['Customer Marketing'],
          'lane_systems': ['Delighted', 'Ambassador']
        }
      }
    ]
  }
];

export const mockTasks: Task[] = [
  {
    id: 'i_test1',
    projectId: 'proj_test',
    title: 'Explore Journey Mapping',
    description: 'Create a new journey map or edit an existing one to see how it works.',
    status: 'Discover',
    kanbanStatus: 'In Progress',
    impact: 'High',
    effort: 'Low',
    owner: 'Alex Johnson',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    expectedCompletionDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    stageHistory: [
      { stage: 'Backlog', enteredAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { stage: 'In Progress', enteredAt: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  },
  {
    id: 'i1',
    projectId: 'proj1',
    title: 'Revamp Checkout Flow',
    description: 'Simplify the checkout process to reduce cart abandonment.',
    status: 'Develop',
    kanbanStatus: 'In Progress',
    impact: 'High',
    effort: 'Medium',
    owner: 'John Doe',
    createdAt: '2023-10-20T10:00:00Z',
    expectedCompletionDate: '2023-11-15T00:00:00Z',
    metrics: {
      experience: 'Reduction in cart abandonment rate',
      efficiency: 'Faster checkout time',
      moneySaved: '$50k/year projected'
    },
    stageHistory: [
      { stage: 'Backlog', enteredAt: '2023-10-20T10:00:00Z' },
      { stage: 'In Progress', enteredAt: '2023-10-22T14:00:00Z' }
    ]
  },
  {
    id: 'i2',
    projectId: 'proj1',
    title: 'Transparent Pricing Page',
    description: 'Redesign pricing page to clearly show all tiers and features.',
    status: 'Discover',
    kanbanStatus: 'Backlog',
    impact: 'High',
    effort: 'Low',
    owner: 'Jane Smith',
    createdAt: '2023-10-24T09:00:00Z',
    metrics: {
      experience: 'Improved clarity for users',
      efficiency: 'Fewer support tickets about pricing'
    },
    stageHistory: [
      { stage: 'Backlog', enteredAt: '2023-10-24T09:00:00Z' }
    ]
  },
  {
    id: 'i3',
    projectId: 'proj2',
    title: 'Consolidate Webinar Follow-ups',
    description: 'Create a single, comprehensive follow-up email sequence.',
    status: 'Deliver',
    kanbanStatus: 'Done',
    impact: 'Medium',
    effort: 'Low',
    owner: 'Admin User',
    createdAt: '2023-10-10T11:00:00Z',
    expectedCompletionDate: '2023-10-18T00:00:00Z',
    metrics: {
      efficiency: 'Reduced manual email sending time',
      timeSaved: '5 hours/week'
    },
    stageHistory: [
      { stage: 'Backlog', enteredAt: '2023-10-10T11:00:00Z' },
      { stage: 'In Progress', enteredAt: '2023-10-12T09:00:00Z' },
      { stage: 'Done', enteredAt: '2023-10-18T16:00:00Z' }
    ]
  }
];

export const mockProcessMaps: ProcessMap[] = [
  {
    id: 'pm_test',
    projectId: 'proj_test',
    title: 'User Registration Flow',
    journeyId: 'j_test_current',
    nodes: [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'User visits site', description: 'Landing page' } },
      { id: '2', position: { x: 250, y: 0 }, data: { label: 'Clicks Sign Up', description: 'CTA button' } },
      { id: '3', position: { x: 500, y: 0 }, data: { label: 'Fills Form', description: 'Name, Email, Password' } },
      { id: '4', position: { x: 750, y: -50 }, data: { label: 'Validation Fails', description: 'Show errors' } },
      { id: '5', position: { x: 750, y: 50 }, data: { label: 'Validation Passes', description: 'Create account' } },
      { id: '6', position: { x: 1000, y: 50 }, data: { label: 'Send Welcome Email', description: 'Via SendGrid' } }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4', label: 'Invalid' },
      { id: 'e4-3', source: '4', target: '3', label: 'Retry' },
      { id: 'e3-5', source: '3', target: '5', label: 'Valid' },
      { id: 'e5-6', source: '5', target: '6' }
    ]
  },
  {
    id: 'pm1',
    projectId: 'proj1',
    title: 'Lead Routing Process',
    journeyId: 'j1',
    nodes: [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'Lead Captured', description: 'HubSpot Form' } },
      { id: '2', position: { x: 250, y: 0 }, data: { label: 'Lead Scoring', description: 'Automated Rules' } },
      { id: '3', position: { x: 500, y: -50 }, data: { label: 'Sales Routing', description: 'Assign to SDR' } },
      { id: '4', position: { x: 500, y: 50 }, data: { label: 'Marketing Nurture', description: 'Add to Sequence' } },
      { id: '5', position: { x: 750, y: 0 }, data: { label: 'CRM Sync', description: 'Salesforce' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3', label: 'Score > 50' },
      { id: 'e2-4', source: '2', target: '4', label: 'Score <= 50' },
      { id: 'e3-5', source: '3', target: '5' },
      { id: 'e4-5', source: '4', target: '5' },
    ]
  }
];

export const mockStakeholders: Stakeholder[] = [
  {
    id: 'stk_1',
    name: 'Robert Miller',
    category: 'Executive Sponsor',
    organization: 'ExampleCorp',
    email: 'robert@example.com',
    isGlobal: true
  },
  {
    id: 'stk_2',
    name: 'Linda Thompson',
    category: 'Director/Head of Service',
    organization: 'ExampleCorp',
    email: 'linda@example.com',
    isGlobal: true
  },
  {
    id: 'stk_3',
    name: 'IT Infrastructure Team',
    category: 'Corporate Function (IT, Finance, HR, Legal, Comms)',
    organization: 'ExampleCorp',
    isGlobal: true
  },
  {
    id: 'stk_4',
    name: 'Acme Contractors',
    category: 'Key Partner (Contractor, Housing, NHS, Third Sector)',
    organization: 'Acme Corp',
    isGlobal: true
  },
  {
    id: 'stk_5',
    name: 'Financial Conduct Authority',
    category: 'Regulator',
    isGlobal: true
  },
  {
    id: 'stk_6',
    name: 'Green Valley Tenants Association',
    category: 'Resident/Tenant Group',
    isGlobal: true
  },
  {
    id: 'stk_7',
    name: 'National Workers Union',
    category: 'Union',
    isGlobal: true
  }
];

export const mockProjectStakeholders: ProjectStakeholder[] = [
  {
    ...{
      id: 'stk_1',
      name: 'Robert Miller',
      category: 'Executive Sponsor',
      organization: 'ExampleCorp',
      email: 'robert@example.com',
      isGlobal: true
    },
    projectId: 'proj_test',
    power: 90,
    interest: 85,
    sentiment: 'Positive',
    sentimentHistory: [
      { date: new Date(Date.now() - 86400000 * 7).toISOString(), sentiment: 'Neutral', note: 'Initial briefing' },
      { date: new Date().toISOString(), sentiment: 'Positive', note: 'Excited about the vision' }
    ],
    engagementStrategy: 'Maintain close relationship through weekly updates and strategic alignment sessions.',
    linkedItems: []
  },
  {
    ...{
      id: 'stk_3',
      name: 'IT Infrastructure Team',
      category: 'Corporate Function (IT, Finance, HR, Legal, Comms)',
      organization: 'ExampleCorp',
      isGlobal: true
    },
    projectId: 'proj_test',
    power: 70,
    interest: 40,
    sentiment: 'Neutral',
    sentimentHistory: [
      { date: new Date().toISOString(), sentiment: 'Neutral' }
    ],
    engagementStrategy: 'Keep informed about technical requirements and ensure early involvement in infrastructure decisions.',
    linkedItems: []
  },
  {
    id: 'pstk_1',
    name: 'Local Community Board',
    category: 'Community Group',
    projectId: 'proj_test',
    isGlobal: false,
    power: 40,
    interest: 95,
    sentiment: 'Negative',
    sentimentHistory: [
      { date: new Date().toISOString(), sentiment: 'Negative', note: 'Concerned about noise and disruption' }
    ],
    engagementStrategy: 'Proactive consultation and community engagement events to address concerns and build trust.',
    linkedItems: []
  }
];
