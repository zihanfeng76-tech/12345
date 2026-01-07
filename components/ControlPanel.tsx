import React from 'react';
import { ProcessingSettings } from '../types';

interface ControlPanelProps {
  settings: ProcessingSettings;
  onUpdate: (newSettings: ProcessingSettings) => void;
  disabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onUpdate, disabled }) => {
  const handleChange = (key: keyof ProcessingSettings, value: number | boolean) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-[#D8C29D] rounded-lg p-6 shadow-sm mb-6">
      <h3 className="serif text-xl text-[#3E3832] mb-4 border-b border-[#D8C29D] pb-2">
        Extraction Settings
      </h3>
      
      <div className="space-y-6">
        {/* Color Count Slider */}
        <div>
          <div className="flex justify-between mb-2 text-sm text-[#5C5046]">
            <span>Palette Size</span>
            <span className="font-bold">{settings.colorCount} colors</span>
          </div>
          <input
            type="range"
            min="3"
            max="12"
            value={settings.colorCount}
            disabled={disabled}
            onChange={(e) => handleChange('colorCount', parseInt(e.target.value))}
            className="w-full h-2 bg-[#D8C29D] rounded-lg appearance-none cursor-pointer accent-[#A84C32]"
          />
        </div>

        {/* Precision Slider */}
        <div>
          <div className="flex justify-between mb-2 text-sm text-[#5C5046]">
            <span>Sampling Precision</span>
            <span className="font-bold">{settings.samplePrecision}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.samplePrecision}
            disabled={disabled}
            onChange={(e) => handleChange('samplePrecision', parseInt(e.target.value))}
            className="w-full h-2 bg-[#D8C29D] rounded-lg appearance-none cursor-pointer accent-[#A84C32]"
          />
          <p className="text-xs text-gray-500 mt-1">Higher precision is slower but more accurate.</p>
        </div>

        {/* PCCS Brighten Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#A84C32]/5 rounded-lg border border-[#A84C32]/10">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#A84C32]">PCCS Brighten (Restoration)</span>
            <span className="text-[10px] text-[#8C7B6C]">Simulate original vibrant pigments</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.brighten} 
              disabled={disabled}
              onChange={(e) => handleChange('brighten', e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A84C32]"></div>
          </label>
        </div>

        {/* Ignore Grayscale Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#5C5046]">Filter Grayscale</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.ignoreGrayscale} 
              disabled={disabled}
              onChange={(e) => handleChange('ignoreGrayscale', e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A84C32]"></div>
          </label>
        </div>
      </div>
    </div>
  );
};