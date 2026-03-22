import React, { useState, useRef } from 'react';
import { X, Upload, Wand2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ProcessMap } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AiProcessGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (processMap: ProcessMap) => void;
  projectId: string;
}

export function AiProcessGeneratorModal({ isOpen, onClose, onGenerate, projectId }: AiProcessGeneratorModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      try {
        let text = '';
        if (selectedFile.type === 'application/pdf') {
          text = await extractTextFromPdf(selectedFile);
        } else if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          text = await extractTextFromDocx(selectedFile);
        } else {
           // Fallback for text files
           const textContent = await selectedFile.text();
           text = textContent;
        }
        setTextInput(text);
      } catch (err) {
        console.error('Error reading file:', err);
        setError('Failed to read file content. Please try again.');
        setFile(null);
        setTextInput('');
      }
    }
  };

  const generateProcessMap = async () => {
    if (!textInput.trim()) {
      setError('Please provide some process text or upload a document.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a structured process map from the following SOP/Process document text. 
        Return a JSON object with:
        - 'title': string
        - 'nodes': array of { id: string, label: string, description: string }
        - 'edges': array of { sourceId: string, targetId: string, label?: string }
        
        Process Text:
        ${textInput}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["id", "label", "description"]
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sourceId: { type: Type.STRING },
                    targetId: { type: Type.STRING },
                    label: { type: Type.STRING }
                  },
                  required: ["sourceId", "targetId"]
                }
              }
            },
            required: ["title", "nodes", "edges"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      // Simple layout logic: horizontal sequence with some vertical offset for branches
      const nodes = (result.nodes || []).map((node: any, index: number) => ({
        id: node.id,
        position: { x: index * 250, y: (index % 2 === 0 ? 0 : 50) },
        data: { label: node.label, description: node.description }
      }));

      const edges = (result.edges || []).map((edge: any) => ({
        id: `e-${edge.sourceId}-${edge.targetId}`,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label
      }));

      const newProcessMap: ProcessMap = {
        id: uuidv4(),
        projectId: projectId,
        title: result.title || 'AI Generated Process',
        nodes,
        edges
      };

      onGenerate(newProcessMap);
      onClose();
      setFile(null);
      setTextInput('');
    } catch (err) {
      console.error('AI Generation Error:', err);
      setError('Failed to generate process map. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">AI Process Generator</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Upload an SOP to generate a visual map.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                file ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".txt,.md,.doc,.docx,.pdf"
              />
              <Upload className={`w-10 h-10 mx-auto mb-4 ${file ? 'text-indigo-600' : 'text-zinc-300'}`} />
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">
                {file ? file.name : 'Upload SOP or Process Document'}
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Support for .txt, .md, .pdf, .docx
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-x-0 top-0 flex items-center justify-center -translate-y-1/2">
                <span className="bg-white dark:bg-zinc-900 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Or Paste Text</span>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your standard operating procedure or process steps here..."
                className="w-full h-48 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateProcessMap}
            disabled={isGenerating || !textInput.trim()}
            className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Process Map
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
