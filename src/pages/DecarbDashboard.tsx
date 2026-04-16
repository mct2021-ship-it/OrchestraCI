import React, { useState, useMemo } from 'react';
import { Leaf, TrendingDown, Info, ArrowRight, Zap, Globe, BookOpen, Lightbulb, BarChart3, PieChart as PieChartIcon, Target, Sparkles, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { JourneyMap, Project } from '../types';
import { carbonLibrary } from '../data/carbonLibrary';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DecarbDashboardProps {
  journeys: JourneyMap[];
  projects: Project[];
  onNavigate: (tab: string, subTab?: string) => void;
}

export function DecarbDashboard({ journeys, projects, onNavigate }: DecarbDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'education' | 'library'>('overview');

  // Calculate stats
  const stats = useMemo(() => {
    const totalCarbon = journeys.reduce((sum, j) => sum + (j.carbonFootprint || 0), 0);
    const activeProjectsWithCarbon = projects.filter(p => journeys.some(j => j.projectId === p.id && (j.carbonFootprint || 0) > 0));
    const avgCarbonPerJourney = journeys.length > 0 ? totalCarbon / journeys.length : 0;
    
    // Project breakdown
    const projectData = projects.map(p => {
      const projectJourneys = journeys.filter(j => j.projectId === p.id);
      const carbon = projectJourneys.reduce((sum, j) => sum + (j.carbonFootprint || 0), 0);
      return {
        name: p.name,
        carbon: parseFloat(carbon.toFixed(2)),
        journeyCount: projectJourneys.length
      };
    }).filter(p => p.carbon > 0).sort((a, b) => b.carbon - a.carbon);

    // Top contributors (items)
    const allItems: { title: string; carbon: number; journey: string; project: string }[] = [];
    journeys.forEach(j => {
      const project = projects.find(p => p.id === j.projectId);
      j.stages.forEach(s => {
        Object.values(s.laneData).flat().forEach(item => {
          if (typeof item !== 'string' && item.carbonData?.calculatedValue) {
            allItems.push({
              title: item.title,
              carbon: item.carbonData.calculatedValue,
              journey: j.title,
              project: project?.name || 'Unknown'
            });
          }
        });
      });
    });

    const topContributors = allItems.sort((a, b) => b.carbon - a.carbon).slice(0, 5);

    return {
      totalCarbon,
      activeProjectsCount: activeProjectsWithCarbon.length,
      avgCarbonPerJourney,
      projectData,
      topContributors
    };
  }, [journeys, projects]);

  const educationTips = [
    {
      title: "PDF to HTML Transformation",
      description: "Moving from downloadable PDFs to interactive HTML pages can reduce carbon footprint by up to 80% per view.",
      impact: "High",
      category: "Digital",
      tip: "Instead of a 5MB PDF, use a lightweight web page. It saves on data transfer and server storage energy."
    },
    {
      title: "Optimize Image Assets",
      description: "Large, unoptimized images are the primary contributor to web page weight.",
      impact: "Medium",
      category: "Digital",
      tip: "Use WebP or AVIF formats and implement lazy loading to ensure energy is only used for images in the viewport."
    },
    {
      title: "Consolidate Communications",
      description: "Reducing the number of touchpoints in a journey directly reduces the cumulative carbon cost.",
      impact: "High",
      category: "Strategy",
      tip: "Combine multiple notification emails into a single summary or 'digest' email."
    },
    {
      title: "Green Hosting",
      description: "The energy source of your data center matters as much as the amount of energy used.",
      impact: "Critical",
      category: "Infrastructure",
      tip: "Switch to providers that use 100% renewable energy for their data centers (look for Green Web Foundation certification)."
    }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Leaf className="w-8 h-8" />
            </div>
            Decarb Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Track, analyze, and reduce the environmental impact of your customer journeys.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'overview' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'education' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Education & Tips
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'library' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Carbon Library
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">Total Impact</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-white">{stats.totalCarbon.toFixed(2)}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">kg CO2e across all journeys</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">Active Projects</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-white">{stats.activeProjectsCount}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Projects with carbon data</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">Avg. Intensity</span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-white">{stats.avgCarbonPerJourney.toFixed(2)}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">kg CO2e per journey map</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-600/20 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">AI Insights</span>
              </div>
              <div className="text-sm font-medium leading-tight">
                Your proposed journeys show a potential <span className="font-bold">12% reduction</span> in total carbon footprint.
              </div>
              <button 
                onClick={() => onNavigate('intelligence')}
                className="mt-4 w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors"
              >
                View Full Analysis
              </button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Breakdown Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Carbon by Project</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Distribution of estimated footprint across active projects</p>
                </div>
                <BarChart3 className="w-6 h-6 text-zinc-400" />
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.projectData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }}
                    />
                    <Bar dataKey="carbon" radius={[6, 6, 0, 0]} barSize={40}>
                      {stats.projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Top Contributors</h3>
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              
              <div className="space-y-6">
                {stats.topContributors.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-lg font-black text-zinc-400 shrink-0 shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.title}</div>
                      <div className="text-[10px] text-zinc-500 font-medium truncate">{item.journey}</div>
                      <div className="mt-2 h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full" 
                          style={{ width: `${(item.carbon / stats.topContributors[0].carbon) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-rose-600">{item.carbon.toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">kg</div>
                    </div>
                  </div>
                ))}
                
                {stats.topContributors.length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Leaf className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">No carbon data found yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'education' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4">Why Decarbonize Journeys?</h2>
                <p className="text-indigo-100 text-lg leading-relaxed">
                  Every digital interaction, physical touchpoint, and logistical step in a customer journey has a carbon cost. By optimizing these pathways, we don't just improve CX—we build a sustainable future.
                </p>
                <div className="grid grid-cols-2 gap-6 mt-10">
                  <div className="space-y-2">
                    <div className="text-3xl font-black">2%</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">Global Emissions from ICT</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-black">70%</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">Consumers prefer sustainable brands</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-amber-500" />
                Top Decarb Tips
              </h3>
              <div className="space-y-6">
                {educationTips.map((tip, idx) => (
                  <div key={idx} className="group p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                        tip.impact === 'Critical' ? "bg-rose-100 text-rose-600" :
                        tip.impact === 'High' ? "bg-amber-100 text-amber-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {tip.impact} Impact
                      </span>
                      <span className="text-xs font-bold text-zinc-400">{tip.category}</span>
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-2">{tip.title}</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{tip.description}</p>
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-700 text-xs font-medium text-indigo-600 dark:text-indigo-400 italic">
                      " {tip.tip} "
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-500" />
                Open Source Resources
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                We leverage data from leading open-source carbon libraries to provide the most accurate estimates possible.
              </p>
              
              <div className="space-y-4">
                {[
                  { name: "Cloud Carbon Footprint", url: "https://www.cloudcarbonfootprint.org/", desc: "Open source tool to measure and analyze cloud carbon emissions." },
                  { name: "Green Web Foundation", url: "https://www.thegreenwebfoundation.org/", desc: "The world's largest open database of green web hosting." },
                  { name: "UK Government Conversion Factors", url: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting", desc: "Official GHG reporting factors for logistics and energy." },
                  { name: "Sustainable Web Design", url: "https://sustainablewebdesign.org/", desc: "A standard for calculating digital carbon footprints." }
                ].map((resource, idx) => (
                  <a 
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">{resource.name}</div>
                      <div className="text-xs text-zinc-500 mt-1">{resource.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-emerald-500 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
              <div className="absolute bottom-0 left-0 p-32 bg-white/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
              <div className="relative z-10 text-center space-y-4">
                <Zap className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold">Ready to optimize?</h3>
                <p className="text-emerald-50 leading-relaxed">
                  Use the "Estimate with AI" feature in your Journey Maps to automatically identify high-impact touchpoints and get reduction suggestions.
                </p>
                <button 
                  onClick={() => onNavigate('projects')}
                  className="mt-6 px-8 py-3 bg-white text-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-900/20"
                >
                  Go to Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Carbon Coefficient Library</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">The underlying data used for all calculations in Orchestra CI.</p>
            </div>
            <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500">
              {carbonLibrary.length} Active Coefficients
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider pl-8">Category</th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Label</th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Value (kg CO2e)</th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Unit</th>
                  <th className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider pr-8">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {carbonLibrary.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 pl-8">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md",
                        item.category === 'Digital' ? "bg-blue-50 text-blue-600" :
                        item.category === 'Physical' ? "bg-amber-50 text-amber-600" :
                        item.category === 'Logistics' ? "bg-purple-50 text-purple-600" :
                        item.category === 'Human' ? "bg-rose-50 text-rose-600" :
                        "bg-emerald-50 text-emerald-600"
                      )}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 max-w-xs truncate">{item.description}</div>
                    </td>
                    <td className="p-4 font-mono text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      {item.value}
                    </td>
                    <td className="p-4 text-xs text-zinc-500 font-medium">
                      {item.unit}
                    </td>
                    <td className="p-4 pr-8 text-[10px] text-zinc-400 font-bold uppercase">
                      {item.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
