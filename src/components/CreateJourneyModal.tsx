import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { X, Wand2, Loader2, Mic, FilePlus, Upload, FileText } from 'lucide-react';
import { JourneyMap, Swimlane, JourneyStage, Product, Service } from '../types';
import { defaultSwimlanes } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface CreateJourneyModalProps {
  onClose: () => void;
  onSave: (journey: JourneyMap) => void;
  projectId: string;
}

export function CreateJourneyModal({ onClose, onSave, projectId }: CreateJourneyModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateBlank = () => {
    const newJourney: JourneyMap = {
      id: uuidv4(),
      projectId,
      title: 'New Blank Journey',
      personaId: 'p1', // Default persona for now
      state: 'Current',
      satisfaction: {
        metric: 'NPS',
        value: 0
      },
      swimlanes: defaultSwimlanes,
      stages: [
        { id: uuidv4(), name: 'Awareness', emotion: 3, laneData: {}, icon: 'Eye' },
        { id: uuidv4(), name: 'Consideration', emotion: 3, laneData: {}, icon: 'Search' },
        { id: uuidv4(), name: 'Purchase', emotion: 3, laneData: {}, icon: 'ShoppingBag' },
        { id: uuidv4(), name: 'Retention', emotion: 3, laneData: {}, icon: 'RefreshCw' },
        { id: uuidv4(), name: 'Advocacy', emotion: 3, laneData: {}, icon: 'Star' }
      ]
    };
    onSave(newJourney);
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setError(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractTextFromDocx(file);
      } else {
        throw new Error('Unsupported file type. Please upload PDF or Word document.');
      }
      setFileContent(text);
    } catch (err: any) {
      console.error('Error extracting text:', err);
      setError('Failed to read file content. Please try again.');
      setUploadedFile(null);
      setFileContent('');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !fileContent) return;
    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing.");

      const ai = new GoogleGenAI({ apiKey });

      let contentPrompt = `You are an expert Customer Experience (CX) designer. Create a customer journey map based on the following input.`;
      
      if (prompt.trim()) {
        contentPrompt += `\n\nUser Description: "${prompt}"`;
      }

      if (fileContent) {
        contentPrompt += `\n\nSOP/Document Content:\n${fileContent.substring(0, 20000)}`; // Limit content length to avoid token limits if necessary, though Gemini handles large context well.
      }

      contentPrompt += `\n\nThe journey map should have 5 stages: Awareness, Consideration, Purchase/Decision, Retention, and Advocacy.
        For each stage, provide data for these specific swimlanes:
        - lane_touchpoints: What the customer interacts with (e.g., Website, Email, Store)
        - lane_friction: Pain points or frustrations the customer experiences
        - lane_opportunities: Ideas to improve the experience
        - lane_backoffice: Internal processes happening behind the scenes
        - lane_teams: Internal teams involved at this stage
        - lane_systems: Technology or software systems used
        
        Also provide an emotion score from 1 to 5 for each stage (1 is very negative, 5 is very positive).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contentPrompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'A concise title for the journey map' },
              stages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Name of the stage (e.g., Awareness, Purchase)' },
                    emotion: { type: Type.INTEGER, description: 'Emotion score from 1 to 5' },
                    lane_touchpoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lane_friction: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lane_opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lane_backoffice: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lane_teams: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lane_systems: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['name', 'emotion', 'lane_touchpoints', 'lane_friction', 'lane_opportunities', 'lane_backoffice', 'lane_teams', 'lane_systems']
                }
              }
            },
            required: ['title', 'stages']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      const newJourney: JourneyMap = {
        id: uuidv4(),
        projectId,
        title: data.title || 'Generated Journey Map',
        personaId: 'p1', // Default persona for now
        state: 'Proposed',
        satisfaction: {
          metric: 'NPS',
          value: 0
        },
        swimlanes: defaultSwimlanes,
        stages: (data.stages || []).map((s: any) => ({
          id: uuidv4(),
          name: s.name,
          emotion: s.emotion,
          laneData: {
            'lane_touchpoints': s.lane_touchpoints || [],
            'lane_friction': s.lane_friction || [],
            'lane_opportunities': s.lane_opportunities || [],
            'lane_backoffice': s.lane_backoffice || [],
            'lane_teams': s.lane_teams || [],
            'lane_systems': s.lane_systems || []
          }
        }))
      };

      onSave(newJourney);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate journey map.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create Journey Map</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateBlank}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-full flex items-center justify-center transition-colors">
                <FilePlus className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Blank Journey Map</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Start from scratch with a standard template</p>
              </div>
            </button>

            <div className="flex flex-col gap-3 p-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">Create with AI</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Describe your journey or upload SOP</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the journey (e.g., A customer buying a new car online...)"
                    className="w-full h-20 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  />
                  <button 
                    className="absolute bottom-2 right-2 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 rounded-md shadow-sm transition-colors"
                    title="Voice input (simulated)"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadedFile ? 'Change File' : 'Upload SOP (PDF/Word)'}
                  </button>
                </div>
                
                {uploadedFile && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate flex-1">{uploadedFile.name}</span>
                    <button 
                      onClick={() => {
                        setUploadedFile(null);
                        setFileContent('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt.trim() && !fileContent)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm text-sm mt-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Map
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
