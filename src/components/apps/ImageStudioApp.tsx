import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, Layers, Wand2 } from 'lucide-react';

export const ImageStudioApp: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('16:9');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  );
  const [textNote, setTextNote] = useState<string>('Sample AI artwork generated for Mick AI OS Desktop.');

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        setTextNote(data.text || 'Image created using Gemini Image Model.');
      } else {
        setTextNote('Could not parse image output from server response.');
      }
    } catch (err: any) {
      setTextNote('Generation error: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-slate-100">Mick AI Image Studio</h3>
            <p className="text-[10px] text-slate-400">Powered by Gemini 3.1 Flash Image Engine</p>
          </div>
        </div>

        {imageUrl && (
          <a
            href={imageUrl}
            download="mick_ai_art.png"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </a>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Controls Sidebar */}
        <div className="w-full md:w-80 p-4 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Image Prompt
            </label>
            <textarea
              rows={4}
              placeholder="Describe what you want Gemini to paint or edit... (e.g. 'Futuristic cybernetic metropolis with glowing violet neon skyline')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['16:9', '1:1', '9:16', '4:3'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                    aspectRatio === ratio
                      ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Image...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Art</span>
              </>
            )}
          </button>

          {/* Preset Styles */}
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Quick Style Suggestions:</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Cyberpunk Neon',
                'Minimalist Glassmorphism',
                '80s Synthwave Sunset',
                'Deep Cosmos Nebula',
                'Digital Oil Painting',
              ].map((style) => (
                <button
                  key={style}
                  onClick={() => setPrompt((p) => `${p} ${style}`.trim())}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 transition-colors"
                >
                  + {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Display Canvas Area */}
        <div className="flex-1 p-6 bg-slate-950 flex flex-col items-center justify-center relative overflow-y-auto">
          {imageUrl ? (
            <div className="max-w-2xl w-full flex flex-col items-center gap-3">
              <div className="relative group rounded-2xl overflow-hidden border border-slate-800 shadow-2xl max-h-[460px] bg-slate-900 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Generated AI Art"
                  className="w-full h-auto object-contain max-h-[440px]"
                />
              </div>

              {textNote && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs text-center max-w-xl">
                  {textNote}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500 space-y-2">
              <Layers className="w-12 h-12 mx-auto text-slate-700 animate-pulse" />
              <p className="text-sm font-medium">Enter a prompt to create AI wallpaper or artwork</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
