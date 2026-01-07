
import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { PaletteDisplay } from './components/PaletteDisplay';
import { ColorInfo, ProcessingSettings } from './types';
import { extractColorsFromImage } from './services/colorService';
import { analyzeColorsWithAI } from './services/geminiService';

/**
 * Main application component for Dunhuang Color Extraction.
 * Orchestrates local color extraction and cloud-based AI pigment identification.
 */
const App = () => {
  const [image, setImage] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [settings, setSettings] = useState<ProcessingSettings>({
    colorCount: 6,
    samplePrecision: 5,
    brighten: false,
    ignoreGrayscale: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const src = event.target?.result as string;
        setImage(src);
        processImage(src, settings);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (src: string, currentSettings: ProcessingSettings) => {
    setLoading(true);
    try {
      // Phase 1: Local Algorithm (K-Means) for dominant color extraction
      const extracted = await extractColorsFromImage(src, currentSettings);
      setColors(extracted);
      setLoading(false);
      
      // Phase 2: AI Enrichment (Gemini) for pigment identification
      setAnalyzing(true);
      const enriched = await analyzeColorsWithAI(extracted);
      setColors(enriched);
    } catch (err) {
      console.error("Mural analysis failed:", err);
      setLoading(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSettingsUpdate = (newSettings: ProcessingSettings) => {
    setSettings(newSettings);
    if (image) {
      processImage(image, newSettings);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E3832] pb-20">
      <Header />
      
      <main className="container mx-auto px-4 mt-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Mural Preview & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative aspect-video bg-white border-2 border-dashed border-[#D8C29D] rounded-xl overflow-hidden cursor-pointer hover:border-[#A84C32] transition-colors shadow-sm"
            >
              {image ? (
                <img src={image} alt="Mural Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-4xl mb-2">🖼️</span>
                  <p className="serif font-bold text-[#8C7B6C]">Upload Mural Segment</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-mono">JPG / PNG / WEBP</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />

            <ControlPanel 
              settings={settings} 
              onUpdate={handleSettingsUpdate} 
              disabled={loading || analyzing}
            />

            <div className="p-4 bg-[#E5D5C0]/20 rounded-lg border border-[#E5D5C0] text-xs leading-relaxed italic text-[#8C7B6C]">
              Note: Mineral pigments used in Dunhuang murals often oxidize over time. Cinnabar may darken, and Minium often turns black. Use "PCCS Brighten" to view potential original states.
            </div>
          </div>

          {/* Color Analysis Display */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6 border-b-2 border-[#A84C32] pb-2">
              <h2 className="serif text-2xl font-bold flex items-center gap-2">
                Pigment Palette
                {analyzing && <span className="text-xs font-normal text-gray-400 animate-pulse ml-2">Identifying Historical Pigments...</span>}
              </h2>
              {colors.length > 0 && (
                <button 
                   onClick={() => window.print()}
                   className="text-xs bg-[#3E3832] text-white px-3 py-1 rounded hover:bg-[#A84C32] transition-colors shadow-lg"
                >
                  Export Palette
                </button>
              )}
            </div>
            
            <PaletteDisplay 
              colors={colors} 
              loading={loading} 
              analyzingNames={analyzing} 
            />
          </div>
        </div>
      </main>

      <footer className="mt-20 pt-10 text-center opacity-60">
        <p className="serif text-sm italic">"Extracting the soul of thousands of years."</p>
        <p className="text-[10px] mt-1">© 2025 Dunhuang Cultural Digitalization Project</p>
        <div className="flex justify-center gap-4 mt-4">
           <span className="w-1.5 h-1.5 rounded-full bg-[#A84C32]"></span>
           <span className="w-1.5 h-1.5 rounded-full bg-[#4B5E52]"></span>
           <span className="w-1.5 h-1.5 rounded-full bg-[#2E4E7E]"></span>
        </div>
      </footer>
    </div>
  );
};

export default App;
