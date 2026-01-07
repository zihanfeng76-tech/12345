import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { PaletteDisplay } from './components/PaletteDisplay';
import { extractColors, generatePaletteImage } from './services/colorService';
import { getDunhuangColorNames } from './services/geminiService';
import { DEFAULT_SETTINGS, MOCK_PALETTE_NAME } from './constants';
import { Palette, ProcessingSettings } from './types';

function App() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [savedPalettes, setSavedPalettes] = useState<Palette[]>([]);
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNaming, setIsNaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Saved Palettes
  useEffect(() => {
    const saved = localStorage.getItem('dunhuang_palettes');
    if (saved) {
      try {
        setSavedPalettes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Process Image when Image or Settings change
  useEffect(() => {
    if (!currentImage) return;

    const process = async () => {
      setIsProcessing(true);
      setError(null);
      setIsNaming(false);

      try {
        const extractedColors = await extractColors(currentImage, settings);
        
        const tempPalette: Palette = {
          id: Date.now().toString(),
          name: MOCK_PALETTE_NAME,
          colors: extractedColors,
          createdAt: Date.now(),
          sourceImage: currentImage
        };
        setPalette(tempPalette);
        setIsProcessing(false);

        setIsNaming(true);
        const namedColors = await getDunhuangColorNames(extractedColors);
        
        setPalette(prev => prev ? { ...prev, colors: namedColors } : null);
      } catch (err) {
        console.error(err);
        setError("Failed to process image. Please try a different file.");
      } finally {
        setIsProcessing(false);
        setIsNaming(false);
      }
    };

    const timer = setTimeout(process, 300);
    return () => clearTimeout(timer);

  }, [currentImage, settings.colorCount, settings.ignoreGrayscale, settings.samplePrecision, settings.brighten]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setCurrentImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const savePalette = () => {
    if (!palette) return;
    const newSaved = [palette, ...savedPalettes];
    setSavedPalettes(newSaved);
    localStorage.setItem('dunhuang_palettes', JSON.stringify(newSaved));
    alert("Palette saved to collection!");
  };

  const exportJSON = () => {
    if (!palette) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(palette, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dunhuang-palette-${palette.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportCSS = () => {
    if (!palette) return;
    let cssContent = ":root {\n";
    palette.colors.forEach((c, i) => {
      const safeName = c.enName ? c.enName.toLowerCase().replace(/\s+/g, '-') : `color-${i+1}`;
      cssContent += `  --dunhuang-${safeName}: ${c.hex};\n`;
    });
    cssContent += "}\n";
    
    const dataStr = "data:text/css;charset=utf-8," + encodeURIComponent(cssContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dunhuang-vars-${palette.id}.css`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportPNG = async () => {
    if (!palette) return;
    const dataUrl = await generatePaletteImage(palette.colors, palette.name);
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.download = `dunhuang-card-${palette.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
            setError("Image size exceeds 10MB limit.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (typeof ev.target?.result === 'string') {
                setCurrentImage(ev.target.result);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <Header />
      
      <main className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upload & Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Upload Area */}
          <div 
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragOver ? 'border-[#A84C32] bg-[#A84C32]/10' : 'border-[#D8C29D] hover:border-[#A84C32] bg-white/40'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleFileUpload}
            />
            
            {currentImage ? (
              <img src={currentImage} alt="Preview" className="mx-auto max-h-48 rounded shadow-lg object-contain" />
            ) : (
              <div className="text-[#8C7B6C]">
                 <svg className="w-12 h-12 mx-auto mb-2 text-[#A84C32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 <p className="serif text-lg font-bold">Drop image or click to upload</p>
                 <p className="text-sm mt-1">JPG, PNG, WebP (Max 10MB)</p>
              </div>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                 <div className="cloud-loader"></div>
              </div>
            )}
          </div>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">{error}</div>}

          <ControlPanel 
            settings={settings} 
            onUpdate={setSettings} 
            disabled={isProcessing} 
          />
        </div>

        {/* Right Column: Palette Display & Actions */}
        <div className="lg:col-span-8">
          
          {/* Actions Bar */}
          {palette && (
             <div className="flex flex-wrap gap-2 mb-6 justify-between items-center bg-[#E5D5C0]/50 p-4 rounded-lg">
                <div className="serif text-xl font-bold text-[#A84C32]">
                   {palette.colors.length} Colors Found
                </div>
                <div className="flex gap-2">
                   <button onClick={savePalette} className="px-4 py-2 bg-[#3E3832] text-[#F2E8D5] rounded hover:bg-[#5C5046] transition text-sm">Save Palette</button>
                   <div className="h-6 w-px bg-[#A84C32]/30 mx-1"></div>
                   <button onClick={exportJSON} className="px-3 py-2 bg-white border border-[#D8C29D] text-[#3E3832] rounded hover:bg-[#FAF5EB] transition text-xs font-mono">JSON</button>
                   <button onClick={exportCSS} className="px-3 py-2 bg-white border border-[#D8C29D] text-[#3E3832] rounded hover:bg-[#FAF5EB] transition text-xs font-mono">CSS</button>
                   <button onClick={exportPNG} className="px-3 py-2 bg-[#A84C32] text-white rounded hover:bg-[#C25E42] transition text-xs font-bold">Export Card</button>
                </div>
             </div>
          )}

          <PaletteDisplay 
            colors={palette?.colors || []} 
            loading={isProcessing} 
            analyzingNames={isNaming}
          />
          
          {/* Saved History */}
          {savedPalettes.length > 0 && (
             <div className="mt-12 pt-8 border-t border-[#D8C29D]">
                <h3 className="serif text-2xl text-[#3E3832] mb-6">Your Collection</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {savedPalettes.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded shadow hover:shadow-lg transition">
                      <div className="flex h-16 rounded overflow-hidden mb-2">
                        {p.colors.slice(0, 5).map(c => (
                          <div key={c.hex} style={{backgroundColor: c.hex, flex: c.percentage}} className="h-full"></div>
                        ))}
                      </div>
                      <h5 className="font-bold text-sm text-[#3E3832] truncate">{p.name}</h5>
                      <div className="text-xs text-gray-500 flex justify-between mt-1">
                         <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                         <button 
                           onClick={() => setPalette(p)}
                           className="text-[#A84C32] hover:underline"
                         >Load</button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

        </div>
      </main>
      
      <footer className="mt-20 py-6 text-center text-[#8C7B6C] text-sm border-t border-[#D8C29D]/50">
        <p className="serif">Inspired by the Mogao Caves • Built with React & Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;