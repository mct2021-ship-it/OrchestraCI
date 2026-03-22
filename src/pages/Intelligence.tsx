import React, { useState } from 'react';
import { BrainCircuit, Upload, FileText, MessageSquare, BarChart3, Sparkles, Database, ArrowRight, CheckCircle2, Building2, Target, Gauge, Heart, Trash2, Star, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { VocSection } from '../components/VocSection';
import { NpsCalculator } from '../components/NpsCalculator';
import { YourCompany, CompanyProfile } from '../components/YourCompany';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/ContextualHelp';

interface IntelligenceProps {
  companyProfile?: CompanyProfile;
  onUpdateProfile?: (updates: Partial<CompanyProfile>) => void;
  startInEditMode?: boolean;
  onSaveComplete?: () => void;
}

export function Intelligence({ companyProfile: propProfile, onUpdateProfile, startInEditMode, onSaveComplete }: IntelligenceProps) {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'overview' | 'sources' | 'analysis'>(startInEditMode ? 'profile' : 'overview');
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    if (startInEditMode) {
      setActiveTab('profile');
    }
  }, [startInEditMode]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [uploadedData, setUploadedData] = useState([
    { id: 1, date: '2024-03-15', source: 'Trustpilot', type: 'Reviews', count: 1240, status: 'Synced' },
    { id: 2, date: '2024-03-14', source: 'HubSpot', type: 'Tickets', count: 850, status: 'Synced' },
    { id: 3, date: '2024-03-10', source: 'Manual', type: 'Survey', count: 150, status: 'Processed' },
  ]);

  const handleDeleteData = (id: number) => {
    setUploadedData(uploadedData.filter(d => d.id !== id));
  };

  // Fallback profile if not provided (though it should be from App.tsx)
  const defaultProfile: CompanyProfile = {
    name: '',
    vertical: '',
    description: '',
    customerBenefits: '',
    targetEmotions: [],
    measurementMethods: []
  };

  const profile = propProfile || defaultProfile;

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <ContextualHelp 
        title="Intelligence Hub" 
        description="Centralize your customer data, company profile, and satisfaction metrics. Use this hub to inform your journey maps and drive data-backed improvements."
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-600" />
            Intelligence Hub
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
            Build a deep understanding of your business and customers to drive continuous improvement.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'overview'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <BrainCircuit className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'sources'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <Database className="w-4 h-4" />
          Data Sources
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'analysis'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Analysis & Insights
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'profile'
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          <Building2 className="w-4 h-4" />
          Company Profile
        </button>
      </div>

      {activeTab === 'profile' && (
        <YourCompany 
          profile={profile} 
          onUpdateProfile={onUpdateProfile || (() => {})} 
          startInEditMode={startInEditMode}
          onSaveComplete={onSaveComplete}
        />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* I-SEE Graphic */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">I-SEE Framework</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Our core methodology for understanding and optimizing the complete customer experience.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Intelligence */}
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-300">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Intelligence</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Understanding the current experience through surveys, interviews, tickets, and complaints.
                </p>
              </div>

              {/* Success */}
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-300">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Success</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Measuring how well you meet customer needs and enabling them to be successful.
                </p>
              </div>

              {/* Effort */}
              <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-300">
                  <Gauge className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Effort</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Ensuring customers achieve goals quickly and simply. Reducing friction at every step.
                </p>
              </div>

              {/* Emotion */}
              <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800/50">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-800 rounded-xl flex items-center justify-center mb-4 text-rose-600 dark:text-rose-300">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Emotion</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Understanding how your customers feel versus how you want them to feel.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-bold text-zinc-900 dark:text-white">Recent Insights</h3>
                  <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                </div>
                <div className="divide-y divide-zinc-100">
                  {[
                    { title: 'High friction in onboarding', type: 'Support Tickets', impact: 'Negative Emotion', date: '2 days ago' },
                    { title: 'Pricing page lacks clarity', type: 'User Interviews', impact: 'High Effort', date: '1 week ago' },
                    { title: 'Great response time from support', type: 'CSAT Survey', impact: 'Positive Emotion', date: '2 weeks ago' },
                  ].map((insight, i) => (
                    <div key={i} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 transition-colors flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-bold text-zinc-900 dark:text-white">{insight.title}</h4>
                        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1"><Database className="w-3 h-3" /> {insight.type}</span>
                          <span>•</span>
                          <span>{insight.date}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        insight.impact.includes('Negative') || insight.impact.includes('High') 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {insight.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 p-12 bg-indigo-500/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <h3 className="text-lg font-bold mb-2 relative z-10">Improvement Cycle</h3>
              <div className="space-y-4 relative z-10 mt-6">
                {[
                  { step: '1', title: 'Intelligence', desc: 'Gather data and feedback.' },
                  { step: '2', title: 'Personas', desc: 'Build profiles from real data.' },
                  { step: '3', title: 'Journey', desc: 'Map current state pain points.' },
                  { step: '4', title: 'Tasks', desc: 'Execute changes (Discover to Deliver).' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 text-sm">{item.title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Connections */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Active Connections</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your integrated data streams.</p>
                  </div>
                  <button 
                    onClick={handleUpload}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Manual Upload
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Source</th>
                        <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Last Sync</th>
                        <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Records</th>
                        <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {uploadedData.map((row) => (
                        <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                                {row.source === 'Trustpilot' && <img src="https://cdn.simpleicons.org/trustpilot" className="w-4 h-4" />}
                                {row.source === 'HubSpot' && <img src="https://cdn.simpleicons.org/hubspot" className="w-4 h-4" />}
                                {row.source === 'Manual' && <FileText className="w-4 h-4 text-zinc-500" />}
                              </div>
                              <span className="text-sm font-bold text-zinc-900 dark:text-white">{row.source}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{row.date}</td>
                          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300 font-mono">
                            {row.count.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 uppercase tracking-wider">
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                             <button className="p-1 text-zinc-400 hover:text-indigo-600 transition-colors" title="Sync Now">
                               <RefreshCw className="w-4 h-4" />
                             </button>
                             <button className="p-1 text-zinc-400 hover:text-rose-600 transition-colors" title="Remove" onClick={() => handleDeleteData(row.id)}>
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Integration Grid */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white px-2">Available Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Salesforce', category: 'CRM', icon: 'salesforce' },
                    { name: 'Zendesk', category: 'Support', icon: 'zendesk' },
                    { name: 'Intercom', category: 'Support', icon: 'intercom' },
                    { name: 'SurveyMonkey', category: 'Surveys', icon: 'surveymonkey' },
                    { name: 'Qualtrics', category: 'Surveys', icon: 'qualtrics' },
                    { name: 'G2', category: 'Reviews', icon: 'g2' },
                  ].map((int) => (
                    <div key={int.name} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group hover:border-indigo-500 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center p-2">
                          <img src={`https://cdn.simpleicons.org/${int.icon}`} alt={int.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{int.name}</h4>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{int.category}</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">Connect</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manual Upload Sidebar */}
            <div className="space-y-6">
              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
                <h3 className="text-lg font-bold mb-4">Import Data</h3>
                <p className="text-indigo-100 text-sm mb-6">
                  Upload your customer research, feedback, and analytics to generate AI-powered insights.
                </p>
                
                <div 
                  className="border-2 border-dashed border-indigo-400/50 rounded-2xl p-8 text-center hover:bg-indigo-500 transition-colors cursor-pointer flex flex-col items-center justify-center bg-indigo-700/30"
                  onClick={handleUpload}
                >
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : uploadSuccess ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-xs font-bold">Drop files here</span>
                    </>
                  )}
                </div>
                <input type="file" id="file-upload" className="hidden" />
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
                <h4 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  AI Data Mapping
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Our AI automatically maps fields from your CRM or survey exports to our standard intelligence schema. No manual mapping required.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Analysis & Insights</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Transform raw data into actionable intelligence.</p>
            </div>
          </div>
          <VocSection />
          <NpsCalculator />
        </div>
      )}
    </div>
  );
}
