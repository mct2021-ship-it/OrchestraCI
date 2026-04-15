import React, { useState } from 'react';
import { Pricing } from './Pricing';
import { motion } from 'motion/react';
import { PlanType } from '../context/PlanContext';

export function BetaSignup({ onComplete }: { onComplete: (user: { name: string, email: string, plan: PlanType }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  if (step === 1) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-800"
        >
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Join the Beta</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Enter your details to access the Orchestra CI beta platform.</p>
          
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              setError('Please enter a valid email address.');
              return;
            }
            setError(null);
            setStep(2); 
          }} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                placeholder="Jane Doe" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                placeholder="jane@example.com" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors mt-4"
            >
              Continue
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Try Orchestra CI Beta</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Choose how you want to experience the platform.</p>
      </div>

      <div className="max-w-3xl mx-auto px-8 mb-16 flex flex-col sm:flex-row gap-6 justify-center">
        <button 
          onClick={() => onComplete({ name, email, plan: 'professional' })}
          className="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 p-8 rounded-3xl transition-all flex flex-col items-center gap-3 shadow-sm hover:shadow-md"
        >
          <span className="font-black text-2xl">Try Professional Beta</span>
          <span className="text-sm font-medium opacity-80">Free during beta period</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-8 mb-8 text-center">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-8 bg-indigo-50 dark:bg-indigo-900/20 inline-block px-4 py-2 rounded-full">
          Discounts are available to charities and not-for-profits. Please contact us for more details.
        </p>
        <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full mb-8"></div>
        <h3 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-4">Pricing Information</h3>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mb-8">Review the features included in each plan after the beta period.</p>
      </div>

      <Pricing hideHeader={true} onSelectPlan={(plan) => onComplete({ name, email, plan: plan as PlanType })} />
    </div>
  );
}
