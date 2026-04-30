import React, { useState, useRef } from 'react';
import { X, Sparkles, Loader2, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Sprint, Project, Task } from '../types';
import { ThinkingLevel } from '@google/genai';
import { getGeminiClient, ensureApiKey } from '../lib/gemini';
import { AI_MODELS } from '../lib/aiConfig';
import { stripPIData } from '../lib/piStripper';
import { useToast } from '../context/ToastContext';
import { fixOklch } from '../lib/utils';
import Markdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface SprintReportModalProps {
  sprint: Sprint;
  tasks: Task[];
  project: Project;
  onClose: () => void;
}

export function SprintReportModal({ sprint, tasks, project, onClose }: SprintReportModalProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const handleExportImage = async () => {
    if (!contentRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      addToast('Generating image...', 'info');
      // Temporarily set a fixed width to prevent cutoff
      const originalWidth = contentRef.current.style.width;
      contentRef.current.style.width = '800px';
      
      const canvas = await html2canvas(contentRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });
      
      contentRef.current.style.width = originalWidth;
      
      const link = document.createElement('a');
      link.download = `Sprint_Report_${sprint.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      addToast('Image exported successfully', 'success');
    } catch (error) {
      console.error('Error generating image:', error);
      addToast('Failed to export image', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current || isExporting) return;

    setIsExporting(true);
    try {
      addToast('Generating PDF...', 'info');
      // Temporarily set a fixed width to prevent cutoff
      const originalWidth = contentRef.current.style.width;
      contentRef.current.style.width = '800px';

      const canvas = await html2canvas(contentRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#18181b' : '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          fixOklch(clonedDoc);
        }
      });

      contentRef.current.style.width = originalWidth;
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width / 2;
      const imgHeight = canvas.height / 2;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Sprint_Report_${sprint.name.replace(/\s+/g, '_')}.pdf`);
      addToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      await ensureApiKey();
      const ai = await getGeminiClient();
      if (!ai) {
        throw new Error('AI client not initialized');
      }

      const prompt = `
Generate a professional, nicely formatted sprint report for "${stripPIData(project.name)}" - ${stripPIData(sprint.name)}.

Sprint Description/Goals: ${stripPIData(sprint.description || 'No specific goals provided.')}
Completed At: ${sprint.completedAt ? new Date(sprint.completedAt).toLocaleDateString() : 'N/A'}

Here are the tasks that were part of this sprint:
${tasks.map(t => `- [${t.kanbanStatus}] ${stripPIData(t.title)} (${t.impact} Impact, ${t.effort} Effort, Owner: ${t.owner ? stripPIData(t.owner) : 'Unassigned'})
  Description: ${stripPIData(t.description || 'N/A')}`).join('\n')}

Please provide a summary of the work completed, highlighting key achievements, high impact items, and overall progress. Use markdown formatting.

CRITICAL INSTRUCTIONS:
- ONLY use the data provided above.
- DO NOT invent, hallucinate, or assume any metrics like velocity, burn-down charts, story points, or capacity unless they are explicitly in the data.
- DO NOT mention any team members or tasks that are not listed above.
- Ensure the members involved and tasks completed are accurately reflected based ONLY on the provided task list.
- Format the report nicely with clear headings, bullet points, and bold text for emphasis.
`;

      const response = await ai.models.generateContent({
        model: AI_MODELS.chat,
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert agile project manager. Generate clear, concise, and professional sprint reports.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      setReport(response.text || 'Failed to generate report.');
    } catch (error) {
      console.error('Error generating sprint report:', error);
      addToast('Failed to generate sprint report', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Sprint Report</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{sprint.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50 dark:bg-zinc-900/50">
          {!report && !isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles className="w-12 h-12 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Generate AI Sprint Report</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
                Let AI analyze the tasks completed in this sprint and generate a comprehensive summary of achievements and progress.
              </p>
              <button
                onClick={generateReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Sparkles className="w-5 h-5" />
                Generate Report
              </button>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Analyzing Sprint Data...</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Generating your comprehensive sprint report.</p>
            </div>
          ) : (
            <div ref={contentRef} className="bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm prose prose-zinc dark:prose-invert max-w-none">
              <div className="markdown-body">
                <Markdown>{report}</Markdown>
              </div>
            </div>
          )}
        </div>

        {report && (
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportImage}
                disabled={isExporting}
                className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
                title="Export as Image"
              >
                <ImageIcon className="w-4 h-4" />
                <span>PNG</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
                title="Export as PDF"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={generateReport}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={onClose}
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
