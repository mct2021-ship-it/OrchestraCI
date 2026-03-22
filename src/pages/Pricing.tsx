import React, { useState } from 'react';
import { Check, X, Zap, Building2, Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

type Currency = 'GBP' | 'USD' | 'EUR';

const currencySymbols: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€'
};

export function Pricing({ onSelectPlan, hideHeader }: { onSelectPlan?: (plan: string) => void, hideHeader?: boolean }) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<Currency>('GBP');

  const tiers = [
    {
      name: 'Starter',
      description: 'Perfect for small teams or consultancies.',
      icon: Rocket,
      monthlyPrice: { GBP: 99, USD: 129, EUR: 119 },
      annualPrice: { GBP: 89, USD: 116, EUR: 107 },
      minUsers: 3,
      additionalUserPrice: { GBP: 29, USD: 39, EUR: 35 },
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      features: [
        '3 Active Project Slots',
        '10 Total Project Creations / year',
        'Max 3 Journey Maps per Project',
        'Max 5 Total Personas',
        'Max 3 Personas per Project',
        '1,000 AI Credits / month',
        'Kanban Boards',
        'Risk Registers',
        '5 Free Viewer Accounts',
        'Email Support',
      ],
      notIncluded: [
        'AI-Powered Intelligence',
        'VoC (Voice of Customer) Analysis',
        'Custom Taxonomy',
        'Dedicated Success Manager',
      ]
    },
    {
      name: 'Professional',
      description: 'For growing organizations scaling their CX operations.',
      icon: Zap,
      monthlyPrice: { GBP: 221, USD: 289, EUR: 265 },
      annualPrice: { GBP: 199, USD: 259, EUR: 239 },
      minUsers: 5,
      additionalUserPrice: { GBP: 49, USD: 59, EUR: 55 },
      isPopular: true,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500',
      lightBg: 'bg-indigo-50 dark:bg-indigo-900/20',
      features: [
        '15 Active Project Slots',
        '50 Total Project Creations / year',
        'Unlimited Journey & Process Maps',
        'Max 25 Total Personas',
        'Max 10 Personas per Project',
        '50,000 AI Credits / month',
        'Kanban Boards & Risk Registers',
        'AI-Powered Intelligence',
        'VoC (Voice of Customer) Analysis',
        'Custom Taxonomy',
        '25 Free Viewer Accounts',
        'Priority Support',
      ],
      notIncluded: [
        'Single Sign-On (SSO)',
        'Dedicated Success Manager',
      ]
    },
    {
      name: 'Enterprise',
      description: 'Full-scale CX orchestration for large enterprises, Housing Associations & Local Authorities.',
      icon: Building2,
      monthlyPrice: 'Custom',
      annualPrice: 'Fixed Annual',
      minUsers: 10,
      additionalUserPrice: 'Custom',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500',
      lightBg: 'bg-rose-50 dark:bg-rose-900/20',
      features: [
        'Everything in Professional',
        'Fixed Annual Pricing Options',
        'Unlimited Active Projects',
        'Unlimited Project Creations',
        'Unlimited AI Credits',
        'Unlimited Personas',
        'Unlimited Free Viewer Accounts',
        'Single Sign-On (SSO)',
        'Custom Security Policies',
        'Dedicated Success Manager',
        'On-premise Deployment Options',
        '24/7 Phone Support',
      ],
      notIncluded: []
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        {!hideHeader && (
          <>
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
              Pricing that scales with your <span className="text-indigo-600 dark:text-indigo-400">CX maturity</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Whether you're just starting to map journeys or orchestrating complex enterprise experiences, we have a plan for you.
            </p>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-4 bg-indigo-50 dark:bg-indigo-900/20 inline-block px-4 py-2 rounded-full">
              Discounts are available to charities and not-for-profits. Please contact us for more details.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
          {/* Currency Toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {(['GBP', 'USD', 'EUR'] as Currency[]).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  currency === c 
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700" 
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border border-transparent"
                )}
              >
                {c} ({currencySymbols[c]})
              </button>
            ))}
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-6">
            <span className={cn("text-sm font-bold", !isAnnual ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400")}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-7 bg-zinc-300 dark:bg-zinc-700 rounded-full p-1 relative transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <motion.div 
                className="w-5 h-5 bg-indigo-600 rounded-full shadow-md"
                animate={{ x: isAnnual ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={cn("text-sm font-bold flex items-center gap-2", isAnnual ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400")}>
              Annually
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] uppercase tracking-wider">Save 10%</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, idx) => {
          const currentMonthly = typeof tier.monthlyPrice === 'string' ? tier.monthlyPrice : tier.monthlyPrice[currency];
          const currentAnnual = typeof tier.annualPrice === 'string' ? tier.annualPrice : tier.annualPrice[currency];
          const currentAdditional = typeof tier.additionalUserPrice === 'string' ? tier.additionalUserPrice : tier.additionalUserPrice?.[currency];
          const sym = currencySymbols[currency];

          return (
            <motion.div 
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-xl",
                tier.isPopular ? "border-indigo-500 dark:border-indigo-500 shadow-indigo-100 dark:shadow-none scale-105 z-10" : "border-zinc-200 dark:border-zinc-800"
              )}
            >
              {tier.isPopular && (
                <div className="absolute top-0 inset-x-0 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 text-center">
                  Most Popular
                </div>
              )}
              
              <div className={cn("p-8 border-b border-zinc-100 dark:border-zinc-800", tier.isPopular ? "pt-12" : "")}>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", tier.lightBg)}>
                  <tier.icon className={cn("w-6 h-6", tier.color)} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 h-10">{tier.description}</p>
                
                <div className="mt-6 flex items-baseline gap-2">
                  {typeof currentMonthly === 'number' ? (
                    <>
                      <span className="text-4xl font-black text-zinc-900 dark:text-white">
                        {sym}{isAnnual ? currentAnnual : currentMonthly}
                      </span>
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">/user/month</span>
                    </>
                  ) : (
                    <span className="text-4xl font-black text-zinc-900 dark:text-white">{currentMonthly}</span>
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {typeof currentMonthly === 'number' && typeof currentAnnual === 'number' && isAnnual && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Billed {sym}{currentAnnual * 12} annually
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {tier.minUsers} users minimum
                  </p>
                  {currentAdditional && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {typeof currentAdditional === 'number' ? `+${sym}${currentAdditional}/mo per additional editor` : 'Custom pricing for additional editors'}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-4 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={cn("w-5 h-5 shrink-0", tier.color)} />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                    </li>
                  ))}
                  {tier.notIncluded.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 opacity-50">
                      <X className="w-5 h-5 shrink-0 text-zinc-400" />
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => onSelectPlan ? onSelectPlan(tier.name.toLowerCase()) : null}
                  className={cn(
                  "mt-8 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                  tier.isPopular 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}>
                  {tier.name === 'Enterprise' ? 'Contact Sales' : (onSelectPlan ? `Select ${tier.name}` : 'Start 14-Day Free Trial')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* AI Credits Explanation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">What are AI Credits?</h3>
            <p className="text-zinc-500 dark:text-zinc-400">
              AI Credits power our intelligent features like Persona generation, Journey Orchestration, and Automated Insights. 
              Credits are consumed based on the complexity of the task:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Simple Generation</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">10 Credits</p>
                <p className="text-[10px] text-zinc-500 italic">e.g. User Stories, RAID mitigations</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Advanced Analysis</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">50 Credits</p>
                <p className="text-[10px] text-zinc-500 italic">e.g. Persona creation, VOC analysis</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Deep Intelligence</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">250 Credits</p>
                <p className="text-[10px] text-zinc-500 italic">e.g. Journey Assessment, ROI Reports</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Live Chat</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">5 Credits / msg</p>
                <p className="text-[10px] text-zinc-500 italic">e.g. Orchestra AI Chatbot</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
