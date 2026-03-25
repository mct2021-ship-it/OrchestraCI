import { Persona } from '../types';

export interface PersonaFolder {
  id: string;
  name: string;
  description: string;
  icon: string;
  personas: Partial<Persona>[];
}

export const personaLibrary: PersonaFolder[] = [
  {
    id: 'housing-associations',
    name: 'Housing Associations',
    description: 'Personas representing typical tenants and stakeholders in social housing.',
    icon: 'Home',
    personas: [
      {
        name: 'Leanne',
        type: 'Single parent balancing work and home',
        role: 'Social Tenant',
        age: 32,
        gender: 'Female',
        quote: 'I just want a stable home for my child where repairs are done on time.',
        goals: [
          'Stable, affordable home',
          'Timely repairs',
          'Clear, flexible communication about rent and services'
        ],
        frustrations: [
          'Long repair wait times',
          'Rigid appointment windows',
          'Difficulty attending meetings due to childcare and shifts'
        ],
        motivations: [
          'Wants predictability so she can work and care for her child',
          'Values practical support (e.g., payment plans, local childcare signposting)'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 60 },
          { id: '2', label: 'Time Poor', value: 90 },
          { id: '3', label: 'Financial Security', value: 30 },
          { id: '4', label: 'Mobility', value: 95 },
          { id: '5', label: 'Health', value: 85 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 60 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop'
      },
      {
        name: 'Dylan',
        type: 'Young professional in shared ownership',
        role: 'Shared Owner',
        age: 28,
        gender: 'Male',
        quote: 'I want to understand my service charges and have a say in how my building is managed.',
        goals: [
          'Clear breakdown of service charges',
          'Easy way to report communal issues',
          'Path to staircasing (buying more shares)'
        ],
        frustrations: [
          'Unexpected increases in service charges',
          'Lack of communication from property managers',
          'Complex staircasing process'
        ],
        motivations: [
          'Building equity and moving towards full homeownership',
          'Living in a well-maintained, safe environment'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 85 },
          { id: '2', label: 'Time Poor', value: 70 },
          { id: '3', label: 'Financial Security', value: 60 },
          { id: '4', label: 'Mobility', value: 100 },
          { id: '5', label: 'Health', value: 95 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 85 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
      },
      {
        name: 'Marion',
        type: 'Elderly resident needing support',
        role: 'Supported Housing Resident',
        age: 78,
        gender: 'Female',
        quote: 'I want to feel safe and connected to my community, with help nearby if I need it.',
        goals: [
          'Maintaining independence',
          'Feeling safe and secure',
          'Easy access to support services and community activities'
        ],
        frustrations: [
          'Complex digital systems for reporting issues',
          'Feeling isolated or disconnected',
          'Physical barriers in the home or community'
        ],
        motivations: [
          'Peace of mind for herself and her family',
          'Social interaction and community belonging'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 20 },
          { id: '2', label: 'Time Poor', value: 10 },
          { id: '3', label: 'Financial Security', value: 40 },
          { id: '4', label: 'Mobility', value: 30 },
          { id: '5', label: 'Health', value: 40 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 50 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1581579186913-45ac3e6ef911?w=400&h=400&fit=crop'
      },
      {
        name: 'Amina',
        type: 'Community leader and involved tenant',
        role: 'Tenant Board Member',
        age: 45,
        gender: 'Female',
        quote: 'I want to ensure our voices are heard and our neighborhood is a great place to live.',
        goals: [
          'Improving community facilities',
          'Holding the housing association accountable',
          'Fostering a strong sense of community'
        ],
        frustrations: [
          'Bureaucracy and slow decision-making',
          'Lack of transparency from management',
          'Apathy from other residents'
        ],
        motivations: [
          'Making a tangible difference in her community',
          'Ensuring fair treatment for all tenants'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 75 },
          { id: '2', label: 'Time Poor', value: 80 },
          { id: '3', label: 'Financial Security', value: 50 },
          { id: '4', label: 'Mobility', value: 85 },
          { id: '5', label: 'Health', value: 80 },
          { id: '6', label: 'Language Skills', value: 85 },
          { id: '7', label: 'Education Level', value: 75 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=400&fit=crop'
      },
      {
        name: 'Jamal',
        type: 'Family man in social housing',
        role: 'Social Tenant',
        age: 45,
        gender: 'Male',
        quote: 'I need a safe neighborhood for my kids to grow up in, and a landlord that listens.',
        goals: [
          'Safe and clean communal areas',
          'Access to local community programs for children',
          'Responsive maintenance for family-sized homes'
        ],
        frustrations: [
          'Anti-social behavior in the neighborhood',
          'Lack of safe play areas',
          'Poor communication regarding estate improvements'
        ],
        motivations: [
          'Providing a good life and opportunities for his children',
          'Building a strong, supportive local community'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 65 },
          { id: '2', label: 'Time Poor', value: 85 },
          { id: '3', label: 'Financial Security', value: 40 },
          { id: '4', label: 'Mobility', value: 90 },
          { id: '5', label: 'Health', value: 85 },
          { id: '6', label: 'Language Skills', value: 95 },
          { id: '7', label: 'Education Level', value: 65 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop'
      }
    ]
  },
  {
    id: 'local-authorities',
    name: 'Local Authorities',
    description: 'Personas representing citizens interacting with council services.',
    icon: 'Building2',
    personas: [
      {
        name: 'Sarah',
        type: 'Library User',
        role: 'Citizen',
        age: 35,
        gender: 'Female',
        quote: 'I use the library for my kids\' reading groups and to work quietly occasionally.',
        goals: [
          'Easy access to children\'s books and activities',
          'Quiet workspace with reliable Wi-Fi',
          'Simple online catalog and reservation system'
        ],
        frustrations: [
          'Inconsistent opening hours',
          'Difficult to navigate the online booking system',
          'Lack of available study spaces during peak times'
        ],
        motivations: [
          'Fostering a love of reading in her children',
          'Finding a productive environment outside the home'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 70 },
          { id: '2', label: 'Time Poor', value: 85 },
          { id: '3', label: 'Financial Security', value: 60 },
          { id: '4', label: 'Mobility', value: 95 },
          { id: '5', label: 'Health', value: 90 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 75 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
      },
      {
        name: 'Tom',
        type: 'Leisure Centre Member',
        role: 'Citizen',
        age: 42,
        gender: 'Male',
        quote: 'I want to stay fit, but I need flexible class schedules that fit around my work.',
        goals: [
          'Access to modern gym equipment',
          'Variety of fitness classes at convenient times',
          'Easy online booking and membership management'
        ],
        frustrations: [
          'Classes booking up too quickly',
          'Broken equipment taking too long to fix',
          'Confusing membership tiers and pricing'
        ],
        motivations: [
          'Maintaining physical and mental health',
          'Finding a sense of community through group exercise'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 80 },
          { id: '2', label: 'Time Poor', value: 75 },
          { id: '3', label: 'Financial Security', value: 70 },
          { id: '4', label: 'Mobility', value: 100 },
          { id: '5', label: 'Health', value: 85 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 80 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
      },
      {
        name: 'Arthur',
        type: 'Social Care Recipient',
        role: 'Citizen',
        age: 82,
        gender: 'Male',
        quote: 'I need help with daily tasks, but I want to stay in my own home for as long as possible.',
        goals: [
          'Receiving reliable and compassionate care',
          'Maintaining dignity and independence',
          'Clear communication with care providers and family'
        ],
        frustrations: [
          'Different carers arriving every day',
          'Complex forms and assessments for care packages',
          'Feeling like a burden'
        ],
        motivations: [
          'Staying in familiar surroundings',
          'Avoiding a move to a residential care home'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 15 },
          { id: '2', label: 'Time Poor', value: 10 },
          { id: '3', label: 'Financial Security', value: 45 },
          { id: '4', label: 'Mobility', value: 20 },
          { id: '5', label: 'Health', value: 30 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 60 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=400&fit=crop'
      },
      {
        name: 'Priya',
        type: 'Small business owner',
        role: 'Local Business Owner',
        age: 38,
        gender: 'Female',
        quote: 'Dealing with council licensing should be straightforward, not a maze of paperwork.',
        goals: [
          'Quick and easy licensing and permits',
          'Clear guidance on local business regulations',
          'Support for local high streets'
        ],
        frustrations: [
          'Confusing council websites',
          'Slow response times to business inquiries',
          'High business rates with little perceived return'
        ],
        motivations: [
          'Growing her business and supporting her family',
          'Contributing to the local economy'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 80 },
          { id: '2', label: 'Time Poor', value: 95 },
          { id: '3', label: 'Financial Security', value: 60 },
          { id: '4', label: 'Mobility', value: 100 },
          { id: '5', label: 'Health', value: 90 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 80 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop'
      },
      {
        name: 'George',
        type: 'Retiree concerned about local services',
        role: 'Active Citizen',
        age: 65,
        gender: 'Male',
        quote: 'I\'ve paid my taxes all my life, I expect the bins to be collected and the streets to be safe.',
        goals: [
          'Reliable core council services (waste, roads)',
          'Easy access to information without needing a smartphone',
          'Having a say in local development plans'
        ],
        frustrations: [
          'Services moving "online only"',
          'Potholes and poor street lighting',
          'Feeling ignored by local politicians'
        ],
        motivations: [
          'Maintaining the character and safety of his neighborhood',
          'Ensuring value for money from council tax'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 30 },
          { id: '2', label: 'Time Poor', value: 20 },
          { id: '3', label: 'Financial Security', value: 70 },
          { id: '4', label: 'Mobility', value: 75 },
          { id: '5', label: 'Health', value: 65 },
          { id: '6', label: 'Language Skills', value: 100 },
          { id: '7', label: 'Education Level', value: 70 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop'
      }
    ]
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Personas representing clients and stakeholders in the legal sector.',
    icon: 'Scale',
    personas: [
      {
        name: 'Eleanor',
        type: 'Corporate Client',
        role: 'General Counsel',
        age: 48,
        gender: 'Female',
        quote: 'I need a law firm that understands our business and provides practical, actionable advice without the fluff.',
        goals: [
          'Mitigate legal risks for the company',
          'Manage external legal spend effectively',
          'Receive timely and concise legal updates'
        ],
        frustrations: [
          'Unpredictable billing and hidden fees',
          'Overly academic advice that lacks business context',
          'Slow response times on urgent matters'
        ],
        motivations: [
          'Protecting the company\'s reputation',
          'Demonstrating value to the executive board'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 85 },
          { id: '2', label: 'Time Poor', value: 95 },
          { id: '3', label: 'Financial Security', value: 90 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=400&fit=crop'
      },
      {
        name: 'Marcus',
        type: 'Individual Client',
        role: 'Family Law Client',
        age: 36,
        gender: 'Male',
        quote: 'This is the most stressful time of my life. I need someone who explains things clearly and fights my corner.',
        goals: [
          'Resolve the legal issue quickly and fairly',
          'Understand the legal process and next steps',
          'Keep legal costs manageable'
        ],
        frustrations: [
          'Legal jargon that is hard to understand',
          'Feeling like just another case number',
          'Lack of transparency about potential outcomes'
        ],
        motivations: [
          'Protecting his family and assets',
          'Moving on with his life as quickly as possible'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 70 },
          { id: '2', label: 'Time Poor', value: 80 },
          { id: '3', label: 'Financial Security', value: 50 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
      },
      {
        name: 'Samantha',
        type: 'First-time homebuyer',
        role: 'Conveyancing Client',
        age: 32,
        gender: 'Female',
        quote: 'Buying a house is so stressful. I need my solicitor to keep me updated every step of the way.',
        goals: [
          'Complete the house purchase smoothly and on time',
          'Understand all the legal fees upfront',
          'Proactive communication from her solicitor'
        ],
        frustrations: [
          'Chasing solicitors for updates',
          'Unexpected delays in the chain',
          'Complex legal documents that are hard to understand'
        ],
        motivations: [
          'Securing her dream home',
          'Minimizing stress during a major life event'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 85 },
          { id: '2', label: 'Time Poor', value: 75 },
          { id: '3', label: 'Financial Security', value: 60 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop'
      },
      {
        name: 'Michael',
        type: 'Business owner needing contract review',
        role: 'Corporate Client',
        age: 55,
        gender: 'Male',
        quote: 'I need legal advice that is commercial and practical, not just theoretical risks.',
        goals: [
          'Protecting his business from liability',
          'Fast turnaround on contract reviews',
          'Clear, actionable legal advice'
        ],
        frustrations: [
          'Lawyers who say "no" without offering solutions',
          'Slow response times that delay deals',
          'Opaque billing practices'
        ],
        motivations: [
          'Growing his business safely',
          'Closing deals efficiently'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 60 },
          { id: '2', label: 'Time Poor', value: 90 },
          { id: '3', label: 'Financial Security', value: 85 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop'
      },
      {
        name: 'Fiona',
        type: 'Going through a divorce',
        role: 'Family Law Client',
        age: 42,
        gender: 'Female',
        quote: 'I need someone compassionate but strong to help me navigate this difficult time.',
        goals: [
          'Fair financial settlement',
          'Clear custody arrangements for her children',
          'Emotional support and clear guidance'
        ],
        frustrations: [
          'The slow pace of the legal system',
          'High and unpredictable legal costs',
          'Aggressive tactics from the opposing side'
        ],
        motivations: [
          'Protecting her children\'s future',
          'Starting a new chapter in her life with financial stability'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 70 },
          { id: '2', label: 'Time Poor', value: 80 },
          { id: '3', label: 'Financial Security', value: 50 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop'
      }
    ]
  },
  {
    id: 'accounting',
    name: 'Accounting',
    description: 'Personas representing clients interacting with accounting and financial services.',
    icon: 'Calculator',
    personas: [
      {
        name: 'David',
        type: 'Small Business Owner',
        role: 'Founder & CEO',
        age: 41,
        gender: 'Male',
        quote: 'I want an accountant who doesn\'t just do my taxes, but helps me grow my business.',
        goals: [
          'Ensure full tax compliance',
          'Optimize cash flow and reduce expenses',
          'Receive proactive financial advice'
        ],
        frustrations: [
          'Accountants who only speak to him once a year',
          'Complex accounting software',
          'Surprise tax bills'
        ],
        motivations: [
          'Growing his business sustainably',
          'Providing financial security for his family'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 65 },
          { id: '2', label: 'Time Poor', value: 100 },
          { id: '3', label: 'Financial Security', value: 60 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop'
      },
      {
        name: 'Chloe',
        type: 'Freelancer',
        role: 'Independent Contractor',
        age: 29,
        gender: 'Female',
        quote: 'Taxes terrify me. I just need a simple system to track my income and expenses so I don\'t get fined.',
        goals: [
          'Easy and painless tax filing',
          'Simple expense tracking on the go',
          'Understanding what she can and cannot deduct'
        ],
        frustrations: [
          'Expensive accounting fees',
          'Confusing tax jargon',
          'Fear of making a mistake and being audited'
        ],
        motivations: [
          'Maintaining her independence and freelance lifestyle',
          'Maximizing her take-home pay'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 90 },
          { id: '2', label: 'Time Poor', value: 60 },
          { id: '3', label: 'Financial Security', value: 40 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
      },
      {
        name: 'Ben',
        type: 'Freelancer needing tax help',
        role: 'Sole Trader',
        age: 29,
        gender: 'Male',
        quote: 'I just want to know how much I need to save for taxes so I don\'t get a nasty surprise.',
        goals: [
          'Understanding allowable expenses',
          'Simple digital tools for bookkeeping',
          'Peace of mind that taxes are done correctly'
        ],
        frustrations: [
          'Complicated tax rules for freelancers',
          'Keeping track of paper receipts',
          'Accountants who don\'t understand the gig economy'
        ],
        motivations: [
          'Focusing on his creative work, not admin',
          'Avoiding fines from HMRC'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 95 },
          { id: '2', label: 'Time Poor', value: 70 },
          { id: '3', label: 'Financial Security', value: 40 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop'
      },
      {
        name: 'Linda',
        type: 'CFO of a mid-size company',
        role: 'Corporate Client',
        age: 50,
        gender: 'Female',
        quote: 'I need strategic financial advice, not just someone to crunch the numbers.',
        goals: [
          'Optimizing tax strategy for the company',
          'Accurate and timely financial reporting',
          'Strategic advice on mergers and acquisitions'
        ],
        frustrations: [
          'Errors in financial reports',
          'Lack of proactive advice from auditors',
          'Slow response times during critical periods'
        ],
        motivations: [
          'Driving company growth and profitability',
          'Ensuring strict regulatory compliance'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 80 },
          { id: '2', label: 'Time Poor', value: 95 },
          { id: '3', label: 'Financial Security', value: 90 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop'
      },
      {
        name: 'Raj',
        type: 'Startup founder seeking investment advice',
        role: 'Startup Founder',
        age: 40,
        gender: 'Male',
        quote: 'I need help structuring my company to attract investors and manage cash flow.',
        goals: [
          'Securing SEIS/EIS advance assurance',
          'Creating robust financial models for pitch decks',
          'Managing tight cash runways'
        ],
        frustrations: [
          'Accountants who don\'t understand startup growth metrics',
          'High fees for basic services',
          'Complex cap table management'
        ],
        motivations: [
          'Scaling his business rapidly',
          'Securing the next round of funding'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 90 },
          { id: '2', label: 'Time Poor', value: 100 },
          { id: '3', label: 'Financial Security', value: 50 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop'
      }
    ]
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Personas representing customers of energy, water, and telecom providers.',
    icon: 'Zap',
    personas: [
      {
        name: 'Robert',
        type: 'Eco-conscious Homeowner',
        role: 'Residential Customer',
        age: 55,
        gender: 'Male',
        quote: 'I want to reduce my carbon footprint and see exactly how much energy my solar panels are generating.',
        goals: [
          'Transition to 100% renewable energy',
          'Monitor real-time energy usage via a smart app',
          'Lower overall energy consumption'
        ],
        frustrations: [
          'Confusing bills that don\'t clearly show renewable contributions',
          'Clunky apps that crash frequently',
          'Poor customer service when issues arise'
        ],
        motivations: [
          'Protecting the environment for future generations',
          'Feeling in control of his home\'s energy ecosystem'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 75 },
          { id: '2', label: 'Time Poor', value: 50 },
          { id: '3', label: 'Financial Security', value: 85 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
      },
      {
        name: 'Jessica',
        type: 'Budget-conscious Renter',
        role: 'Residential Customer',
        age: 24,
        gender: 'Female',
        quote: 'My bills are my biggest worry. I need predictability and an easy way to pay.',
        goals: [
          'Keep utility bills as low as possible',
          'Have a predictable monthly payment plan',
          'Receive alerts if usage spikes unexpectedly'
        ],
        frustrations: [
          'Unexpectedly high winter bills',
          'Hidden fees or confusing tariffs',
          'Difficulty reaching a human when calling support'
        ],
        motivations: [
          'Managing a tight monthly budget',
          'Avoiding debt and late fees'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 95 },
          { id: '2', label: 'Time Poor', value: 70 },
          { id: '3', label: 'Financial Security', value: 20 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'
      },
      {
        name: 'Emma',
        type: 'Renter setting up bills for the first time',
        role: 'New Customer',
        age: 25,
        gender: 'Female',
        quote: 'I\'ve never had to set up gas and electric before, I just want it to be easy and cheap.',
        goals: [
          'Quick and easy online setup',
          'Clear explanation of tariffs and charges',
          'A simple app to manage her account'
        ],
        frustrations: [
          'Confusing terminology (e.g., standing charges, kWh)',
          'Long wait times on the phone',
          'Difficulty splitting bills with housemates'
        ],
        motivations: [
          'Getting settled into her new home quickly',
          'Keeping her monthly outgoings low'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 95 },
          { id: '2', label: 'Time Poor', value: 60 },
          { id: '3', label: 'Financial Security', value: 30 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop'
      },
      {
        name: 'John',
        type: 'Homeowner looking to install solar panels',
        role: 'Prosumer',
        age: 60,
        gender: 'Male',
        quote: 'I want to generate my own energy and sell the excess back to the grid.',
        goals: [
          'Understanding the Smart Export Guarantee (SEG)',
          'Seamless integration of solar panels with his smart meter',
          'Reducing his reliance on the national grid'
        ],
        frustrations: [
          'Confusing information about tariffs for solar owners',
          'Delays in getting a smart meter installed',
          'Poor customer service when dealing with complex queries'
        ],
        motivations: [
          'Saving money in the long term',
          'Doing his bit for the environment'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 60 },
          { id: '2', label: 'Time Poor', value: 40 },
          { id: '3', label: 'Financial Security', value: 80 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop'
      },
      {
        name: 'Maria',
        type: 'Low-income customer struggling with energy bills',
        role: 'Vulnerable Customer',
        age: 35,
        gender: 'Female',
        quote: 'I\'m terrified to turn the heating on because I don\'t know how I\'ll pay the bill.',
        goals: [
          'Access to financial support or hardship funds',
          'Clear communication about debt repayment plans',
          'Ways to reduce energy consumption without freezing'
        ],
        frustrations: [
          'Threatening letters about unpaid bills',
          'Being forced onto a prepayment meter',
          'Complex processes to apply for support'
        ],
        motivations: [
          'Keeping her home warm for her children',
          'Getting out of debt'
        ],
        demographics: [
          { id: '1', label: 'Tech Savvy', value: 40 },
          { id: '2', label: 'Time Poor', value: 80 },
          { id: '3', label: 'Financial Security', value: 10 }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1508214751196-bfd1414d4bbc?w=400&h=400&fit=crop'
      }
    ]
  }
];
