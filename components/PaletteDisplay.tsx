import React from 'react';
import { ColorInfo } from '../types';

interface PaletteDisplayProps {
  colors: ColorInfo[];
  loading: boolean;
  analyzingNames: boolean;
}

export const PaletteDisplay: React.FC<PaletteDisplayProps> = ({ colors, loading, analyzingNames }) => {
  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-[#A84C32]">
        <div className="cloud-loader mb-4"></div>
        <p className="serif text-lg animate-pulse">Extracting Colors...</p>
      </div>
    );
  }

  if (colors.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center border-2 border-dashed border-[#D8C29D] rounded-lg bg-white/30">
        <p className="text-[#8C7B6C] serif">Upload an image to reveal its colors.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {colors.map((color, idx) => (
        <div 
          key={color.hex + idx}
          className="bg-white rounded-lg shadow-md overflow-hidden transform transition hover:-translate-y-1 hover:shadow-xl border border-[#E5D5C0]"
        >
          {/* Color Swatch */}
          <div 
            className="h-32 w-full relative group"
            style={{ backgroundColor: color.hex }}
          >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-sm">
              {color.hex}
            </div>
            {/* Percentage Badge */}
            <span className="absolute bottom-2 right-2 bg-black/30 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
              {color.percentage}%
            </span>
          </div>

          {/* Details */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="serif text-xl font-bold text-[#3E3832]">
                  {analyzingNames ? (
                    <span className="inline-block w-20 h-5 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    color.name || "Unknown"
                  )}
                </h4>
                <p className="text-xs text-[#A84C32] uppercase tracking-wider font-bold">
                  {analyzingNames ? "Analyzing..." : color.enName || "Custom"}
                </p>
              </div>
              {color.pinyin && (
                <span className="text-xs text-gray-400 font-serif italic">{color.pinyin}</span>
              )}
            </div>

            {/* Values */}
            <div className="space-y-1 mt-3 border-t border-gray-100 pt-2 text-xs text-gray-600 font-mono">
              <div className="flex justify-between">
                <span>RGB</span>
                <span>{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
              </div>
              <div className="flex justify-between">
                <span>CMYK</span>
                <span>{color.cmyk.c}, {color.cmyk.m}, {color.cmyk.y}, {color.cmyk.k}</span>
              </div>
              <div className="flex justify-between">
                <span>HEX</span>
                <span>{color.hex}</span>
              </div>
            </div>

             {/* Description tooltip/text */}
             {!analyzingNames && color.description && (
                <p className="mt-2 text-xs text-gray-500 italic border-l-2 border-[#D8C29D] pl-2 line-clamp-2">
                    {color.description}
                </p>
             )}
          </div>
        </div>
      ))}
    </div>
  );
};