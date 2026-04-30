export const AI_MODELS = {
  // Complex Reasoning & Structuring - Use Pro models
  personaGeneration: 'gemini-3.1-pro-preview',
  journeyGeneration: 'gemini-3.1-pro-preview',
  processGeneration: 'gemini-3.1-pro-preview',
  userStoryGeneration: 'gemini-3.1-pro-preview',
  deepInsights: 'gemini-3.1-pro-preview',
  journeyAssistant: 'gemini-3.1-pro-preview',
  
  // Fast & Conversational Tasks - Use Flash models
  chat: 'gemini-3-flash-preview',
  personaInterview: 'gemini-3-flash-preview',
  npsAnalysis: 'gemini-3-flash-preview',
  vocAnalysis: 'gemini-3-flash-preview',
  empathyMap: 'gemini-3-flash-preview',
  stakeholderMapping: 'gemini-3-flash-preview',
  sprintReport: 'gemini-3-flash-preview',
  routineAnalysis: 'gemini-3-flash-preview',
};

export const AI_MODEL_EXPLANATIONS = [
  {
    name: 'Gemini 3.1 Pro',
    alias: 'gemini-3.1-pro-preview',
    useCases: [
      'Generating complex Customer Personas',
      'Architecting multi-stage Journey Maps',
      'Designing Business Processes',
      'Writing detailed User Stories & Acceptance Criteria',
      'Extracting deep insights from large datasets',
    ],
    description: 'Our most advanced enterprise reasoning model. Used for complex generative tasks that require deep structuring, planning, and contextual understanding.',
  },
  {
    name: 'Gemini 3 Flash',
    alias: 'gemini-3-flash-preview',
    useCases: [
      'Interactive Chatbots',
      'Persona Interviews & Roleplay',
      'NPS & VoC text analysis',
      'Empathy Maps',
      'Sprint Reporting & Routine summarizations',
      'Stakeholder classifications',
    ],
    description: 'Our fast, highly responsive enterprise model. Ideal for interactive tasks, conversational experiences, and rapid analysis of text feedback.',
  }
];

export const AI_TOKEN_PRICING = {
  multiplier: {
    flash: 1,
    pro: 10,
  },
  tracking: 'Google calculates usage based on "Tokens" - approximately 4 characters of text equals 1 token. We track total tokens (Input + Output) for every request.',
};
