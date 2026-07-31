import React, { useState } from 'react';
import { Calculator, Sparkles, Delete } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBtn = (val: string) => {
    if (display === '0' && val !== '.') {
      setDisplay(val);
    } else {
      setDisplay((prev) => prev + val);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExplanation(null);
  };

  const handleEvaluate = () => {
    try {
      // safe eval for basic math
      const result = eval(display.replace(/×/g, '*').replace(/÷/g, '/'));
      setDisplay(String(result));
    } catch {
      setDisplay('Error');
    }
  };

  const handleExplainMath = async () => {
    if (!display || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Explain the mathematical formula or result of "${display}" in clear, simple terms.`,
        }),
      });
      const data = await res.json();
      setExplanation(data.text || 'No explanation generated.');
    } catch (e: any) {
      setExplanation('Could not evaluate with Gemini.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 font-mono text-xs select-none">
      {/* Display Screen */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 mb-4 text-right">
        <div className="text-2xl font-black text-emerald-400 tracking-wider overflow-x-auto">
          {display}
        </div>
      </div>

      {/* Calculator Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map(
          (btn) => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '=') handleEvaluate();
                else handleBtn(btn);
              }}
              className={`p-3.5 rounded-xl font-bold text-sm transition-all ${
                btn === '='
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white col-span-2'
                  : ['÷', '×', '-', '+'].includes(btn)
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
              }`}
            >
              {btn}
            </button>
          )
        )}
      </div>

      <button
        onClick={handleExplainMath}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-sans font-semibold text-xs flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>Explain Equation with Gemini</span>
      </button>

      {explanation && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-sans text-xs leading-relaxed">
          {explanation}
        </div>
      )}
    </div>
  );
};
