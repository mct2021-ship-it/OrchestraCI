const fs = require('fs');
const path = require('path');

const flashFiles = [
  'src/components/VocSection.tsx',
  'src/components/NpsCalculator.tsx',
  'src/components/PersonaInterview.tsx',
  'src/components/StakeholderMapping.tsx',
  'src/components/GeminiChatbot.tsx',
  'src/components/SprintReportModal.tsx',
  'src/components/PersonaEmpathyMap.tsx',
  'src/pages/SprintManagement.tsx',
  'src/pages/RaidLog.tsx',
  'src/pages/Stakeholders.tsx',
  'src/pages/Intelligence.tsx',
  'src/pages/Personas.tsx',
  'src/components/YourCompany.tsx',
  'src/components/ReviewIntelligence.tsx',
  'src/pages/ProjectDetail.tsx'
];

const proFiles = [
  'src/components/CreatePersonaModal.tsx',
  'src/components/AiProcessGeneratorModal.tsx',
  'src/components/JourneyAiAssistant.tsx',
  'src/components/AiPersonaGenerator.tsx',
  'src/components/CreateJourneyModal.tsx',
  'src/pages/SprintBacklog.tsx',
  'src/pages/JourneyMaps.tsx',
];

const processFiles = (files, model) => {
  files.forEach(file => {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add import if missing
    if (!content.includes('AI_MODELS')) {
       // Find where to insert, typically after gemini import
       const geminiImportRegex = /import.*gemini.*;/g;
       const match = geminiImportRegex.exec(content);
       if (match) {
         const insertPos = match.index + match[0].length;
         content = content.slice(0, insertPos) + "\nimport { AI_MODELS } from '../lib/aiConfig';" + content.slice(insertPos);
       } else {
         content = "import { AI_MODELS } from '../lib/aiConfig';\n" + content;
       }
    }

    // Replace the strings
    // We want to replace model: "gemini-3-flash-preview" or model: 'gemini-3-flash-preview' with model: model
    content = content.replace(/model:\s*['"]gemini-3-flash-preview['"]/g, `model: AI_MODELS.${model}`);
    
    fs.writeFileSync(filePath, content, 'utf8');
  });
};

processFiles(flashFiles, 'chat');
processFiles(proFiles, 'personaGeneration');

// Some files might need more specific replacements, we'll fix manually if needed.
console.log('done');
