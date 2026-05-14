import React, { useState } from 'react';
import { InventoryItem, Transaction } from '../types';
import { getInventoryInsights } from '../services/geminiService';
import { Bot, Send, X, Loader2 } from 'lucide-react';

interface AIAssistantProps {
  inventory: InventoryItem[];
  history: Transaction[];
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ inventory, history, isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);
    const result = await getInventoryInsights(inventory, history, prompt);
    setResponse(result);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h2 className="font-bold">Smart Assistant</h2>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-700 border border-slate-100">
          Hello! I can help you analyze your inventory data. Ask me about stock levels, valuation trends, or recent activity.
        </div>
        
        {response && (
            <div className="flex justify-start animate-fade-in">
                <div className="bg-white p-4 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-800 border border-slate-100 prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed">{response}</p>
                </div>
            </div>
        )}

        {loading && (
             <div className="flex justify-center py-4">
                 <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
             </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleAsk} className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            placeholder="Ask about your inventory..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};